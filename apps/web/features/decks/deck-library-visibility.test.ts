import { describe, expect, it } from "vitest";
import {
  isCuratedLegacyDeckId,
  mergeVisibleGuestDecks,
  visibleGuestDecks,
} from "./deck-library-visibility";
import type { EditableDeck } from "./deck-table-model";

describe("guest deck library visibility", () => {
  it("hides all frozen legacy classifications while preserving newly created guest decks", () => {
    const standard = deck("local_corp_cheap_bag_tricks");
    const internal = deck("local_corp_ki_rush_score_static_mix_2026_06_29");
    const testFixture = deck("local_corp_unused_black_ice_ambush_lab");
    const own = deck("local_corp_created_after_account_migration");
    expect(
      visibleGuestDecks([standard, internal, testFixture, own]).map(
        (entry) => entry.deckId,
      ),
    ).toEqual([own.deckId]);
    expect(isCuratedLegacyDeckId(standard.deckId)).toBe(true);
  });

  it("keeps hidden legacy files in the persistence payload", () => {
    const hidden = deck("local_corp_unused_black_ice_ambush_lab");
    const oldOwn = deck("local_old_own");
    const nextOwn = deck("local_next_own");
    expect(
      mergeVisibleGuestDecks([hidden, oldOwn], [nextOwn]).map(
        (entry) => entry.deckId,
      ),
    ).toEqual([hidden.deckId, nextOwn.deckId]);
  });
});

function deck(deckId: string): EditableDeck {
  return {
    deckId,
    deckVersion: "test",
    name: deckId,
    side: "corp",
    identityCardId: "corp_identity_001",
    cardPoolSnapshotId: "card-snapshot-0.8",
    formatProfileId: "netgrid_private_local_v1",
    cards: [],
    createdAt: "2026-07-18T00:00:00.000Z",
    updatedAt: "2026-07-18T00:00:00.000Z",
  };
}
