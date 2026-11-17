import { createGameAfterSetup } from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS, type Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  assertValidAiDeckSnapshotForRuntime,
  buildAiDecisionInput,
  isAiDeckSnapshotRuntimeError,
  type AiDecisionInputWithDeckCapabilities,
  type AiDeckStrategyDeckSnapshot,
  type AiDeckSnapshotRuntimeErrorCode,
} from "./index";
import { deckSnapshotForSimulation } from "./simulation/simulation-config-helpers";

describe("AI deck snapshot runtime validation", () => {
  it("builds a normal AI decision input with a valid ownDeckSnapshot", () => {
    const state = createGameAfterSetup({
      matchId: "ai-deck-snapshot-valid",
      seed: "ai-deck-snapshot-valid",
    });
    const snapshot = snapshotForSide("corp");

    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "normal",
      ownDeckSnapshot: snapshot,
    }) as AiDecisionInputWithDeckCapabilities;

    expect(input.ownDeckStrategyProfile?.deckId).toBe(snapshot.deckSnapshotId);
    expect(input.ownDeckCapabilities?.side).toBe("corp");
  });

  it("rejects a normal AI decision input without ownDeckSnapshot", () => {
    const state = createGameAfterSetup({
      matchId: "ai-deck-snapshot-missing",
      seed: "ai-deck-snapshot-missing",
    });

    expectSnapshotError(
      () => buildAiDecisionInput(state, "corp", undefined as never),
      "ai_deck_snapshot_missing",
    );
  });

  it("rejects a normal AI decision input with the wrong side snapshot", () => {
    const state = createGameAfterSetup({
      matchId: "ai-deck-snapshot-side-mismatch",
      seed: "ai-deck-snapshot-side-mismatch",
    });

    expectSnapshotError(
      () =>
        buildAiDecisionInput(state, "corp", {
          difficulty: "normal",
          ownDeckSnapshot: snapshotForSide("runner"),
        }),
      "ai_deck_snapshot_side_mismatch",
    );
  });

  it("rejects a normal AI decision input with an unknown card id", () => {
    const state = createGameAfterSetup({
      matchId: "ai-deck-snapshot-unknown-card",
      seed: "ai-deck-snapshot-unknown-card",
    });
    const snapshot = snapshotForSide("corp");
    snapshot.cards = [{ cardId: Number.MAX_SAFE_INTEGER, quantity: 1 }];

    expectSnapshotError(
      () =>
        buildAiDecisionInput(state, "corp", {
          difficulty: "normal",
          ownDeckSnapshot: snapshot,
        }),
      "ai_deck_snapshot_unknown_card",
    );
  });

  it.each(["duplicate", "malformed", "string card identifier"])(
    "rejects %s card rows",
    (invalidity) => {
      const snapshot = snapshotForSide("corp");
      if (invalidity === "duplicate") {
        snapshot.cards.push({ ...snapshot.cards[0]! });
      } else if (invalidity === "string card identifier") {
        snapshot.cards[0] = {
          ...snapshot.cards[0]!,
          cardId: String(snapshot.cards[0]!.cardId) as never,
        };
      } else {
        snapshot.cards.push(null as never);
      }

      expectSnapshotError(
        () => assertValidAiDeckSnapshotForRuntime(snapshot, { side: "corp" }),
        "ai_deck_snapshot_invalid",
      );
    },
  );

  it("rejects stale ownDeckSnapshot metadata for normal runtime", () => {
    const snapshot = snapshotForSide("corp");

    expectSnapshotError(
      () =>
        assertValidAiDeckSnapshotForRuntime(snapshot, {
          side: "corp",
          deckSnapshotId: `${snapshot.deckSnapshotId}_stale`,
        }),
      "ai_deck_snapshot_stale",
    );
  });
});

function snapshotForSide(side: Side): AiDeckStrategyDeckSnapshot {
  return deckSnapshotForSimulation(ORIGINALSET_DEFAULT_DECKS[side]);
}

function expectSnapshotError(
  run: () => unknown,
  code: AiDeckSnapshotRuntimeErrorCode,
): void {
  try {
    run();
  } catch (error) {
    expect(isAiDeckSnapshotRuntimeError(error)).toBe(true);
    if (!isAiDeckSnapshotRuntimeError(error)) throw error;
    expect(error.code).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}`);
}
