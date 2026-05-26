import type { GameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { cloneGameStateForAction } from "./apply-action-state";
import { createGame } from "./create-game";

describe("apply action state clone", () => {
  it("does not mutate the original state and preserves stateVersion", () => {
    const state = createGame({
      seed: "arch-62-apply-action-state",
      setupMode: "completed",
    });
    const before = JSON.stringify(state);

    const clone = cloneGameStateForAction(state);

    expect(JSON.stringify(state)).toBe(before);
    expect(clone).toEqual(state);
    expect(clone).not.toBe(state);
    expect(clone.stateVersion).toBe(state.stateVersion);
  });

  it("keeps EventLog as a new array with existing event object references", () => {
    const state = createGame({
      seed: "arch-62-apply-action-state-eventlog",
      setupMode: "completed",
    });
    const event = state.eventLog[0] as GameEvent;

    const clone = cloneGameStateForAction(state);

    expect(clone.eventLog).toEqual(state.eventLog);
    expect(clone.eventLog).not.toBe(state.eventLog);
    expect(clone.eventLog[0]).toBe(event);
  });

  it("deep clones non-event runtime fields including randomDrawRecords", () => {
    const state = createGame({
      seed: "arch-62-apply-action-state-random",
      setupMode: "completed",
    });
    state.randomDrawRecords.push({
      counter: 7,
      purpose: "arch_62_clone_policy",
      value: 3,
    });

    const clone = cloneGameStateForAction(state);

    expect(clone.randomDrawRecords).toEqual(state.randomDrawRecords);
    expect(clone.randomDrawRecords).not.toBe(state.randomDrawRecords);
    const recordIndex = state.randomDrawRecords.length - 1;
    expect(clone.randomDrawRecords[recordIndex]).not.toBe(
      state.randomDrawRecords[recordIndex],
    );
    clone.randomDrawRecords[recordIndex]!.counter = 99;
    expect(state.randomDrawRecords[recordIndex]!.counter).toBe(7);
  });
});
