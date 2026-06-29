import { describe, expect, it } from "vitest";
import { createPlanStep, createTacticalPlan } from "./tactical-plan-builders";
import {
  normalizedPlanContinuityValue,
  progressTacticalPlans,
} from "./tactical-plan-progression";
import type { TacticalPlanMemorySnapshot } from "./tactical-plan-types";

describe("tactical plan progression", () => {
  it("normalizes plan continuity values into the scoring consumer scale", () => {
    expect(normalizedPlanContinuityValue(0)).toBe(0);
    expect(normalizedPlanContinuityValue(120)).toBe(12);
    expect(normalizedPlanContinuityValue(1500)).toBe(100);
    expect(normalizedPlanContinuityValue(-1500)).toBe(-100);
  });

  it("keeps priority continuity while exposing normalized scoring evidence", () => {
    const plan = createTacticalPlan({
      planId: "runner.contest_remote:remote_1",
      side: "runner",
      type: "runner.contest_remote",
      status: "active",
      priority: 700,
      horizonTurns: 1,
      target: { kind: "server", id: "remote_1" },
      currentStep: createPlanStep({
        stepId: "run_target:remote_1",
        kind: "run_target",
        desiredActionSemantics: ["run"],
      }),
      stateVersion: 12,
    });
    const previousPlan: TacticalPlanMemorySnapshot = {
      schemaVersion: "tactical-plan-v1",
      memoryId: "previous-remote-1",
      side: "runner",
      planId: "runner.contest_remote:remote_1",
      type: "runner.contest_remote",
      status: "progressing",
      target: { kind: "server", id: "remote_1" },
      selectedStepKind: "run_target",
      selectedActionId: "run-remote-1",
      blockedBy: [],
      ttlDecisionsRemaining: 2,
      planProgressionReason: "previous_plan_considered",
      updatedAtStateVersion: 11,
    };

    const result = progressTacticalPlans([plan], previousPlan);
    const progressed = result.plans[0];

    expect(progressed?.priority).toBe(820);
    expect(progressed?.status).toBe("progressing");
    expect(progressed?.evidence).toEqual(
      expect.arrayContaining([
        "plan_continuity_raw_value:120",
        "plan_continuity_normalized_value:12",
      ]),
    );
    expect(progressed?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "previous_plan_continuity",
          value: 12,
          reason: expect.stringContaining(
            "plan_continuity_normalized_value:12",
          ),
        }),
      ]),
    );
  });
});
