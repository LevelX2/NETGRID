import type { LegalAction } from "@netgrid/shared";

export function exactCostDimension(
  action: LegalAction,
  key: "clicks" | "credits",
):
  | { status: "invalid" }
  | { status: "known"; value: number; explicit: boolean } {
  // The Engine's complete empty cost list certifies zero expenditure.
  // Preserve that fact for planners which require exact resource dimensions.
  let value = 0;
  let explicit = false;
  for (const cost of action.costs) {
    const component = cost[key];
    if (component === undefined) continue;
    if (
      !Number.isSafeInteger(component) ||
      component < 0 ||
      !Number.isSafeInteger(value + component)
    ) {
      return { status: "invalid" };
    }
    explicit = true;
    value += component;
  }
  return { status: "known", value, explicit };
}

export function actionClickCost(action: LegalAction): number {
  return literalActionCost(action, "clicks");
}

export function actionCreditCost(action: LegalAction): number {
  return literalActionCost(action, "credits");
}

export const nonNegativeActionCreditCost = actionCreditCost;

function literalActionCost(
  action: LegalAction,
  key: "clicks" | "credits",
): number {
  const quote = exactCostDimension(action, key);
  if (quote.status === "invalid") {
    throw Object.assign(new Error("invalid_legal_action_cost"), {
      actionId: action.actionId,
      code: "invalid_legal_action_cost",
      owner: "action_semantics",
      invalidDimensions: [key],
    });
  }
  return quote.value;
}
