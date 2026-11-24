import type { CardInstanceId, GameState } from "@netgrid/shared";

/** The simulator sees the applied Engine transition. Only aggregate facts
 * derived here enter the report; the affected instances stay local. */
export function advancementChangesForSimulationAction(
  before: GameState,
  after: GameState,
): { added: number; advancedCardIds: CardInstanceId[] } {
  let added = 0;
  const advancedCardIds: CardInstanceId[] = [];
  for (const card of Object.values(after.cardInstances)) {
    if (card.advancementCounters <= 0) continue;
    const oldCount =
      before.cardInstances[card.instanceId]?.advancementCounters ?? 0;
    const increase = card.advancementCounters - oldCount;
    if (increase <= 0) continue;
    added += increase;
    advancedCardIds.push(card.instanceId);
  }
  return { added, advancedCardIds };
}
