/**
 * Quotes additional break-subroutine costs from CardImplementation modifiers.
 *
 * This module reads active server-scoped sources for the encountered ICE and
 * returns a cost quote for the existing icebreaker action path. It does not
 * break subroutines, spend credits, or alter run state.
 */
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  cardDefinitionForInstance,
  cardHasNormalizedSubtype,
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
  breakerId?: CardInstanceId,
): boolean {
  if (
    modifier.operation !== "increase" ||
    modifier.side !== "corp" ||
    !isPublicRezzedCorpRootModifier(modifier)
  )
    return false;
  if (!cardMatchesModifierAppliesTo(iceDefinition, modifier.appliesTo))
    return false;
  if (modifier.appliesToRunner) {
    if (!breakerId) return false;
    const breakerDefinition = cardDefinitionForInstance(state, breakerId);
    if (breakerDefinition.type !== modifier.appliesToRunner.cardType)
      return false;
    if (
      !cardHasNormalizedSubtype(
        breakerDefinition,
        modifier.appliesToRunner.subtype,
      )
    )
      return false;
  }
  return sameServerAsSourceApplies(
    state,
    sourceCardInstanceId,
    iceId,
    modifier.sameServerAsSource,
  );
}

/**
 * Calculates the additional cost for breaking one or more subroutines on an ICE.
 *
 * The quote carries public source attribution so LegalAction payloads and
 * revalidation can stay aligned without exposing private source instance data.
 */
export function quoteBreakSubroutineCostModifiers(
  state: GameState,
  iceId: CardInstanceId,
  subroutineCount = 1,
  breakerId?: CardInstanceId,
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
        breakerId,
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
