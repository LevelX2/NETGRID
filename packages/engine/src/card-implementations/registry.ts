/**
 * Registers concrete CardImplementation definitions by card definition id.
 *
 * This file is a catalog lookup only: concrete card file imports live in
 * subregistries so the main registry stays stable and merge-light.
 */
import type { CardDefinitionId } from "@netgrid/shared";
import type { CardImplementationDefinition } from "./types";
import { ALL_CARD_IMPLEMENTATIONS } from "./subregistries/all-card-implementations";

export const CARD_IMPLEMENTATIONS = ALL_CARD_IMPLEMENTATIONS;

export const CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, CardImplementationDefinition>
> = Object.fromEntries(
  CARD_IMPLEMENTATIONS.map((implementation) => [
    implementation.cardDefinitionId,
    implementation,
  ]),
);

/**
 * Looks up the declarative implementation for a card definition, if migrated.
 */
export function cardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}
