import type { GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyRunnerForgoNextAction,
  consumeRunnerFutureActionDebt,
} from "./turn-action-economy-runtime";

function state(clicks: number): GameState {
  return {
    runner: {
      clicks,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {},
    cardInstances: {},
    runnerTurnFlags: {
      runnerActionOrdinal: 0,
      runLockActionsPending: 6,
      forgoNextActionsPending: 0,
    },
  } as unknown as GameState;
}

describe("runner action-capacity consumption", () => {
  it("counts an immediately forgone action against action ordinals and run locks", () => {
    const current = state(3);

    applyRunnerForgoNextAction(current);

    expect(current.runner.clicks).toBe(2);
    expect(current.runnerTurnFlags).toMatchObject({
      runnerActionOrdinal: 1,
      currentRunnerActionOrdinal: 1,
      runLockActionsPending: 5,
    });
  });

  it("counts every consumed future action-debt unit against the same contract", () => {
    const current = state(3);
    current.runnerTurnFlags!.forgoNextActionsPending = 2;

    expect(consumeRunnerFutureActionDebt(current)).toBe(2);

    expect(current.runner.clicks).toBe(1);
    expect(current.runnerTurnFlags).toMatchObject({
      forgoNextActionsPending: 0,
      runnerActionOrdinal: 2,
      currentRunnerActionOrdinal: 2,
      runLockActionsPending: 4,
    });
  });
});
