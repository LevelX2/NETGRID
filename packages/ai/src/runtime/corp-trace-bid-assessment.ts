import { traceCorpBaseStrength, traceRulesDefinition } from "@netgrid/engine";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";

import { createAiHintsByCard } from "../ai-hints";
import { corpVisibleCardPlayCost } from "./corp-tag-punish-payoff-profiles";
import type { LatestTraceContext } from "./trace-context";
import { corpCurrentRunAgendaExposure } from "../corp/defense/corp-server-protection-reserve";

const AI_HINTS_BY_CARD = createAiHintsByCard();

export type CorpTraceBidAssessment = {
  recommendedBid: number;
  reason:
    | "guaranteed_visible_payoff"
    | "guaranteed_native_trace_payoff"
    | "guaranteed_current_terminal_run_lock"
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
  const terminalRunLockBid = currentTerminalRunLockBid(
    params.input,
    params.maxBid,
  );
  if (terminalRunLockBid !== undefined) {
    return {
      recommendedBid: terminalRunLockBid,
      reason: "guaranteed_current_terminal_run_lock",
      minimumGuaranteedBid: terminalRunLockBid,
    };
  }
  const runnerLink = params.traceContext.runnerLink;
  if (!Number.isInteger(runnerLink) || typeof runnerLink !== "number") {
    return {
      recommendedBid: 0,
      reason: "unknown_trace_context",
    };
  }

  const rules = traceRulesDefinition(params.traceContext.traceRulesProfile);
  const printedTrace = params.traceContext.traceLimit;
  if (
    rules.corpBaseStrengthMode === "printed_trace" &&
    (typeof printedTrace !== "number" ||
      !Number.isInteger(printedTrace) ||
      printedTrace < 0)
  ) {
    return {
      recommendedBid: 0,
      reason: "unknown_trace_context",
    };
  }
  const baseStrength = traceCorpBaseStrength({
    traceLimit:
      rules.corpBaseStrengthMode === "printed_trace" ? printedTrace! : 0,
    traceRulesProfile: rules.profile,
  });
  const tieMargin = rules.tieWinner === "corp" ? 0 : 1;
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
    visibleRunnerMaximumStrength + tieMargin - baseStrength,
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

function currentTerminalRunLockBid(
  input: AiDecisionInput,
  maxBid: number,
): number | undefined {
  const { playerView: view } = input;
  const { run, pendingChoice: choice, trace } = view;
  const quote = trace?.currentRunLockBidQuote;
  if (
    input.side !== "corp" ||
    !trace ||
    !quote ||
    !run?.runId ||
    quote.runId !== run.runId ||
    quote.stateVersion !== view.stateVersion ||
    !Number.isSafeInteger(quote.amount) ||
    quote.amount <= 0 ||
    quote.amount > maxBid ||
    quote.amount > view.own.credits ||
    choice?.choiceId !== quote.choiceId ||
    choice.stateVersion !== quote.stateVersion ||
    choice.source !== `trace:${trace.traceId}` ||
    !choice.options.some(
      (option) => option.id === quote.optionId && option.value === quote.amount,
    ) ||
    !input.legalActions.some(
      (action) =>
        action.actionId === quote.actionId &&
        action.expiresAtStateVersion === quote.stateVersion &&
        action.choiceRequirements?.some(
          (requirement) =>
            requirement.choiceId === quote.choiceId &&
            requirement.optionIds.includes(quote.optionId),
        ),
    )
  )
    return undefined;
  // The one-click lock exhausts the current turn's ordinary run horizon.
  // Keep the existing reserve for other continuations and credible fallbacks.
  if (
    view.own.clicks !== 0 ||
    run.breach !== undefined ||
    !Number.isSafeInteger(view.opponent.clicks) ||
    view.opponent.clicks < 0 ||
    view.opponent.clicks > 1 ||
    (run.pendingSequenceRunCount ?? 0) > 0 ||
    run.followupRunOpportunity !== undefined ||
    run.attackedServerId !== "hq" ||
    (run.accessServerOverride !== undefined &&
      run.accessServerOverride !== "hq") ||
    run.position?.kind !== "ice" ||
    run.position.iceIndex !== 0 ||
    run.encounteredIce?.instanceId !== trace.sourceCardInstanceId ||
    run.encounteredIce?.effectiveRunQuote?.subroutines.length !== 1 ||
    view.servers.find((server) => server.id === "hq")?.root.length !== 0
  )
    return undefined;
  const exposure = corpCurrentRunAgendaExposure(input, run.attackedServerId);
  return exposure &&
    exposure.maximumPoints >=
      view.agendaPointsToWin - view.opponent.agendaPoints
    ? quote.amount
    : undefined;
}

function sourceHasNativeTraceSuccessPayoff(
  sourceDefinitionId: string,
): boolean {
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
