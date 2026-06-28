import { describe, expect, it } from "vitest";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";
import {
  runnerPressureGoalForServer,
  runnerRemoteGoalForServer,
} from "./tactical-plan-goal-evidence";

describe("tactical plan goal evidence", () => {
  it("matches runner pressure goal ids by bounded semantic terms", () => {
    expect(
      runnerPressureGoalForServer(
        context([
          goal("runner.strategic.hq_pressure_followup", "pressure", "hq"),
        ]),
        "hq",
      )?.goalId,
    ).toBe("runner.strategic.hq_pressure_followup");

    expect(
      runnerPressureGoalForServer(
        context([
          goal("runner.strategic.hq_pressureish_noise", "pressure", "hq"),
        ]),
        "hq",
      ),
    ).toBeUndefined();
  });

  it("matches runner remote goal ids by bounded semantic terms", () => {
    expect(
      runnerRemoteGoalForServer(
        context([
          goal("runner.remote_followup", "opportunistic_access", "remote_1"),
        ]),
        "remote_1",
      )?.goalId,
    ).toBe("runner.remote_followup");

    expect(
      runnerRemoteGoalForServer(
        context([
          goal("runner.remoteish_noise", "opportunistic_access", "remote_1"),
        ]),
        "remote_1",
      ),
    ).toBeUndefined();
  });
});

function context(goals: TacticalGoalLike[]): TacticalPlanBuildContext {
  return {
    tacticalGoals: goals,
  } as unknown as TacticalPlanBuildContext;
}

function goal(
  goalId: string,
  family: string,
  targetServerId: string,
): TacticalGoalLike {
  return {
    goalId,
    family,
    targetServerId,
    priority: 100,
    urgency: "high",
    source: "strategic_intent",
  };
}
