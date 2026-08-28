import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { createAiHintsByCard } from "../ai-hints";
import { corpVisibleCardPlayCost } from "./corp-tag-punish-payoff-profiles";
import type { LatestTraceContext } from "./trace-context";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type CorpTraceBidAssessment = {
  recommendedBid: number;
  reason:
    | "guaranteed_visible_payoff"
    | "guaranteed_native_trace_payoff"
    | "no_visible_payoff"
    | "unconvertible_visible_payoff"
    | "unknown_trace_context";
  minimumGuaranteedBid?: number;
  followupCreditReserve?: number;
  followupCardId?: string;
  sourceDefinitionId?: string;
};

const NATIVE_TRACE_SUCCESS_PAYOFF_KINDS = new Set([
  "etr",
  "run_lock",
  "tag",
  "tag_source",
  "damage",
  "program_trash",
  "hardware_trash",
  "resource_trash",
]);
const NATIVE_TRACE_PAYOFF_MAX_BID = 3;
const NATIVE_TRACE_PAYOFF_CREDIT_RESERVE = 2;

export function assessCorpTraceBid(params: {
  input: AiDecisionInput;
  traceContext: LatestTraceContext;
  maxBid: number;
  sourceDefinitionId?: string;
}): CorpTraceBidAssessment {
  const runnerLink = params.traceContext.runnerLink;
  if (!Number.isInteger(runnerLink) || typeof runnerLink !== "number") {
    return {
      recommendedBid: 0,
      reason: "unknown_trace_context",
    };
  }

  const tieMargin =
    params.traceContext.traceRulesProfile === "classic_blind_corp_ties"
      ? 0
      : 1;
  const visibleRunnerMaximumStrength =
    typeof params.traceContext.runnerMaximumPreRevealStrength === "number" &&
    Number.isInteger(params.traceContext.runnerMaximumPreRevealStrength)
      ? Math.max(0, params.traceContext.runnerMaximumPreRevealStrength)
      : Math.max(0, runnerLink) +
        (params.traceContext.traceRulesProfile === "classic_blind" ||
        params.traceContext.traceRulesProfile === "classic_blind_corp_ties"
          ? 0
          : Math.max(0, params.input.playerView.opponent.credits));
  const minimumGuaranteedBid = Math.max(
    0,
    visibleRunnerMaximumStrength + tieMargin,
  );
  if (
    params.sourceDefinitionId !== undefined &&
    sourceHasNativeTraceSuccessPayoff(params.sourceDefinitionId) &&
    minimumGuaranteedBid <= params.maxBid &&
    minimumGuaranteedBid <=
      Math.min(
        NATIVE_TRACE_PAYOFF_MAX_BID,
        Math.max(
          0,
          params.input.playerView.own.credits -
            NATIVE_TRACE_PAYOFF_CREDIT_RESERVE,
        ),
      )
  ) {
    return {
      recommendedBid: minimumGuaranteedBid,
      reason: "guaranteed_native_trace_payoff",
      minimumGuaranteedBid,
      sourceDefinitionId: params.sourceDefinitionId,
    };
  }

  const payoff = cheapestVisibleTagPunishPayoff(params.input);
  if (!payoff) {
    return {
      recommendedBid: 0,
      reason: "no_visible_payoff",
    };
  }
  const followupClicks = params.input.playerView.own.clicks;
  if (followupClicks >= 1) {
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
    recommendedBid: 0,
    reason: "unconvertible_visible_payoff",
    minimumGuaranteedBid,
    followupCreditReserve: payoff.cost,
    followupCardId: payoff.card.instanceId,
  };
}

function sourceHasNativeTraceSuccessPayoff(sourceDefinitionId: string): boolean {
  const hint = AI_HINTS_BY_CARD.get(sourceDefinitionId);
  if (!hint || hint.cardType !== "ice") return false;
  const hasTrace = (hint.effects ?? []).some(
    (effect) => effect.kind === "trace",
  );
  const requiresTraceSuccess = (hint.conditions ?? []).some(
    (condition) => condition.kind === "requires_trace_success",
  );
  const directlyTimedPayoff = (hint.effects ?? []).some(
    (effect) =>
      effect.timing === "trace_success" &&
      NATIVE_TRACE_SUCCESS_PAYOFF_KINDS.has(effect.kind),
  );
  const conditionalEndRun =
    requiresTraceSuccess &&
    (hint.effects ?? []).some((effect) => effect.kind === "etr");
  return hasTrace && (directlyTimedPayoff || conditionalEndRun);
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
      const cost = corpVisibleCardPlayCost(card);
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
