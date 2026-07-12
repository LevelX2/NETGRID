import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { PlanFollowupActionBudget } from "./tactical-plan-types";

export function assessPlanFollowupActionBudget(params: {
  input: AiDecisionInput;
  acquisitionActionIds?: readonly string[];
  conversionActionIds?: readonly string[];
  requiredFollowupActions: number;
  horizon: PlanFollowupActionBudget["horizon"];
}): PlanFollowupActionBudget {
  const availableActions = Math.max(0, params.input.playerView.own.clicks ?? 0);
  const acquisitionActionCost = minimumActionCost(
    params.input,
    params.acquisitionActionIds,
  );
  const conversionAvailable = (params.conversionActionIds?.length ?? 0) > 0;
  const sameTurnReachable =
    availableActions >= acquisitionActionCost + params.requiredFollowupActions;
  const recommendation = conversionAvailable && !sameTurnReachable
    ? "convert_now"
    : sameTurnReachable
      ? "acquire_then_convert"
      : params.horizon === "next_turn_allowed"
        ? "acquire_for_next_turn"
        : "defer_acquisition";
  return {
    recommendation,
    horizon: params.horizon,
    availableActions,
    acquisitionActionCost,
    requiredFollowupActions: params.requiredFollowupActions,
    conversionAvailable,
    sameTurnReachable,
    evidence: [
      `followup_budget_recommendation:${recommendation}`,
      `followup_budget_horizon:${params.horizon}`,
      `followup_budget_available_actions:${availableActions}`,
      `followup_budget_acquisition_cost:${acquisitionActionCost}`,
      `followup_budget_required_actions:${params.requiredFollowupActions}`,
      `followup_budget_conversion_available:${conversionAvailable}`,
      `followup_budget_same_turn_reachable:${sameTurnReachable}`,
    ],
  };
}

function minimumActionCost(
  input: AiDecisionInput,
  actionIds: readonly string[] | undefined,
): number {
  const ids = new Set(actionIds ?? []);
  const actions = input.legalActions.filter((action) =>
    ids.size === 0 || ids.has(action.actionId),
  );
  if (actions.length === 0) return 1;
  return Math.max(
    1,
    Math.min(...actions.map(actionClickCost)),
  );
}

function actionClickCost(action: LegalAction): number {
  return action.costs?.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0) ?? 1;
}
