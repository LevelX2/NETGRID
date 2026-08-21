import { cardSpecDefinitionById } from "@netgrid/cards/engine";
import type { CardDefinition, CardDefinitionId } from "@netgrid/shared";

/** Canonical CardSpec-backed definition fixture for Proteus engine tests. */
export function proteusTestCardDefinition(
  cardId: CardDefinitionId,
): CardDefinition {
  const definition = cardSpecDefinitionById(cardId);
  if (!definition) throw new Error(`Unknown Proteus test card: ${cardId}`);
  return definition;
}
