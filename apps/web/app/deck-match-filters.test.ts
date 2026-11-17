import { createRuntimeCardsById } from "@netgrid/catalog";
import { describe, expect, it } from "vitest";

import {
  CLASSIC_DECK_FORMAT_PROFILE_ID,
  CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID,
  PROTEUS_DECK_FORMAT_PROFILE_ID,
  deckProfileForMatchCardPool,
  editableDeckAllowedForMatchCardPool,
  snapshotAllowedForMatchCardPool,
} from "../features/decks/deck-match-filters";

const cardSetsById = createRuntimeCardsById();

const baseDeck = {
  deckId: "local_runner",
  deckVersion: "test",
  name: "Runner",
  side: "runner" as const,
  identityCardId: 587,
  cardPoolSnapshotId: "card-snapshot-0.8",
  formatProfileId: "netgrid_private_local_v1",
  cards: [{ cardId: 213, quantity: 1 }],
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z",
};

describe("deck match card-pool filters", () => {
  it("maps additive match pools to explicit format profiles", () => {
    expect(deckProfileForMatchCardPool("originalset").formatProfileId).toBe(
      "netgrid_private_local_v1",
    );
    expect(
      deckProfileForMatchCardPool("originalset_classic").formatProfileId,
    ).toBe(CLASSIC_DECK_FORMAT_PROFILE_ID);
    expect(
      deckProfileForMatchCardPool("originalset_proteus").formatProfileId,
    ).toBe(PROTEUS_DECK_FORMAT_PROFILE_ID);
    expect(
      deckProfileForMatchCardPool("originalset_classic_proteus")
        .formatProfileId,
    ).toBe(CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID);
  });

  it("blocks Classic and Proteus cards unless their additive set is selected", () => {
    const classicDeck = {
      ...baseDeck,
      formatProfileId: CLASSIC_DECK_FORMAT_PROFILE_ID,
      cards: [{ cardId: 45, quantity: 1 }],
    };
    const proteusDeck = {
      ...baseDeck,
      formatProfileId: PROTEUS_DECK_FORMAT_PROFILE_ID,
      cards: [{ cardId: 105, quantity: 1 }],
    };
    const combinedDeck = {
      ...baseDeck,
      formatProfileId: CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID,
      cards: [
        { cardId: 45, quantity: 1 },
        { cardId: 105, quantity: 1 },
      ],
    };

    expect(
      editableDeckAllowedForMatchCardPool(classicDeck, "originalset", cardSetsById),
    ).toBe(false);
    expect(
      editableDeckAllowedForMatchCardPool(classicDeck, "originalset_classic", cardSetsById),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(
        classicDeck,
        "originalset_classic_proteus", cardSetsById,
      ),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(classicDeck, "originalset_proteus", cardSetsById),
    ).toBe(false);
    expect(
      editableDeckAllowedForMatchCardPool(proteusDeck, "originalset_proteus", cardSetsById),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(
        proteusDeck,
        "originalset_classic_proteus", cardSetsById,
      ),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(proteusDeck, "originalset_classic", cardSetsById),
    ).toBe(false);
    expect(
      editableDeckAllowedForMatchCardPool(
        combinedDeck,
        "originalset_classic_proteus", cardSetsById,
      ),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(combinedDeck, "originalset_classic", cardSetsById),
    ).toBe(false);
  });

  it("uses the same additive checks for immutable snapshots", () => {
    const snapshot = {
      formatProfileId: CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID,
      cards: [
        { cardId: 45, quantity: 1 },
        { cardId: 105, quantity: 1 },
      ],
    };

    expect(snapshotAllowedForMatchCardPool(snapshot, "originalset", cardSetsById)).toBe(
      false,
    );
    expect(
      snapshotAllowedForMatchCardPool(snapshot, "originalset_proteus", cardSetsById),
    ).toBe(false);
    expect(
      snapshotAllowedForMatchCardPool(snapshot, "originalset_classic_proteus", cardSetsById),
    ).toBe(true);
  });
});
