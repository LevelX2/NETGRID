import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { VisibleCard } from "@netgrid/shared";

/** A visible, usable reaction to one incoming tag. */
export function canAvoidOneNextCorpTag(
  card: VisibleCard,
  credits: number,
  requireFreeReaction = false,
): boolean {
  if (
    !card.known ||
    !card.definitionId ||
    (card.lifecycleMarkers?.length ?? 0) > 0
  )
    return false;
  return (
    cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
      .tagPreventionSources ?? []
  ).some((source) => {
    if (
      source.kind !== "avoid_tag" ||
      source.amount !== 1 ||
      source.visibility !== "public"
    )
      return false;
    const cost = source.cost;
    if (cost.kind === "credit_and_tap_source" && card.tapped) return false;
    return (
      cost.kind === "trash_source" ||
      cost.amount <= (requireFreeReaction ? 0 : credits)
    );
  });
}
