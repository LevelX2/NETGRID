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
import { preserveSelectedRunnerCoverageBindingAcrossPaymentStep } from "../../runner/rig-coverage/coverage-bindings";
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

  it("continues Gideon without stale Temple dispositions (SP-684)", () => {
    const f = original("coverage-payment-rejected-search");
    const pending =
      f.runtime.residentPlanPortfolio.pendingRunnerCostPenaltySupportOrigin;
    const decision = choose(f);
    const debug = decision.decisionDebug!.planFirstDecision!;
    expect(decision.actionId).toBe(pending.originalActionId);
    expect(debug.rootPlanInstanceId).toBe(pending.rootPlanInstanceId);
    expect(debug.leafExecutorInstanceId).toBe(pending.executorInstanceId);
    const current = new Set(f.input.legalActions.map((a: any) => a.actionId));
    expect(debug.dispositions!.every((d: any) => current.has(d.actionId))).toBe(
      true,
    );
  });

  it.each(["coverage-payment", "coverage-payment-rejected-search"])(
    "preserves current search target without prior alternative offers: %s",
    (kind) => {
      const f = original(kind);
      const previous = f.runtime.residentPlanPortfolio;
      const pending = previous.pendingRunnerCostPenaltySupportOrigin;
      const priorGap = previous.instances.find(
        (i: any) => i.instanceId === pending.executorInstanceId,
      ).moduleState.gap;
      const binding = priorGap.directSearchChoiceBindings.find(
        (b: any) => b.actionId === pending.originalActionId,
      );
      const fields = [
        "installActionIds",
        "preparationActionIds",
        "memorySupportActionIds",
        "fundingActionIds",
        "rejectedSearchActionIds",
        "programInstallMemoryRejectedActionIds",
        "searchEngineSetupActionIds",
        "drawForAnswerActionIds",
      ];
      for (const field of fields) priorGap[field] = ["historical-other-head"];
      priorGap.directSearchActionIds.push("historical-other-search");
      priorGap.directSearchChoiceBindings.push({
        ...binding,
        actionId: "historical-other-search",
      });
      const saved = JSON.stringify(previous);
      const held = runnerRemoteCoveragePaymentNeed(f.input, previous)!;
      expect(JSON.stringify(previous)).toBe(saved);
      expect(held.coverageGap.directSearchActionIds).toEqual([
        pending.originalActionId,
      ]);
      expect(held.coverageGap.directSearchChoiceBindings).toEqual([binding]);
      for (const field of fields)
        expect((held.coverageGap as any)[field]).toEqual([]);
      expect(held.coverageGap.requesterNeedId).toBe(priorGap.requesterNeedId);
      expect(held.coverageGap.targetServerId).toBe(priorGap.targetServerId);
    },
  );

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

  it("keeps the exact selected preparation through payment support (SP-684)", () => {
    const f = original("coverage-payment-preparation");
    const pending = structuredClone(
      f.runtime.residentPlanPortfolio.pendingRunnerCostPenaltySupportOrigin,
    );
    const decision = choose(f);
    const portfolio = residentPlanPortfolioSnapshot(f.input)!;
    const leaf = portfolio.instances.find(
      (i) => i.instanceId === pending.executorInstanceId,
    )!;
    expect(leaf.moduleState).toMatchObject({
      kind: "coverage",
      phase: "prepare_coverage",
      gap: { preparationActionIds: [pending.originalActionId] },
    });
    expect(portfolio.pendingRunnerCostPenaltySupportOrigin).toMatchObject({
      rootPlanInstanceId: pending.rootPlanInstanceId,
      executorInstanceId: pending.executorInstanceId,
      originalActionId: pending.originalActionId,
      sourceStepId: pending.sourceStepId,
    });
    expect(decision.actionId).toBeTruthy();
  });

  it.each([
    "exact",
    "wrong_action",
    "wrong_step",
    "wrong_phase",
    "wrong_root",
    "wrong_side",
  ])("keeps only the exact preparation origin: %s", (change) => {
    const f = original("coverage-payment-preparation"),
      previous = f.runtime.residentPlanPortfolio,
      pending = previous.pendingRunnerCostPenaltySupportOrigin;
    const leaf = previous.instances.find(
      (i: any) => i.instanceId === pending.executorInstanceId,
    );
    if (change === "wrong_action")
      leaf.moduleState.gap.preparationActionIds = ["another-head"];
    if (change === "wrong_step") pending.sourceStepId = "another-step";
    if (change === "wrong_phase") leaf.moduleState.phase = "hold";
    if (change === "wrong_root") pending.rootPlanInstanceId = "another-root";
    if (change === "wrong_side") previous.side = "corp";
    const before = JSON.stringify(previous),
      portfolio = structuredClone(previous);
    portfolio.instances = portfolio.instances.filter(
      (i: any) => i.instanceId !== pending.executorInstanceId,
    );
    const result: any = { lane: "plan", portfolio };
    const call = () =>
      preserveSelectedRunnerCoverageBindingAcrossPaymentStep(
        f.input,
        result,
        previous,
        pending,
      );
    if (change === "exact") {
      call();
      expect(
        result.portfolio.instances.find(
          (i: any) => i.instanceId === pending.executorInstanceId,
        ).moduleState,
      ).toEqual(leaf.moduleState);
    } else expect(call).toThrow(/invalid_support_graph/);
    expect(JSON.stringify(previous)).toBe(before);
  });

  it("retains a payable agenda before exposing terminal open Archives points (SP-686)", () => {
    const f = original("hq-retain-terminal");
    const decision = choose(f);
    const ids = (decision.selectedChoices as { selectedOptionIds: string[] })
      .selectedOptionIds;
    expect(ids).toHaveLength(1);
    const kept = f.input.playerView.own.gripOrHq.find((c: any) =>
      ids.includes("card_" + c.instanceId),
    );
    expect(kept).toMatchObject({ type: "agenda", agendaPoints: 2 });
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
