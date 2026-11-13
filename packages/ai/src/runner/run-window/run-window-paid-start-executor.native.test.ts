import { readFileSync } from "node:fs";
import type { AiDecisionInput } from "@netgrid/shared";
import { expect, it } from "vitest";
import type {
  PlanSchedulerContext,
  PlanSchedulerResult,
} from "../../plans/plan-scheduler";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import {
  reconcileSelectedRunnerCostPenaltySupportOrigin,
  resolvePlanBoundRunnerCostPenaltyContinuation,
} from "./run-window-cost-continuation";
import { resolvePlanBoundRunnerTraceBaseLinkChoice } from "./run-window-trace-continuation";

function original() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta734-paid-run-start.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    paymentInput: AiDecisionInput;
    traceInput: AiDecisionInput;
    previous: ResidentPlanPortfolio;
  };
}

function engineContinuation(
  input: AiDecisionInput,
  previous: ResidentPlanPortfolio,
) {
  const resolution = resolvePlanBoundRunnerCostPenaltyContinuation(
    { input } as PlanSchedulerContext,
    previous,
  );
  if (!resolution) throw new Error("Missing exact Runner payment continuation");
  const result: Extract<PlanSchedulerResult, { lane: "engine_window" }> = {
    lane: "engine_window",
    actionId: resolution.actionId,
    origin: resolution.origin,
    portfolio: structuredClone(previous),
    diagnostics: [{ stage: "window", code: resolution.reasonCode }],
  };
  return result;
}

it("resumes the paid Disgruntled Ice Technician Run under the original R&D owner", () => {
  const { paymentInput, traceInput, previous } = original();
  const origin = previous.pendingRunnerCostPenaltySupportOrigin!;
  const before = JSON.stringify(previous);
  const result = engineContinuation(paymentInput, previous);
  expect(previous.executorInstanceId).toContain("runner.economy");
  reconcileSelectedRunnerCostPenaltySupportOrigin(
    paymentInput,
    result,
    previous,
  );
  expect(JSON.stringify(previous)).toBe(before);
  expect(result.actionId).toBe(origin.originalActionId);
  expect(result.portfolio).toMatchObject({
    rootForegroundInstanceId: origin.rootPlanInstanceId,
    executorInstanceId: origin.executorInstanceId,
    selectedActionOrigin: {
      selectedActionId: origin.originalActionId,
      sourceStepId: origin.sourceStepId,
      selectedAtStateVersion: paymentInput.playerView.stateVersion,
    },
  });
  expect(
    result.portfolio?.pendingRunnerCostPenaltySupportOrigin,
  ).toBeUndefined();
  expect(
    resolvePlanBoundRunnerTraceBaseLinkChoice(
      { input: traceInput } as PlanSchedulerContext,
      result.portfolio,
    ),
  ).toMatchObject({
    actionId: "runner.resolve_choice",
    origin: {
      rootPlanInstanceId: origin.rootPlanInstanceId,
      leafPlanInstanceId: origin.executorInstanceId,
    },
  });
});

it("rejects a foreign Run target on the paid continuation", () => {
  const { paymentInput, previous } = original();
  const result = engineContinuation(paymentInput, previous);
  paymentInput.legalActions[0]!.payload!.serverId = "hq";
  expect(() =>
    reconcileSelectedRunnerCostPenaltySupportOrigin(
      paymentInput,
      result,
      previous,
    ),
  ).toThrow(/window_origin_missing/);
});
