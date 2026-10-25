import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  exportAiRuntimeCheckpoint,
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { DevelopmentState } from "../../runner/hand-development/development-types";
function checkpoint(d: 155 | 156 | 157) {
  const suffix = d === 157 ? "-failed" : "";
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-555-r5-g11-d" +
          d +
          suffix +
          ".json",
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
  return cp;
}
function begin() {
  const cp = checkpoint(155);
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const first = chooseAiAction(cp.input);
  const runtime = exportAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
  );
  const pending =
    runtime.residentPlanPortfolio!.pendingRunnerCostPenaltySupportOrigin!;
  expect(first.actionId).toBe(pending.originalActionId);
  expect(first.decisionDebug!.planFirstDecision!.selectedPlan?.moduleId).toBe(
    "runner.develop_board_and_hand",
  );
  return { cp, runtime, pending };
}
afterEach(resetResidentPlanPortfolioMemory);
it("preserves the native selected program target through Chiba support and resumes the same development executor", () => {
  const { cp, pending } = begin();
  const target = "onr_v1_035_invisibility";
  const support = checkpoint(156).input;
  const before = JSON.stringify([support.playerView, support.legalActions]);
  const paid = chooseAiAction(support);
  expect(paid.actionId).toContain("chiba-bank-account");
  expect(paid.fallbackUsed).toBe(false);
  expect(JSON.stringify([support.playerView, support.legalActions])).toBe(
    before,
  );
  const state = residentPlanPortfolioSnapshot(support)!.instances.find(
    (i) => i.instanceId === pending.executorInstanceId,
  )!.moduleState as DevelopmentState;
  expect(state.signal.programSearchCommitment).toMatchObject({
    targetDefinitionId: target,
    selectedActionId: pending.originalActionId,
    plannedAtStateVersion: 154,
    selectedAtStateVersion: 154,
  });
  const input = checkpoint(157).input;
  const unchanged = JSON.stringify([input.playerView, input.legalActions]);
  const resumed = chooseAiAction(input);
  expect(resumed.actionId).toBe(pending.originalActionId);
  expect(
    input.legalActions.some(
      (a) => a.actionId === resumed.actionId && a.expiresAtStateVersion === 156,
    ),
  ).toBe(true);
  expect(resumed.fallbackUsed).toBe(false);
  expect(resumed.timeoutUsed).not.toBe(true);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  expect(portfolio.rootForegroundInstanceId).toBe(pending.rootPlanInstanceId);
  expect(portfolio.executorInstanceId).toBe(pending.executorInstanceId);
  const final = portfolio.instances.find(
    (i) => i.instanceId === pending.executorInstanceId,
  )!;
  expect(final.executionState).toBe("executor");
  expect(
    (final.moduleState as DevelopmentState).signal.programSearchCommitment,
  ).toMatchObject({
    targetDefinitionId: target,
    selectedActionId: pending.originalActionId,
    plannedAtStateVersion: 154,
    selectedAtStateVersion: 154,
    engineContinuationAtStateVersion: 156,
  });
  expect(JSON.stringify([input.playerView, input.legalActions])).toBe(
    unchanged,
  );
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(cp.input.playerView.stateVersion).toBe(154);
});
it.each(["target", "source", "version", "missing-selection", "root"])(
  "fails closed rather than reconstructing a %s mismatch during native payment support",
  (kind) => {
    const { runtime, pending } = begin();
    const owner = runtime.residentPlanPortfolio!.instances.find(
      (i) => i.instanceId === pending.executorInstanceId,
    )!;
    const commitment = (owner.moduleState as DevelopmentState).signal
      .programSearchCommitment!;
    if (kind === "target") commitment.targetDefinitionId = "onr_v1_011_cloak";
    else if (kind === "source")
      commitment.sourceCardInstanceId = "different-source";
    else if (kind === "version") commitment.plannedAtStateVersion += 1;
    else if (kind === "missing-selection") delete commitment.selectedActionId;
    else
      runtime.residentPlanPortfolio!.pendingRunnerCostPenaltySupportOrigin = {
        ...runtime.residentPlanPortfolio!
          .pendingRunnerCostPenaltySupportOrigin!,
        rootPlanInstanceId: "different-root",
      };
    const input = checkpoint(156).input;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    expect(() => chooseAiAction(input)).toThrow(PlanResolutionFailure);
  },
);
