import {
  CS06_CARD_DEFINITION_IDS,
  cs06CardDefinitions,
} from "@netgrid/cards/engine";
import {
  CARD_DEFINITIONS_BY_ID as LEGACY_CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type ResolvedCardDefinition,
} from "@netgrid/shared";

export type CardDefinitionAuthorityErrorCode =
  | "overlapping_definition_authority"
  | "duplicate_definition_authority"
  | "missing_definition_authority"
  | "unexpected_card_spec_authority";

export class CardDefinitionAuthorityError extends Error {
  readonly name = "CardDefinitionAuthorityError";

  constructor(
    readonly code: CardDefinitionAuthorityErrorCode,
    readonly definitionId: CardDefinitionId,
  ) {
    super(`${code}: ${definitionId}`);
  }
}

export function composeCardDefinitionAuthorities(
  legacyDefinitions: readonly ResolvedCardDefinition[],
  cardSpecDefinitions: readonly ResolvedCardDefinition[],
  expectedCardSpecIds: readonly CardDefinitionId[],
): readonly ResolvedCardDefinition[] {
  assertUniqueDefinitionIds(legacyDefinitions);
  assertUniqueDefinitionIds(cardSpecDefinitions);
  const legacyIds = new Set(legacyDefinitions.map((entry) => entry.id));
  const cardSpecIds = new Set(cardSpecDefinitions.map((entry) => entry.id));
  for (const definitionId of cardSpecIds)
    if (legacyIds.has(definitionId))
      throw new CardDefinitionAuthorityError(
        "overlapping_definition_authority",
        definitionId,
      );
  const expected = new Set(expectedCardSpecIds);
  for (const definitionId of expected)
    if (!cardSpecIds.has(definitionId))
      throw new CardDefinitionAuthorityError(
        "missing_definition_authority",
        definitionId,
      );
  for (const definitionId of cardSpecIds)
    if (!expected.has(definitionId))
      throw new CardDefinitionAuthorityError(
        "unexpected_card_spec_authority",
        definitionId,
      );
  return Object.freeze([...legacyDefinitions, ...cardSpecDefinitions]);
}

function assertUniqueDefinitionIds(
  definitions: readonly ResolvedCardDefinition[],
): void {
  const seen = new Set<CardDefinitionId>();
  for (const definition of definitions) {
    if (seen.has(definition.id))
      throw new CardDefinitionAuthorityError(
        "duplicate_definition_authority",
        definition.id,
      );
    seen.add(definition.id);
  }
}

export const CARD_DEFINITIONS = composeCardDefinitionAuthorities(
  Object.values(LEGACY_CARD_DEFINITIONS_BY_ID),
  cs06CardDefinitions(),
  CS06_CARD_DEFINITION_IDS,
);

export const CARD_DEFINITIONS_BY_ID: Readonly<
  Record<CardDefinitionId, ResolvedCardDefinition>
> = Object.freeze(
  Object.fromEntries(
    CARD_DEFINITIONS.map((definition) => [definition.id, definition]),
  ),
);
