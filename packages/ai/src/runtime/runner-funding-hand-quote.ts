import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { FundingRoute } from "../plans/funding-route";
import { runnerStrategicExchangeKinds } from "./runner-strategic-exchange";

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
  let hand = input.playerView.own.gripOrHq.length;
  let stack = input.playerView.own.stackOrRdCount;
  if (!Number.isSafeInteger(maximumHand) || maximumHand < 0)
    return { status: "not_comparable", reason: "hand_limit_unknown" };
  const retainedBefore = Math.min(hand, maximumHand),
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
      !action ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
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
      projection.cardsDrawn > stack ||
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
    const before = Math.min(hand, maximumHand);
    hand += projection.netHandDelta;
    stack -= projection.cardsDrawn;
    stepGains.push(Math.min(hand, maximumHand) - before);
  }
  return {
    status: "known",
    retainedGain: Math.min(hand, maximumHand) - retainedBefore,
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
