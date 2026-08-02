import type {
  StandardDeckGuideEntry,
  StandardDeckGuideStatus,
} from "@netgrid/decks";
import type { DeckSnapshot } from "../decks/deck-api-types";
import type { EditableDeck } from "../decks/deck-table-model";
import { accountRequest, type AccountFetch } from "./account-client";

export type StandardDeck = {
  standardDeckId: string;
  version: string;
  status: "active";
  name: string;
  side: "runner" | "corp";
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  cards: Array<{ cardId: string; quantity: number }>;
  guideStatus: StandardDeckGuideStatus;
  guide?: StandardDeckGuideEntry;
};

export type AccountDeck = {
  cloudDeckId: string;
  deckVersion: number;
  deck: EditableDeck;
  validationStatus: "valid" | "invalid" | "needs_revalidation";
  createdAt: string;
  updatedAt: string;
};

export type AccountDeckQuota = {
  limit: number;
  used: number;
  remaining: number;
};

export function loadStandardDecks(
  fetcher: AccountFetch = fetch,
  signal?: AbortSignal,
): Promise<{ catalog: { decks: StandardDeck[]; snapshots: DeckSnapshot[] } }> {
  return accountRequest(fetcher, "/api/decks/standards", {
    method: "GET",
    ...(signal ? { signal } : {}),
  });
}

export function loadAccountDecks(
  fetcher: AccountFetch = fetch,
): Promise<{ decks: AccountDeck[]; quota: AccountDeckQuota }> {
  return accountRequest(fetcher, "/api/account/decks", { method: "GET" });
}

export function createAccountDeck(
  deck: EditableDeck,
  csrfToken: string,
  fetcher: AccountFetch = fetch,
): Promise<{ deck: AccountDeck; quota: AccountDeckQuota }> {
  return accountRequest(fetcher, "/api/account/decks", {
    method: "POST",
    headers: csrf(csrfToken),
    body: JSON.stringify({ deck: deckDraft(deck) }),
  });
}

export function copyStandardDeck(
  standardDeckId: string,
  csrfToken: string,
  fetcher: AccountFetch = fetch,
): Promise<{ deck: AccountDeck; quota: AccountDeckQuota }> {
  return accountRequest(fetcher, "/api/account/decks/copy-standard", {
    method: "POST",
    headers: csrf(csrfToken),
    body: JSON.stringify({ standardDeckId }),
  });
}

export function updateAccountDeck(
  deck: EditableDeck,
  expectedVersion: number,
  csrfToken: string,
  fetcher: AccountFetch = fetch,
): Promise<{ deck: AccountDeck }> {
  return accountRequest(
    fetcher,
    `/api/account/decks/${encodeURIComponent(deck.deckId)}`,
    {
      method: "PUT",
      headers: csrf(csrfToken),
      body: JSON.stringify({ expectedVersion, deck: deckDraft(deck) }),
    },
  );
}

export function deleteAccountDeck(
  cloudDeckId: string,
  csrfToken: string,
  fetcher: AccountFetch = fetch,
): Promise<{ ok: true; quota: AccountDeckQuota }> {
  return accountRequest(
    fetcher,
    `/api/account/decks/${encodeURIComponent(cloudDeckId)}`,
    { method: "DELETE", headers: csrf(csrfToken) },
  );
}

export function snapshotAccountDeck(
  cloudDeckId: string,
  csrfToken: string,
  fetcher: AccountFetch = fetch,
): Promise<{ snapshot: DeckSnapshot }> {
  return accountRequest(
    fetcher,
    `/api/account/decks/${encodeURIComponent(cloudDeckId)}/snapshot`,
    { method: "POST", headers: csrf(csrfToken) },
  );
}

function csrf(csrfToken: string): HeadersInit {
  return { "x-netgrid-csrf": csrfToken };
}

function deckDraft(deck: EditableDeck) {
  return {
    name: deck.name,
    side: deck.side,
    identityCardId: deck.identityCardId,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    ...(deck.cardPoolVersion ? { cardPoolVersion: deck.cardPoolVersion } : {}),
    formatProfileId: deck.formatProfileId,
    ...(deck.formatProfileVersion
      ? { formatProfileVersion: deck.formatProfileVersion }
      : {}),
    cards: deck.cards,
    ...(deck.notes ? { notes: deck.notes } : {}),
    ...(deck.tableLayout ? { tableLayout: deck.tableLayout } : {}),
  };
}
