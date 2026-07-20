import type { LegalAction, Side } from "@netgrid/shared";
import type { RunnerAccessPayoff } from "../run-analysis/runner-run-target-types";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

const RUNNER_BANK_MIN_CRITICAL_CASHOUT = 3;
const RUNNER_BANK_VALUE_BUILD_TARGET = 12;
const RUNNER_BANK_COMFORTABLE_BUILD_CREDITS = 15;
const RUNNER_BANK_COMFORTABLE_LIQUID_CREDITS = 20;

export type RunnerCreditBankAssessment = {
  buildActions: LegalAction[];
  payoutActions: LegalAction[];
  currentStoredCredits: number;
  portfolioStoredCredits: number;
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

export type RunnerConvertibleBankRunFundingConsumer = {
  targetServerId: string;
  fundingGap: number;
  accessPayoff: RunnerAccessPayoff;
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
  const amounts = bankStoredAmounts(context, side);
  if (amounts.length === 0) return undefined;
  return Math.max(...amounts);
}

function leastLoadedBankStoredAmount(
  context: TacticalPlanBuildContext,
  side: Side,
): number | undefined {
  const amounts = bankStoredAmounts(context, side);
  if (amounts.length === 0) return undefined;
  return Math.min(...amounts);
}

function portfolioBankStoredAmount(
  context: TacticalPlanBuildContext,
  side: Side,
): number {
  return bankStoredAmounts(context, side).reduce(
    (sum, amount) => sum + amount,
    0,
  );
}

function bankStoredAmounts(
  context: TacticalPlanBuildContext,
  side: Side,
): number[] {
  return bankTools(context, side).flatMap((tool) =>
    tool.currentBankAmounts?.length
      ? tool.currentBankAmounts
      : typeof tool.currentBankAmount === "number"
        ? [tool.currentBankAmount]
        : [],
  );
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

export function runnerHasConvertibleBankRunFundingNeed(
  context: TacticalPlanBuildContext,
): boolean {
  return runnerConvertibleBankRunFundingConsumer(context) !== undefined;
}

export function runnerConvertibleBankRunFundingConsumer(
  context: TacticalPlanBuildContext,
): RunnerConvertibleBankRunFundingConsumer | undefined {
  if (context.input.side !== "runner") return undefined;
  if (context.input.playerView.own.clicks < 2) return undefined;
  const largestPayout = largestBankPayout(context, "runner") ?? 0;
  if (largestPayout <= 0) return undefined;
  const credits = context.input.playerView.own.credits;
  const evaluations = context.runnerRunTargetEvaluations ?? [];
  const readyPressureAvailable = evaluations.some(
    (evaluation) =>
      runnerBankRunConsumerHasValue(evaluation) &&
      (evaluation.routeQuote?.fundingGap ??
        Math.max(0, evaluation.pathCost - credits)) === 0 &&
      evaluation.pathPassability === "reachable" &&
      evaluation.creditsAfterRun >= 0,
  );
  if (readyPressureAvailable) return undefined;
  const [consumer] = evaluations
    .flatMap((evaluation) => {
      const fundingGap =
        evaluation.routeQuote?.fundingGap ??
        Math.max(0, evaluation.pathCost - credits);
      const routeCanBecomeAccess = evaluation.routeQuote
        ? evaluation.routeQuote.reachability !== "no_access"
        : evaluation.pathPassability === "blocked_unpayable";
      if (
        !runnerBankRunConsumerHasValue(evaluation) ||
        !routeCanBecomeAccess ||
        fundingGap <= 0 ||
        fundingGap > largestPayout
      ) {
        return [];
      }
      return [
        {
          targetServerId: evaluation.targetServerId,
          fundingGap,
          accessPayoff: evaluation.accessPayoff,
          score: evaluation.score,
          evidence: [
            `runner_bank_funding_consumer:run_route`,
            `runner_bank_funding_consumer_server:${evaluation.targetServerId}`,
            `runner_bank_funding_consumer_gap:${fundingGap}`,
            `runner_bank_funding_consumer_payoff:${evaluation.accessPayoff}`,
          ],
        },
      ];
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.fundingGap - right.fundingGap ||
        left.targetServerId.localeCompare(right.targetServerId),
    );
  if (!consumer) return undefined;
  const { score: _score, ...publicConsumer } = consumer;
  return publicConsumer;
}

function runnerBankRunConsumerHasValue(
  evaluation: NonNullable<
    TacticalPlanBuildContext["runnerRunTargetEvaluations"]
  >[number],
): boolean {
  return (
    evaluation.scoreThreat ||
    ["agenda", "score_threat", "trash_affordable", "fresh"].includes(
      evaluation.accessPayoff,
    ) ||
    (evaluation.targetServerId === "rd" &&
      evaluation.knownAccessState === "unknown")
  );
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
    Math.floor(leastLoadedBankStoredAmount(context, "runner") ?? 0),
  );
  const portfolioStoredCredits = Math.max(
    0,
    Math.floor(portfolioBankStoredAmount(context, "runner")),
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
  const combinedCreditAccess = ownCredits + portfolioStoredCredits;
  const cashOutMinimum = concreteFundingNeed
    ? 1
    : ownCredits < 5
      ? RUNNER_BANK_MIN_CRITICAL_CASHOUT
      : RUNNER_BANK_VALUE_BUILD_TARGET;
  const shouldBuild =
    buildActions.length > 0 &&
    !concreteFundingNeed &&
    ownCredits < RUNNER_BANK_COMFORTABLE_BUILD_CREDITS &&
    currentStoredCredits < buildTarget;
  const cashOutReason =
    payoutActions.length === 0 || estimatedPayout <= 0
      ? undefined
      : concreteFundingNeed
        ? "concrete_funding_need"
        : ownCredits < 5 && estimatedPayout >= RUNNER_BANK_MIN_CRITICAL_CASHOUT
          ? "urgent_credit_floor"
          : ownCredits < RUNNER_BANK_COMFORTABLE_LIQUID_CREDITS &&
              estimatedPayout >= RUNNER_BANK_VALUE_BUILD_TARGET
            ? "value_target"
            : undefined;
  const shouldCashOut = cashOutReason !== undefined;
  return {
    buildActions,
    payoutActions,
    currentStoredCredits,
    portfolioStoredCredits,
    estimatedPayout,
    buildTarget,
    cashOutMinimum,
    concreteFundingNeed,
    shouldBuild,
    shouldCashOut,
    ...(cashOutReason ? { cashOutReason } : {}),
    evidence: [
      `runner_bank_current_stored:${currentStoredCredits}`,
      `runner_bank_portfolio_stored:${portfolioStoredCredits}`,
      `runner_bank_estimated_payout:${estimatedPayout}`,
      `runner_bank_build_target:${buildTarget}`,
      `runner_bank_combined_credit_access:${combinedCreditAccess}`,
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
