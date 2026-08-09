import {
  CARD_DEFINITIONS_BY_ID as LEGACY_CARD_DEFINITIONS_BY_ID,
  type CardDefinitionId,
  type ResolvedCardDefinition,
  type SubroutineDefinition,
} from "@netgrid/shared";
import {
  CS06_CARD_DEFINITION_IDS,
  cs06PlanningCards,
} from "@netgrid/cards/planning";

export type AiCardDefinitionAuthorityErrorCode =
  | "overlapping_definition_authority"
  | "missing_definition_authority"
  | "unexpected_card_spec_authority";

export class AiCardDefinitionAuthorityError extends Error {
  readonly name = "AiCardDefinitionAuthorityError";

  constructor(
    readonly code: AiCardDefinitionAuthorityErrorCode,
    readonly definitionId: CardDefinitionId,
  ) {
    super(`${code}: ${definitionId}`);
  }
}

const expectedCardSpecIds = new Set<string>(CS06_CARD_DEFINITION_IDS);
const cardSpecDefinitions = cs06PlanningCards().map(({ definition }) =>
  mutableCompatibilityDefinition(definition),
);
const cardSpecIds = new Set(cardSpecDefinitions.map(({ id }) => id));
if (cardSpecIds.size !== cardSpecDefinitions.length)
  throw new AiCardDefinitionAuthorityError(
    "overlapping_definition_authority",
    cardSpecDefinitions.find(
      (definition, index) =>
        cardSpecDefinitions.findIndex(({ id }) => id === definition.id) !==
        index,
    )?.id ?? "unknown_duplicate_card_spec",
  );
for (const definitionId of expectedCardSpecIds)
  if (!cardSpecIds.has(definitionId))
    throw new AiCardDefinitionAuthorityError(
      "missing_definition_authority",
      definitionId,
    );
for (const definitionId of cardSpecIds)
  if (!expectedCardSpecIds.has(definitionId))
    throw new AiCardDefinitionAuthorityError(
      "unexpected_card_spec_authority",
      definitionId,
    );
for (const definitionId of expectedCardSpecIds)
  if (LEGACY_CARD_DEFINITIONS_BY_ID[definitionId] !== undefined)
    throw new AiCardDefinitionAuthorityError(
      "overlapping_definition_authority",
      definitionId,
    );

const combinedDefinitions: ResolvedCardDefinition[] = [
  ...Object.values(LEGACY_CARD_DEFINITIONS_BY_ID),
  ...cardSpecDefinitions,
];
export const CARD_DEFINITIONS = Object.freeze(combinedDefinitions);
export const CARD_DEFINITIONS_BY_ID = Object.freeze(
  Object.fromEntries(
    CARD_DEFINITIONS.map((definition) => [definition.id, definition]),
  ),
);

function mutableCompatibilityDefinition(
  definition: ReturnType<typeof cs06PlanningCards>[number]["definition"],
): ResolvedCardDefinition {
  const { abilities, mechanics, modifiers, subroutines, subtypes, ...scalar } =
    definition;
  if (abilities !== undefined || modifiers !== undefined)
    throw new AiCardDefinitionAuthorityError(
      "unexpected_card_spec_authority",
      definition.id,
    );
  return {
    ...scalar,
    subtypes: [...subtypes],
    mechanics: [...mechanics],
    ...(subroutines === undefined
      ? {}
      : { subroutines: subroutines.map(mutableSubroutineDefinition) }),
  };
}

function mutableSubroutineDefinition(
  subroutine: NonNullable<
    ReturnType<typeof cs06PlanningCards>[number]["definition"]["subroutines"]
  >[number],
): SubroutineDefinition {
  return {
    id: subroutine.id,
    type: subroutine.type,
    ...(subroutine.amount === undefined ? {} : { amount: subroutine.amount }),
    ...(subroutine.damageType === undefined
      ? {}
      : { damageType: subroutine.damageType }),
    ...(subroutine.dieFaces === undefined
      ? {}
      : { dieFaces: subroutine.dieFaces }),
    ...(subroutine.damageOnResults === undefined
      ? {}
      : { damageOnResults: [...subroutine.damageOnResults] }),
    ...(subroutine.baseTraceStrength === undefined
      ? {}
      : { baseTraceStrength: subroutine.baseTraceStrength }),
    ...(subroutine.traceBidLimit === undefined
      ? {}
      : { traceBidLimit: subroutine.traceBidLimit }),
    ...(subroutine.traceSuccessEffect === undefined
      ? {}
      : { traceSuccessEffect: structuredClone(subroutine.traceSuccessEffect) }),
    ...(subroutine.runFutureStrengthCancelPaymentAmount === undefined
      ? {}
      : {
          runFutureStrengthCancelPaymentAmount:
            subroutine.runFutureStrengthCancelPaymentAmount,
        }),
    ...(subroutine.requiresSuccessfulTraceSubroutineIndex === undefined
      ? {}
      : {
          requiresSuccessfulTraceSubroutineIndex:
            subroutine.requiresSuccessfulTraceSubroutineIndex,
        }),
    ...(subroutine.deflectorTarget === undefined
      ? {}
      : { deflectorTarget: subroutine.deflectorTarget }),
    ...(subroutine.deflectorCost === undefined
      ? {}
      : { deflectorCost: subroutine.deflectorCost }),
    ...(subroutine.deflectorAutoBreakIfNoTarget === undefined
      ? {}
      : {
          deflectorAutoBreakIfNoTarget: subroutine.deflectorAutoBreakIfNoTarget,
        }),
    ...(subroutine.breakTags === undefined
      ? {}
      : { breakTags: [...subroutine.breakTags] }),
  };
}
