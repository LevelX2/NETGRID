import type { RunnerCreditReservePhase } from "../run-analysis/runner-run-target-types";

export const RUNNER_BREAKER_UPGRADE_ECONOMIC_QUOTE_SCHEMA_VERSION =
  "runner-breaker-upgrade-economic-quote-v1" as const;

const ACTION_OPPORTUNITY_COST_PER_CLICK = 1;
const CONSUMED_SEARCH_CARD_OPPORTUNITY_COST = 1;
const REQUIRED_NET_SAFETY_MARGIN = 2;

export type RunnerBreakerUpgradeEconomicRejection =
  | "invalid_quote_input"
  | "not_midgame"
  | "urgent_score_threat"
  | "insufficient_run_horizon"
  | "no_operating_savings"
  | "memory_unavailable"
  | "reserve_breached"
  | "amortization_margin_not_met";

export type RunnerBreakerUpgradeEconomicQuote = {
  schemaVersion: typeof RUNNER_BREAKER_UPGRADE_ECONOMIC_QUOTE_SCHEMA_VERSION;
  admitted: boolean;
  rejectionReasons: RunnerBreakerUpgradeEconomicRejection[];
  currentPathCost: number;
  projectedPathCost: number;
  savingsPerRun: number;
  plannedRunHorizon: number;
  grossRunSavings: number;
  installCreditCost: number;
  searchCreditCost: number;
  upfrontCreditCost: number;
  installActionClicks: number;
  searchActionClicks: number;
  actionOpportunityCost: number;
  searchCardOpportunityCost: number;
  totalInvestment: number;
  netValueBeforeSafetyMargin: number;
  requiredNetSafetyMargin: number;
  currentCredits: number;
  desiredCreditReserve: number;
  projectedLiquidCreditsAfterUpgradeAndRun: number;
  memoryAvailable: number;
  candidateMemoryCost: number;
  evidence: string[];
};

export type QuoteRunnerBreakerUpgradeEconomicsParams = {
  phase: RunnerCreditReservePhase;
  scoreThreat: boolean;
  currentPathCost: number;
  projectedPathCost: number;
  plannedRunHorizon: number;
  installCreditCost: number;
  searchCreditCost: number;
  installActionClicks: number;
  searchActionClicks: number;
  consumesSearchCard: boolean;
  currentCredits: number;
  desiredCreditReserve: number;
  memoryAvailable: number;
  candidateMemoryCost: number;
};

/**
 * Hard admission gate for an optional, already-covered breaker upgrade.
 * Plan priority is intentionally absent: an uneconomic quote cannot be
 * rescued by the requesting Central plan.
 */
export function quoteRunnerBreakerUpgradeEconomics(
  params: QuoteRunnerBreakerUpgradeEconomicsParams,
): RunnerBreakerUpgradeEconomicQuote {
  const numericInputs = [
    params.currentPathCost,
    params.projectedPathCost,
    params.plannedRunHorizon,
    params.installCreditCost,
    params.searchCreditCost,
    params.installActionClicks,
    params.searchActionClicks,
    params.currentCredits,
    params.desiredCreditReserve,
    params.memoryAvailable,
    params.candidateMemoryCost,
  ];
  const validInputs = numericInputs.every(
    (value) => Number.isSafeInteger(value) && value >= 0,
  );
  const savingsPerRun = validInputs
    ? Math.max(0, params.currentPathCost - params.projectedPathCost)
    : 0;
  const grossRunSavings = savingsPerRun * params.plannedRunHorizon;
  const upfrontCreditCost = params.installCreditCost + params.searchCreditCost;
  const actionOpportunityCost =
    (params.installActionClicks + params.searchActionClicks) *
    ACTION_OPPORTUNITY_COST_PER_CLICK;
  const searchCardOpportunityCost = params.consumesSearchCard
    ? CONSUMED_SEARCH_CARD_OPPORTUNITY_COST
    : 0;
  const totalInvestment =
    upfrontCreditCost + actionOpportunityCost + searchCardOpportunityCost;
  const netValueBeforeSafetyMargin = grossRunSavings - totalInvestment;
  const projectedLiquidCreditsAfterUpgradeAndRun =
    params.currentCredits - upfrontCreditCost - params.projectedPathCost;
  const rejectionReasons: RunnerBreakerUpgradeEconomicRejection[] = [];
  if (!validInputs) rejectionReasons.push("invalid_quote_input");
  if (params.phase !== "midgame") rejectionReasons.push("not_midgame");
  if (params.scoreThreat) rejectionReasons.push("urgent_score_threat");
  if (params.plannedRunHorizon < 2)
    rejectionReasons.push("insufficient_run_horizon");
  if (savingsPerRun <= 0) rejectionReasons.push("no_operating_savings");
  if (params.candidateMemoryCost > params.memoryAvailable)
    rejectionReasons.push("memory_unavailable");
  if (projectedLiquidCreditsAfterUpgradeAndRun < params.desiredCreditReserve) {
    rejectionReasons.push("reserve_breached");
  }
  if (netValueBeforeSafetyMargin < REQUIRED_NET_SAFETY_MARGIN) {
    rejectionReasons.push("amortization_margin_not_met");
  }

  return {
    schemaVersion: RUNNER_BREAKER_UPGRADE_ECONOMIC_QUOTE_SCHEMA_VERSION,
    admitted: rejectionReasons.length === 0,
    rejectionReasons,
    currentPathCost: params.currentPathCost,
    projectedPathCost: params.projectedPathCost,
    savingsPerRun,
    plannedRunHorizon: params.plannedRunHorizon,
    grossRunSavings,
    installCreditCost: params.installCreditCost,
    searchCreditCost: params.searchCreditCost,
    upfrontCreditCost,
    installActionClicks: params.installActionClicks,
    searchActionClicks: params.searchActionClicks,
    actionOpportunityCost,
    searchCardOpportunityCost,
    totalInvestment,
    netValueBeforeSafetyMargin,
    requiredNetSafetyMargin: REQUIRED_NET_SAFETY_MARGIN,
    currentCredits: params.currentCredits,
    desiredCreditReserve: params.desiredCreditReserve,
    projectedLiquidCreditsAfterUpgradeAndRun,
    memoryAvailable: params.memoryAvailable,
    candidateMemoryCost: params.candidateMemoryCost,
    evidence: [
      `breaker_upgrade_phase:${params.phase}`,
      `breaker_upgrade_score_threat:${params.scoreThreat}`,
      `breaker_upgrade_current_path_cost:${params.currentPathCost}`,
      `breaker_upgrade_projected_path_cost:${params.projectedPathCost}`,
      `breaker_upgrade_savings_per_run:${savingsPerRun}`,
      `breaker_upgrade_planned_run_horizon:${params.plannedRunHorizon}`,
      `breaker_upgrade_gross_run_savings:${grossRunSavings}`,
      `breaker_upgrade_upfront_credit_cost:${upfrontCreditCost}`,
      `breaker_upgrade_action_opportunity_cost:${actionOpportunityCost}`,
      `breaker_upgrade_search_card_opportunity_cost:${searchCardOpportunityCost}`,
      `breaker_upgrade_total_investment:${totalInvestment}`,
      `breaker_upgrade_net_value_before_margin:${netValueBeforeSafetyMargin}`,
      `breaker_upgrade_required_net_margin:${REQUIRED_NET_SAFETY_MARGIN}`,
      `breaker_upgrade_projected_credits_after_upgrade_and_run:${projectedLiquidCreditsAfterUpgradeAndRun}`,
      `breaker_upgrade_desired_credit_reserve:${params.desiredCreditReserve}`,
      `breaker_upgrade_memory_available:${params.memoryAvailable}`,
      `breaker_upgrade_candidate_memory_cost:${params.candidateMemoryCost}`,
      `breaker_upgrade_admitted:${rejectionReasons.length === 0}`,
      ...rejectionReasons.map((reason) => `breaker_upgrade_rejected:${reason}`),
    ],
  };
}
