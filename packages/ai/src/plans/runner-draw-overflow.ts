import type { LegalAction, PlayerView } from "@netgrid/shared";

import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type {
  RunnerDrawOverflowAssessment,
  RunnerDrawOverflowSeverity,
  RunnerDrawOverflowUrgencyOverride,
  TacticalPlan,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function assessRunnerDrawOverflow(
  context: TacticalPlanBuildContext,
  plan?: TacticalPlan,
): RunnerDrawOverflowAssessment | undefined {
  if (context.input.side !== "runner") return undefined;
  const drawActions = context.input.legalActions.filter(
    (action) => action.side === "runner" && action.type === "draw_card",
  );
  if (drawActions.length === 0) return undefined;
  const cardsToDraw = Math.max(...drawActions.map(cardsToDrawFromAction));
  const currentHandCount = context.input.playerView.own.gripOrHq.length;
  const maxHandSize = Math.max(0, context.input.playerView.own.maxHandSize ?? 5);
  const remainingClicks = Math.max(0, context.input.playerView.own.clicks ?? 0);
  const projectedHandAfterDraw = currentHandCount + cardsToDraw;
  const projectedOverflow = Math.max(0, projectedHandAfterDraw - maxHandSize);
  const currentOverflow = Math.max(0, currentHandCount - maxHandSize);
  const severity = drawOverflowSeverity(projectedOverflow, currentOverflow);
  const discardFodderCount = runnerDiscardFodderCount(context);
  const usefulPlayableCardsInHand = runnerUsefulPlayableHandCount(context);
  const usefulHandCardsBlockedByCredits =
    context.runnerEconomyPosture?.creditBasePlan.usefulHandCardsBlockedByCredits ??
    runnerUsefulHandCardsBlockedByCreditsCount(context);
  const usefulHandCards = runnerUsefulHandCardCount(context);
  const valuableCardsAtRisk = Math.max(
    0,
    Math.min(
      usefulHandCards,
      projectedOverflow - Math.min(projectedOverflow, discardFodderCount),
    ),
  );
  const urgencyOverride = runnerDrawOverflowUrgencyOverride(context, plan);
  const penalty = runnerDrawOverflowPenalty({
    currentOverflow,
    projectedOverflow,
    severity,
    discardFodderCount,
    valuableCardsAtRisk,
    usefulPlayableCardsInHand,
    usefulHandCardsBlockedByCredits,
    urgencyOverride,
  });
  return {
    currentHandCount,
    maxHandSize,
    cardsToDraw,
    remainingClicks,
    projectedHandAfterDraw,
    projectedOverflow,
    severity,
    discardFodderCount,
    valuableCardsAtRisk,
    usefulPlayableCardsInHand,
    usefulHandCardsBlockedByCredits,
    urgencyOverride,
    penalty,
    reasons: runnerDrawOverflowReasons({
      currentOverflow,
      projectedOverflow,
      severity,
      discardFodderCount,
      valuableCardsAtRisk,
      usefulPlayableCardsInHand,
      usefulHandCardsBlockedByCredits,
      urgencyOverride,
      penalty,
    }),
  };
}

export function cardsToDrawFromAction(action: LegalAction): number {
  const payload = action.payload ?? {};
  const values = [
    payload.amount,
    payload.drawAmount,
    payload.cardsToDraw,
    payload.drawCardsAmount,
  ];
  const value = values.find(
    (candidate): candidate is number =>
      typeof candidate === "number" &&
      Number.isFinite(candidate) &&
      candidate > 0,
  );
  return Math.max(1, Math.floor(value ?? 1));
}

export function drawOverflowSeverity(
  projectedOverflow: number,
  currentOverflow: number,
): RunnerDrawOverflowSeverity {
  if (projectedOverflow <= 0) return "none";
  if (currentOverflow > 0 || projectedOverflow >= 3) return "high";
  if (projectedOverflow === 2) return "moderate";
  return "minor";
}

function runnerDiscardFodderCount(context: TacticalPlanBuildContext): number {
  const evaluations = context.runnerHandDevelopmentEvaluations ?? [];
  const evaluatedFodder = evaluations.filter(isRunnerDiscardFodder).length;
  return Math.max(
    evaluatedFodder,
    duplicateOwnHandFodderCount(context.input.playerView),
  );
}

function isRunnerDiscardFodder(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.deferReason === "duplicate" ||
    evaluation.currentNeed === "none" ||
    (evaluation.currentNeed === "later" && evaluation.priority < 500) ||
    (evaluation.strategicFit === "weak" && evaluation.priority < 500)
  );
}

function duplicateOwnHandFodderCount(playerView: PlayerView): number {
  const counts = new Map<string, number>();
  for (const card of playerView.own.gripOrHq) {
    if (card.known === false) continue;
    const key = card.definitionId ?? card.title;
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].reduce(
    (sum, count) => sum + Math.max(0, count - 1),
    0,
  );
}

function runnerUsefulPlayableHandCount(
  context: TacticalPlanBuildContext,
): number {
  return (context.runnerHandDevelopmentEvaluations ?? []).filter(
    (evaluation) =>
      evaluation.availability === "legal_now" &&
      usefulRunnerHandDevelopmentForOverflow(evaluation),
  ).length;
}

function runnerUsefulHandCardsBlockedByCreditsCount(
  context: TacticalPlanBuildContext,
): number {
  return (context.runnerHandDevelopmentEvaluations ?? []).filter(
    (evaluation) =>
      evaluation.availability === "missing_credits" &&
      usefulRunnerHandDevelopmentForOverflow(evaluation),
  ).length;
}

function runnerUsefulHandCardCount(context: TacticalPlanBuildContext): number {
  return (context.runnerHandDevelopmentEvaluations ?? []).filter(
    usefulRunnerHandDevelopmentForOverflow,
  ).length;
}

function usefulRunnerHandDevelopmentForOverflow(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.developmentRole === "unknown"
  ) {
    return false;
  }
  if (evaluation.currentNeed === "none" || evaluation.currentNeed === "later") {
    return false;
  }
  return evaluation.priority >= 500;
}

export function runnerDrawOverflowUrgencyOverride(
  context: TacticalPlanBuildContext,
  plan?: TacticalPlan,
): RunnerDrawOverflowUrgencyOverride {
  const targetServerId =
    plan?.target?.kind === "server" ? plan.target.id : undefined;
  if (
    runnerHasScoreThreatGoal(context, targetServerId) ||
    (targetServerId !== undefined &&
      remoteHasVisibleScoreThreat(context.input.playerView, targetServerId))
  ) {
    return "find_breaker_for_score_threat";
  }
  if (
    context.runnerEconomyPosture?.fundingNeed &&
    !context.input.legalActions.some((action) => action.type === "gain_credit")
  ) {
    return "find_economy";
  }
  return "none";
}

function runnerHasScoreThreatGoal(
  context: TacticalPlanBuildContext,
  targetServerId: string | undefined,
): boolean {
  return (context.runnerTacticalGoals ?? []).some(
    (goal) =>
      goal.goalId === "runner.contest_remote_if_score_threat" &&
      (!targetServerId ||
        !goal.targetServerId ||
        goal.targetServerId === targetServerId),
  );
}

function remoteHasVisibleScoreThreat(
  playerView: PlayerView,
  serverId: string,
): boolean {
  if (!isRemoteServer(serverId)) return false;
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server?.root.some(
      (card) =>
        (card.known && card.type === "agenda") ||
        (card.advancementCounters ?? 0) > 0,
    ) === true
  );
}

export function runnerDrawOverflowPenalty(params: {
  currentOverflow: number;
  projectedOverflow: number;
  severity: RunnerDrawOverflowSeverity;
  discardFodderCount: number;
  valuableCardsAtRisk: number;
  usefulPlayableCardsInHand: number;
  usefulHandCardsBlockedByCredits: number;
  urgencyOverride: RunnerDrawOverflowUrgencyOverride;
}): number {
  if (params.severity === "none") return 0;
  const base =
    params.severity === "minor"
      ? 85
      : params.severity === "moderate"
        ? 230
        : 420 + Math.max(0, params.projectedOverflow - 3) * 90;
  const alreadyOverLimitPenalty = params.currentOverflow > 0 ? 120 : 0;
  const fodderReduction =
    Math.min(params.projectedOverflow, params.discardFodderCount) * 85;
  const usefulPlayablePenalty = Math.min(
    210,
    params.usefulPlayableCardsInHand * 70,
  );
  const blockedByCreditsPenalty = Math.min(
    120,
    params.usefulHandCardsBlockedByCredits * 60,
  );
  const valuableRiskPenalty = params.valuableCardsAtRisk * 55;
  const urgencyReduction =
    params.urgencyOverride === "none"
      ? 0
      : params.severity === "high"
        ? 200
        : params.severity === "moderate"
          ? 150
          : 90;
  return Math.max(
    0,
    Math.min(
      760,
      base +
        alreadyOverLimitPenalty +
        usefulPlayablePenalty +
        blockedByCreditsPenalty +
        valuableRiskPenalty -
        fodderReduction -
        urgencyReduction,
    ),
  );
}

export function runnerDrawOverflowReasons(params: {
  currentOverflow: number;
  projectedOverflow: number;
  severity: RunnerDrawOverflowSeverity;
  discardFodderCount: number;
  valuableCardsAtRisk: number;
  usefulPlayableCardsInHand: number;
  usefulHandCardsBlockedByCredits: number;
  urgencyOverride: RunnerDrawOverflowUrgencyOverride;
  penalty: number;
}): string[] {
  const reasons: string[] = [];
  if (params.projectedOverflow <= 0) reasons.push("no_overflow");
  if (params.currentOverflow > 0) reasons.push("already_over_hand_limit");
  if (params.projectedOverflow > 0) reasons.push("projected_overflow");
  if (params.discardFodderCount > 0) {
    reasons.push("discard_fodder_reduces_penalty");
  }
  if (params.valuableCardsAtRisk > 0) {
    reasons.push("valuable_hand_cards_at_risk");
  }
  if (params.usefulPlayableCardsInHand > 0) {
    reasons.push("useful_hand_play_available_before_draw");
  }
  if (params.usefulHandCardsBlockedByCredits > 0) {
    reasons.push("credit_base_needed_before_more_draw");
  }
  if (params.urgencyOverride !== "none") {
    reasons.push("urgency_override_keeps_draw_plausible");
  }
  if (params.penalty > 0) reasons.push("overdraw_penalty_applied");
  if (
    params.penalty === 0 &&
    params.projectedOverflow > 0 &&
    params.urgencyOverride !== "none"
  ) {
    reasons.push("draw_still_plausible_under_urgency");
  }
  return sortedUnique(reasons);
}

export function runnerDrawOverflowRationale(
  assessment: RunnerDrawOverflowAssessment,
): string[] {
  return [
    `handLimitPressure:${assessment.severity}`,
    `projectedOverflow:${assessment.projectedOverflow}`,
    `drawOverflowPenalty:${assessment.penalty}`,
    `discardFodderCount:${assessment.discardFodderCount}`,
    `usefulPlayableCardsInHand:${assessment.usefulPlayableCardsInHand}`,
    `urgencyOverride:${assessment.urgencyOverride}`,
    `why_draw_over_install_or_credit:${assessment.reasons.join(",")}`,
  ];
}

export function runnerDrawOverflowEvidence(
  assessment: RunnerDrawOverflowAssessment,
): string[] {
  return [
    `hand_limit_pressure:${assessment.severity}`,
    `current_hand_count:${assessment.currentHandCount}`,
    `max_hand_size:${assessment.maxHandSize}`,
    `cards_to_draw:${assessment.cardsToDraw}`,
    `remaining_clicks:${assessment.remainingClicks}`,
    `projected_hand_after_draw:${assessment.projectedHandAfterDraw}`,
    `projected_overflow:${assessment.projectedOverflow}`,
    `draw_overflow_penalty:${assessment.penalty}`,
    `discard_fodder_count:${assessment.discardFodderCount}`,
    `valuable_cards_at_risk:${assessment.valuableCardsAtRisk}`,
    `useful_playable_cards_in_hand:${assessment.usefulPlayableCardsInHand}`,
    `useful_hand_cards_blocked_by_credits:${assessment.usefulHandCardsBlockedByCredits}`,
    `urgency_override:${assessment.urgencyOverride}`,
    `why_draw_over_install_or_credit:${assessment.reasons.join(",")}`,
  ];
}

export function runnerDrawOverflowSupportsCreditPlan(
  assessment: RunnerDrawOverflowAssessment,
): boolean {
  if (assessment.projectedOverflow <= 0) return false;
  if (assessment.urgencyOverride !== "none") return false;
  if (assessment.usefulPlayableCardsInHand > 0) return false;
  return (
    assessment.severity === "moderate" ||
    assessment.severity === "high" ||
    assessment.usefulHandCardsBlockedByCredits > 0
  );
}

export function runnerDrawOverflowCreditPriorityBoost(
  assessment: RunnerDrawOverflowAssessment,
): number {
  const severityBoost =
    assessment.severity === "high"
      ? 250
      : assessment.severity === "moderate"
        ? 150
        : assessment.severity === "minor"
          ? 60
          : 0;
  return Math.min(
    290,
    severityBoost +
      Math.min(90, assessment.usefulHandCardsBlockedByCredits * 45),
  );
}

export function runnerHandDevelopmentOverflowBonus(
  assessment: RunnerDrawOverflowAssessment | undefined,
): number {
  if (!assessment || assessment.projectedOverflow <= 0) return 0;
  if (assessment.urgencyOverride !== "none") return 0;
  if (assessment.usefulPlayableCardsInHand <= 0) return 0;
  switch (assessment.severity) {
    case "minor":
      return 70;
    case "moderate":
      return 150;
    case "high":
      return 210;
    case "none":
      return 0;
  }
}

function isRemoteServer(serverId: string | undefined): boolean {
  return serverId?.startsWith("remote_") === true;
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
