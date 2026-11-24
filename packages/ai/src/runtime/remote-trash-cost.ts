import type { LegalAction, VisibleCard } from "@netgrid/shared";
import { actionCreditCost } from "./action-cost";

export type RemoteTrashCostBucket = "0_1" | "2_3" | "4_5" | "6_plus";

export function remoteTrashCostBucket(cost: number): RemoteTrashCostBucket {
  if (cost <= 1) return "0_1";
  if (cost <= 3) return "2_3";
  if (cost <= 5) return "4_5";
  return "6_plus";
}

export function remoteTrashActionTotalCost(action: LegalAction): number {
  const payloadCost = action.payload?.accessTrashTotalCost;
  return typeof payloadCost === "number" && Number.isFinite(payloadCost)
    ? payloadCost
    : actionCreditCost(action);
}

/** Restricted credits certified for this exact accessed card and trash offer. */
export function remoteTrashQuotedDedicatedCredits(
  action: LegalAction,
  accessed: VisibleCard,
): number {
  if (
    action.type !== "trash_accessed_card" ||
    action.side !== "runner" ||
    action.source !== accessed.instanceId
  )
    return 0;
  const amount =
    accessed.type === "upgrade"
      ? action.payload?.upgradeTrashRecurringCreditsAvailable
      : accessed.type === "asset"
        ? action.payload?.poltergeistRecurringCreditsAvailable
        : undefined;
  return typeof amount === "number" &&
    Number.isSafeInteger(amount) &&
    amount > 0
    ? Math.min(remoteTrashActionTotalCost(action), amount)
    : 0;
}
