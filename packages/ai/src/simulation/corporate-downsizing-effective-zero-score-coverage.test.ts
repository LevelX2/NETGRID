import { describe, expect, it } from "vitest";

import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

const SLOT_ID = "strategy_panel_fast_advance_chrome_rush";
const SEED = "ai-behavior-baseline-v1-03";

describe("Corporate Downsizing effective-zero score coverage", () => {
  it("keeps the originating baseline seed on a clean terminal plan-first path", () => {
    const slot = listMatchProgressionBenchmarkDeckSlots().find(
      (candidate) => candidate.slotId === SLOT_ID,
    );
    if (!slot) throw new Error(`Missing benchmark slot ${SLOT_ID}`);
    const resolved = resolveBenchmarkDeckSlot(slot);
    if (!resolved.ok) throw new Error(resolved.reason);

    const summary = simulateAiGame({
      seed: SEED,
      maxActions: 480,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      ...resolved.config,
    });

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.terminationKind).toBe("game_result");
    expect(summary.actionSequence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionType: "score_agenda",
          planKind: "corp.score_agenda",
          reasonCode: "plan_first.corp.score_agenda",
          fallbackUsed: false,
        }),
      ]),
    );
  }, 30_000);
});
