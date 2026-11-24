import type { CardMechanicalDefinition } from "@netgrid/cards/engine";
import type { CardDefinitionId } from "@netgrid/shared";

/**
 * Engine registry entry for a mechanical definition projected by @netgrid/cards.
 */
export type CardImplementationDefinition = CardMechanicalDefinition & {
  cardDefinitionId: CardDefinitionId;
};
