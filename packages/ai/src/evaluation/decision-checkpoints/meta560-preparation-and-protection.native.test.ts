import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
  visibleRunnerInitialProgramInstallCredits,
} from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { runnerCoverageInstallCreditPreparation } from "../../runner/rig-coverage/coverage-install-credit-preparation";
import { corpInstalledIceHasFreeFullBreak } from "../../corp/defense/corp-free-full-break";
import { buildCorpDefenseTurnPlanningSlice } from "../../corp/defense/corp-defense-turn-planning";
import {
  corpGlobalIceSupportAssetInstallSignal,
  corpTerminalCentralRezReserveSignals,
} from "../../corp/defense/defense-discovery-support";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function original(stem: string) {
  const native = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta560-" +
          stem +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const state = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta560-" + stem + ".state.json", import.meta.url),
      "utf8",
    ),
  );
  expect(hashGameState(state)).toBe(native.stateHash);
  expect(Object.values(native.validation)).toEqual(Array(9).fill(true));
  return { native, state };
}
function choose(native: any, dto = false) {
  const input = dto
    ? { ...native.input, ...buildAiDecisionInputDto(native.input) }
    : structuredClone(native.input);
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    native.runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(
    input.legalActions.some((a: any) => a.actionId === result.actionId),
  ).toBe(true);
  return { input, result, portfolio: residentPlanPortfolioSnapshot(input)! };
}
function candidates(input: any) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq.map((c: any) => [
        c.instanceId,
        c.definitionId,
      ]),
    ),
  });
}
function apply(state: any, actionId: string, side: "corp" | "runner") {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(JSON.stringify(result.error));
  const replay = replayEvents(
    state,
    result.state.eventLog.slice(state.eventLog.length),
  );
  expect(replay.errors).toEqual([]);
  expect(hashGameState(replay.state)).toBe(hashGameState(result.state));
  return result.state;
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing 560: purpose-bound preparation and honest protection facts", () => {
  it.each([false, true])(
    "installs the credit source before its exact Coverage answer through DTO=%s",
    (dto) => {
      const f = original("r1-g10-d9-installer-order"),
        { input, result, portfolio } = choose(f.native, dto);
      const action = input.legalActions.find(
        (a: any) => a.actionId === result.actionId,
      );
      expect(action.source).toContain("software-installer");
      const plan = result.decisionDebug!.planFirstDecision!;
      expect(plan.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
      expect(plan.route).toMatchObject({
        actionId: action.actionId,
        stateVersion: f.state.stateVersion,
        planInstanceId: plan.leafExecutorInstanceId,
      });
      const gap = (
        portfolio.instances.find(
          (p: any) =>
            p.moduleId === "runner.rig_and_coverage" &&
            (p.moduleState as any).phase === "prepare_coverage",
        )!.moduleState as any
      ).gap;
      expect(gap.installCreditPreparation).toMatchObject({
        actionId: action.actionId,
        savedLiquidCredits: 2,
        targetDefinitionId: "onr_v1_014_codecracker",
        stateVersion: 8,
      });
      const installed = apply(f.state, action.actionId, "runner");
      const nextInput = {
        ...input,
        ...buildAiDecisionInputDto({
          ...input,
          playerView: getPlayerView(installed, "runner"),
          legalActions: getLegalActions(installed, "runner"),
        }),
      };
      const next = chooseAiAction(nextInput);
      const answer = nextInput.legalActions.find(
        (a: any) => a.actionId === next.actionId,
      )!;
      expect(answer).toMatchObject({
        type: "install_card",
        source: gap.installCreditPreparation.targetCardInstanceId,
        payload: { runnerInstallPaymentHostedCredits: 2 },
      });
      expect(
        next.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId,
      ).toBe("runner.rig_and_coverage");
      expect(next.fallbackUsed).toBe(false);
      const paid = apply(installed, answer.actionId, "runner");
      expect(paid.runner.credits).toBe(f.state.runner.credits);
      expect(paid.runner.clicks).toBe(f.state.runner.clicks - 2);
      expect(hashGameState(f.state)).toBe(f.native.stateHash);
    },
  );
  it.each([
    "last_click",
    "urgent",
    "conversion",
    "memory",
    "no_saving",
    "other_answer",
  ])(
    "keeps direct Coverage without profitable safe preparation: %s",
    (variant) => {
      const { native } = original("r1-g10-d9-installer-order"),
        { input, portfolio } = choose(native);
      const gap = structuredClone(
        (
          portfolio.instances.find(
            (p: any) =>
              p.moduleId === "runner.rig_and_coverage" &&
              (p.moduleState as any).phase === "prepare_coverage",
          )!.moduleState as any
        ).gap,
      );
      delete gap.preparationActionIds;
      delete gap.installCreditPreparation;
      if (variant === "last_click") input.playerView.own.clicks = 1;
      if (variant === "urgent") gap.priorityClass = "P2";
      if (variant === "conversion") gap.sameTurnRunConversion = {};
      if (variant === "memory") input.playerView.own.memoryLimit = 1;
      if (variant === "other_answer") gap.handAnswerDefinitionId = "other";
      if (variant === "no_saving")
        for (const a of input.legalActions.filter((a: any) =>
          gap.installActionIds.includes(a.actionId),
        ))
          a.costs = [{ clicks: 1, credits: 1 }];
      expect(
        runnerCoverageInstallCreditPreparation(input, gap)
          .installCreditPreparation,
      ).toBeUndefined();
    },
  );
  it("takes initial restricted credits only from the canonical source lifecycle", () => {
    const { native } = original("r1-g10-d9-installer-order");
    const hand = native.input.playerView.own.gripOrHq;
    expect(
      visibleRunnerInitialProgramInstallCredits(
        hand.find((c: any) => c.definitionId.includes("software-installer")),
      ),
    ).toBe(2);
    expect(
      visibleRunnerInitialProgramInstallCredits(
        hand.find((c: any) => c.definitionId.includes("codecracker")),
      ),
    ).toBe(0);
  });
  it("retains legal staging but does not claim Glacier ready without its mandatory point", () => {
    const { native } = original("r1-g1-d129-glacier-staging"),
      { input, portfolio } = choose(native);
    const signals = (
      portfolio.instances.find((p) => p.moduleId === "corp.defend_servers")!
        .moduleState as any
    ).signals;
    const staging = signals.filter(
      (s: any) => s.kind === "score_protection_staging_install",
    );
    expect(staging.length).toBeGreaterThan(0);
    const params = {
      input,
      defenseNeeds: staging,
      economyNeeds: [],
      candidates: candidates(input),
      stateIdentity: buildPlanningStateIdentity(input),
    };
    const slice = buildCorpDefenseTurnPlanningSlice(params);
    expect(
      slice.lines.every(
        (l) =>
          !l.rezReadyAfterLine &&
          l.campaignQuote.nextMilestoneId ===
            "score_remote_ice_staged_for_later_rez",
      ),
    ).toBe(true);
    input.playerView.own.agendaPoints = 1; // Explicit funding countercase; action/quote remain the exact native head.
    expect(
      buildCorpDefenseTurnPlanningSlice(params).lines.every(
        (l) => l.rezReadyAfterLine,
      ),
    ).toBe(true);
    for (const a of input.legalActions)
      if (a.payload?.postInstallRezQuoteComplete)
        delete a.payload.postInstallRezQuoteMandatoryAgendaPointCost;
    expect(() => buildCorpDefenseTurnPlanningSlice(params)).toThrow();
  });
  it.each([false, true])(
    "places global support outside its current scoring slot through DTO=%s",
    (dto) => {
      const { native, state } = original("r1-g28-d470-masons-overwrite"),
        { input, result, portfolio } = choose(native, dto);
      const action = input.legalActions.find(
        (a: any) => a.actionId === result.actionId,
      );
      expect(action).toMatchObject({
        type: "install_card",
        source: "corp_onr_v1_317_data-masons_1",
        payload: { serverId: "new_remote" },
      });
      expect(
        result.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId,
      ).toBe("corp.defend_servers");
      const projects = portfolio.instances
        .filter((p) => p.moduleId === "corp.score_agenda")
        .map((p) => (p.moduleState as any).signal)
        .filter(
          (p) =>
            p.protectionNeed?.observedAtStateVersion ===
            input.playerView.stateVersion,
        );
      const all = candidates(input),
        old = all.find(
          (c) =>
            c.sourceCardInstanceId === action.source &&
            input.legalActions.find((a: any) => a.actionId === c.actionId)
              ?.payload?.serverId === "remote_1",
        )!;
      expect(
        corpGlobalIceSupportAssetInstallSignal(input, old, projects, all),
      ).toBeUndefined();
      expect(
        corpGlobalIceSupportAssetInstallSignal(input, old, [], all),
      ).toMatchObject({ serverId: "remote_1" });
      let current = apply(state, action.actionId, "corp");
      for (let i = 0; i < 3 && current.activeSide === "corp"; i++) {
        const nextInput = {
          ...input,
          ...buildAiDecisionInputDto({
            ...input,
            playerView: getPlayerView(current, "corp"),
            legalActions: getLegalActions(current, "corp"),
          }),
        };
        const next = chooseAiAction(nextInput);
        expect(next.fallbackUsed).toBe(false);
        current = apply(current, next.actionId!, "corp");
      }
      const support = getPlayerView(current, "corp")
        .servers.flatMap((s) => s.root)
        .find((c) => c.instanceId === action.source);
      expect(support?.rezzed).toBe(true);
      expect(
        getPlayerView(current, "corp").own.heapOrArchives.map(
          (c) => c.instanceId,
        ),
      ).not.toContain(action.source);
    },
  );
  it("removes only the certified free-break reserve and retains the independent terminal draw", () => {
    const { native } = original("r1-g33-d209-score-before-purge"),
      { input, result, portfolio } = choose(native);
    const defense = portfolio.instances.find(
      (p) => p.moduleId === "corp.defend_servers",
    )!.moduleState as any;
    const ice = input.playerView.servers.find((s: any) => s.id === "rd").ice[1];
    expect(corpInstalledIceHasFreeFullBreak(input, ice, "rd")).toBe(true);
    expect(
      defense.signals.some((s: any) =>
        s.defenseId.startsWith("terminal-central-rez-reserve:rd:"),
      ),
    ).toBe(false);
    expect(result.actionId).toBe("corp.draw_card");
    expect(
      result.decisionDebug!.planFirstDecision!.priority?.effectiveClass,
    ).toBe("P2");
    input.playerView.opponent.rig = input.playerView.opponent.rig.filter(
      (c: any) => !c.definitionId.includes("worm"),
    );
    expect(corpInstalledIceHasFreeFullBreak(input, ice, "rd")).toBe(false);
    expect(
      corpTerminalCentralRezReserveSignals(
        input,
        defense.centralAllocation,
        candidates(input),
      ),
    ).toContainEqual(
      expect.objectContaining({
        phase: "fund_rez_reserve",
        targetIceInstanceId: ice.instanceId,
      }),
    );
  });
  it.each(["stale", "target", "tax", "extra_effect", "insufficient_strength"])(
    "does not certify a free break from incomplete or costly facts: %s",
    (variant) => {
      const { native } = original("r1-g33-d209-score-before-purge"),
        input = native.input;
      const ice = input.playerView.servers.find((s: any) => s.id === "rd")
          .ice[1],
        post = ice.effectivePostRezRunQuote;
      if (variant === "stale") post.expiresAtStateVersion--;
      if (variant === "target") post.targetServerId = "hq";
      if (variant === "tax")
        post.effectiveRunQuote.breakSubroutineAdditionalCostPerSubroutine = 1;
      if (variant === "extra_effect")
        post.effectiveRunQuote.subroutines.push({
          id: "damage",
          type: "do_net_damage",
        });
      if (variant === "insufficient_strength")
        post.effectiveRunQuote.encounterStrength = 3;
      expect(corpInstalledIceHasFreeFullBreak(input, ice, "rd")).toBe(false);
    },
  );
});
