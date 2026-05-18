import type { CardDefinitionId } from "@netgrid/shared";
import { onrV1RezCostModifierImplementations } from "./onr-v1/rez-cost-modifiers";
import type { CardImplementationDefinition } from "./types";

export const CARD_IMPLEMENTATIONS = [
  ...onrV1RezCostModifierImplementations,
] as const satisfies readonly CardImplementationDefinition[];

export const CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, CardImplementationDefinition>
> = Object.fromEntries(
  CARD_IMPLEMENTATIONS.map((implementation) => [
    implementation.cardDefinitionId,
    implementation,
  ]),
);

export function cardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}
