import { expect, it } from "vitest";
import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-remote-search-payment-d166.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { preserveCoveragePaymentAncestry } from "../../runner/rig-coverage/coverage-payment-ancestry";

it("keeps the remote parent through Chiba support and resumes its exact Sneak search", () => {
  const capture = structuredClone(captureJson) as unknown as {
    initial: {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    followingInputs: AiDecisionInputWithDeckCapabilities[];
  };
  const { input, runtime } = capture.initial;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const original =
    runtime.residentPlanPortfolio!.pendingRunnerCostPenaltySupportOrigin!;
  const previousCoverage = runtime.residentPlanPortfolio!.instances.find(
    (i) => i.instanceId === original.executorInstanceId,
  )!;
  const expectedParent = {
    parentInstanceId: previousCoverage.parentInstanceId,
    parentNeedId: previousCoverage.parentNeedId,
  };
  expect(expectedParent.parentInstanceId).toBe(original.rootPlanInstanceId);
  for (const [index, current] of [
    input,
    ...capture.followingInputs,
  ].entries()) {
    const decision = chooseAiAction(current);
    expect(
      current.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    expect(decision.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(current)!;
    expect(
      portfolio.instances.find(
        (i) => i.instanceId === original.executorInstanceId,
      ),
    ).toMatchObject(expectedParent);
    if (index === 2) {
      expect(decision.actionId).toBe(original.originalActionId);
      expect(portfolio.rootForegroundInstanceId).toBe(
        original.rootPlanInstanceId,
      );
      expect(portfolio.executorInstanceId).toBe(original.executorInstanceId);
    }
  }
});

it.each(["missing_parent", "closed_need", "wrong_root", "cycle"])(
  "rejects %s without reconstructing payment ancestry",
  (defect) => {
    const capture = structuredClone(captureJson.initial) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const previous = capture.runtime.residentPlanPortfolio!;
    const pending = { ...previous.pendingRunnerCostPenaltySupportOrigin! };
    const next = structuredClone(previous);
    const executor = next.instances.find(
      (i) => i.instanceId === pending.executorInstanceId,
    )!;
    delete executor.parentInstanceId;
    delete executor.parentNeedId;
    if (defect === "missing_parent")
      next.instances = next.instances.filter(
        (i) => i.instanceId !== pending.rootPlanInstanceId,
      );
    if (defect === "closed_need")
      next.instances.find(
        (i) => i.instanceId === pending.rootPlanInstanceId,
      )!.openNeedIds = [];
    if (defect === "wrong_root")
      pending.rootPlanInstanceId = pending.executorInstanceId;
    if (defect === "cycle")
      previous.instances.find(
        (i) => i.instanceId === pending.rootPlanInstanceId,
      )!.parentInstanceId = pending.executorInstanceId;
    const unchanged = structuredClone(next);
    expect(() =>
      preserveCoveragePaymentAncestry(capture.input, previous, next, pending),
    ).toThrow(expect.objectContaining({ code: "invalid_support_graph" }));
    expect(next).toEqual(unchanged);
  },
);
