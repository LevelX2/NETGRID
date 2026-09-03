import { standardDeckCurationData as curationData } from "@netgrid/runtime-data/decks";
import type { EditableDeck } from "./deck-table-model";

const CURATED_LEGACY_DECK_IDS = new Set(
  curationData.localDeckLibrary.entries.map((entry) => entry.sourceDeckId),
);

export function visibleGuestDecks(decks: EditableDeck[]): EditableDeck[] {
  return decks.filter((deck) => !CURATED_LEGACY_DECK_IDS.has(deck.deckId));
}

export function mergeVisibleGuestDecks(
  backingDecks: EditableDeck[],
  visibleDecks: EditableDeck[],
): EditableDeck[] {
  return [
    ...backingDecks.filter((deck) => CURATED_LEGACY_DECK_IDS.has(deck.deckId)),
    ...visibleDecks.filter((deck) => !CURATED_LEGACY_DECK_IDS.has(deck.deckId)),
  ];
}

export function isCuratedLegacyDeckId(deckId: string): boolean {
  return CURATED_LEGACY_DECK_IDS.has(deckId);
}
