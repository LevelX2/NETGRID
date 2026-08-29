import { describe, expect, it } from "vitest";

import type { StandardDeck } from "../account/account-deck-client";
import { editableStandardDeckPreview } from "./standard-deck-table-preview";

const standardDeck: StandardDeck = {
  standardDeckId: "standard_runner_preview",
  version: "1.0.0",
  status: "active",
  name: "Ghost Circuit",
  side: "runner",
  identityCardId: "identity_runner",
  cardPoolSnapshotId: "card_pool_original",
  cardPoolVersion: "1.0.0",
  formatProfileId: "format_original",
  formatProfileVersion: "1.0.0",
  cards: [{ cardId: "card_a", quantity: 3 }],
  guideStatus: "missing",
};

describe("standard deck table preview", () => {
  it("creates a deterministic, detached editable draft without making it personal", () => {
    const preview = editableStandardDeckPreview(standardDeck);

    expect(preview).toMatchObject({
      deckId: "standard-preview:standard_runner_preview",
      deckVersion: "1.0.0",
      name: "Ghost Circuit",
      side: "runner",
      validationStatus: "valid",
      cards: [{ cardId: "card_a", quantity: 3 }],
    });
    expect(preview.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(preview.cards).not.toBe(standardDeck.cards);
    expect(preview.cards[0]).not.toBe(standardDeck.cards[0]);
  });
});
