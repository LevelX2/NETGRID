import { describe, expect, it } from "vitest";
import {
  PLAN_RESOLUTION_FAILURE_CODES,
  PlanResolutionFailure,
  planResolutionFailureEvidence,
} from "./plan-resolution-failure";

describe("PlanResolutionFailure", () => {
  it("normalizes a deterministic redacted failure context", () => {
    const failure = new PlanResolutionFailure(
      "missing_plan_module_coverage",
      {
        side: "runner",
        stateVersion: 12.9,
        timingPoint: "runner_action.main",
        legalActionTypes: ["draw_card", "gain_credit", "draw_card"],
        owner: "plan_registry",
        removalCondition:
          "Add a domain plan for the uncovered semantic action family.",
        candidateCount: 2.8,
      },
    );

    expect(failure.code).toBe("missing_plan_module_coverage");
    expect(failure.context).toEqual({
      side: "runner",
      stateVersion: 12,
      timingPoint: "runner_action.main",
      legalActionTypes: ["draw_card", "gain_credit"],
      owner: "plan_registry",
      removalCondition:
        "Add a domain plan for the uncovered semantic action family.",
      candidateCount: 2,
    });
    expect(failure.message).toBe(
      "Plan resolution failed: missing_plan_module_coverage side=runner stateVersion=12 timing=runner_action.main actions=draw_card,gain_credit owner=plan_registry",
    );
  });

  it("exports stable evidence without action payloads or hidden cards", () => {
    const failure = new PlanResolutionFailure("no_current_route_head", {
      side: "corp",
      stateVersion: 8,
      timingPoint: "corp_action.main",
      legalActionTypes: ["install_card"],
      owner: "plan_module",
      removalCondition: "Materialize a current route head.",
      planInstanceId: "corp.score_agenda:remote_1",
      stepId: "install_agenda",
      routeCount: 0,
    });

    expect(planResolutionFailureEvidence(failure)).toEqual([
      "plan_resolution_failure:no_current_route_head",
      "plan_resolution_owner:plan_module",
      "plan_resolution_side:corp",
      "plan_resolution_state_version:8",
      "plan_resolution_timing:corp_action.main",
      "plan_resolution_legal_action_types:install_card",
      "plan_resolution_removal_condition:Materialize a current route head.",
      "plan_resolution_instance:corp.score_agenda:remote_1",
      "plan_resolution_step:install_agenda",
      "plan_resolution_route_count:0",
    ]);
  });

  it("keeps the failure code catalog unique", () => {
    expect(new Set(PLAN_RESOLUTION_FAILURE_CODES).size).toBe(
      PLAN_RESOLUTION_FAILURE_CODES.length,
    );
  });
});
