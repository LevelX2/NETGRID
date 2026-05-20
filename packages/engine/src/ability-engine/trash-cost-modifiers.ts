/**
 * Quotes access trash costs from CardImplementation modifiers.
 *
 * The helper reads current server/root state and returns a public quote for the
 * existing access-trash action path. It does not trash cards or persist costs
 * after a source leaves play.
 */
import type {
  CardDefinition,
  CardInstanceId,
  GameState,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  cardMatchesModifierAppliesTo,
  corpServerIdForInstalledCard,
  isPublicRezzedCorpRootModifier,
} from "./card-implementation-modifiers";
import type { CardTrashCostModifierImplementation } from "./definition-types";

export type TrashCostModifierQuote = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinition["id"];
  sourceTitle: string;
  amount: number;
};

export type AccessTrashCostQuote = {
  baseCost: number;
  modifier: number;
  totalCost: number;
  modifiers: TrashCostModifierQuote[];
};

function trashCostModifierAppliesToCard(
  state: GameState,
  modifier: CardTrashCostModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  targetCardInstanceId: CardInstanceId,
  targetDefinition: CardDefinition,
): boolean {
  if (
    modifier.operation !== "increase" ||
    modifier.side !== "corp" ||
    !isPublicRezzedCorpRootModifier(modifier)
  )
    return false;
  if (!cardMatchesModifierAppliesTo(targetDefinition, modifier.appliesTo))
    return false;
  if (!modifier.sameServerAsSource) return true;
  const targetServerId = corpServerIdForInstalledCard(
    state,
    targetCardInstanceId,
  );
  return (
    Boolean(targetServerId) &&
    corpServerIdForInstalledCard(state, sourceCardInstanceId) === targetServerId
  );
}

/**
 * Calculates the effective access trash cost for one accessed card.
 *
 * Callers are responsible for rebuilding this quote during revalidation before
 * runner credits are spent.
 */
export function quoteAccessTrashCost(
  state: GameState,
  targetCardInstanceId: CardInstanceId,
  targetDefinition: CardDefinition,
  baseCost: number,
): AccessTrashCostQuote {
  const modifiers: TrashCostModifierQuote[] = [];
  for (const match of activeCardImplementationModifiersForCorpRoot(
    state,
    "trash_cost",
  )) {
    if (match.sourceCardInstanceId === targetCardInstanceId) continue;
    if (
      !trashCostModifierAppliesToCard(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        targetCardInstanceId,
        targetDefinition,
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
  const modifier = modifiers.reduce((sum, match) => sum + match.amount, 0);
  return {
    baseCost,
    modifier,
    totalCost: baseCost + modifier,
    modifiers,
  };
}
