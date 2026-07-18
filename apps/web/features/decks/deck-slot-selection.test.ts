import { describe, expect, it } from "vitest";

import { resolveDeckSlotSelection } from "./deck-slot-selection";

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
});
