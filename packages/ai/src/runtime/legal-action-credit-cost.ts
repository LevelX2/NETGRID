import { type AiDecisionInput } from "@netgrid/shared";
export function legalActionCreditCost(
  action: AiDecisionInput["legalActions"][number],
): number {
  return action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
    0,
  );
}
