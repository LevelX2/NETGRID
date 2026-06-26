import { createRuntimeCardsById } from "@netgrid/catalog";
import type {
  DeckDefinition,
  DeckPublicMetadata,
} from "@netgrid/shared";
import type { AiBenchmarkSnapshotDeck } from "./benchmark-deck-types";
import { DECK_SNAPSHOTS_08 } from "./benchmark-deck-snapshot-data";
import {
  LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS,
  REAL_SCENE_FROZEN_DECK_SNAPSHOTS,
} from "./benchmark-local-deck-data";
import { sortedUnique } from "../runtime/collection";

const BENCHMARK_RUNTIME_CARDS_BY_ID = createRuntimeCardsById();

export function benchmarkDeckFromSnapshot(
  snapshotId: string,
): AiBenchmarkSnapshotDeck {
  const snapshot = DECK_SNAPSHOTS_08.find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) {
    throw new Error(`Unknown benchmark deck snapshot: ${snapshotId}`);
  }
  const deck: DeckDefinition = {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
  const metadata: DeckPublicMetadata =
    snapshot.publicMetadata ??
    ({
      side: snapshot.side,
      identityCardId: snapshot.identityCardId,
      deckName: snapshot.name,
    } as DeckPublicMetadata);
  return {
    snapshotId: snapshot.deckSnapshotId,
    sourceDeckId: snapshot.sourceDeckId,
    deck,
    metadata,
  };
}

export function benchmarkDeckFromFrozenLocalSnapshot(
  snapshotId: string,
): AiBenchmarkSnapshotDeck {
  const snapshot = [
    ...LOCAL_REALISTIC_FROZEN_DECK_SNAPSHOTS,
    ...REAL_SCENE_FROZEN_DECK_SNAPSHOTS,
  ].find((candidate) => candidate.deckSnapshotId === snapshotId);
  if (!snapshot) {
    throw new Error(
      `Unknown frozen local benchmark deck snapshot: ${snapshotId}`,
    );
  }
  if (snapshot.classification !== "runnable_ai_benchmark") {
    throw new Error(
      `Frozen local benchmark deck ${snapshotId} is not runnable: ${snapshot.classification}`,
    );
  }
  const unsupportedCards = snapshot.cards
    .filter(
      (entry) =>
        BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId]?.statuses.ai_supported !==
        true,
    )
    .map((entry) => entry.cardId);
  if (unsupportedCards.length > 0) {
    throw new Error(
      `Frozen local benchmark deck ${snapshotId} contains unsupported cards: ${sortedUnique(unsupportedCards).join(",")}`,
    );
  }
  const deck: DeckDefinition = {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: snapshot.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
  const metadata: DeckPublicMetadata = {
    side: snapshot.side,
    identityCardId: snapshot.identityCardId,
    deckName: snapshot.name,
    cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
    ...(snapshot.cardPoolVersion
      ? { cardPoolVersion: snapshot.cardPoolVersion }
      : {}),
    formatProfileId: snapshot.formatProfileId,
    ...(snapshot.formatProfileVersion
      ? { formatProfileVersion: snapshot.formatProfileVersion }
      : {}),
    deckHash: snapshot.deckHash,
  };
  return {
    snapshotId: snapshot.deckSnapshotId,
    sourceDeckId: snapshot.sourceDeckId,
    deck,
    metadata,
  };
}
