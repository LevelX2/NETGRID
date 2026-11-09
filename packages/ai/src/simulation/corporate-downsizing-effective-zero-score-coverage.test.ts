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
      maxActions: 700,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      ...resolved.config,
    });

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.replayErrors).toEqual([]);
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
    expect(
      summary.actionSequence.some(
        (action) =>
          action.actionType === "score_agenda" &&
          action.debugFacts.some((fact) =>
            fact.includes("onr_v1_194_corporate-downsizing"),
          ),
      ),
    ).toBe(true);
    // Action-scoped random-break risk changes the first run-event admission
    // at D104. The verified legal continuation ends after 649 actions and
    // scores Corporate Downsizing twice; keep terminal/replay and card-score
    // coverage without requiring the earlier trajectory's 600-action bound.
  }, 120_000);
});
