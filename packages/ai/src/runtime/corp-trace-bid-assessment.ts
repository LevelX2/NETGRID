import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { createAiHintsByCard } from "../ai-hints";
import type { LatestTraceContext } from "./trace-context";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type CorpTraceBidAssessment = {
  recommendedBid: number;
  reason:
    | "guaranteed_visible_payoff"
    | "conservative_tax"
    | "unknown_trace_context";
  minimumGuaranteedBid?: number;
  followupCreditReserve?: number;
  followupCardId?: string;
};

export function assessCorpTraceBid(params: {
  input: AiDecisionInput;
  traceContext: LatestTraceContext;
  maxBid: number;
  conservativeBid: number;
}): CorpTraceBidAssessment {
  const traceStrength = params.traceContext.traceStrength;
  const runnerLink = params.traceContext.runnerLink;
  if (
    !Number.isInteger(traceStrength) ||
    typeof traceStrength !== "number" ||
    !Number.isInteger(runnerLink) ||
    typeof runnerLink !== "number"
  ) {
    return {
      recommendedBid: Math.min(params.maxBid, params.conservativeBid),
      reason: "unknown_trace_context",
    };
  }

  const payoff = cheapestVisibleTagPunishPayoff(params.input);
  const followupClicks = params.input.playerView.own.clicks;
  const minimumGuaranteedBid = Math.max(
    0,
    Math.max(0, runnerLink) +
      Math.max(0, params.input.playerView.opponent.credits) -
      Math.max(0, traceStrength) +
      1,
  );
  if (payoff && followupClicks >= 1) {
    const maximumBidWithFollowup = Math.max(
      0,
      params.input.playerView.own.credits - payoff.cost,
    );
    if (
      minimumGuaranteedBid <= params.maxBid &&
      minimumGuaranteedBid <= maximumBidWithFollowup
    ) {
      return {
        recommendedBid: minimumGuaranteedBid,
        reason: "guaranteed_visible_payoff",
        minimumGuaranteedBid,
        followupCreditReserve: payoff.cost,
        followupCardId: payoff.card.instanceId,
      };
    }
  }

  return {
    recommendedBid: Math.min(params.maxBid, params.conservativeBid),
    reason: "conservative_tax",
    minimumGuaranteedBid,
    ...(payoff
      ? {
          followupCreditReserve: payoff.cost,
          followupCardId: payoff.card.instanceId,
        }
      : {}),
  };
}

function cheapestVisibleTagPunishPayoff(
  input: AiDecisionInput,
): { card: VisibleCard; cost: number } | undefined {
  return input.playerView.own.gripOrHq
    .flatMap((card) => {
      if (card.known === false || !card.definitionId) return [];
      const hint = AI_HINTS_BY_CARD.get(card.definitionId);
      const taggedPayoff = (hint?.effects ?? []).some(
        (effect) => effect.kind === "tag_punish_payoff",
      );
      const requiresTag = (hint?.conditions ?? []).some(
        (condition) => condition.kind === "requires_runner_tagged",
      );
      const cost = card.cost ?? hint?.costProfile?.credits;
      if (
        !taggedPayoff ||
        !requiresTag ||
        typeof cost !== "number" ||
        !Number.isFinite(cost) ||
        cost < 0
      ) {
        return [];
      }
      return [{ card, cost }];
    })
    .sort(
      (left, right) =>
        left.cost - right.cost ||
        left.card.instanceId.localeCompare(right.card.instanceId),
    )[0];
}
