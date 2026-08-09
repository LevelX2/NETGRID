/**
 * Registers concrete CardImplementation definitions by card definition id.
 *
 * This file is a catalog lookup only: concrete card file imports live in
 * subregistries so the main registry stays stable and merge-light.
 */
import {
  cardSpecImplementations,
  cardSpecImplementationDefinitionIds,
} from "@netgrid/cards/engine";
import type { CardDefinitionId } from "@netgrid/shared";
import type { CardImplementationDefinition } from "./types";
import { CARD_IMPLEMENTATION_CATALOG } from "./subregistries/card-implementation-catalog";

export type CardImplementationAuthorityErrorCode =
  | "overlapping_definition_authority"
  | "duplicate_definition_authority"
  | "missing_card_spec_authority"
  | "unexpected_card_spec_authority";

export class CardImplementationAuthorityError extends Error {
  readonly name = "CardImplementationAuthorityError";

  constructor(
    readonly code: CardImplementationAuthorityErrorCode,
    readonly definitionId: CardDefinitionId,
  ) {
    super(`${code}: ${definitionId}`);
  }
}

export function composeCardImplementationAuthorities(
  legacyImplementations: readonly CardImplementationDefinition[],
  cardSpecImplementations: readonly CardImplementationDefinition[],
  expectedCardSpecIds: readonly CardDefinitionId[],
): readonly CardImplementationDefinition[] {
  assertUniqueImplementationIds(legacyImplementations);
  assertUniqueImplementationIds(cardSpecImplementations);
  const legacyIds = new Set(
    legacyImplementations.map((entry) => entry.cardDefinitionId),
  );
  const cardSpecIds = new Set(
    cardSpecImplementations.map((entry) => entry.cardDefinitionId),
  );
  for (const definitionId of cardSpecIds)
    if (legacyIds.has(definitionId))
      throw new CardImplementationAuthorityError(
        "overlapping_definition_authority",
        definitionId,
      );
  const expected = new Set(expectedCardSpecIds);
  for (const definitionId of expected)
    if (!cardSpecIds.has(definitionId))
      throw new CardImplementationAuthorityError(
        "missing_card_spec_authority",
        definitionId,
      );
  for (const definitionId of cardSpecIds)
    if (!expected.has(definitionId))
      throw new CardImplementationAuthorityError(
        "unexpected_card_spec_authority",
        definitionId,
      );
  return Object.freeze([...legacyImplementations, ...cardSpecImplementations]);
}

function assertUniqueImplementationIds(
  implementations: readonly CardImplementationDefinition[],
): void {
  const seen = new Set<CardDefinitionId>();
  for (const implementation of implementations) {
    if (seen.has(implementation.cardDefinitionId))
      throw new CardImplementationAuthorityError(
        "duplicate_definition_authority",
        implementation.cardDefinitionId,
      );
    seen.add(implementation.cardDefinitionId);
  }
}

const legacyImplementations = CARD_IMPLEMENTATION_CATALOG;
const cardSpecImplementationAuthority: readonly CardImplementationDefinition[] =
  cardSpecImplementations();

export const CARD_IMPLEMENTATIONS = composeCardImplementationAuthorities(
  legacyImplementations,
  cardSpecImplementationAuthority,
  cardSpecImplementationDefinitionIds(),
);

export const CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: Readonly<
  Partial<Record<CardDefinitionId, CardImplementationDefinition>>
> = Object.freeze(
  Object.fromEntries(
    CARD_IMPLEMENTATIONS.map((implementation) => [
      implementation.cardDefinitionId,
      implementation,
    ]),
  ),
);

const LEGACY_CARD_IMPLEMENTATIONS_BY_DEFINITION_ID: Readonly<
  Partial<Record<CardDefinitionId, CardImplementationDefinition>>
> = Object.freeze(
  Object.fromEntries(
    legacyImplementations.map((implementation) => [
      implementation.cardDefinitionId,
      implementation,
    ]),
  ),
);

/**
 * Looks up the declarative implementation for a card definition, if migrated.
 */
export function cardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}

/** CS06 hybrid authority: canonical CardSpecs must never fall back to legacy. */
export function legacyCardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return LEGACY_CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}
