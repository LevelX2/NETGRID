import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { VisibleCard } from "@netgrid/shared";
import { visibleSingleTagAvoidanceCosts } from "../runtime/visible-runner-tag-prevention";

const tagOnlyCardSpecFields = new Set([
  "schemaVersion",
  "characteristics",
  "tagPreventionSources",
]);

/** Price a fixed tag effect from visible installed sources and liquid credits. */
export function quoteInstalledFixedTagAvoidance(
  rigCards: readonly VisibleCard[],
  tags: number,
  generalCredits: number,
  consumedSourceIds: ReadonlySet<string>,
): { cost: number; trashedSourceIds: string[] } | undefined {
  if (!Number.isSafeInteger(tags) || tags <= 0) return undefined;
  const standaloneTrashSourceIds = new Set<string>();
  let repeatablePrice = Infinity;

  for (const card of rigCards) {
    if (
      !card.known ||
      !card.definitionId ||
      card.rezzed !== true ||
      card.controller !== "runner" ||
      card.lifecycleMarkers?.length ||
      consumedSourceIds.has(card.instanceId)
    )
      continue;
    for (const cost of visibleSingleTagAvoidanceCosts(card)) {
      if (
        cost.kind === "credit" &&
        Number.isSafeInteger(cost.amount) &&
        cost.amount >= 0
      ) {
        repeatablePrice = Math.min(repeatablePrice, cost.amount);
      } else if (
        cost.kind === "trash_source" &&
        !rigCards.some((other) => other.hostedOn === card.instanceId)
      ) {
        // A source with other effects would also change the rest of the path.
        const engine = cardSpecPlanningCardByDefinitionId(card.definitionId)
          ?.planning.engine;
        if (
          engine &&
          Object.keys(engine).every((key) => tagOnlyCardSpecFields.has(key))
        )
          standaloneTrashSourceIds.add(card.instanceId);
      }
    }
  }

  const trashedSourceIds =
    repeatablePrice === 0 ? [] : [...standaloneTrashSourceIds].slice(0, tags);
  const remainingTags = tags - trashedSourceIds.length;
  const cost = remainingTags === 0 ? 0 : remainingTags * repeatablePrice;
  return Number.isSafeInteger(cost) && cost <= generalCredits
    ? { cost, trashedSourceIds }
    : undefined;
}
