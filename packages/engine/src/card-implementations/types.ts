import type { CardMechanicalDefinition } from "@netgrid/cards/engine";
import type { CardDefinitionId } from "@netgrid/shared";

/**
 * Legacy Registry compatibility shape during the setwise migration.
 * The declarative vocabulary is owned by @netgrid/cards; runtime execution
 * and the cardDefinitionId lookup remain Engine-owned until their cutovers.
 */
export type CardImplementationDefinition = CardMechanicalDefinition & {
  cardDefinitionId: CardDefinitionId;
};
