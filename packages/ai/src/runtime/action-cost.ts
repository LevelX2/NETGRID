import type { LegalAction } from "@netgrid/shared";

export function actionClickCost(action: LegalAction): number {
  return Math.max(
    1,
    action.costs.reduce(
      (sum, cost) =>
        sum + (Number.isFinite(cost.clicks) ? (cost.clicks ?? 0) : 0),
      0,
    ),
  );
}

export function actionCreditCost(action: LegalAction): number {
  return action.costs.reduce(
    (sum, cost) =>
      sum + (Number.isFinite(cost.credits) ? (cost.credits ?? 0) : 0),
    0,
  );
}
