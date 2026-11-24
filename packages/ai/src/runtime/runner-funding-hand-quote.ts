import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../actions/current-legal-action";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { FundingRoute } from "../plans/funding-route";
import { runnerStrategicExchangeKinds } from "./runner-strategic-exchange";

export type RunnerFundingCardBudget = Readonly<{
  hand: number;
  stack: number;
}>;

export function advanceRunnerFundingCardBudget(
  budget: RunnerFundingCardBudget,
  projection: NonNullable<ActionSemanticCandidate["economyProjection"]>,
  damage = 0,
): RunnerFundingCardBudget | undefined {
  const consumed = projection.drawPileCardsConsumed ?? projection.cardsDrawn;
  const replenished = projection.drawPileCardsReplenished ?? 0;
  const stackBeforeDraw = budget.stack + replenished;
  const stack = stackBeforeDraw - consumed;
  const hand = budget.hand + projection.netHandDelta - damage;
  if (
    ![
      budget.hand,
      budget.stack,
      consumed,
      replenished,
      damage,
      hand,
      stack,
      stackBeforeDraw,
    ].every((value) => Number.isSafeInteger(value) && value >= 0) ||
    !Number.isSafeInteger(projection.netHandDelta) ||
    (replenished > 0 &&
      (projection.source !== "legal_action_payload" ||
        projection.reliability !== "guaranteed"))
  ) {
    return undefined;
  }
  return { hand, stack };
}

type RunnerFundingHandQuote =
  | { status: "known"; retainedGain: number; stepGains: number[] }
  | { status: "not_comparable"; reason: string };

/** Collateral resource quote for the existing funding chooser. It neither
 * admits a route nor assigns value to unknown drawn card identities. */
export function runnerFundingHandQuote(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  route: FundingRoute,
): RunnerFundingHandQuote {
  const maximumHand = input.playerView.own.maxHandSize;
  let budget: RunnerFundingCardBudget = {
    hand: input.playerView.own.gripOrHq.length,
    stack: input.playerView.own.stackOrRdCount,
  };
  if (!Number.isSafeInteger(maximumHand) || maximumHand < 0)
    return { status: "not_comparable", reason: "hand_limit_unknown" };
  const retainedBefore = Math.min(budget.hand, maximumHand),
    stepGains: number[] = [];
  for (const step of route.steps) {
    const candidate = candidates.find(
      (entry) => entry.actionId === step.actionId,
    );
    const action = input.legalActions.find(
      (entry) => entry.actionId === step.actionId,
    );
    const projection = candidate?.economyProjection;
    if (
      step.kind !== "legal_action" ||
      step.ownTurnOffset !== 0 ||
      !candidate ||
      candidate.actorSide !== "runner" ||
      candidate.stateVersion !== input.playerView.stateVersion ||
      !actionMatchesCurrentDecision(input, action) ||
      action.type !== candidate.actionType ||
      !projection ||
      projection.reliability !== "guaranteed" ||
      projection.kind !== "immediate_liquid" ||
      projection.timing !== "immediate" ||
      projection.creditRestriction !== "general" ||
      projection.source === "unknown" ||
      !Number.isSafeInteger(projection.netHandDelta) ||
      projection.netHandDelta < 0 ||
      !Number.isSafeInteger(projection.cardsDrawn) ||
      projection.cardsDrawn < 0 ||
      candidate.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.additionalCosts.length !== 0 ||
      candidate.risks.length !== 0 ||
      runnerStrategicExchangeKinds(candidate).length !== 0 ||
      (candidate.actionType !== "gain_credit" &&
        (!candidate.functionalEffects?.length ||
          candidate.functionalEffects.some(
            (effect) =>
              effect.scope !== "runner" ||
              (effect.kind !== "economy" && effect.kind !== "draw"),
          )))
    )
      return {
        status: "not_comparable",
        reason: "unquoted_or_adverse_collateral",
      };
    const next = advanceRunnerFundingCardBudget(budget, projection);
    if (!next)
      return { status: "not_comparable", reason: "unfunded_card_budget" };
    stepGains.push(
      Math.min(next.hand, maximumHand) - Math.min(budget.hand, maximumHand),
    );
    budget = next;
  }
  return {
    status: "known",
    retainedGain: Math.min(budget.hand, maximumHand) - retainedBefore,
    stepGains,
  };
}

export function compareRunnerFundingHandQuotes(
  left: RunnerFundingHandQuote,
  right: RunnerFundingHandQuote,
): number {
  if (left.status !== "known" || right.status !== "known") return 0;
  if (left.retainedGain !== right.retainedGain)
    return right.retainedGain - left.retainedGain;
  for (
    let index = 0;
    index < Math.min(left.stepGains.length, right.stepGains.length);
    index += 1
  ) {
    const difference = right.stepGains[index]! - left.stepGains[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}
