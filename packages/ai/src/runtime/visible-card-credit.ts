import { type VisibleCard } from "@netgrid/shared";

const CREDIT_COUNTER_KEYS = new Set([
  "bit",
  "stored_credit",
  "restricted_credit",
  "recurring_credit",
]);

export function corpVisibleCardStoredCredits(card: VisibleCard): number {
  return Object.entries(card.counters ?? {}).reduce((total, [key, value]) => {
    if (!CREDIT_COUNTER_KEYS.has(key)) return total;
    if (
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < 0 ||
      !Number.isSafeInteger(total + value)
    )
      throw new Error("invalid_visible_stored_credit_count");
    return total + value;
  }, 0);
}
