import type { AiDecisionInput } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getRunnerRunPlanMemorySnapshot,
  restoreRunnerRunPlanMemorySnapshot,
  resetRunnerRunPlanMemory,
} from "./runner-run-plan-memory";
import type { RunnerRunPlan } from "./runner-run-plan-snapshot";

describe("runner run plan memory", () => {
  beforeEach(() => resetRunnerRunPlanMemory());

  it("rejects restoration from a later state version", () => {
    expect(() =>
      restoreRunnerRunPlanMemorySnapshot(runnerInput(true), {
        ...activePlan(),
        updatedAtStateVersion: 2,
      }),
    ).toThrow("invalid_runner_run_plan_memory_checkpoint");
  });

  it("clears the stored plan when the runner is no longer in a run", () => {
    const activeInput = runnerInput(true);
    const inactiveInput = runnerInput(false);
    restoreRunnerRunPlanMemorySnapshot(activeInput, activePlan());

    expect(getRunnerRunPlanMemorySnapshot(activeInput)?.id).toBe("runplan-1");
    expect(getRunnerRunPlanMemorySnapshot(inactiveInput)).toBeUndefined();
    expect(getRunnerRunPlanMemorySnapshot(activeInput)).toBeUndefined();
  });
});

function runnerInput(activeRun: boolean): AiDecisionInput {
  return {
    side: "runner",
    profileId: "runner-test",
    decisionId: "runner-memory:1",
    seed: "runner-memory",
    playerView: {
      stateVersion: 1,
      ...(activeRun ? { run: {} } : {}),
    },
  } as unknown as AiDecisionInput;
}

function activePlan(): RunnerRunPlan {
  return {
    id: "runplan-1",
    lifecycle: "active",
    updatedAtStateVersion: 1,
  } as RunnerRunPlan;
}
