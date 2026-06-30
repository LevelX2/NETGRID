import { describe, expect, it } from "vitest";

import {
  CLASSIC_DECK_FORMAT_PROFILE_ID,
  CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID,
  PROTEUS_DECK_FORMAT_PROFILE_ID,
  deckProfileForMatchCardPool,
  editableDeckAllowedForMatchCardPool,
  snapshotAllowedForMatchCardPool,
} from "../features/decks/deck-match-filters";

const baseDeck = {
  deckId: "local_runner",
  deckVersion: "test",
  name: "Runner",
  side: "runner" as const,
  identityCardId: "runner_identity_001",
  cardPoolSnapshotId: "card-snapshot-0.8",
  formatProfileId: "netgrid_private_local_v1",
  cards: [{ cardId: "onr_v1_001_afreet", quantity: 1 }],
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

  it("blocks Classic and Protheus cards unless their additive set is selected", () => {
    const classicDeck = {
      ...baseDeck,
      formatProfileId: CLASSIC_DECK_FORMAT_PROFILE_ID,
      cards: [{ cardId: "onr_classic_041_networking", quantity: 1 }],
    };
    const proteusDeck = {
      ...baseDeck,
      formatProfileId: PROTEUS_DECK_FORMAT_PROFILE_ID,
      cards: [{ cardId: "onr_proteus_047_credit-consolidation", quantity: 1 }],
    };
    const combinedDeck = {
      ...baseDeck,
      formatProfileId: CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID,
      cards: [
        { cardId: "onr_classic_041_networking", quantity: 1 },
        { cardId: "onr_proteus_047_credit-consolidation", quantity: 1 },
      ],
    };

    expect(
      editableDeckAllowedForMatchCardPool(classicDeck, "originalset"),
    ).toBe(false);
    expect(
      editableDeckAllowedForMatchCardPool(classicDeck, "originalset_classic"),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(
        classicDeck,
        "originalset_classic_proteus",
      ),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(classicDeck, "originalset_proteus"),
    ).toBe(false);
    expect(
      editableDeckAllowedForMatchCardPool(proteusDeck, "originalset_proteus"),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(
        proteusDeck,
        "originalset_classic_proteus",
      ),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(proteusDeck, "originalset_classic"),
    ).toBe(false);
    expect(
      editableDeckAllowedForMatchCardPool(
        combinedDeck,
        "originalset_classic_proteus",
      ),
    ).toBe(true);
    expect(
      editableDeckAllowedForMatchCardPool(combinedDeck, "originalset_classic"),
    ).toBe(false);
  });

  it("uses the same additive checks for immutable snapshots", () => {
    const snapshot = {
      formatProfileId: CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID,
      cards: [
        { cardId: "onr_classic_041_networking", quantity: 1 },
        { cardId: "onr_proteus_047_credit-consolidation", quantity: 1 },
      ],
    };

    expect(snapshotAllowedForMatchCardPool(snapshot, "originalset")).toBe(
      false,
    );
    expect(
      snapshotAllowedForMatchCardPool(snapshot, "originalset_proteus"),
    ).toBe(false);
    expect(
      snapshotAllowedForMatchCardPool(snapshot, "originalset_classic_proteus"),
    ).toBe(true);
  });
});
