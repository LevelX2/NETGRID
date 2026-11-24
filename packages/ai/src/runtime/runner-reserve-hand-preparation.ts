import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { exactBasicLiquidCreditCandidate } from "../actions/action-candidate-facts";
import { runnerDrawProjectionFor } from "../actions/action-economy-projection";
import { runnerFundingRouteCandidateIsMaterializable } from "../plans/runner-funding-candidates";
import type { RunnerFundingRouteAssessment } from "../plans/runner-funding-contracts";
import type { RunnerExactFundingRouteRequest } from "../plans/runner-funding-service-contract";
import { turnPlanningFingerprint } from "../plans/turn-planning-contracts";
import { runnerStrategicExchangeRequiresBoundParent } from "./runner-strategic-exchange";

/** An additional exact route of this funding service. Only a known income
 * card retained through basic draws is quoted; drawn identities have no value.
 * Every prefix head is an actual current LegalAction and is revalidated after
 * its private observation boundary. No run or strategic exchange is admitted. */
export function runnerReserveHandPreparation(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
  targetCredits: number,
):
  | { routeActionIds: string[]; routeAssessment: RunnerFundingRouteAssessment }
  | undefined {
  const own = input.playerView.own;
  const requiredHandBuffer = Math.max(
    request.requiredEndTurnHandBuffer ?? -1,
    request.reserveDevelopment?.minimumHandBuffer ?? -1,
  );
  const currentActions = new Map(
    input.legalActions
      .filter((action) => actionMatchesCurrentDecision(input, action))
      .map((action) => [action.actionId, action]),
  );
  const currentCandidates = candidates.filter(
    (candidate) =>
      candidate.actorSide === "runner" &&
      candidate.stateVersion === input.playerView.stateVersion &&
      currentActions.has(candidate.actionId),
  );
  const basic = currentCandidates.find(exactBasicLiquidCreditCandidate);
  const draw = [...currentActions.values()].find(
    (action) =>
      action.type === "draw_card" &&
      action.side === "runner" &&
      action.source === "basic_action",
  );
  const projection = draw && runnerDrawProjectionFor(draw);
  if (
    !basic ||
    !draw ||
    !projection ||
    !Number.isSafeInteger(requiredHandBuffer) ||
    requiredHandBuffer < own.gripOrHq.length ||
    requiredHandBuffer > own.maxHandSize ||
    projection.projectedNetHandDelta <= 0 ||
    projection.projectedPostDrawDispositionCount !== 0
  )
    return undefined;
  const drawClickCost = draw.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const drawCreditCost =
    draw.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) +
    projection.projectedGrossDrawCount * projection.visibleDrawTaxSourceCount;
  if (
    ![drawClickCost, drawCreditCost].every(Number.isSafeInteger) ||
    drawClickCost <= 0 ||
    drawCreditCost < 0
  )
    return undefined;
  const ordinary = currentCandidates.filter(
    (candidate) =>
      runnerFundingRouteCandidateIsMaterializable(candidate) &&
      !runnerStrategicExchangeRequiresBoundParent(candidate),
  );
  // A conservative upper bound for current non-consuming income prevents this
  // preparation from displacing a stronger installed source or draw-income.
  let alternativeRate = 1;
  for (const candidate of ordinary) {
    const income = candidate.economyProjection!;
    if (income.netHandDelta < 0) continue;
    if (
      candidate.costProfile.costKnownStatus !== "known" ||
      !Number.isSafeInteger(income.clickCost) ||
      income.clickCost <= 0 ||
      !Number.isFinite(income.netLiquidCreditGain)
    )
      return undefined;
    alternativeRate = Math.max(
      alternativeRate,
      income.netLiquidCreditGain! / income.clickCost,
    );
  }
  const basicCreditBaseline = Math.ceil(
    own.credits + request.remainingClicks * alternativeRate,
  );
  // A small reserve gap may finish early and release clicks to other plans.
  // Only a still-open whole-turn reserve justifies this whole-turn comparison.
  if (request.targetCredits < basicCreditBaseline) return undefined;
  const quotes: NonNullable<RunnerFundingRouteAssessment["handPreparation"]>[] =
    [];
  for (const candidate of ordinary) {
    const income = candidate.economyProjection!;
    const action = currentActions.get(candidate.actionId);
    if (
      candidate.actionType !== "play_event" ||
      !action ||
      action.type !== "play_event" ||
      (action.choiceRequirements?.length ?? 0) !== 0 ||
      !candidate.sourceCardInstanceId ||
      !own.gripOrHq.some(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      ) ||
      candidate.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.additionalCosts.length !== 0 ||
      candidate.risks.length !== 0 ||
      !candidate.functionalEffects?.length ||
      candidate.functionalEffects.some(
        (effect) => effect.scope !== "runner" || effect.kind !== "economy",
      ) ||
      income.reliability !== "guaranteed" ||
      income.source !== "legal_action_payload" ||
      income.cardsConsumed !== 1 ||
      income.netHandDelta !== -1 ||
      income.cardsDrawn !== 0 ||
      income.payoutMode !== "fixed" ||
      ![income.clickCost, income.creditCost, income.netLiquidCreditGain].every(
        Number.isSafeInteger,
      ) ||
      income.clickCost <= 0 ||
      income.creditCost < 0 ||
      own.gripOrHq.length + income.netHandDelta >= requiredHandBuffer
    )
      continue;
    const drawCount = Math.ceil(
      (requiredHandBuffer - own.gripOrHq.length - income.netHandDelta) /
        projection.projectedNetHandDelta,
    );
    const clicks = drawCount * drawClickCost + income.clickCost;
    const upfront = drawCount * drawCreditCost + income.creditCost;
    const projectedEndCredits =
      own.credits -
      drawCount * drawCreditCost +
      income.netLiquidCreditGain! +
      request.remainingClicks -
      clicks;
    const projectedEndHand =
      own.gripOrHq.length +
      drawCount * projection.projectedNetHandDelta +
      income.netHandDelta;
    if (
      clicks > request.remainingClicks ||
      upfront > own.credits ||
      drawCount * projection.projectedGrossDrawCount > own.stackOrRdCount ||
      projectedEndCredits < targetCredits ||
      projectedEndCredits <= basicCreditBaseline ||
      projectedEndHand < requiredHandBuffer ||
      projectedEndHand > own.maxHandSize
    )
      continue;
    quotes.push({
      stateVersion: input.playerView.stateVersion,
      drawActionId: draw.actionId,
      incomeActionId: candidate.actionId,
      sourceCardInstanceId: candidate.sourceCardInstanceId,
      drawCount,
      drawClickCost,
      drawCreditCost,
      requiredHandBuffer,
      projectedEndCredits,
      projectedEndHand,
      basicCreditBaseline,
    });
  }
  const quote = quotes.sort(
    (left, right) =>
      right.projectedEndCredits - left.projectedEndCredits ||
      right.projectedEndHand - left.projectedEndHand ||
      left.drawCount - right.drawCount ||
      left.incomeActionId.localeCompare(right.incomeActionId),
  )[0];
  if (!quote) return undefined;
  return {
    routeActionIds: [quote.drawActionId],
    routeAssessment: {
      stateVersion: input.playerView.stateVersion,
      routeId: turnPlanningFingerprint(
        "runner-reserve-hand-preparation",
        quote,
      ),
      status: "covered_guaranteed",
      reliability: "guaranteed",
      horizon: "same_turn",
      projectedGap: 0,
      totalClickCost: request.remainingClicks,
      firstStepActionId: quote.drawActionId,
      handPreparation: quote,
      evidenceCodes: [
        "runner_reserve_income_current_hand_preparation",
        `runner_reserve_preparation_end_credits:${quote.projectedEndCredits}|alternative_upper_bound:${quote.basicCreditBaseline}`,
        `runner_reserve_preparation_hand:${quote.projectedEndHand}|required:${quote.requiredHandBuffer}`,
      ],
    },
  };
}
