import type { AiDecisionInput } from "@netgrid/shared";

import { corpRemoteContestabilityAssessment } from "../defense/corp-remote-contestability";

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
  projectedPayoutsByTurn?: readonly number[];
  projectedExhaustion?: {
    turnsFromNow: number;
    remainingFlexibleClicks: number;
  };
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
  reservedNextTurnClicks?: number;
}): CorpEconomyAssetPaybackRisk | undefined {
  const numeric = [
    params.baselineHorizonTurns,
    params.finitePoolCredits,
    params.payoutCreditsPerExecution,
    params.payoutActionCost,
    params.setupCreditCost,
    params.setupActionCost,
    params.reservedNextTurnClicks ?? 0,
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
      ? Math.ceil(params.finitePoolCredits / params.payoutCreditsPerExecution)
      : params.baselineHorizonTurns;
  const currentPayoutActionCapacity = Math.max(
    0,
    params.input.playerView.own.clicks - params.setupActionCost,
  );
  const currentPayoutExecutionCapacity =
    params.payoutActionCost === 0
      ? maximumFinitePoolExecutions
      : Math.floor(currentPayoutActionCapacity / params.payoutActionCost);
  // Forecast only the Engine-quoted flexible clicks in the selected horizon.
  const clicksByTurn = [
    currentPayoutActionCapacity,
    ...(params.input.playerView.own.corpFutureFlexibleClicks ?? []).map(
      (clicks, index) =>
        index === 0
          ? Math.max(0, clicks - (params.reservedNextTurnClicks ?? 0))
          : clicks,
    ),
  ];
  const payoutsByTurn = (horizon: number) => {
    let remaining = maximumFinitePoolExecutions;
    return clicksByTurn.slice(0, horizon).map((clicks) => {
      const payouts =
        params.payoutActionCost === 0
          ? remaining
          : Math.min(remaining, Math.floor(clicks / params.payoutActionCost));
      remaining -= payouts;
      return payouts;
    });
  };
  const count = (payouts: readonly number[]) =>
    payouts.reduce((sum, executions) => sum + executions, 0);
  const projectedPayoutsByTurn =
    params.cadence === "finite_pool"
      ? payoutsByTurn(riskAdjustedHorizonTurns)
      : undefined;
  const unadjustedPayoutExecutions =
    params.cadence === "finite_pool"
      ? count(payoutsByTurn(params.baselineHorizonTurns))
      : params.baselineHorizonTurns;
  const projectedPayoutExecutions = projectedPayoutsByTurn
    ? count(projectedPayoutsByTurn)
    : riskAdjustedHorizonTurns;
  const exhaustionTurn =
    projectedPayoutsByTurn?.reduce(
      (lastTurn, payouts, turn) => (payouts > 0 ? turn : lastTurn),
      -1,
    ) ?? -1;
  const unadjustedProjectedCredits =
    params.cadence === "finite_pool"
      ? Math.min(
          params.finitePoolCredits,
          unadjustedPayoutExecutions * params.payoutCreditsPerExecution,
        )
      : unadjustedPayoutExecutions * params.payoutCreditsPerExecution;
  const projectedCredits =
    params.cadence === "finite_pool"
      ? Math.min(
          params.finitePoolCredits,
          projectedPayoutExecutions * params.payoutCreditsPerExecution,
        )
      : projectedPayoutExecutions * params.payoutCreditsPerExecution;
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
    ...(projectedPayoutsByTurn ? { projectedPayoutsByTurn } : {}),
    ...(projectedPayoutsByTurn &&
    exhaustionTurn >= 0 &&
    projectedPayoutExecutions === maximumFinitePoolExecutions
      ? {
          projectedExhaustion: {
            turnsFromNow: exhaustionTurn,
            remainingFlexibleClicks:
              clicksByTurn[exhaustionTurn]! -
              projectedPayoutsByTurn[exhaustionTurn]! * params.payoutActionCost,
          },
        }
      : {}),
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
      `corp_economy_asset_current_payout_execution_capacity:${currentPayoutExecutionCapacity}`,
      `corp_economy_asset_payout_executions:${projectedPayoutExecutions}`,
      ...(projectedPayoutsByTurn
        ? [
            `corp_economy_asset_payouts_by_turn:${projectedPayoutsByTurn.join(",")}`,
          ]
        : []),
      `corp_economy_asset_unadjusted_credits:${unadjustedProjectedCredits}`,
      `corp_economy_asset_projected_credits:${projectedCredits}`,
      `corp_economy_asset_opportunity_cost:${projectedOpportunityCostCredits}`,
      ...(contestability?.evidence ?? []),
    ],
  };
}
