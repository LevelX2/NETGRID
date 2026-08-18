import type { AiDecisionInput } from "@netgrid/shared";

import { corpRemoteContestabilityAssessment } from "../plans/tactical-plan-corp-score-window";

export type CorpEconomyAssetPaybackRisk = Readonly<{
  serverId: string;
  protectionState:
    | "unprotected"
    | "protected_contestable"
    | "protected_not_contestable"
    | "protection_unknown";
  baselineHorizonTurns: number;
  riskAdjustedHorizonTurns: number;
  projectedPayoutExecutions: number;
  unadjustedProjectedCredits: number;
  projectedCredits: number;
  setupCreditCost: number;
  projectedOpportunityCostCredits: number;
  projectedNetCredits: number;
  evidenceCodes: string[];
}>;

export function assessCorpEconomyAssetPayback(params: {
  input: AiDecisionInput;
  serverId: string;
  cadence: "finite_pool" | "automatic_start_of_turn";
  baselineHorizonTurns: number;
  finitePoolCredits: number;
  payoutCreditsPerExecution: number;
  payoutActionCost: number;
  setupCreditCost: number;
  setupActionCost: number;
}): CorpEconomyAssetPaybackRisk | undefined {
  const numeric = [
    params.baselineHorizonTurns,
    params.finitePoolCredits,
    params.payoutCreditsPerExecution,
    params.payoutActionCost,
    params.setupCreditCost,
    params.setupActionCost,
  ];
  if (
    !numeric.every((value) => Number.isSafeInteger(value) && value >= 0) ||
    params.baselineHorizonTurns <= 0 ||
    params.payoutCreditsPerExecution <= 0
  ) {
    return undefined;
  }
  const server = params.input.playerView.servers.find(
    (candidate) => candidate.id === params.serverId,
  );
  const contestability = server?.ice.length
    ? corpRemoteContestabilityAssessment(params.input, params.serverId)
    : undefined;
  const protectionState =
    !server || server.ice.length === 0
      ? ("unprotected" as const)
      : contestability?.contestable === false
        ? ("protected_not_contestable" as const)
        : contestability?.contestable === true
          ? ("protected_contestable" as const)
          : ("protection_unknown" as const);
  const riskAdjustedHorizonTurns =
    protectionState === "protected_not_contestable"
      ? params.baselineHorizonTurns
      : params.cadence === "finite_pool"
        ? Math.min(1, params.baselineHorizonTurns)
        : 0;
  const maximumFinitePoolExecutions =
    params.cadence === "finite_pool"
      ? Math.floor(params.finitePoolCredits / params.payoutCreditsPerExecution)
      : params.baselineHorizonTurns;
  const currentPayoutActionCapacity = Math.max(
    0,
    params.input.playerView.own.clicks - params.setupActionCost,
  );
  const payoutExecutionCapacity = (horizonTurns: number): number =>
    params.cadence === "finite_pool" && horizonTurns > 0
      ? currentPayoutActionCapacity + Math.max(0, horizonTurns - 1)
      : horizonTurns;
  const unadjustedPayoutExecutions = Math.min(
    payoutExecutionCapacity(params.baselineHorizonTurns),
    maximumFinitePoolExecutions,
  );
  const projectedPayoutExecutions = Math.min(
    payoutExecutionCapacity(riskAdjustedHorizonTurns),
    maximumFinitePoolExecutions,
  );
  const unadjustedProjectedCredits =
    unadjustedPayoutExecutions * params.payoutCreditsPerExecution;
  const projectedCredits =
    projectedPayoutExecutions * params.payoutCreditsPerExecution;
  const projectedOpportunityCostCredits =
    params.setupActionCost +
    projectedPayoutExecutions * params.payoutActionCost;
  const projectedNetCredits =
    projectedCredits - params.setupCreditCost - projectedOpportunityCostCredits;
  return {
    serverId: params.serverId,
    protectionState,
    baselineHorizonTurns: params.baselineHorizonTurns,
    riskAdjustedHorizonTurns,
    projectedPayoutExecutions,
    unadjustedProjectedCredits,
    projectedCredits,
    setupCreditCost: params.setupCreditCost,
    projectedOpportunityCostCredits,
    projectedNetCredits,
    evidenceCodes: [
      `corp_economy_asset_server:${params.serverId}`,
      `corp_economy_asset_protection:${protectionState}`,
      `corp_economy_asset_baseline_horizon:${params.baselineHorizonTurns}`,
      `corp_economy_asset_risk_adjusted_horizon:${riskAdjustedHorizonTurns}`,
      `corp_economy_asset_current_payout_action_capacity:${currentPayoutActionCapacity}`,
      `corp_economy_asset_payout_executions:${projectedPayoutExecutions}`,
      `corp_economy_asset_unadjusted_credits:${unadjustedProjectedCredits}`,
      `corp_economy_asset_projected_credits:${projectedCredits}`,
      `corp_economy_asset_opportunity_cost:${projectedOpportunityCostCredits}`,
      ...(contestability?.evidence ?? []),
    ],
  };
}
