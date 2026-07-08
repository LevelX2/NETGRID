import type { LegalAction, Side } from "@netgrid/shared";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

const RUNNER_BANK_URGENT_CASHOUT_TARGET = 6;
const RUNNER_BANK_VALUE_BUILD_TARGET = 12;
const RUNNER_BANK_COMFORTABLE_CREDITS = 10;

export type RunnerCreditBankAssessment = {
  buildActions: LegalAction[];
  payoutActions: LegalAction[];
  currentStoredCredits: number;
  estimatedPayout: number;
  buildTarget: number;
  cashOutMinimum: number;
  concreteFundingNeed: boolean;
  shouldBuild: boolean;
  shouldCashOut: boolean;
  cashOutReason?:
    | "concrete_funding_need"
    | "urgent_credit_floor"
    | "value_target";
  evidence: string[];
};

function bankTools(context: TacticalPlanBuildContext, side: Side) {
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
  const largestStoredAmount = largestBankStoredAmount(context, side);
  return [
    `bank_tool_count:${tools.length}`,
    `bank_tool_status:${statuses.join(",")}`,
    `bank_build_legal:${legalBuild}`,
    `bank_cashout_legal:${legalCashOut}`,
    ...(largestStoredAmount !== undefined
      ? [`bank_current_amount:${largestStoredAmount}`]
      : []),
    ...(largestPayout !== undefined
      ? [`bank_estimated_payout:${largestPayout}`]
      : []),
  ];
}

export function largestBankStoredAmount(
  context: TacticalPlanBuildContext,
  side: Side,
): number | undefined {
  const tools = bankTools(context, side);
  const amounts = tools
    .map((tool) => tool.currentBankAmount)
    .filter((value): value is number => typeof value === "number");
  if (amounts.length === 0) return undefined;
  return Math.max(...amounts);
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

export function runnerCreditBankAssessment(
  context: TacticalPlanBuildContext,
  legalActions: readonly LegalAction[],
  concreteFundingNeed: boolean,
): RunnerCreditBankAssessment {
  const buildActions = bankBuildActions(context, "runner", legalActions);
  const payoutActions = bankPayoutActions(context, "runner", legalActions);
  const currentStoredCredits = Math.max(
    0,
    Math.floor(largestBankStoredAmount(context, "runner") ?? 0),
  );
  const estimatedPayout = Math.max(
    0,
    Math.floor(largestBankPayout(context, "runner") ?? currentStoredCredits),
  );
  const ownCredits = Math.max(
    0,
    Math.floor(context.input.playerView.own.credits),
  );
  const buildTarget = RUNNER_BANK_VALUE_BUILD_TARGET;
  const cashOutMinimum = concreteFundingNeed
    ? 1
    : ownCredits <= 3
      ? RUNNER_BANK_URGENT_CASHOUT_TARGET
      : RUNNER_BANK_VALUE_BUILD_TARGET;
  const shouldBuild =
    buildActions.length > 0 &&
    !concreteFundingNeed &&
    currentStoredCredits < buildTarget;
  const cashOutReason =
    payoutActions.length === 0 || estimatedPayout <= 0
      ? undefined
      : concreteFundingNeed
        ? "concrete_funding_need"
        : ownCredits <= 3 &&
            estimatedPayout >= RUNNER_BANK_URGENT_CASHOUT_TARGET
          ? "urgent_credit_floor"
          : ownCredits < RUNNER_BANK_COMFORTABLE_CREDITS &&
              estimatedPayout >= RUNNER_BANK_VALUE_BUILD_TARGET
            ? "value_target"
            : undefined;
  const shouldCashOut = cashOutReason !== undefined;
  return {
    buildActions,
    payoutActions,
    currentStoredCredits,
    estimatedPayout,
    buildTarget,
    cashOutMinimum,
    concreteFundingNeed,
    shouldBuild,
    shouldCashOut,
    ...(cashOutReason ? { cashOutReason } : {}),
    evidence: [
      `runner_bank_current_stored:${currentStoredCredits}`,
      `runner_bank_estimated_payout:${estimatedPayout}`,
      `runner_bank_build_target:${buildTarget}`,
      `runner_bank_cashout_minimum:${cashOutMinimum}`,
      `runner_bank_concrete_funding_need:${concreteFundingNeed}`,
      `runner_bank_build_ready:${shouldBuild}`,
      `runner_bank_cashout_ready:${shouldCashOut}`,
      ...(cashOutReason ? [`runner_bank_cashout_reason:${cashOutReason}`] : []),
      ...(!shouldCashOut && payoutActions.length > 0
        ? [
            `runner_bank_cashout_deferred_below_minimum:${estimatedPayout < cashOutMinimum}`,
          ]
        : []),
    ],
  };
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
