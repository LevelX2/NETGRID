import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { VisibleCard } from "@netgrid/shared";

function visibleSingleTagAvoidanceCosts(card: VisibleCard) {
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

/** Maximum one-tag reactions affordable from one shared general-credit pool. */
export function countAvoidableRunnerTags(
  rig: readonly VisibleCard[],
  tags: number,
  credits: number,
  window: "current" | "next_corp_turn",
): number {
  const prices = rig
    .filter(
      (card) =>
        window === "current" || (card.lifecycleMarkers?.length ?? 0) === 0,
    )
    .flatMap((card) =>
      visibleSingleTagAvoidanceCosts(card).map((cost) => ({
        cardId: card.instanceId,
        credits: cost.kind === "trash_source" ? 0 : cost.amount,
        repeatable:
          cost.kind === "credit" ||
          cost.kind === "credit_and_forgo_next_action",
      })),
    )
    .sort((left, right) => left.credits - right.credits);

  let remaining = tags;
  let available = credits;
  const spentSingleUseSources = new Set<string>();
  for (const price of prices) {
    if (remaining <= 0 || price.credits > available) break;
    if (!price.repeatable && spentSingleUseSources.has(price.cardId)) continue;
    const uses = price.repeatable
      ? price.credits === 0
        ? remaining
        : Math.min(remaining, Math.floor(available / price.credits))
      : 1;
    remaining -= uses;
    available -= uses * price.credits;
    if (!price.repeatable) spentSingleUseSources.add(price.cardId);
  }
  return tags - remaining;
}

/** A visible, usable reaction to one incoming tag on the next Corp turn. */
export function canAvoidOneNextCorpTag(
  card: VisibleCard,
  credits: number,
  requireFreeReaction = false,
): boolean {
  return (
    countAvoidableRunnerTags(
      [card],
      1,
      requireFreeReaction ? 0 : credits,
      "next_corp_turn",
    ) === 1
  );
}
