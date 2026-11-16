import type { GameState, Side } from "@netgrid/shared";

export function deckSnapshotCardCountsForTest(state: GameState, side: Side) {
  const counts = new Map<string, number>();
  for (const card of Object.values(state.cardInstances)) {
    if (card.owner !== side) continue;
    counts.set(card.definitionId, (counts.get(card.definitionId) ?? 0) + 1);
  }
  return [...counts].map(([cardId, quantity]) => ({ cardId, quantity }));
}
