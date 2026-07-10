import { CARD_DEFINITIONS_BY_ID, type AiDecisionInput } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { findVisibleCorpServerCard } from "./visible-card-lookup";

export function selectedCorpAdvancementCounterChoiceOptionId(
  input: AiDecisionInput,
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
): string | undefined {
  return selectableOptions
    .map((option) => ({
      option,
      score: corpAdvancementCounterChoiceScore(input, option.value),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.option.id.localeCompare(right.option.id, "de"),
    )[0]?.option.id;
}

function corpAdvancementCounterChoiceScore(
  input: AiDecisionInput,
  value: string | number | boolean | undefined,
): number {
  if (typeof value !== "string") return 0;
  const placements = value
    .split("|")
    .map((part) => {
      const [cardId, amountRaw] = part.split(":");
      const amount = Number(amountRaw);
      return cardId && Number.isFinite(amount) && amount > 0
        ? { cardId, amount }
        : undefined;
    })
    .filter((entry): entry is { cardId: string; amount: number } =>
      Boolean(entry),
    );
  return placements.reduce((sum, placement) => {
    const located = findVisibleCorpServerCard(input, placement.cardId);
    if (!located) return sum;
    const definitionId = located.card.definitionId;
    const definition = definitionId
      ? CARD_DEFINITIONS_BY_ID[definitionId]
      : undefined;
    const runtime = definitionId ? RUNTIME_CARDS[definitionId] : undefined;
    const isAgenda =
      definition?.type === "agenda" || runtime?.type === "agenda";
    const requirement =
      located.card.advancementRequirement ??
      definition?.advancementRequirement ??
      runtime?.numeric.advancementRequirement ??
      0;
    const countersAfter =
      (located.card.advancementCounters ?? 0) + placement.amount;
    const remaining = Math.max(0, requirement - countersAfter);
    const serverIce = located.server.ice.length;
    const rezzedIce = located.server.ice.filter(
      (ice) => ice.rezzed === true,
    ).length;
    return (
      sum +
      placement.amount * 12 +
      (isAgenda ? 90 : 20) +
      (remaining === 0 ? 80 : remaining <= 2 ? 35 : 0) +
      Math.min(serverIce, 3) * 18 +
      rezzedIce * 12
    );
  }, 0);
}
