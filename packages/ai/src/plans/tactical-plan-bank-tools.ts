import type { LegalAction, Side } from "@netgrid/shared";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

export function bankToolEvidence(
  context: TacticalPlanBuildContext,
  side: Side,
): string[] {
  const tools =
    side === "runner"
      ? (context.deckCapabilities?.runner?.economyBankTools ?? [])
      : (context.deckCapabilities?.corp?.economyBankTools ?? []);
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
  const tools =
    side === "runner"
      ? (context.deckCapabilities?.runner?.economyBankTools ?? [])
      : (context.deckCapabilities?.corp?.economyBankTools ?? []);
  const payouts = tools
    .map((tool) => tool.estimatedPayout ?? tool.currentBankAmount)
    .filter((value): value is number => typeof value === "number");
  if (payouts.length === 0) return undefined;
  return Math.max(...payouts);
}

export function isBankBuildAction(action: LegalAction): boolean {
  const label = action.label.toLowerCase();
  return (
    (label.includes("legen") && label.includes("bank")) ||
    (label.includes("put") && label.includes("bank")) ||
    (label.includes("bank") && label.includes("counter"))
  );
}

export function isBankPayoutAction(action: LegalAction): boolean {
  const label = action.label.toLowerCase();
  return (
    (label.includes("nehmen") && label.includes("bank")) ||
    (label.includes("take") && label.includes("bank")) ||
    (label.includes("cash") && label.includes("bank"))
  );
}
