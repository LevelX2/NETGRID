import type { LegalAction, Side } from "@netgrid/shared";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

function bankTools(
  context: TacticalPlanBuildContext,
  side: Side,
) {
  return side === "runner"
    ? (context.deckCapabilities?.runner?.economyBankTools ?? [])
    : (context.deckCapabilities?.corp?.economyBankTools ?? []);
}

export function bankToolEvidence(
  context: TacticalPlanBuildContext,
  side: Side,
): string[] {
  const tools = bankTools(context, side);
  if (tools.length === 0) return [];
  const statuses = [...new Set(tools.map((tool) => tool.status))].sort();
  const legalBuild = tools.some((tool) => tool.buildActionLegal);
  const legalCashOut = tools.some((tool) => tool.cashOutActionLegal);
  const largestPayout = largestBankPayout(context, side);
  return [
    `bank_tool_count:${tools.length}`,
    `bank_tool_status:${statuses.join(",")}`,
    `bank_build_legal:${legalBuild}`,
    `bank_cashout_legal:${legalCashOut}`,
    ...(largestPayout !== undefined
      ? [`bank_estimated_payout:${largestPayout}`]
      : []),
  ];
}

export function largestBankPayout(
  context: TacticalPlanBuildContext,
  side: Side,
): number | undefined {
  const tools = bankTools(context, side);
  const payouts = tools
    .map((tool) => tool.estimatedPayout ?? tool.currentBankAmount)
    .filter((value): value is number => typeof value === "number");
  if (payouts.length === 0) return undefined;
  return Math.max(...payouts);
}

export function bankBuildActions(
  context: TacticalPlanBuildContext,
  side: Side,
  legalActions: readonly LegalAction[],
): LegalAction[] {
  const actionIds = new Set(
    bankTools(context, side).flatMap((tool) => tool.buildActionIds),
  );
  if (actionIds.size === 0) return [];
  return legalActions.filter((action) => actionIds.has(action.actionId));
}

export function bankPayoutActions(
  context: TacticalPlanBuildContext,
  side: Side,
  legalActions: readonly LegalAction[],
): LegalAction[] {
  const actionIds = new Set(
    bankTools(context, side).flatMap((tool) => tool.cashOutActionIds),
  );
  if (actionIds.size === 0) return [];
  return legalActions.filter((action) => actionIds.has(action.actionId));
}
