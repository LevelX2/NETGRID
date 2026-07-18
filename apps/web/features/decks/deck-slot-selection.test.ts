import { describe, expect, it } from "vitest";

import {
  RANDOM_STANDARD_DECK_SOURCE,
  randomStandardSnapshotForSlot,
  resolveDeckSlotSelection,
} from "./deck-slot-selection";

describe("resolveDeckSlotSelection", () => {
  const snapshots = [{ deckSnapshotId: "standard_corp" }];

  it("falls back to the visible standard deck when a stored personal deck disappeared", () => {
    expect(
      resolveDeckSlotSelection({
        source: "local",
        selectedSnapshotId: "standard_corp",
        selectedLocalDeckId: "missing_personal_deck",
        snapshots,
        localDecks: [],
      }),
    ).toEqual({ source: "snapshot", snapshotId: "standard_corp" });
  });

  it("keeps an available personal deck selected", () => {
    expect(
      resolveDeckSlotSelection({
        source: "local",
        selectedSnapshotId: "standard_corp",
        selectedLocalDeckId: "personal_corp",
        snapshots,
        localDecks: [{ deckId: "personal_corp" }],
      }),
    ).toEqual({ source: "local", localDeckId: "personal_corp" });
  });

  it("does not replace a standard selection while standards are still loading", () => {
    expect(
      resolveDeckSlotSelection({
        source: "snapshot",
        selectedSnapshotId: "standard_corp",
        selectedLocalDeckId: "personal_corp",
        snapshots: [],
        localDecks: [{ deckId: "personal_corp" }],
      }),
    ).toBeNull();
  });

  it("keeps a random standard slot unresolved until match start", () => {
    expect(
      resolveDeckSlotSelection({
        source: RANDOM_STANDARD_DECK_SOURCE,
        selectedSnapshotId: "standard_corp",
        selectedLocalDeckId: "personal_corp",
        snapshots,
        localDecks: [{ deckId: "personal_corp" }],
      }),
    ).toEqual({ source: RANDOM_STANDARD_DECK_SOURCE });
  });

  it("resolves random standards reproducibly and independently of API order", () => {
    const candidates = [
      { deckSnapshotId: "standard_c" },
      { deckSnapshotId: "standard_a" },
      { deckSnapshotId: "standard_b" },
    ];
    const first = randomStandardSnapshotForSlot({
      snapshots: candidates,
      seed: "match-seed",
      slotKey: "participant_b:corp",
    });
    const reordered = randomStandardSnapshotForSlot({
      snapshots: [...candidates].reverse(),
      seed: "match-seed",
      slotKey: "participant_b:corp",
    });

    expect(first).not.toBeNull();
    expect(reordered?.deckSnapshotId).toBe(first?.deckSnapshotId);
  });
});
