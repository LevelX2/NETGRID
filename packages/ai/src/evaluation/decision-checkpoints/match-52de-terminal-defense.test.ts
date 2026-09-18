import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { assessCorpTerminalAgendaDefense } from "../../corp/defense/corp-terminal-agenda-defense";
import { corpServerProtectionClaims } from "../../corp/defense/corp-server-protection-reserve";
import { withCorpTerminalAgendaDefense } from "../../corp/score/score-terminal-defense";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { assessCorpExactIceRezAgainstScoreReserves } from "../../corp/defense/corp-defense-score-reserve";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";

function capture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-52de-d34-defense-replay.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
function installedSupport(input: AiDecisionInputWithDeckCapabilities) {
  const card = input.playerView.own.gripOrHq.find(
    (card) => card.type === "upgrade",
  )!;
  input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.filter(
    (other) => other !== card,
  );
  input.playerView.servers
    .find((server) => server.id === "remote_1")!
    .root.push({ ...card, rezzed: true });
  input.legalActions = input.legalActions.filter(
    (action) => action.source !== card.instanceId,
  );
}
function project(
  input: AiDecisionInputWithDeckCapabilities,
): CorpScoreProjectSignal {
  const agenda = input.playerView.servers
    .find((server) => server.id === "remote_1")!
    .root.find((card) => card.type === "agenda")!;
  return {
    projectId: "terminal-test",
    agendaInstanceId: agenda.instanceId,
    agendaDefinitionId: agenda.definitionId!,
    agendaPoints: agenda.agendaPoints!,
    serverId: "remote_1",
    phase: "advance_agenda",
    sameTurnCloseout: false,
    actionIds: input.legalActions
      .filter((action) => action.type === "advance_card")
      .map((action) => action.actionId),
    terminalScore: false,
    feasible: true,
    evidenceCode: "test",
  };
}
describe("match 52de terminal agenda defense", () => {
  beforeEach(resetResidentPlanPortfolioMemory);
  it.each([
    [5, 5],
    [3, 2],
  ])(
    "reserves affordable partial terminal protection across servers at %i credits",
    (credits, reserve) => {
      const { input } = capture();
      installedSupport(input);
      input.playerView.own.credits = credits;
      expect(corpServerProtectionClaims(input).claims).toContainEqual(
        expect.objectContaining({
          serverId: "remote_1",
          terminal: true,
          credits: reserve,
        }),
      );
      input.playerView.opponent.agendaPoints = 3;
      expect(
        corpServerProtectionClaims(input).claims.some(
          (claim) => claim.serverId === "remote_1",
        ),
      ).toBe(false);
    },
  );
  it("quotes the exact D34 partial protection and installs it through the Score parent", () => {
    const replay = capture();
    const { input } = replay;
    const quote = assessCorpTerminalAgendaDefense(input, "remote_1", "test");
    expect(quote?.install?.sourceDefinitionId).toBe(
      "onr_v1_367_rio-de-janeiro-city-grid",
    );
    expect(quote?.best.protection.runnerAccessSuccessProbability).toEqual({
      numerator: 25,
      denominator: 36,
    });
    expect(quote?.requiredCredits).toBe(6);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      replay.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(quote?.install?.actionId);
    expect(decision.reasonCode).toBe("plan_first.corp.defend_servers");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("corp.score_agenda");
  });
  it("retains actor-only checkpoint data", () => {
    const replay = capture();
    expect(Object.values(replay.validation).every(Boolean)).toBe(true);
    expect(replay.input.playerView.opponent).not.toHaveProperty("gripOrHq");
  });
  it.each([
    [5, 2, 25, 36, 6, 1],
    [4, 1, 5, 6, 3, 0],
  ])(
    "funds the best remaining protection with %i credits and %i clicks",
    (credits, clicks, numerator, denominator, required, preparation) => {
      const { input } = capture();
      input.playerView.own.credits = credits;
      input.playerView.own.clicks = clicks;
      const quote = assessCorpTerminalAgendaDefense(input, "remote_1", "test");
      expect(quote?.best.protection.runnerAccessSuccessProbability).toEqual({
        numerator,
        denominator,
      });
      expect(quote?.requiredCredits).toBe(required);
      expect(quote?.preparationCreditClicks).toBe(preparation);
      expect(quote?.install).toBeDefined();
    },
  );
  it("funds before advancing and then permits only surplus progress", () => {
    const { input } = capture();
    installedSupport(input);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 2;
    let signal = withCorpTerminalAgendaDefense(input, project(input), []);
    expect(signal).toMatchObject({
      feasible: false,
      fundingGap: 1,
      terminalDefense: { requiredCredits: 6 },
    });
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("gain_credit");
    expect(decision.reasonCode).toBe("plan_first.corp.economy");
    resetResidentPlanPortfolioMemory();
    input.playerView.own.credits = 6;
    input.playerView.own.clicks = 1;
    signal = withCorpTerminalAgendaDefense(input, project(input), []);
    expect(signal).toMatchObject({ feasible: true, fundingGap: 0 });
    const advance = chooseAiAction(input);
    expect(
      input.legalActions.find((action) => action.actionId === advance.actionId)
        ?.type,
    ).toBe("advance_card");
  });
  it("preserves the two-ICE budget on the last click", () => {
    const { input } = capture();
    installedSupport(input);
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 1;
    expect(
      withCorpTerminalAgendaDefense(input, project(input), []),
    ).toMatchObject({
      feasible: false,
      fundingGap: 1,
      terminalDefense: { requiredCredits: 5 },
    });
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find((action) => action.actionId === decision.actionId)
        ?.type,
    ).toBe("gain_credit");
  });
  it("applies the same survival need to a next-turn continuation without explicit actionIds", () => {
    const { input } = capture();
    input.playerView.own.credits = 4;
    input.playerView.own.clicks = 1;
    const signal = project(input);
    delete signal.actionIds;
    signal.evidenceCode = "engine_certified_next_turn_score_continuation";
    expect(withCorpTerminalAgendaDefense(input, signal, [])).toMatchObject({
      feasible: false,
      terminalDefense: { requiredCredits: 3, install: { placement: "root" } },
    });
  });
  it("leaves nonterminal agendas and exact same-turn scoring routes to Score", () => {
    const { input } = capture();
    const signal = project(input);
    expect(
      withCorpTerminalAgendaDefense(
        input,
        { ...signal, sameTurnCloseout: true },
        [],
      ).terminalDefense,
    ).toBeUndefined();
    expect(
      withCorpTerminalAgendaDefense(input, signal, [
        { ...signal, sameTurnCloseout: true },
      ]),
    ).toBe(signal);
    input.playerView.opponent.agendaPoints = 3;
    expect(withCorpTerminalAgendaDefense(input, signal, [])).toBe(signal);
  });
  it("does not invent a usable ICE, activation, or stale installation", () => {
    const { input } = capture();
    input.playerView.servers.find((server) => server.id === "remote_1")!.ice =
      [];
    expect(
      assessCorpTerminalAgendaDefense(input, "remote_1", "test")?.install,
    ).toBeUndefined();
    const stale = capture().input;
    stale.legalActions = stale.legalActions.map((action) =>
      action.type === "install_card"
        ? { ...action, expiresAtStateVersion: action.expiresAtStateVersion - 1 }
        : action,
    );
    expect(
      assessCorpTerminalAgendaDefense(stale, "remote_1", "test")?.install,
    ).toBeUndefined();
  });
  it("keeps a deterministic existing stop ahead of probabilistic support", () => {
    const { input } = capture();
    input.playerView.opponent.rig = [];
    const quote = assessCorpTerminalAgendaDefense(input, "remote_1", "test");
    expect(quote?.install).toBeUndefined();
    expect(quote?.best.protection.runnerAccessSuccessProbability).toEqual({
      numerator: 0,
      denominator: 1,
    });
    expect(quote?.requiredCredits).toBe(2);
  });
  it.each([
    [3, false],
    [5, true],
  ])(
    "reserves the cheaper inner layer with %i credits during the winning run",
    (credits, rezOuter) => {
      const { input } = capture();
      installedSupport(input);
      input.playerView.own.credits = credits;
      input.playerView.own.clicks = 0;
      input.playerView.opponent.credits = 6;
      input.playerView.opponent.clicks = 0;
      input.playerView.activeSide = "runner";
      input.playerView.phase = "run";
      input.playerView.timingPoint = "run.approach_ice";
      input.playerView.run = {
        runId: "test-run",
        attackedServerId: "remote_1",
        phase: "approach_ice",
        position: { kind: "ice", serverId: "remote_1", iceIndex: 1 },
        badPublicityCredits: 0,
        successful: false,
      };
      const server = input.playerView.servers.find(
        (entry) => entry.id === "remote_1",
      )!;
      const outer = server.ice[1]!;
      input.legalActions = [
        {
          actionId: "test-rez",
          side: "corp",
          type: "rez_ice",
          source: outer.instanceId,
          label: "test",
          timingPoint: "run.approach_ice",
          costs: [{ credits: 3 }],
          targetRequirements: [],
          visibility: "public",
          expiresAtStateVersion: input.playerView.stateVersion,
          payload: { serverId: "remote_1", cardId: outer.instanceId },
        },
      ];
      const candidate = buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "corp",
        stateVersion: input.playerView.stateVersion,
        visibleSourceDefinitionsByInstanceId:
          visibleSourceDefinitionsByInstanceId(input.playerView),
        cardSemanticProfilesByDefinitionId:
          buildActionCardSemanticProfilesByDefinitionId(),
      })[0]!;
      const route = projectExactCorpIceRezRoute({
        input,
        candidate,
        sourceCard: outer,
        targetServerId: "remote_1",
      });
      expect(route).toBeDefined();
      const admission = assessCorpExactIceRezAgainstScoreReserves({
        input,
        route: route!,
        scoreProjects: [],
      });
      expect(admission.preservesReserve).toBe(rezOuter);
      expect(admission.requiredCreditsAfterRez).toBe(2);
      expect(admission.opportunity.reason).toBe("current_terminal_access");
    },
  );
});
