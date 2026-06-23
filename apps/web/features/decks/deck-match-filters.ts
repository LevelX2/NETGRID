import type { Side } from "@netgrid/shared";

import type { MatchCardPoolSelection } from "../../app/match-start";
import type { DeckCardEntry, EditableDeck } from "./deck-table-model";

export const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
export const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
export const DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID = "card-snapshot-0.8";
export const DEFAULT_DECK_CARD_POOL_VERSION = "private-local-onr-v1";
export const DEFAULT_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_v1";
export const DEFAULT_DECK_FORMAT_PROFILE_VERSION = "1.3.0";
export const PROTEUS_DECK_CARD_POOL_VERSION = "private-local-onr-v1-plus-proteus-playtest";
export const PROTEUS_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_proteus_playtest_v1";
export const PROTEUS_DECK_FORMAT_PROFILE_VERSION = "1.0.0";
export const DEFAULT_IDENTITY_BY_SIDE: Record<Side, string> = {
  runner: "runner_identity_001",
  corp: "corp_identity_001"
};

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
