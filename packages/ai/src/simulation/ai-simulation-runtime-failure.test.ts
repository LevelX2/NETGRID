import { describe, expect, it } from "vitest";

import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  classifySimulationRuntimeFailure,
  simulationRuntimeFailureToken,
} from "./ai-simulation-runtime-failure";

describe("simulation runtime failure classification", () => {
  it("preserves classified PlanResolutionFailure code, owner, plan and step", () => {
    const failure = classifySimulationRuntimeFailure(
      new PlanResolutionFailure("missing_plan_module_coverage", {
        side: "runner",
        stateVersion: 9,
        timingPoint: "runner_action.main",
        legalActionTypes: ["install_card"],
        unresolvedActionIds: ["runner.install_card"],
        owner: "plan_registry",
        removalCondition: "Register the missing plan module.",
        planInstanceId: "plan:runner.coverage:code_gate",
        stepId: "find_breaker",
      }),
      {
        side: "corp",
        stateVersion: 99,
        timingPoint: "ignored",
      },
    );

    expect(failure).toEqual({
      classified: true,
      code: "missing_plan_module_coverage",
      owner: "plan_registry",
      side: "runner",
      stateVersion: 9,
      timingPoint: "runner_action.main",
      removalCondition: "Register the missing plan module.",
      planInstanceId: "plan:runner.coverage:code_gate",
      stepId: "find_breaker",
      legalActionTypes: ["install_card"],
      unresolvedActionIds: ["runner.install_card"],
    });
    expect(simulationRuntimeFailureToken(failure)).toBe(
      "runtime_failure:missing_plan_module_coverage classified:true owner:plan_registry side:runner stateVersion:9 timing:runner_action.main removalCondition:Register the missing plan module. plan:plan:runner.coverage:code_gate step:find_breaker legalActionTypes:install_card unresolvedActionIds:runner.install_card",
    );
  });

  it.each([
    ["invalid_side_plan_registry", "invalid_plan_identity", "plan_registry"],
    [
      "plan_first_selected_action_not_legal",
      "stale_or_future_action_reference",
      "scheduler",
    ],
  ])("classifies known raw boundary error %s", (message, code, owner) => {
    expect(
      classifySimulationRuntimeFailure(new Error(message), context()),
    ).toMatchObject({
      classified: true,
      code,
      owner,
    });
  });

  it("does not invent a class or owner for an unknown exception", () => {
    expect(
      classifySimulationRuntimeFailure(new Error("unexpected"), context()),
    ).toEqual({
      classified: false,
      code: "unclassified_runtime_failure",
      side: "runner",
      stateVersion: 4,
      timingPoint: "runner_action.main",
    });
  });
});

function context() {
  return {
    side: "runner" as const,
    stateVersion: 4,
    timingPoint: "runner_action.main",
  };
}
