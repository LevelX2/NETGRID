import type { GameState } from "@netgrid/shared";

/** Bounds payments for the run's icebreaker/Link restriction, not other costs. */
export function limitRunActionSpendingCapacity(
  state: GameState,
  paymentCapacity: number,
): number {
  const cap = state.run?.runActionSpendingCap;
  if (!cap) return paymentCapacity;
  if (
    !Number.isSafeInteger(cap.limit) ||
    !Number.isSafeInteger(cap.spent) ||
    cap.limit < 0 ||
    cap.spent < 0 ||
    cap.spent > cap.limit
  )
    throw new Error("runtime_invalid_run_action_spending_cap");
  return Math.min(paymentCapacity, cap.limit - cap.spent);
}
