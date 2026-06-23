import type { Side } from "@netgrid/shared";

import type { MatchCardPoolSelection } from "../../app/match-start";
import type { DeckCardEntry, EditableDeck } from "./deck-table-model";

export const PROTEUS_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_proteus_playtest_v1";

type DeckSnapshotForMatchPool = {
  formatProfileId: string;
  cards: DeckCardEntry[];
};

type CatalogCardForDeckEditor = {
  side: Side;
  type: string;
  statuses: {
    catalog_ready: boolean;
    playable: boolean;
    deck_legal: boolean;
  };
};

export function snapshotAllowedForMatchCardPool(snapshot: DeckSnapshotForMatchPool, matchCardPool: MatchCardPoolSelection): boolean {
  if (matchCardPool === "originalset_proteus") return true;
  return snapshot.formatProfileId !== PROTEUS_DECK_FORMAT_PROFILE_ID && !snapshot.cards.some((entry) => entry.cardId.startsWith("onr_proteus_"));
}

export function editableDeckAllowedForMatchCardPool(deck: EditableDeck, matchCardPool: MatchCardPoolSelection): boolean {
  if (matchCardPool === "originalset_proteus") return true;
  return deck.formatProfileId !== PROTEUS_DECK_FORMAT_PROFILE_ID && !deck.cards.some((entry) => entry.cardId.startsWith("onr_proteus_"));
}

export function catalogCardAllowedForDeckEditor(card: CatalogCardForDeckEditor, deck: EditableDeck | null): boolean {
  if (deck && card.side !== deck.side) return false;
  if (card.type === "identity") return false;
  if (deck?.formatProfileId === PROTEUS_DECK_FORMAT_PROFILE_ID) return card.statuses.catalog_ready;
  return card.statuses.playable && card.statuses.deck_legal;
}
