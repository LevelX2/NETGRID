import type {
  CardDefinitionId,
  ResolvedCardDefinition,
  SubroutineDefinition,
} from "@netgrid/shared";
import { cardSpecPlanningCards, planningCards } from "@netgrid/cards/planning";

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

const cardSpecEntries = cardSpecPlanningCards();
const planningEntries = planningCards();
const expectedCardSpecIds = new Set<string>(
  planningEntries.map(({ cardDefinitionId }) => cardDefinitionId),
);
if (expectedCardSpecIds.size !== planningEntries.length)
  throw new AiCardDefinitionAuthorityError(
    "overlapping_definition_authority",
    "unknown_duplicate_planning_card",
  );
const cardSpecDefinitions = cardSpecEntries.map(({ definition }) =>
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
export const CARD_DEFINITIONS: readonly ResolvedCardDefinition[] =
  Object.freeze(cardSpecDefinitions);
export const CARD_DEFINITIONS_BY_ID = Object.freeze(
  Object.fromEntries(
    CARD_DEFINITIONS.map((definition) => [definition.id, definition]),
  ),
);

function mutableCompatibilityDefinition(
  definition: ReturnType<typeof cardSpecPlanningCards>[number]["definition"],
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
    ReturnType<
      typeof cardSpecPlanningCards
    >[number]["definition"]["subroutines"]
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
    ...(subroutine.traceLimit === undefined
      ? {}
      : { traceLimit: subroutine.traceLimit }),
    ...(subroutine.traceLimit === undefined
      ? {}
      : { traceLimit: subroutine.traceLimit }),
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
