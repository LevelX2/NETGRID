import type { AccessOutcomeMemoryStatus } from "../access/access-outcome-memory";
import type { KnownRemoteAccessCommitment } from "../decision/known-remote-access-commitment";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { StrategicIntentState } from "../strategic-intent-state";

export function redactedRunnerStrategicIntentFacts(
  intent: RunnerStrategicIntentProfile,
): string[] {
  return [
    `runner_strategic_intent:${intent.primaryWinIntent}`,
    ...(intent.executionStyle
      ? [`runner_execution_style:${intent.executionStyle}`]
      : []),
    `runner_setup_engine:${intent.setupEngine.join("|") || "none"}`,
    `runner_pressure_vectors:${intent.pressureVectors.join("|") || "none"}`,
    `runner_risk_profile:${intent.riskProfile.join("|") || "none"}`,
    `runner_rejected_intents:${intent.rejectedIntents.join("|") || "none"}`,
    `runner_intent_confidence:${intent.confidence}`,
  ];
}

export function redactedStrategicIntentStateFacts(
  state: StrategicIntentState,
): string[] {
  return [
    `strategic_intent_state:${state.primaryStrategy.strategyId}`,
    `strategic_intent_phase:${state.phase}`,
    `strategic_intent_family:${state.primaryStrategy.family}`,
    `strategic_intent_completeness:${state.primaryStrategy.completeness}`,
    `strategic_intent_target:${state.targetVector.kind}`,
    `strategic_intent_blocker_count:${state.blockers.length}`,
    `strategic_intent_transition:${state.transition.status}`,
  ];
}

export function redactedCorpStrategicIntentFacts(
  intent: CorpStrategicIntentProfile,
): string[] {
  return [
    `corp_strategic_intent:${intent.primaryWinIntent}`,
    `corp_score_plan:${intent.scorePlan.join("|") || "none"}`,
    `corp_defense_plan:${intent.defensePlan.join("|") || "none"}`,
    `corp_economy_plan:${intent.economyPlan.join("|") || "none"}`,
    `corp_punish_plan:${intent.punishPlan.join("|") || "none"}`,
    `corp_risk_profile:${intent.riskProfile.join("|") || "none"}`,
    `corp_intent_confidence:${intent.confidence}`,
  ];
}

export function redactedAccessCommitmentFacts(
  commitment: KnownRemoteAccessCommitment,
): string[] {
  return [
    `access_commitment_server:${commitment.serverId}`,
    `access_commitment_state:${commitment.knownAccessState}`,
    `access_commitment_intended_action:${commitment.intendedAccessAction}`,
    `access_commitment_reason:${commitment.reason}`,
  ];
}

export function redactedAccessOutcomeMemoryFacts(
  status: AccessOutcomeMemoryStatus,
): string[] {
  return [
    `access_outcome_memory_applies:${status.applies}`,
    `access_outcome_memory_suppresses_plan_bonus:${status.suppressesPlanBonus}`,
    ...(status.invalidationReason
      ? [`access_outcome_memory_invalidation:${status.invalidationReason}`]
      : []),
  ];
}

export function redactedRunnerRunTargetEvaluationFacts(
  evaluations: readonly RunnerRunTargetEvaluation[],
): string[] {
  return evaluations.slice(0, 8).map((evaluation) =>
    [
      `runner_run_target:${evaluation.targetServerId}`,
      `kind:${evaluation.targetKind}`,
      `payoff:${evaluation.accessPayoff}`,
      `known:${evaluation.knownAccessState}`,
      `path:${evaluation.pathPassability}`,
      `credits_after:${evaluation.creditsAfterRun}`,
      `recommendation:${evaluation.recommendation}`,
      `score:${evaluation.score}`,
    ].join("|"),
  );
}

export function redactedRunnerEconomyPostureFacts(
  posture: RunnerEconomyPosture,
): string[] {
  const creditBase = posture.creditBasePlan;
  const reservePolicy = posture.creditReservePolicy;
  const reserveShortfall = Math.max(
    0,
    reservePolicy.desiredCreditReserve - reservePolicy.currentCredits,
  );
  const creditReservePenalty = reservePolicy.belowReserveNow
    ? Math.min(240, reserveShortfall * 30)
    : 0;
  return [
    `runner_economy_min_floor:${posture.minimumCreditFloor}`,
    `runner_economy_desired_reserve:${posture.desiredCreditReserve}`,
    `runner_credit_base_recommendation:${creditBase.recommendation}`,
    `runner_credit_base_priority:${creditBase.economyPriority}`,
    `runner_credit_base_blocked_hand_cards:${creditBase.usefulHandCardsBlockedByCredits}`,
    `runner_credit_base_affordable_hand_cards:${creditBase.usefulHandCardsAffordableNow}`,
    ...(creditBase.topBlockedHandCandidate
      ? [
          `runner_credit_base_top_role:${creditBase.topBlockedHandCandidate.developmentRole}`,
          `runner_credit_base_top_need:${creditBase.topBlockedHandCandidate.currentNeed}`,
          `runner_credit_base_top_missing_credits:${creditBase.topBlockedHandCandidate.missingCredits}`,
        ]
      : []),
    `runner_economy_risk_adjusted:${posture.riskAdjustedRunReserve}`,
    `runner_economy_build_before_pressure:${posture.buildEconomyBeforePressure}`,
    `runner_economy_bank_relevant:${posture.bankToolsRelevant}`,
    `runner_economy_funding_need:${posture.fundingNeed}`,
    `runner_economy_recommendation:${posture.recommendation}`,
    `runner_economy_route:${posture.preferredEconomyRoute ?? "unknown"}`,
    `runner_credit_reserve_current_credits:${reservePolicy.currentCredits}`,
    `runner_credit_reserve_desired:${reservePolicy.desiredCreditReserve}`,
    `runner_credit_reserve_phase:${reservePolicy.phase}`,
    `runner_credit_reserve_remote_score_threat:${reservePolicy.remoteScoreThreat}`,
    `runner_credit_reserve_contest:${reservePolicy.contestReserve}`,
    `runner_credit_reserve_below_now:${reservePolicy.belowReserveNow}`,
    `runner_credit_reserve_spending_would_drop:${reservePolicy.spendingWouldDropBelowReserve}`,
    `runner_credit_reserve_penalty:${creditReservePenalty}`,
    `runner_credit_reserve_reasons:${reservePolicy.reserveDrivers.join("|") || "none"}`,
    `runner_credit_reserve_overrides:${reservePolicy.reserveOverrides.join("|") || "none"}`,
    `why_economy_over_run_or_install:${runnerEconomyOverRunOrInstallReason(posture)}`,
    `why_spend_allowed_despite_reserve:${runnerSpendAllowedDespiteReserveReason(posture)}`,
  ];
}

function runnerEconomyOverRunOrInstallReason(
  posture: RunnerEconomyPosture,
): string {
  const policy = posture.creditReservePolicy;
  if (
    !posture.fundingNeed &&
    !policy.belowReserveNow &&
    posture.recommendation !== "build_economy" &&
    posture.recommendation !== "cash_out_bank"
  ) {
    return "none";
  }
  if (policy.remoteScoreThreat !== "none" && policy.belowReserveNow) {
    return "remote_contest_reserve";
  }
  if (posture.recommendation === "cash_out_bank") return "bank_tool_cashout";
  if (posture.creditBasePlan.usefulHandCardsBlockedByCredits > 0) {
    return "useful_hand_funding";
  }
  if (policy.currentCredits < policy.minimumCreditFloor) return "minimum_floor";
  if (policy.belowReserveNow) return "desired_reserve";
  return "economy_priority";
}

function runnerSpendAllowedDespiteReserveReason(
  posture: RunnerEconomyPosture,
): string {
  switch (posture.creditBasePlan.recommendation) {
    case "allow_setup_spend":
      return "setup_card_payoff";
    case "allow_pressure":
      return "pressure_payoff_or_probe";
    case "build_credit_base":
    case "fund_useful_hand_card":
    case "preserve_reserve":
      return "not_allowed";
  }
}
