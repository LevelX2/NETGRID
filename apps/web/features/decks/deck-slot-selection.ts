export const RANDOM_STANDARD_DECK_SOURCE = "random_standard" as const;

export type DeckSlotSource =
  | "snapshot"
  | "local"
  | typeof RANDOM_STANDARD_DECK_SOURCE;

export type ResolvedDeckSlotSelection =
  | { source: "snapshot"; snapshotId: string }
  | { source: "local"; localDeckId: string }
  | { source: typeof RANDOM_STANDARD_DECK_SOURCE };

export function resolveDeckSlotSelection(input: {
  source: DeckSlotSource;
  selectedSnapshotId: string;
  selectedLocalDeckId: string;
  snapshots: Array<{ deckSnapshotId: string }>;
  localDecks: Array<{ deckId: string }>;
}): ResolvedDeckSlotSelection | null {
  if (input.source === RANDOM_STANDARD_DECK_SOURCE)
    return { source: RANDOM_STANDARD_DECK_SOURCE };

  const selectedSnapshot = input.snapshots.find(
    (snapshot) => snapshot.deckSnapshotId === input.selectedSnapshotId,
  );
  const selectedLocalDeck = input.localDecks.find(
    (deck) => deck.deckId === input.selectedLocalDeckId,
  );

  if (input.source === "local" && selectedLocalDeck)
    return { source: "local", localDeckId: selectedLocalDeck.deckId };
  if (input.source === "snapshot" && selectedSnapshot)
    return { source: "snapshot", snapshotId: selectedSnapshot.deckSnapshotId };

  const fallbackSnapshot = selectedSnapshot ?? input.snapshots[0];
  if (fallbackSnapshot)
    return { source: "snapshot", snapshotId: fallbackSnapshot.deckSnapshotId };

  if (input.source === "snapshot") return null;

  const fallbackLocalDeck = selectedLocalDeck ?? input.localDecks[0];
  return fallbackLocalDeck
    ? { source: "local", localDeckId: fallbackLocalDeck.deckId }
    : null;
}

export function randomStandardSnapshotForSlot<
  T extends {
    deckSnapshotId: string;
  },
>(input: { snapshots: T[]; seed: string; slotKey: string }): T | null {
  const candidates = [...input.snapshots].sort((left, right) =>
    left.deckSnapshotId.localeCompare(right.deckSnapshotId),
  );
  if (candidates.length === 0) return null;
  const index =
    stableDeckSlotHash(`${input.seed}:${input.slotKey}`) % candidates.length;
  return candidates[index] ?? null;
}

function stableDeckSlotHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
