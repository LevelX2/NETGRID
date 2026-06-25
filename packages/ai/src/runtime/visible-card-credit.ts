import { type VisibleCard } from "@netgrid/shared";

export function corpVisibleCardStoredCredits(card: VisibleCard): number {
  return Object.entries(card.counters ?? {}).reduce((total, [key, value]) => {
    const normalizedKey = key.toLowerCase();
    if (!normalizedKey.includes("credit") && normalizedKey !== "bit")
      return total;
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}
