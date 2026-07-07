import { createGameAfterSetup } from "@netgrid/engine";
import { describe, expect, it } from "vitest";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import {
  assertValidAiDeckSnapshotForRuntime,
  buildAiDecisionInput,
  isAiDeckSnapshotRuntimeError,
  type AiDecisionInputWithDeckCapabilities,
  type AiDeckStrategyDeckSnapshot,
  type AiDeckSnapshotRuntimeErrorCode,
} from "./index";

describe("AI deck snapshot runtime validation", () => {
  it("builds a normal AI decision input with a valid ownDeckSnapshot", () => {
    const state = createGameAfterSetup({
      matchId: "ai-deck-snapshot-valid",
      seed: "ai-deck-snapshot-valid",
    });
    const snapshot = snapshotById("demo_corp_008_snapshot_v0_8");

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
      () => buildAiDecisionInput(state, "corp", {
        difficulty: "normal",
        ownDeckSnapshot: snapshotById("demo_runner_008_snapshot_v0_8"),
      }),
      "ai_deck_snapshot_side_mismatch",
    );
  });

  it("rejects a normal AI decision input with an unknown card id", () => {
    const state = createGameAfterSetup({
      matchId: "ai-deck-snapshot-unknown-card",
      seed: "ai-deck-snapshot-unknown-card",
    });
    const snapshot = structuredClone(snapshotById("demo_corp_008_snapshot_v0_8"));
    snapshot.cards = [{ cardId: "unknown_runtime_card_for_snapshot_test", quantity: 1 }];

    expectSnapshotError(
      () => buildAiDecisionInput(state, "corp", {
        difficulty: "normal",
        ownDeckSnapshot: snapshot,
      }),
      "ai_deck_snapshot_unknown_card",
    );
  });

  it("rejects stale ownDeckSnapshot metadata for normal runtime", () => {
    const snapshot = snapshotById("demo_corp_008_snapshot_v0_8");

    expectSnapshotError(
      () => assertValidAiDeckSnapshotForRuntime(snapshot, {
        side: "corp",
        deckSnapshotId: `${snapshot.deckSnapshotId}_stale`,
      }),
      "ai_deck_snapshot_stale",
    );
  });
});

function snapshotById(snapshotId: string): AiDeckStrategyDeckSnapshot {
  const snapshot = (snapshotsData08.snapshots as AiDeckStrategyDeckSnapshot[]).find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing test deck snapshot ${snapshotId}`);
  return structuredClone(snapshot);
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
