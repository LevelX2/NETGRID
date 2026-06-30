import type { Side } from "@netgrid/shared";

import type { MatchCardPoolSelection } from "../../app/match-start";
import type { DeckCardEntry, EditableDeck } from "./deck-table-model";

export const DEFAULT_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
export const DEFAULT_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
export const DEFAULT_DECK_CARD_POOL_SNAPSHOT_ID = "card-snapshot-0.8";
export const DEFAULT_DECK_CARD_POOL_VERSION = "private-local-onr-v1";
export const DEFAULT_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_v1";
export const DEFAULT_DECK_FORMAT_PROFILE_VERSION = "1.3.0";
export const CLASSIC_DECK_CARD_POOL_VERSION = "private-local-onr-v1-plus-classic-playtest";
export const CLASSIC_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_classic_playtest_v1";
export const CLASSIC_DECK_FORMAT_PROFILE_VERSION = "1.0.0";
export const PROTEUS_DECK_CARD_POOL_VERSION = "private-local-onr-v1-plus-proteus-playtest";
export const PROTEUS_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_proteus_playtest_v1";
export const PROTEUS_DECK_FORMAT_PROFILE_VERSION = "1.0.0";
export const CLASSIC_PROTEUS_DECK_CARD_POOL_VERSION = "private-local-onr-v1-plus-classic-proteus-playtest";
export const CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID = "netgrid_private_local_classic_proteus_playtest_v1";
export const CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_VERSION = "1.0.0";
export const DEFAULT_IDENTITY_BY_SIDE: Record<Side, string> = {
  runner: "runner_identity_001",
  corp: "corp_identity_001"
};

const ADDITIVE_FORMAT_PROFILE_IDS = new Set([CLASSIC_DECK_FORMAT_PROFILE_ID, PROTEUS_DECK_FORMAT_PROFILE_ID, CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID]);

export function matchCardPoolIncludesClassic(matchCardPool: MatchCardPoolSelection): boolean {
  return matchCardPool === "originalset_classic" || matchCardPool === "originalset_classic_proteus";
}

export function matchCardPoolIncludesProteus(matchCardPool: MatchCardPoolSelection): boolean {
  return matchCardPool === "originalset_proteus" || matchCardPool === "originalset_classic_proteus";
}

export function deckProfileForMatchCardPool(matchCardPool: MatchCardPoolSelection): { cardPoolVersion: string; formatProfileId: string; formatProfileVersion: string } {
  if (matchCardPool === "originalset_classic") return { cardPoolVersion: CLASSIC_DECK_CARD_POOL_VERSION, formatProfileId: CLASSIC_DECK_FORMAT_PROFILE_ID, formatProfileVersion: CLASSIC_DECK_FORMAT_PROFILE_VERSION };
  if (matchCardPool === "originalset_proteus") return { cardPoolVersion: PROTEUS_DECK_CARD_POOL_VERSION, formatProfileId: PROTEUS_DECK_FORMAT_PROFILE_ID, formatProfileVersion: PROTEUS_DECK_FORMAT_PROFILE_VERSION };
  if (matchCardPool === "originalset_classic_proteus") return { cardPoolVersion: CLASSIC_PROTEUS_DECK_CARD_POOL_VERSION, formatProfileId: CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID, formatProfileVersion: CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_VERSION };
  return { cardPoolVersion: DEFAULT_DECK_CARD_POOL_VERSION, formatProfileId: DEFAULT_DECK_FORMAT_PROFILE_ID, formatProfileVersion: DEFAULT_DECK_FORMAT_PROFILE_VERSION };
}

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
  if (!profileAllowedForMatchCardPool(snapshot.formatProfileId, matchCardPool)) return false;
  return snapshot.cards.every((entry) => cardIdAllowedForMatchCardPool(entry.cardId, matchCardPool));
}

export function editableDeckAllowedForMatchCardPool(deck: EditableDeck, matchCardPool: MatchCardPoolSelection): boolean {
  if (!profileAllowedForMatchCardPool(deck.formatProfileId, matchCardPool)) return false;
  return deck.cards.every((entry) => cardIdAllowedForMatchCardPool(entry.cardId, matchCardPool));
}

export function catalogCardAllowedForDeckEditor(card: CatalogCardForDeckEditor, deck: EditableDeck | null): boolean {
  if (deck && card.side !== deck.side) return false;
  if (card.type === "identity") return false;
  if (deck && ADDITIVE_FORMAT_PROFILE_IDS.has(deck.formatProfileId)) return card.statuses.catalog_ready;
  return card.statuses.playable && card.statuses.deck_legal;
}

function profileAllowedForMatchCardPool(formatProfileId: string, matchCardPool: MatchCardPoolSelection): boolean {
  if (formatProfileId === CLASSIC_DECK_FORMAT_PROFILE_ID) return matchCardPoolIncludesClassic(matchCardPool);
  if (formatProfileId === PROTEUS_DECK_FORMAT_PROFILE_ID) return matchCardPoolIncludesProteus(matchCardPool);
  if (formatProfileId === CLASSIC_PROTEUS_DECK_FORMAT_PROFILE_ID) return matchCardPoolIncludesClassic(matchCardPool) && matchCardPoolIncludesProteus(matchCardPool);
  return true;
}

function cardIdAllowedForMatchCardPool(cardId: string, matchCardPool: MatchCardPoolSelection): boolean {
  if (cardId.startsWith("onr_classic_") && !matchCardPoolIncludesClassic(matchCardPool)) return false;
  if (cardId.startsWith("onr_proteus_") && !matchCardPoolIncludesProteus(matchCardPool)) return false;
  return true;
}
