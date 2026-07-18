export type DeckSlotSource = "snapshot" | "local";

export type ResolvedDeckSlotSelection =
  | { source: "snapshot"; snapshotId: string }
  | { source: "local"; localDeckId: string };

export function resolveDeckSlotSelection(input: {
  source: DeckSlotSource;
  selectedSnapshotId: string;
  selectedLocalDeckId: string;
  snapshots: Array<{ deckSnapshotId: string }>;
  localDecks: Array<{ deckId: string }>;
}): ResolvedDeckSlotSelection | null {
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
