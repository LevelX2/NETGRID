import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  cardDefinitionForInstance,
  cardMatchesModifierAppliesTo,
  isPublicRezzedCorpRootModifier,
  sameServerAsSourceApplies,
} from "./card-implementation-modifiers";
import type { CardBreakSubroutineCostModifierImplementation } from "./definition-types";

export type BreakSubroutineCostModifierQuote = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinition["id"];
  sourceTitle: string;
  amount: number;
};

export type BreakSubroutineCostQuote = {
  subroutineCount: number;
  perSubroutineAdditionalCost: number;
  totalAdditionalCost: number;
  modifiers: BreakSubroutineCostModifierQuote[];
  publicPayload: NonNullable<LegalAction["payload"]>;
};

function breakSubroutineCostModifierAppliesToIce(
  state: GameState,
  modifier: CardBreakSubroutineCostModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): boolean {
  if (
    modifier.operation !== "increase" ||
    modifier.side !== "corp" ||
    !isPublicRezzedCorpRootModifier(modifier)
  )
    return false;
  if (!cardMatchesModifierAppliesTo(iceDefinition, modifier.appliesTo))
    return false;
  return sameServerAsSourceApplies(
    state,
    sourceCardInstanceId,
    iceId,
    modifier.sameServerAsSource,
  );
}

export function quoteBreakSubroutineCostModifiers(
  state: GameState,
  iceId: CardInstanceId,
  subroutineCount = 1,
): BreakSubroutineCostQuote {
  const safeSubroutineCount = Math.max(1, Math.floor(subroutineCount));
  const iceDefinition = cardDefinitionForInstance(state, iceId);
  const modifiers: BreakSubroutineCostModifierQuote[] = [];
  for (const match of activeCardImplementationModifiersForCorpRoot(
    state,
    "break_subroutine_cost",
  )) {
    if (
      !breakSubroutineCostModifierAppliesToIce(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        iceId,
        iceDefinition,
      )
    )
      continue;
    modifiers.push({
      sourceCardInstanceId: match.sourceCardInstanceId,
      sourceDefinitionId: match.sourceDefinitionId,
      sourceTitle: match.sourceDefinition.title,
      amount: match.modifier.amount,
    });
  }
  modifiers.sort((left, right) =>
    `${left.sourceDefinitionId}:${left.sourceCardInstanceId}`.localeCompare(
      `${right.sourceDefinitionId}:${right.sourceCardInstanceId}`,
    ),
  );
  const perSubroutineAdditionalCost = modifiers.reduce(
    (sum, modifier) => sum + modifier.amount,
    0,
  );
  const totalAdditionalCost =
    perSubroutineAdditionalCost * safeSubroutineCount;
  const publicPayload: NonNullable<LegalAction["payload"]> = {};
  if (totalAdditionalCost > 0) {
    publicPayload.breakSubroutineCostSourceDefinitionIds = modifiers
      .map((modifier) => modifier.sourceDefinitionId)
      .join(",");
    publicPayload.breakSubroutineCostSourceTitles = modifiers
      .map((modifier) => modifier.sourceTitle)
      .join(",");
    publicPayload.breakSubroutineCostPerSubroutine =
      perSubroutineAdditionalCost;
  }
  return {
    subroutineCount: safeSubroutineCount,
    perSubroutineAdditionalCost,
    totalAdditionalCost,
    modifiers,
    publicPayload,
  };
}
