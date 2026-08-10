import {
  cardSpecImplementationDefinitionIds,
  cardSpecImplementations,
} from "@netgrid/cards/engine";
import type { CardDefinitionId } from "@netgrid/shared";
import type { CardImplementationDefinition } from "./types";

const implementations: readonly CardImplementationDefinition[] =
  cardSpecImplementations();
const expectedIds = cardSpecImplementationDefinitionIds();
const implementationIds = implementations.map(
  (implementation) => implementation.cardDefinitionId,
);

if (
  implementations.length !== expectedIds.length ||
  new Set(implementationIds).size !== implementationIds.length ||
  implementationIds.some(
    (definitionId, index) => definitionId !== expectedIds[index],
  )
)
  throw new Error("card_spec_implementation_authority_mismatch");

export const CARD_IMPLEMENTATIONS: readonly CardImplementationDefinition[] =
  Object.freeze([...implementations]);

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

export function cardImplementationForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationDefinition | undefined {
  return CARD_IMPLEMENTATIONS_BY_DEFINITION_ID[definitionId];
}

export function cardImplementationCounterOwnerDefinitionId(
  counterType: string,
): CardDefinitionId {
  return resolveUniqueCardImplementationCounterOwner(
    CARD_IMPLEMENTATIONS,
    counterType,
  );
}

export function resolveUniqueCardImplementationCounterOwner(
  candidates: readonly CardImplementationDefinition[],
  counterType: string,
): CardDefinitionId {
  const owners = candidates
    .filter((implementation) => {
      if (implementation.virusCounter?.counterKind === counterType) return true;
      return implementation.successfulRunFollowups?.some(
        (followup) =>
          followup.kind ===
            "skip_rd_access_add_purgeable_runner_virus_counter" &&
          followup.counterType === counterType,
      );
    })
    .map((implementation) => implementation.cardDefinitionId);
  if (owners.length !== 1)
    throw new Error(
      `card_implementation_counter_owner_not_unique:${counterType}:${owners.length}`,
    );
  return owners[0]!;
}
