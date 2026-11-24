import type { VisibleCard } from "@netgrid/shared";

export function corpVisibleCardPlayCost(card: VisibleCard): number | undefined {
  const playCost = card.playCost;
  if (playCost === undefined) return undefined;
  if (playCost.kind === "fixed") {
    return Number.isSafeInteger(playCost.credits) && playCost.credits >= 0
      ? playCost.credits
      : undefined;
  }
  if (
    playCost.kind !== "variable_x" ||
    !Number.isSafeInteger(playCost.minimumX) ||
    playCost.minimumX < 0 ||
    !Number.isSafeInteger(playCost.creditsPerX) ||
    playCost.creditsPerX < 1 ||
    playCost.maximumX?.kind !== "context"
  ) {
    return undefined;
  }
  const minimumCredits = playCost.minimumX * playCost.creditsPerX;
  return Number.isSafeInteger(minimumCredits) ? minimumCredits : undefined;
}
