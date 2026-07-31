import { describe, expect, it } from "vitest";

import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

const SLOT_ID = "progression_tuning_origin_pressure_vs_tax";
const SEED = "ai-behavior-baseline-v1-01";

describe("Runner TurnPlanner cutover behavior-baseline regressions", () => {
  it("does not let a rejected defense-draw use suppress Night Shift's independent economy route", () => {
    const slot = listMatchProgressionBenchmarkDeckSlots().find(
      (candidate) => candidate.slotId === SLOT_ID,
    );
    if (!slot) throw new Error(`Missing benchmark slot ${SLOT_ID}.`);
    const resolved = resolveBenchmarkDeckSlot(slot);
    if (!resolved.ok) throw new Error(resolved.reason);

    const summary = simulateAiGame({
      seed: SEED,
      maxActions: 20,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      ...resolved.config,
    });

    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.errors).toEqual([]);
    expect(
      summary.actionSequence
        .slice(15)
        .some(
          (entry) =>
            entry.side === "corp" &&
            entry.selectedActionId === "corp.play_operation" &&
            entry.actionType === "play_operation" &&
            entry.planKind === "corp.economy" &&
            entry.reasonCode === "plan_first.corp.economy",
        ),
    ).toBe(true);
  });
});
