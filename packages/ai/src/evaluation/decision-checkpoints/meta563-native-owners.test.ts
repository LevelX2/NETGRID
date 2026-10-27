import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { reconstructBeliefState } from "../../belief-state";
import { runnerTargetHasTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { runnerRemoteCoveragePaymentNeed } from "../../runner/remote-contest/remote-contest-payment-need";
import { corpDefenseSignalReservesActionWindow } from "../../corp/defense/corp-funded-continuation-window";

function original(kind: string) {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta563-" +
          kind +
          "-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(f.validation).every((v) => v === true)).toBe(true);
  return f;
}

function choose(f: ReturnType<typeof original>) {
  const input = f.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    f.runtime,
  );
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(
    input.legalActions.some((a: any) => a.actionId === decision.actionId),
  ).toBe(true);
  return decision;
}

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing563 native owner regressions", () => {
  it("retains the witnessed Chimera prefix after an unseen sibling scores (SP-683)", () => {
    const f = original("known-root-sibling");
    expect(
      reconstructBeliefState(f.input).runnerOpponentModel!.knownPositionMemory,
    ).toContainEqual(
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "root:0",
        definitionId: "onr_v1_353_chimera",
        sourceEventId: "evt_231",
      }),
    );
    expect(runnerTargetHasTerminalContestThreat(f.input, "remote_1")).toBe(
      false,
    );
    const decision = choose(f);
    expect(
      decision.decisionDebug!.planFirstDecision!.priority!.effectiveClass,
    ).not.toBe("P2");
  });

  it.each([
    "unknown_sibling",
    "missing_identity",
    "same_card",
    "lower_gap",
    "multi_trash",
  ])("does not certify an uncertain root through %s", (change) => {
    const f = original("known-root-sibling");
    const witnessedIdentity = f.input.eventTail.find(
      (e: any) => e.eventId === "evt_231",
    ).publicPayload.installedPositionKey;
    if (change === "unknown_sibling" || change === "lower_gap")
      f.input.playerView.servers
        .find((s: any) => s.id === "remote_1")
        .root.push({
          instanceId: "counterfactual-unknown",
          known: false,
          rezzed: false,
          advancementCounters: 0,
        });
    for (const events of [
      f.input.eventTail,
      f.input.playerView.publicEvents ?? [],
    ]) {
      const seen = events.find((e: any) => e.eventId === "evt_231");
      const removed = events.find((e: any) => e.eventId === "evt_248");
      if (change === "missing_identity" && seen)
        delete seen.publicPayload.installedPositionKey;
      if (change === "same_card" && removed)
        removed.publicPayload.installedPositionKey = witnessedIdentity;
      if (change === "lower_gap" && seen)
        Object.assign(seen.publicPayload, {
          accessedCardPositionKey: "root:1",
          accessedIndex: 1,
        });
      if (change === "multi_trash" && removed) {
        removed.type = "trash_accessed_card";
        removed.publicPayload.actionType = "trash_accessed_card";
      }
    }
    expect(runnerTargetHasTerminalContestThreat(f.input, "remote_1")).toBe(
      true,
    );
  });

  it("preserves the open Remote need through the exact Sneak payment window (SP-684)", () => {
    const f = original("coverage-payment");
    const pending =
      f.runtime.residentPlanPortfolio.pendingRunnerCostPenaltySupportOrigin;
    const decision = choose(f);
    const portfolio = residentPlanPortfolioSnapshot(f.input)!;
    const parent = portfolio.instances.find(
      (i) => i.instanceId === pending.rootPlanInstanceId,
    )!;
    const leaf = portfolio.instances.find(
      (i) => i.instanceId === pending.executorInstanceId,
    )!;
    expect(parent.openNeedIds).toContain(leaf.parentNeedId);
    expect(leaf.parentInstanceId).toBe(pending.rootPlanInstanceId);
    expect(portfolio.pendingRunnerCostPenaltySupportOrigin).toMatchObject({
      rootPlanInstanceId: pending.rootPlanInstanceId,
      executorInstanceId: pending.executorInstanceId,
      originalActionId: pending.originalActionId,
      sourceStepId: pending.sourceStepId,
      selectedAtStateVersion:
        decision.actionId === pending.originalActionId
          ? f.input.playerView.stateVersion
          : pending.selectedAtStateVersion,
    });
  });

  it.each([
    "missing_parent",
    "closed_need",
    "wrong_window",
    "wrong_action",
    "mixed_actions",
    "stale_version",
    "wrong_server",
    "wrong_child_side",
  ])("does not preserve a payment need with %s", (change) => {
    const f = original("coverage-payment"),
      previous = f.runtime.residentPlanPortfolio;
    const pending = previous.pendingRunnerCostPenaltySupportOrigin;
    const parent = previous.instances.find(
      (i: any) => i.instanceId === pending.rootPlanInstanceId,
    );
    if (change === "missing_parent")
      previous.instances = previous.instances.filter((i: any) => i !== parent);
    if (change === "closed_need") parent.openNeedIds = [];
    if (change === "wrong_window") pending.windowId = "other-window";
    if (change === "wrong_action") pending.originalActionId = "another-action";
    if (change === "mixed_actions")
      f.input.legalActions.push({
        ...f.input.legalActions[0],
        actionId: "other-action",
        payload: {},
      });
    if (change === "stale_version") previous.stateVersion--;
    if (change === "wrong_server")
      previous.instances.find(
        (i: any) => i.instanceId === pending.executorInstanceId,
      ).moduleState.gap.targetServerId = "remote_2";
    if (change === "wrong_child_side")
      previous.instances.find(
        (i: any) => i.instanceId === pending.executorInstanceId,
      ).side = "corp";
    expect(runnerRemoteCoveragePaymentNeed(f.input, previous)).toBeUndefined();
  });

  it("admits Department's complete rest-turn cycle after the Defense draw is rejected (SP-685)", () => {
    const f = original("bank-draw-admission");
    const decision = choose(f);
    const action = f.input.legalActions.find(
      (a: any) => a.actionId === decision.actionId,
    )!;
    expect(action.type).toBe("activated_card_ability");
    expect(action.source).toBe(
      "corp_onr_v1_318_department-of-truth-enhancement_1",
    );
    const quote = JSON.parse(action.payload.hostedCreditBankCycleQuoteJson);
    expect(quote).toMatchObject({
      headKind: "load",
      loadExecutions: 2,
      cashoutCredits: 6,
      extraLiquidCredits: 3,
    });
    expect(
      decision.decisionDebug!.planFirstDecision!.selectedPlan!.moduleId,
    ).toBe("corp.economy");
  });

  it.each(["complete", "missing", "admitted", "unknown", "urgent", "partial"])(
    "releases only complete current cleanup rejection: %s",
    (change) => {
      const f = original("bank-draw-admission");
      const signal = f.observedDiscovery.preAdmissionDefenseNeeds[0];
      const admissions = f.observedDiscovery.drawAdmissions;
      if (change === "missing") admissions.length = 0;
      if (change === "admitted") admissions[0].disposition = "admitted";
      if (change === "unknown")
        admissions[0].disposition = "blocked_unknown_projection";
      if (change === "urgent") signal.urgent = true;
      if (change === "partial") signal.actionIds.push("another-draw-action");
      expect(
        corpDefenseSignalReservesActionWindow(f.input, signal, admissions),
      ).toBe(change !== "complete");
    },
  );
});
