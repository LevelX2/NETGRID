import {
  cardSpecDefinitions,
  cardSpecRuntimeDefinitionIds,
} from "@netgrid/cards/engine";
import type {
  CardDefinitionId,
  ResolvedCardDefinition,
} from "@netgrid/shared";

const definitions = cardSpecDefinitions();
const expectedIds = cardSpecRuntimeDefinitionIds();
const definitionIds = definitions.map((definition) => definition.id);

if (
  definitions.length !== expectedIds.length ||
  new Set(definitionIds).size !== definitionIds.length ||
  definitionIds.some((definitionId, index) => definitionId !== expectedIds[index])
)
  throw new Error("card_spec_definition_authority_mismatch");

export const CARD_DEFINITIONS: readonly ResolvedCardDefinition[] =
  Object.freeze([...definitions]);

export const CARD_DEFINITIONS_BY_ID: Readonly<
  Record<CardDefinitionId, ResolvedCardDefinition>
> = Object.freeze(
  Object.fromEntries(
    CARD_DEFINITIONS.map((definition) => [definition.id, definition]),
  ),
);
