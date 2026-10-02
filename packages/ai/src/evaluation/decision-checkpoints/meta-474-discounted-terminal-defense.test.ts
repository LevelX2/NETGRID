import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { assessCorpTerminalAgendaDefense } from "../../corp/defense/corp-terminal-agenda-defense";
import { assessCorpExactIceRezAgainstScoreReserves } from "../../corp/defense/corp-defense-score-reserve";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r5-g1-d140.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return {
    input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) },
    runtime: cp.runtime,
  };
}

function assessment(
  input: AiDecisionInputWithDeckCapabilities,
  discounted: boolean,
) {
  const server = input.playerView.servers.find((s) => s.id === "hq")!;
  const sourceCard = server.ice[0]!;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      [...server.ice, ...server.root].map((c) => [
        c.instanceId,
        c.definitionId!,
      ]),
    ),
  });
  const action = input.legalActions.find(
    (a) =>
      a.type === "rez_ice" &&
      a.actionId.includes("olivia-salazar") === discounted,
  )!;
  const route = projectExactCorpIceRezRoute({
    input,
    sourceCard,
    candidate: candidates.find((c) => c.actionId === action.actionId)!,
    targetServerId: server.id,
  })!;
  const defense = assessCorpTerminalAgendaDefense(
    input,
    server.id,
    "current-terminal-run",
  )!;
  const reserve = assessCorpExactIceRezAgainstScoreReserves({
    input,
    route,
    scoreProjects: [],
  });
  return { action, route, defense, reserve };
}

describe("pairing 474: current selected partial defense and exact discounted rez", () => {
  it.each([false, true])(
    "prioritizes the selected current tax with discounted=%s",
    (discounted) => {
      const { input } = checkpoint();
      const { route, defense, reserve } = assessment(input, discounted);
      expect(route.before?.runnerCreditsRemainingOnBestAccessPath).toBe(6);
      expect(route.after?.runnerCreditsRemainingOnBestAccessPath).toBe(0);
      expect(defense.best.protection.runnerAccessSuccessProbability).toEqual({
        numerator: 1,
        denominator: 1,
      });
      expect(defense.best.selectedRezCosts).toMatchObject([
        { iceInstanceId: route.sourceCardInstanceId, credits: 3 },
      ]);
      expect(reserve).toMatchObject({
        preservesReserve: true,
        requiredCreditsAfterRez: 0,
        availableCreditsAfterRez: discounted ? 3 : 1,
        immediateRezIceIds: [route.sourceCardInstanceId],
        opportunity: { reason: "current_terminal_access" },
      });
    },
  );

  it("chooses the engine-offered one-credit action in the same defense root and step", () => {
    const { input, runtime } = checkpoint();
    const { action } = assessment(input, true);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: action.actionId,
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(
      input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.rootPlanInstanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );
    expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
    expect(plan.selectedStep!.planInstanceId).toBe(plan.rootPlanInstanceId);
    expect(plan.route).toMatchObject({
      actionId: action.actionId,
      stateVersion: 139,
      planInstanceId: plan.rootPlanInstanceId,
    });
    expect(plan.route!.stepId).toBe(plan.selectedStep!.stepId);
  });

  it("rejects a quote that spends more credits or agenda points than its selected subset", () => {
    const { input } = checkpoint();
    const { route } = assessment(input, false);
    for (const excessRoute of [
      { ...route, totalRezCredits: 4 },
      {
        ...route,
        quote: {
          ...route.quote,
          mandatoryAdditionalCosts: { agendaPoints: 1 },
        },
      },
    ]) {
      expect(
        assessCorpExactIceRezAgainstScoreReserves({
          input,
          route: excessRoute,
          scoreProjects: [],
        }).preservesReserve,
      ).toBe(false);
    }
  });

  it("retains ordinary cross-server reserves when the exact known baseline adds no tax reduction", () => {
    const { input } = checkpoint();
    const { route } = assessment(input, true);
    const noReductionRoute = {
      ...route,
      before: {
        ...route.before!,
        runnerCreditsRemainingOnBestAccessPath: 0,
      },
    };
    const reserve = assessCorpExactIceRezAgainstScoreReserves({
      input,
      route: noReductionRoute,
      scoreProjects: [],
    });
    expect(reserve.opportunity.reason).not.toBe("current_terminal_access");
  });
});
