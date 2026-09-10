import type { StandardDeck } from "../account/account-deck-client";

import type { EditableDeck } from "./deck-table-model";

const STANDARD_DECK_PREVIEW_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export function editableStandardDeckPreview(
  standardDeck: StandardDeck,
): EditableDeck {
  return {
    deckId: `standard-preview:${standardDeck.standardDeckId}`,
    deckVersion: standardDeck.version,
    name: standardDeck.name,
    side: standardDeck.side,
    identityCardId: standardDeck.identityCardId,
    cardPoolSnapshotId: standardDeck.cardPoolSnapshotId,
    ...(standardDeck.cardPoolVersion
      ? { cardPoolVersion: standardDeck.cardPoolVersion }
      : {}),
    formatProfileId: standardDeck.formatProfileId,
    ...(standardDeck.formatProfileVersion
      ? { formatProfileVersion: standardDeck.formatProfileVersion }
      : {}),
    validationStatus: "valid",
    cards: standardDeck.cards.map((entry) => ({ ...entry })),
    createdAt: STANDARD_DECK_PREVIEW_TIMESTAMP,
    updatedAt: STANDARD_DECK_PREVIEW_TIMESTAMP,
  };
}
