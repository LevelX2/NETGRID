import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { type AiDecisionInput } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import { findVisibleCorpServerCard } from "./visible-card-lookup";

export function selectedCorpAdvancementCounterChoiceOptionId(
  input: AiDecisionInput,
  selectableOptions: NonNullable<
    AiDecisionInput["playerView"]["pendingChoice"]
  >["options"],
  plannedTargetCardId?: string,
  plannedDesiredAdvancementCounters?: number,
  plannedMove?: {
    sourceCardId: string;
    targetCardId: string;
    amount: number;
  },
): string | undefined {
  if (plannedMove) {
    const exactValue = `${plannedMove.sourceCardId}|${plannedMove.targetCardId}|${plannedMove.amount}`;
    return selectableOptions.find((option) => option.value === exactValue)?.id;
  }
  return selectableOptions
    .map((option) => ({
      option,
      score: corpAdvancementCounterChoiceScore(
        input,
        option.value,
        plannedTargetCardId,
        plannedDesiredAdvancementCounters,
      ),
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
  plannedTargetCardId: string | undefined,
  plannedDesiredAdvancementCounters: number | undefined,
): number {
  if (typeof value !== "string") return 0;
  const placements = advancementPlacements(value);
  return placements.reduce((sum, placement) => {
    const located = findVisibleCorpServerCard(input, placement.cardId);
    if (!located) return sum;
    const definitionId = located.card.definitionId;
    const definition = definitionId
      ? CARD_DEFINITIONS_BY_ID[definitionId]
      : undefined;
    const runtime = definitionId ? RUNTIME_CARDS[definitionId] : undefined;
    const isAgenda =
      located.card.type === "agenda" ||
      definition?.type === "agenda" ||
      runtime?.type === "agenda";
    const requirement =
      located.card.advancementRequirement ??
      definition?.advancementRequirement ??
      runtime?.numeric.advancementRequirement ??
      0;
    const countersAfter =
      (located.card.advancementCounters ?? 0) + placement.amount;
    const remaining = Math.max(0, requirement - countersAfter);
    const requiredAmount = Math.max(
      0,
      requirement - (located.card.advancementCounters ?? 0),
    );
    const plannedRequiredAmount = Math.max(
      0,
      (plannedDesiredAdvancementCounters ?? requirement) -
        (located.card.advancementCounters ?? 0),
    );
    const serverIce = located.server.ice.length;
    const rezzedIce = located.server.ice.filter(
      (ice) => ice.rezzed === true,
    ).length;
    return (
      sum +
      placement.amount * 12 +
      (plannedTargetCardId === placement.cardId ? 5000 : 0) +
      (plannedTargetCardId === placement.cardId &&
      plannedDesiredAdvancementCounters !== undefined &&
      placement.amount === plannedRequiredAmount
        ? 900
        : 0) +
      (plannedTargetCardId && plannedTargetCardId !== placement.cardId
        ? -1200
        : 0) +
      (isAgenda ? 240 : 20) +
      (isAgenda
        ? remaining === 0
          ? 700 + (placement.amount === requiredAmount ? 500 : 0)
          : remaining === 1
            ? 260
            : remaining === 2
              ? 70
              : 0
        : 0) +
      Math.min(serverIce, 3) * 18 +
      rezzedIce * 12
    );
  }, 0);
}

function advancementPlacements(
  value: string,
): Array<{ cardId: string; amount: number }> {
  const moveParts = value.split("|");
  if (
    moveParts.length === 3 &&
    !value.includes(":") &&
    positiveAmount(moveParts[2]) !== undefined
  ) {
    return [
      {
        cardId: moveParts[1]!,
        amount: positiveAmount(moveParts[2])!,
      },
    ];
  }
  return value
    .split("|")
    .map((part) => {
      const [cardId, amountRaw] = part.split(":");
      const amount = positiveAmount(amountRaw);
      return cardId && amount !== undefined ? { cardId, amount } : undefined;
    })
    .filter((entry): entry is { cardId: string; amount: number } =>
      Boolean(entry),
    );
}

function positiveAmount(value: string | undefined): number | undefined {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}
