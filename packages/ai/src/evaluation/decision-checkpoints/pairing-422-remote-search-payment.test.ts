import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
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

type CapturedPayment = {
  initial: {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  followingInputs: AiDecisionInputWithDeckCapabilities[];
};
const captureJson = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-remote-search-payment-d166.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as CapturedPayment;

it("does not open an unfunded historical temporary search or accept its off-branch payment window", () => {
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
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.gain_credit");
  expect(decision.fallbackUsed).toBe(false);
  expect(
    residentPlanPortfolioSnapshot(input)?.pendingRunnerCostPenaltySupportOrigin,
  ).toBeUndefined();
  expect(JSON.stringify(input)).toBe(before);
  // The old capture then assumes Sneak was played. That payment state is no longer this AI branch.
  expect(() => chooseAiAction(capture.followingInputs[0]!)).toThrow(
    expect.objectContaining({ code: "window_origin_missing" }),
  );
});

it("preserves the complete existing remote parent independently of search-route admission", () => {
  const capture = structuredClone(captureJson.initial) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const previous = capture.runtime.residentPlanPortfolio!;
  const pending = previous.pendingRunnerCostPenaltySupportOrigin!;
  const old = previous.instances.find(
    (i) => i.instanceId === pending.executorInstanceId,
  )!;
  expect(old.parentInstanceId).toBe(pending.rootPlanInstanceId);
  expect(old.parentNeedId).toBeDefined();
  const next = structuredClone(previous);
  const leaf = next.instances.find(
    (i) => i.instanceId === pending.executorInstanceId,
  )!;
  delete leaf.parentInstanceId;
  delete leaf.parentNeedId;
  const before = JSON.stringify(previous);
  preserveCoveragePaymentAncestry(capture.input, previous, next, pending);
  expect(leaf.parentInstanceId).toBe(old.parentInstanceId);
  expect(leaf.parentNeedId).toBe(old.parentNeedId);
  expect(JSON.stringify(previous)).toBe(before);
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
