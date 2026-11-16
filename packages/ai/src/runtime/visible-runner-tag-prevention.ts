import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { VisibleCard } from "@netgrid/shared";

export function visibleSingleTagAvoidanceCosts(card: VisibleCard) {
  if (!card.known || !card.definitionId) return [];
  const sources =
    cardSpecPlanningCardByDefinitionId(card.definitionId)?.planning.engine
      .tagPreventionSources ?? [];
  return sources
    .filter(
      (source) =>
        source.kind === "avoid_tag" &&
        source.amount === 1 &&
        source.visibility === "public" &&
        (source.cost.kind !== "credit_and_tap_source" || !card.tapped),
    )
    .map((source) => source.cost);
}

/** A visible, usable reaction to one incoming tag on the next Corp turn. */
export function canAvoidOneNextCorpTag(
  card: VisibleCard,
  credits: number,
  requireFreeReaction = false,
): boolean {
  if ((card.lifecycleMarkers?.length ?? 0) > 0) return false;
  return visibleSingleTagAvoidanceCosts(card).some(
    (cost) =>
      cost.kind === "trash_source" ||
      cost.amount <= (requireFreeReaction ? 0 : credits),
  );
}
