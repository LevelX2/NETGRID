import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { nextEncounterDamageMarkerPayment } from "../../runner/run-window/run-window-encounter-payment";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function native() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/deep666-d109-pump-payment-continuation.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    cp.runtime.residentPlanPortfolio,
  );
  return input;
}

it("finishes the already bound native pump payment under its original run owner", () => {
  const input = native();
  const continuation = input.legalActions.find(
    (a) => a.payload?.runnerCostPenaltySupportContinuation === true,
  )!;
  const before = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(continuation.actionId);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ahq",
  );
  expect(plan.leafExecutorInstanceId).toBe(
    "plan:runner.convert_run_window:run%3Arun_107",
  );
  expect(plan.lane).toBe("engine_window");
  expect(plan.engineWindowAction).toMatchObject({
    actionId: continuation.actionId,
    reasonCode: "plan_bound_runner_cost_penalty_support_continuation",
  });
  expect(plan.executionOrigin).toMatchObject({
    rootPlanInstanceId: plan.rootPlanInstanceId,
    leafPlanInstanceId: plan.leafExecutorInstanceId,
    windowId: "runner_cost_penalty_support.108",
    stateVersion: 108,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(before);
});

it("does not require an encounter-resolution offer inside the marked payment window", () => {
  const input = native();
  const action = input.legalActions.find((a) => a.type === "pump_breaker")!;
  expect(nextEncounterDamageMarkerPayment(input, action)).toBeUndefined();
});

it("still fails closed when an ordinary encounter action lacks its required scope", () => {
  const input = native();
  const action = input.legalActions.find((a) => a.type === "pump_breaker")!;
  delete action.payload!.runnerCostPenaltySupportContinuation;
  expect(() => nextEncounterDamageMarkerPayment(input, action)).toThrow(
    PlanResolutionFailure,
  );
});
