import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { createRunnerCreditDemand } from "../../plans/credit-demand";
import { searchFundingRoutes } from "../../plans/funding-route";
import type { RunnerFundingRouteAssessment } from "../../plans/runner-funding-contracts";
import { runnerFundingRouteCandidateIsMaterializable } from "../../plans/runner-funding-candidates";
import { runnerStrategicExchangeRequiresBoundParent } from "../../runtime/runner-strategic-exchange";

export const RUNNER_TAG_CLEAR_FUNDING_VALUE = 85;

/** A complete current cleanup quote. Stored credits become liquid only through
 * distinct, currently legal bank payouts; every tag still reserves its click. */
export function quoteRunnerTagClearBankFunding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): RunnerFundingRouteAssessment | undefined {
  const own = input.playerView.own;
  if (
    !Number.isSafeInteger(own.tags) ||
    own.tags <= 0 ||
    own.credits >= 2 * own.tags ||
    own.clicks <= own.tags
  )
    return undefined;
  const remainingClicks = own.clicks - own.tags;
  const current = candidates.filter((candidate) =>
    input.legalActions.some(
      (action) =>
        action.actionId === candidate.actionId &&
        action.side === "runner" &&
        action.expiresAtStateVersion === input.playerView.stateVersion &&
        action.timingPoint === input.playerView.timingPoint,
    ),
  );
  const bank = current.filter((candidate) => {
    const p = candidate.economyProjection;
    return (
      candidate.planOwnerBinding?.owner === "runner.credit_bank" &&
      candidate.planOwnerBinding.route === "cash_out" &&
      input.playerView.own.rig?.some(
        (card) =>
          card.instanceId === candidate.sourceCardInstanceId &&
          card.definitionId === candidate.sourceDefinitionId,
      ) &&
      p?.source === "legal_action_payload" &&
      p.kind === "immediate_liquid" &&
      p.reliability === "guaranteed" &&
      p.confidence === "high" &&
      p.timing === "immediate" &&
      p.creditRestriction === "general" &&
      p.payoutMode === "all_available" &&
      p.sourcePool === "finite" &&
      p.cardsConsumed === 0 &&
      p.cardsDrawn === 0 &&
      p.netHandDelta === 0 &&
      (p.storedCreditsTaken ?? 0) > 0 &&
      (p.netLiquidCreditGain ?? 0) > 0 &&
      (candidate.costProfile.selfDamage?.length ?? 0) === 0
    );
  });
  if (bank.length === 0) return undefined;
  const demand = createRunnerCreditDemand({
    demandId: "runner-defense-tag-clear-funding",
    sourcePlanId: "plan:runner.defense_and_recovery:runner",
    purpose: "foreground_plan",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "end_of_current_turn",
    currentCredits: own.credits,
    targetCredits: 2 * own.tags,
  });
  const search = (offers: readonly ActionSemanticCandidate[]) =>
    searchFundingRoutes({
      demand,
      candidates: offers,
      remainingClicks,
      maxSteps: remainingClicks,
      maxRoutes: 16,
    })
      .routes.filter(
        (route) =>
          route.status === "covered_guaranteed" &&
          route.reliability === "guaranteed" &&
          route.horizon === "same_turn" &&
          route.projectedGap === 0,
      )
      .sort((a, b) => a.totalClickCost - b.totalClickCost);
  const ordinary = search(
    current.filter(
      (candidate) =>
        runnerFundingRouteCandidateIsMaterializable(candidate) &&
        !runnerStrategicExchangeRequiresBoundParent(candidate),
    ),
  )[0];
  for (const route of search(bank)) {
    if (ordinary && ordinary.totalClickCost <= route.totalClickCost) continue;
    const sources = route.steps.map(
      (step) =>
        bank.find((c) => c.actionId === step.actionId)?.sourceCardInstanceId,
    );
    if (
      sources.some((source) => !source) ||
      new Set(sources).size !== sources.length ||
      route.steps.some(
        (step) => step.kind !== "legal_action" || step.ownTurnOffset !== 0,
      ) ||
      !route.steps[0]?.actionId
    )
      continue;
    return {
      stateVersion: input.playerView.stateVersion,
      routeId: route.routeId,
      status: route.status,
      reliability: route.reliability,
      horizon: route.horizon,
      projectedGap: route.projectedGap,
      totalClickCost: route.totalClickCost,
      firstStepActionId: route.steps[0].actionId,
      evidenceCodes: [
        "runner_complete_tag_clear_bank_funding",
        ...route.evidence,
      ],
    };
  }
  return undefined;
}
