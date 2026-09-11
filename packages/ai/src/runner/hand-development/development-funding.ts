import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { createRunnerCreditDemand } from "../../plans/credit-demand";
import { searchFundingRoutes } from "../../plans/funding-route";
import type { RunnerHandDevelopmentEvaluation } from "./hand-development-evaluation";
import { runnerStrategicExchangeRequiresBoundParent } from "../../runtime/runner-strategic-exchange";

export function runnerSameTurnDevelopmentFundingRoute(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerHandDevelopmentEvaluation,
  explicitTargetCredits?: number,
): { actionIds: string[]; evidenceCodes: string[] } {
  const targetCredits =
    explicitTargetCredits ?? evaluation.fundingNeed?.targetCredits;
  if (targetCredits === undefined) {
    return {
      actionIds: [],
      evidenceCodes: ["development_funding_route_status:missing_credit_demand"],
    };
  }

  // A funding step belongs to the card plan only when the complete
  // fund-and-convert route still fits into this turn. Long-term generic
  // credit accumulation remains the economy plan's responsibility.
  const conversionClickCost = 1;
  const remainingFundingClicks = Math.max(
    0,
    input.playerView.own.clicks - conversionClickCost,
  );
  const demand = createRunnerCreditDemand({
    demandId: `development:${evaluation.cardInstanceId}`,
    sourcePlanId: `runner.develop_board_and_hand:${evaluation.cardInstanceId}`,
    purpose: "foreground_plan",
    priority: "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    currentCredits: input.playerView.own.credits,
    targetCredits,
    evidence: [
      `development_card:${evaluation.definitionId ?? "missing_definition"}`,
      `development_conversion_clicks_reserved:${conversionClickCost}`,
    ],
  });
  const result = searchFundingRoutes({
    demand,
    candidates: candidates.filter(
      (candidate) => !runnerStrategicExchangeRequiresBoundParent(candidate),
    ),
    remainingClicks: remainingFundingClicks,
    maxSteps: Math.max(1, remainingFundingClicks),
    maxRoutes: 8,
  });
  const actionIds = [
    ...new Set(
      result.routes
        .filter(
          (route) =>
            route.status === "covered_guaranteed" &&
            route.horizon === "same_turn",
        )
        .map(
          (route) =>
            route.steps.find(
              (step) =>
                step.kind === "legal_action" &&
                step.ownTurnOffset === 0 &&
                step.actionId !== undefined,
            )?.actionId,
        )
        .filter((actionId): actionId is string => actionId !== undefined),
    ),
  ];
  return {
    actionIds,
    evidenceCodes: [
      `development_funding_click_budget:${remainingFundingClicks}`,
      ...(explicitTargetCredits !== undefined
        ? [
            `development_funding_preserves_credit_floor:true`,
            `development_funding_target_credits:${explicitTargetCredits}`,
          ]
        : []),
      `development_funding_route_status:${result.bestRoute.status}`,
      `development_funding_route_horizon:${result.bestRoute.horizon}`,
      `development_funding_route_gap:${result.bestRoute.projectedGap}`,
      "development_funding_strategic_exchange_requires_parent:true",
      `development_funding_route_ready:${actionIds.length > 0}`,
    ],
  };
}
