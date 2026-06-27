import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type PlayerView,
  type VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import { accessOutcomeMemoryPlanEvidence } from "./access/access-outcome-memory";
import type {
  BreakerCoverageKind,
  DeckCapabilityProfile,
} from "./deck-capabilities";
import { redactedDeckCapabilityFacts } from "./deck-capabilities";
import { evaluateKnownCentralAccessPayoff } from "./known-central-access-payoff";
import { evaluateKnownRemoteAccessPayoff } from "./known-remote-access-payoff";
import type { KnownRemoteAccessCommitment } from "./decision/known-remote-access-commitment";
import { redactedMergedTacticalGoalFacts } from "./decision/tactical-goal-merge";
import type { TacticalGoalLike } from "./decision/semantic-decision-frame";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "./runner-run-target-evaluation";
import {
  runnerPressurePreferredProbeTarget,
  runnerPressureProbeBasePriority,
  runnerPressureProbeTargetAllowed,
  runnerRunTargetHighPayoff,
  runnerRunTargetTacticalPriorityDelta,
} from "./runner-run-target-guidance";
import {
  redactedRunnerHandDevelopmentFacts,
  type RunnerHandDevelopmentEvaluation,
} from "./runner-hand-development";
import {
  redactedRunnerTacticalGoalFacts,
  type RunnerTacticalGoal,
} from "./runner-tactical-goals";
import { assessKnownRezzedIcePath } from "./visible-run-analysis";
import { createAiHintsByCard } from "./ai-hints";
import { getTacticalPlanMemorySnapshot } from "./plans/plan-memory";
import {
  assessRunnerDrawOverflow,
  runnerDrawOverflowCreditPriorityBoost,
  runnerDrawOverflowEvidence,
  runnerDrawOverflowRationale,
  runnerDrawOverflowSupportsCreditPlan,
  runnerHandDevelopmentOverflowBonus,
} from "./plans/runner-draw-overflow";
import {
  redactedAccessCommitmentFacts,
  redactedAccessOutcomeMemoryFacts,
  redactedCorpStrategicIntentFacts,
  redactedRunnerEconomyPostureFacts,
  redactedRunnerRunTargetEvaluationFacts,
  redactedRunnerStrategicIntentFacts,
  redactedStrategicIntentStateFacts,
} from "./plans/tactical-plan-redaction";
import {
  createPlanStep,
  createTacticalPlan,
} from "./plans/tactical-plan-builders";
import {
  bankToolEvidence,
  isBankBuildAction,
  isBankPayoutAction,
  largestBankPayout,
} from "./plans/tactical-plan-bank-tools";
import {
  actionServerId,
  isCentralServer,
  isRemoteServer,
  isServerTargetPayloadKey,
} from "./plans/tactical-plan-server-targets";
import {
  actionCreditCost,
  legalActionCreditGainForPlan,
  legalActionCreditNetGain,
  type TacticalPlanCreditValueDependencies,
} from "./plans/tactical-plan-action-values";
import {
  planCanMapToCurrentAction,
  progressTacticalPlans,
  rankTacticalPlans,
} from "./plans/tactical-plan-progression";
import type {
  PlanLifecycle,
  TacticalPlanType,
  PlanStepKind,
  PlanMappingStatus,
  RequiredCapabilityKind,
  RequiredCapability,
  PlanBlockerKind,
  PlanBlocker,
  PlanTarget,
  PlanScoreBreakdown,
  RunnerPressureBudget,
  RunnerDrawOverflowAssessment,
  PlanStep,
  TacticalPlan,
  TacticalPlanBuildContext,
  PlanProgressionStatus,
  TacticalPlanMemorySnapshot,
  TacticalPlanSnapshot,
  PlanStepMappingResult,
  TacticalPlanRuntimeResult
} from "./plans/tactical-plan-types";

const AI_HINTS_BY_CARD = createAiHintsByCard();
const TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES: TacticalPlanCreditValueDependencies = {
  aiHintsByCard: AI_HINTS_BY_CARD,
  visibleCardForAction,
};

export {
  createPlanStep,
  createTacticalPlan,
} from "./plans/tactical-plan-builders";
export { TACTICAL_PLAN_SCHEMA_VERSION } from "./plans/tactical-plan-types";
export {
  createTacticalPlanMemorySnapshot,
  getTacticalPlanMemorySnapshot,
  rememberTacticalPlanRuntime,
  resetTacticalPlanMemory,
} from "./plans/plan-memory";
export { rankTacticalPlans } from "./plans/tactical-plan-progression";
export type {
  PlanLifecycle,
  TacticalPlanType,
  PlanStepKind,
  PlanMappingStatus,
  RequiredCapabilityKind,
  RequiredCapability,
  PlanBlockerKind,
  PlanBlocker,
  PlanTarget,
  PlanScoreBreakdown,
  RunnerDrawOverflowSeverity,
  RunnerDrawOverflowUrgencyOverride,
  RunnerPressureBudget,
  RunnerDrawOverflowAssessment,
  PlanStep,
  TacticalPlan,
  TacticalPlanBuildContext,
  PlanProgressionStatus,
  TacticalPlanMemorySnapshot,
  TacticalPlanSnapshot,
  PlanStepMappingResult,
  TacticalPlanRuntimeResult
} from "./plans/tactical-plan-types";

// TacticalPlans are a mapping layer: they organize TacticalGoals, capabilities,
// memory and ActionSemanticCandidates onto existing LegalActions. New card
// semantics belong in action/card semantic modules, not in plan matching.
export function buildTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  return context.input.side === "runner"
    ? buildRunnerTacticalPlans(context)
    : buildCorpTacticalPlans(context);
}

export function evaluateTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlanRuntimeResult {
  const previousPlan = context.previousPlan ?? getTacticalPlanMemorySnapshot(context.input);
  const deckCapabilitiesUsed = context.deckCapabilities
    ? redactedDeckCapabilityFacts(context.deckCapabilities)
    : [];
  const strategicIntentStateUsed = context.strategicIntentState
    ? redactedStrategicIntentStateFacts(context.strategicIntentState)
    : [];
  const corpStrategicIntentUsed = context.corpStrategicIntent
    ? redactedCorpStrategicIntentFacts(context.corpStrategicIntent)
    : [];
  const tacticalGoalsUsed = context.tacticalGoals
    ? redactedMergedTacticalGoalFacts(context.tacticalGoals)
    : [];
  const runnerStrategicIntentUsed = context.runnerStrategicIntent
    ? redactedRunnerStrategicIntentFacts(context.runnerStrategicIntent)
    : [];
  const runnerRunTargetEvaluationsUsed = context.runnerRunTargetEvaluations
    ? redactedRunnerRunTargetEvaluationFacts(context.runnerRunTargetEvaluations)
    : [];
  const runnerEconomyPostureUsed = context.runnerEconomyPosture
    ? redactedRunnerEconomyPostureFacts(context.runnerEconomyPosture)
    : [];
  const runnerHandDevelopmentEvaluationsUsed = context.runnerHandDevelopmentEvaluations
    ? redactedRunnerHandDevelopmentFacts(context.runnerHandDevelopmentEvaluations)
    : [];
  const runnerTacticalGoalsUsed = context.runnerTacticalGoals
    ? redactedRunnerTacticalGoalFacts(context.runnerTacticalGoals)
    : [];
  const accessCommitmentUsed = context.accessCommitment
    ? redactedAccessCommitmentFacts(context.accessCommitment)
    : [];
  const accessOutcomeMemoryUsed = context.accessOutcomeMemory
    ? redactedAccessOutcomeMemoryFacts(context.accessOutcomeMemory)
    : [];
  const rawPlans = buildTacticalPlans({
    ...context,
    ...(previousPlan ? { previousPlan } : {}),
  });
  const progression = progressTacticalPlans(rawPlans, previousPlan);
  const planAlternatives = rankTacticalPlans(progression.plans);
  const blockedPlans = planAlternatives.filter((plan) => plan.status === "blocked");
  const candidates = context.candidates ?? [];
  for (const plan of planAlternatives) {
    if (!planCanMapToCurrentAction(plan)) continue;
    const mapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      candidates,
      context.input,
    );
    if (mapping.status === "matched" && mapping.legalActions.length > 0) {
      return {
        ...(previousPlan ? { previousPlan } : {}),
        ...(deckCapabilitiesUsed.length > 0 ? { deckCapabilitiesUsed } : {}),
        ...(strategicIntentStateUsed.length > 0
          ? { strategicIntentStateUsed }
          : {}),
        ...(corpStrategicIntentUsed.length > 0 ? { corpStrategicIntentUsed } : {}),
        ...(tacticalGoalsUsed.length > 0 ? { tacticalGoalsUsed } : {}),
        ...(runnerStrategicIntentUsed.length > 0 ? { runnerStrategicIntentUsed } : {}),
        ...(runnerRunTargetEvaluationsUsed.length > 0 ? { runnerRunTargetEvaluationsUsed } : {}),
        ...(runnerEconomyPostureUsed.length > 0 ? { runnerEconomyPostureUsed } : {}),
        ...(runnerHandDevelopmentEvaluationsUsed.length > 0
          ? { runnerHandDevelopmentEvaluationsUsed }
          : {}),
        ...(runnerTacticalGoalsUsed.length > 0 ? { runnerTacticalGoalsUsed } : {}),
        ...(accessCommitmentUsed.length > 0 ? { accessCommitmentUsed } : {}),
        ...(accessOutcomeMemoryUsed.length > 0 ? { accessOutcomeMemoryUsed } : {}),
        planAlternatives,
        blockedPlans,
        selectedPlan: plan,
        selectedStep: mapping.step,
        selectedMapping: mapping,
        ...(progression.planProgressionReason
          ? { planProgressionReason: progression.planProgressionReason }
          : {}),
        ...(progression.whyPlanAbandoned
          ? { whyPlanAbandoned: progression.whyPlanAbandoned }
          : {}),
      };
    }
  }
  return {
    ...(previousPlan ? { previousPlan } : {}),
    ...(deckCapabilitiesUsed.length > 0 ? { deckCapabilitiesUsed } : {}),
    ...(strategicIntentStateUsed.length > 0
      ? { strategicIntentStateUsed }
      : {}),
    ...(corpStrategicIntentUsed.length > 0 ? { corpStrategicIntentUsed } : {}),
    ...(tacticalGoalsUsed.length > 0 ? { tacticalGoalsUsed } : {}),
    ...(runnerStrategicIntentUsed.length > 0 ? { runnerStrategicIntentUsed } : {}),
    ...(runnerRunTargetEvaluationsUsed.length > 0 ? { runnerRunTargetEvaluationsUsed } : {}),
    ...(runnerEconomyPostureUsed.length > 0 ? { runnerEconomyPostureUsed } : {}),
    ...(runnerHandDevelopmentEvaluationsUsed.length > 0
      ? { runnerHandDevelopmentEvaluationsUsed }
      : {}),
    ...(runnerTacticalGoalsUsed.length > 0 ? { runnerTacticalGoalsUsed } : {}),
    ...(accessCommitmentUsed.length > 0 ? { accessCommitmentUsed } : {}),
    ...(accessOutcomeMemoryUsed.length > 0 ? { accessOutcomeMemoryUsed } : {}),
    planAlternatives,
    blockedPlans,
    ...(progression.planProgressionReason
      ? { planProgressionReason: progression.planProgressionReason }
      : {}),
    ...(progression.whyPlanAbandoned
      ? { whyPlanAbandoned: progression.whyPlanAbandoned }
      : {}),
  };
}

export function mapPlanStepToLegalActions(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  input: AiDecisionInput,
): PlanStepMappingResult {
  const legalActionsById = new Map(
    input.legalActions.map((action) => [action.actionId, action]),
  );
  const matchedCandidates = candidates
    .filter((candidate) =>
      candidateMatchesStep(
        plan,
        step,
        candidate,
        legalActionsById.get(candidate.actionId),
        input,
      ),
    )
    .sort((left, right) =>
      planStepCandidatePriority(
        plan,
        step,
        right,
        legalActionsById.get(right.actionId),
        input,
      ) -
        planStepCandidatePriority(
          plan,
          step,
          left,
          legalActionsById.get(left.actionId),
          input,
        ) ||
      left.actionId.localeCompare(right.actionId),
    );
  const matchedCandidateIds = matchedCandidates.map((candidate) => candidate.actionId);
  const legalActions = matchedCandidateIds
    .map((actionId) => legalActionsById.get(actionId))
    .filter((action): action is LegalAction => Boolean(action));
  const status = mappingStatusForStep(step, legalActions);
  const rejectedFalseMatches = rejectedCoverageSearchFalseMatches(
    plan,
    step,
    candidates,
    legalActionsById,
    input,
  );
  const matchedCoverageSearchFits = matchedCoverageSearchRationales(
    plan,
    step,
    matchedCandidates,
    legalActionsById,
    input,
  );
  return {
    plan,
    step: {
      ...step,
      mappingStatus: status,
      actionCandidateIds: matchedCandidateIds,
    },
    status,
    actionCandidateIds: matchedCandidateIds,
    legalActions,
    rationale: [
      ...step.rationale,
      `mapped_candidate_count:${matchedCandidateIds.length}`,
      `mapped_legal_action_count:${legalActions.length}`,
      ...(status !== "matched" &&
      coverageSearchRequiredCapability(plan, step) !== undefined
        ? ["blocked_no_valid_search_action"]
        : []),
      ...rejectedFalseMatches.slice(0, 6),
      ...matchedCoverageSearchFits.slice(0, 4),
      ...matchedCandidates.slice(0, 4).map(candidateMappingRationale),
    ],
  };
}

function mappingStatusForStep(
  step: PlanStep,
  legalActions: readonly LegalAction[],
): PlanMappingStatus {
  if (legalActions.length > 0) return "matched";
  if (
    step.requiredCapabilities.some(
      (capability) =>
        capability.kind.startsWith("breaker_") ||
        capability.kind === "remote_protection" ||
        capability.kind === "bank_payout",
    )
  ) {
    return "blocked_missing_capability";
  }
  return "blocked_no_legal_action";
}

function planStepCandidatePriority(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
  input: AiDecisionInput,
): number {
  if (!action) return 0;
  if (isCoverageAnswerStep(step)) {
    const fit = coverageSearchActionFit(plan, step, candidate, action, input);
    if (!fit?.supportsActiveCapabilityNeed) return 0;
    return coverageAnswerRolePriority(fit.answerRole);
  }
  if (step.kind === "gain_credits") {
    return (
      legalActionCreditNetGain(
        input,
        action,
        TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
      ) * 100
    );
  }
  return 0;
}

function coverageAnswerRolePriority(role: CoverageAnswerRole): number {
  switch (role) {
    case "direct_breaker_install":
      return 1000;
    case "program_search":
      return 900;
    case "recovery_answer":
      return 850;
    case "search_engine_setup":
      return 760;
    case "draw_for_answer":
      return 650;
    case "basic_draw_fallback":
      return 500;
    case "not_coverage_answer":
      return 0;
  }
}

function candidateMatchesStep(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
  input: AiDecisionInput,
): boolean {
  if (!action) return false;
  if (candidate.actorSide !== plan.side) return false;
  if (
    candidate.primaryProjectionStatus === "blocked" ||
    candidate.primaryProjectionStatus === "hidden_info_blocked"
  ) {
    return false;
  }
  if (isCoverageAnswerStep(step)) {
    const fit = coverageSearchActionFit(plan, step, candidate, action, input);
    if (fit !== undefined) {
      return fit.supportsActiveCapabilityNeed &&
        coverageAnswerRoleMatchesStep(step, fit.answerRole) &&
        candidateTargetMatchesPlan(plan, candidate, action);
    }
  }
  if (step.kind === "install_development_card") {
    return developmentCardStepMatchesAction(plan, action);
  }
  if (step.kind === "gain_credits") {
    const creditGain = legalActionCreditGainForPlan(
      input,
      action,
      TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
    );
    if (creditGain > 0) {
      return candidateTargetMatchesPlan(plan, candidate, action);
    }
  }
  if (step.kind === "draw_hand_buffer") {
    return (
      action.type === "draw_card" &&
      candidateTargetMatchesPlan(plan, candidate, action)
    );
  }
  if (step.kind === "install_breaker" && action.type === "install_card") {
    const requiredCoverage = planRequiredBreakerCoverage(plan, step);
    const sourceCard = visibleCardByInstanceId(input.playerView, String(action.source));
    if (!sourceCard && !/breaker|icebreaker|fracter|decoder|killer/i.test(action.label)) {
      return false;
    }
    if (
      sourceCard &&
      !cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
    ) {
      return false;
    }
  }
  if (isRunPlanStep(step)) {
    return runPlanStepMatchesAction(step, candidate, action) &&
      candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidateSemanticsMatchStep(step, candidate)) {
    return candidateTargetMatchesPlan(plan, candidate, action) &&
      bankStepMatchesCandidate(step, candidate, action);
  }
  if (step.desiredActionSemantics.includes(candidate.semanticActionType)) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.actionTacticSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  if (candidate.cardContextSignals.some((signal) => step.desiredActionSemantics.includes(signal))) {
    return candidateTargetMatchesPlan(plan, candidate, action);
  }
  return actionTypeMatchesStep(step, candidate.actionType) &&
    candidateTargetMatchesPlan(plan, candidate, action) &&
    bankStepMatchesCandidate(step, candidate, action);
}

function developmentCardStepMatchesAction(
  plan: TacticalPlan,
  action: LegalAction,
): boolean {
  if (
    action.type !== "install_card" &&
    action.type !== "play_event" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  if (plan.target?.kind !== "card") return true;
  return legalActionReferencesCard(action, plan.target.id);
}

function legalActionReferencesCard(action: LegalAction, cardId: string): boolean {
  const payload = action.payload ?? {};
  return (
    action.source === cardId ||
    payload.cardId === cardId ||
    payload.sourceCardId === cardId ||
    payload.targetCardId === cardId ||
    payload.selectedCardId === cardId
  );
}

function isRunPlanStep(step: PlanStep): boolean {
  return step.kind === "run_target" || step.kind === "probe_central";
}

function runPlanStepMatchesAction(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (!actionTypeMatchesStep(step, candidate.actionType)) return false;
  if (action.type === "start_run") return true;
  if (!actionServerId(action)) return false;
  return actionCandidateCanStartRun(candidate, action);
}

function actionCandidateCanStartRun(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  const text = [
    candidateSemanticText(candidate),
    action.type,
    action.label,
    JSON.stringify(action.payload ?? {}),
  ].join(" ").toLowerCase();
  if (text.includes("path blocked")) return false;
  return /start_run|make_run|make a run|bonus_run|followup_run|run_event|run_action|extra_run|run_bypass|bypass_first_ice|server_specific_|future_run_effect|run_pressure/.test(
    text,
  );
}

function candidateMappingRationale(candidate: ActionSemanticCandidate): string {
  return [
    `candidate_match:${candidate.actionId}`,
    `semantic:${candidate.semanticActionType}`,
    ...(candidate.sourceCardId ? [`source:${candidate.sourceCardId}`] : []),
    ...(candidate.abilityId ? [`ability:${candidate.abilityId}`] : []),
    ...(candidate.actionTacticSignals.length > 0
      ? [`tactics:${candidate.actionTacticSignals.slice(0, 4).join(",")}`]
      : []),
  ].join("|");
}

function candidateSemanticsMatchStep(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
): boolean {
  const signalText = candidateSemanticText(candidate);
  switch (step.kind) {
    case "install_breaker":
      return /install\.card/.test(signalText) &&
        /breaker|icebreaker|program/.test(signalText);
    case "search_for_answer":
      return /program_search|breaker_search|search\.stack|search_for_answer|setup\.program_search/.test(signalText);
    case "setup_search_engine":
      return /install\.card/.test(signalText) &&
        /program_search|breaker_search|search\.stack|search_for_answer|setup\.program_search|search/.test(signalText);
    case "build_bank_counter":
      return /temporary_resource_bank|counter_bank|charge_bank|build_credit_bank|finite_economy_pool/.test(signalText);
    case "cash_out_bank":
      return /temporary_resource_bank|counter_bank|cash_out|payout|take_bank|finite_economy_pool/.test(signalText);
    case "build_rez_reserve":
      return /economy\.gain_credit|rez_reserve|corp_economy|operation_economy/.test(signalText);
    case "protect_remote":
      return /corp_window\.rez|install\.card|remote_protection|corp_rez_ice/.test(signalText);
    case "advance_score_card":
      return /score\.advance_card|advance\.corp_counter_bank/.test(signalText);
    case "score_agenda":
      return /score\.agenda|score\.action_counter_bank/.test(signalText);
    case "rez_outer_ice":
      return /corp_window\.rez|corp_rez_ice/.test(signalText);
    default:
      return false;
  }
}

function isCoverageAnswerStep(step: PlanStep): boolean {
  return (
    step.kind === "search_for_answer" ||
    step.kind === "setup_search_engine" ||
    step.kind === "draw_for_answer"
  ) && coverageSearchRequiredCapabilityForStep(step) !== undefined;
}

function coverageAnswerRoleMatchesStep(
  step: PlanStep,
  role: CoverageAnswerRole,
): boolean {
  switch (step.kind) {
    case "search_for_answer":
      return role === "program_search" || role === "recovery_answer";
    case "setup_search_engine":
      return role === "search_engine_setup";
    case "draw_for_answer":
      return role === "draw_for_answer" || role === "basic_draw_fallback";
    default:
      return false;
  }
}

function candidateSemanticText(candidate: ActionSemanticCandidate): string {
  return [
    candidate.semanticActionType,
    candidate.sourceCardId,
    candidate.abilityId,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.strategySupport.map((entry) => `${entry.strategyId}:${entry.role}`),
    ...candidate.conditions.map((entry) => entry.kind),
    ...candidate.risks.map((entry) => entry.kind),
    ...candidate.constraints.map((entry) => entry.kind),
    ...candidate.costProfile.additionalCosts,
    ...(candidate.targetContext?.targetProfileMatches.flatMap((entry) => entry.evidence) ?? []),
    ...candidate.evidence,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
}

type RecoveryTargetPlanFit = "none" | "low" | "medium" | "high";

type CoverageAnswerRole =
  | "direct_breaker_install"
  | "program_search"
  | "search_engine_setup"
  | "draw_for_answer"
  | "basic_draw_fallback"
  | "recovery_answer"
  | "not_coverage_answer";

type RecoveryLoopPenalties = {
  repeatedRecoverySameCardPenalty: number;
  repeatedEconomyRecoveryLoopPenalty: number;
  noProgressOnRequiredCapabilityPenalty: number;
  fundingNeedReducesRecoveryLoopPenalty: boolean;
};

type CoverageSearchActionFit = {
  supportsActiveCapabilityNeed: boolean;
  answerRole: CoverageAnswerRole;
  recoveredCardId?: string;
  recoveredCardRole?: string;
  supportsCreditNeed: boolean;
  supportsDrawOrSearchNeed: boolean;
  supportsSurvivalNeed: boolean;
  recoveredCardPlanFit: RecoveryTargetPlanFit;
  recoveryLoopRisk: "none" | "low" | "medium" | "high";
  evidence: string[];
};

function coverageSearchActionFit(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  input: AiDecisionInput,
): CoverageSearchActionFit | undefined {
  const requiredCoverage = coverageSearchRequiredCapability(plan, step);
  if (requiredCoverage === undefined) return undefined;
  const sourceCard = visibleCardForAction(input.playerView, action);
  if (
    action.type === "install_card" &&
    sourceCard &&
    cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
  ) {
    return {
      supportsActiveCapabilityNeed: true,
      answerRole: "direct_breaker_install",
      ...(sourceCard.definitionId
        ? { recoveredCardId: sourceCard.definitionId }
        : {}),
      recoveredCardRole: "breaker",
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: false,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "high",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:direct_breaker_install",
        "planStepExpectedRole:install_breaker",
        "matchedActionRole:install_breaker",
        `recoveredCardPlanFit:high`,
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  const signalText = candidateSemanticText(candidate);
  const recoveryTarget = recoveryTargetEvaluation(
    input,
    action,
    requiredCoverage,
  );
  if (recoveryTarget) return recoveryTarget;

  const sourceRole = sourceCard
    ? cardPlanRoleForCoverageSearch(sourceCard)
    : undefined;
  if (sourceCard && sourceRole?.includes("search")) {
    const answerRole: CoverageAnswerRole =
      action.type === "install_card" ? "search_engine_setup" : "program_search";
    return {
      supportsActiveCapabilityNeed: true,
      ...(sourceCard.definitionId
        ? { recoveredCardId: sourceCard.definitionId }
        : {}),
      answerRole,
      recoveredCardRole: sourceRole,
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "high",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        `coverageAnswerRole:${answerRole}`,
        answerRole === "search_engine_setup"
          ? "planStepExpectedRole:setup_search_engine"
          : "planStepExpectedRole:search_for_answer",
        answerRole === "search_engine_setup"
          ? "matchedActionRole:search_engine_setup"
          : "matchedActionRole:program_search",
        "recoveredCardPlanFit:high",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  if (
    sourceCard &&
    sourceRole?.includes("draw") &&
    action.type !== "install_card"
  ) {
    return {
      supportsActiveCapabilityNeed: true,
      ...(sourceCard?.definitionId
        ? { recoveredCardId: sourceCard.definitionId }
        : {}),
      answerRole: "draw_for_answer",
      recoveredCardRole: sourceRole,
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "medium",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:draw_for_answer",
        "planStepExpectedRole:draw_for_answer",
        "matchedActionRole:draw_for_answer",
        "recoveredCardPlanFit:medium",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  if (action.type === "draw_card") {
    return {
      supportsActiveCapabilityNeed: true,
      answerRole: "basic_draw_fallback",
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "low",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:basic_draw_fallback",
        "planStepExpectedRole:draw_for_answer",
        "matchedActionRole:basic_draw_fallback",
        "recoveredCardPlanFit:low",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  const explicitProgramSearch =
    /program_search|breaker_search|search\.stack|search_for_answer|setup\.program_search/.test(
      signalText,
    );
  if (explicitProgramSearch) {
    return {
      supportsActiveCapabilityNeed: true,
      answerRole: "program_search",
      supportsCreditNeed: false,
      supportsDrawOrSearchNeed: true,
      supportsSurvivalNeed: false,
      recoveredCardPlanFit: "high",
      recoveryLoopRisk: "none",
      evidence: [
        `activeRequiredCapability:${requiredCoverage}`,
        "coverageAnswerRole:program_search",
        "planStepExpectedRole:search_for_answer",
        "matchedActionRole:program_search",
        "recoveredCardPlanFit:high",
        ...recoveryLoopPenaltyEvidence(noRecoveryLoopPenalties()),
      ],
    };
  }

  const matchedActionRole = sourceCard
    ? cardPlanRoleForCoverageSearch(sourceCard)
    : action.type;
  const supportsCreditNeed =
    actionCreditCost(action) < 0 || matchedActionRole.includes("economy");
  const penalties = economyFalseMatchLoopPenalties(input, supportsCreditNeed);
  return {
    supportsActiveCapabilityNeed: false,
    answerRole: "not_coverage_answer",
    recoveredCardRole: matchedActionRole,
    supportsCreditNeed,
    supportsDrawOrSearchNeed: false,
    supportsSurvivalNeed: false,
    recoveredCardPlanFit: "none",
    recoveryLoopRisk: matchedActionRole.includes("economy") ? "medium" : "low",
    evidence: [
      `activeRequiredCapability:${requiredCoverage}`,
      "coverageAnswerRole:not_coverage_answer",
      "planStepExpectedRole:search_for_answer",
      `matchedActionRole:${matchedActionRole}`,
      "recoveredCardPlanFit:none",
      matchedActionRole.includes("economy")
        ? "why_livewire_not_search:economy_does_not_satisfy_coverage"
        : "rejectedFalseMatches:action_does_not_satisfy_coverage",
      ...recoveryLoopPenaltyEvidence(penalties),
    ],
  };
}

function rejectedCoverageSearchFalseMatches(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  legalActionsById: ReadonlyMap<string, LegalAction>,
  input: AiDecisionInput,
): string[] {
  if (coverageSearchRequiredCapability(plan, step) === undefined) return [];
  return candidates
    .map((candidate) => {
      const action = legalActionsById.get(candidate.actionId);
      if (!action || candidate.actorSide !== plan.side) return undefined;
      const fit = coverageSearchActionFit(plan, step, candidate, action, input);
      if (!fit || fit.supportsActiveCapabilityNeed) return undefined;
      return [
        `rejectedFalseMatches:${candidate.actionId}`,
        ...fit.evidence,
        `recoveryTargetEvaluation:${fit.recoveredCardId ?? "none"}:${fit.recoveredCardPlanFit}`,
        `recoveryLoopRisk:${fit.recoveryLoopRisk}`,
      ].join("|");
    })
    .filter((entry): entry is string => Boolean(entry));
}

function matchedCoverageSearchRationales(
  plan: TacticalPlan,
  step: PlanStep,
  candidates: readonly ActionSemanticCandidate[],
  legalActionsById: ReadonlyMap<string, LegalAction>,
  input: AiDecisionInput,
): string[] {
  if (coverageSearchRequiredCapability(plan, step) === undefined) return [];
  return candidates
    .map((candidate) => {
      const action = legalActionsById.get(candidate.actionId);
      if (!action || candidate.actorSide !== plan.side) return undefined;
      const fit = coverageSearchActionFit(plan, step, candidate, action, input);
      if (!fit?.supportsActiveCapabilityNeed) return undefined;
      return [
        `matchedCoverageSearchFit:${candidate.actionId}`,
        ...fit.evidence,
        `recoveryTargetEvaluation:${fit.recoveredCardId ?? "none"}:${fit.recoveredCardPlanFit}`,
        `recoveryLoopRisk:${fit.recoveryLoopRisk}`,
      ].join("|");
    })
    .filter((entry): entry is string => Boolean(entry));
}

function coverageSearchRequiredCapability(
  plan: TacticalPlan,
  step: PlanStep,
): RequiredCapabilityKind | undefined {
  const capability = [
    ...step.requiredCapabilities,
    ...plan.requiredCapabilities,
  ].find((candidate) => candidate.kind.startsWith("breaker_"));
  return capability?.kind;
}

function coverageSearchRequiredCapabilityForStep(
  step: PlanStep,
): RequiredCapabilityKind | undefined {
  const capability = step.requiredCapabilities.find((candidate) =>
    candidate.kind.startsWith("breaker_"),
  );
  return capability?.kind;
}

function recoveryTargetEvaluation(
  input: AiDecisionInput,
  action: LegalAction,
  requiredCoverage: RequiredCapabilityKind,
): CoverageSearchActionFit | undefined {
  if (
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return undefined;
  }
  const sourceCard = visibleCardForAction(input.playerView, action);
  const sourceText = [
    sourceCard?.title,
    sourceCard?.definitionId,
    sourceCard?.rulesText,
    action.label,
  ].filter(Boolean).join(" ").toLowerCase();
  const targetDefinitionId = recoveryTargetDefinitionId(input, action);
  const isRecovery =
    /recovery|trash|heap|junkyard|bbs/.test(sourceText) ||
    targetDefinitionId !== undefined;
  if (!isRecovery) return undefined;
  const targetCard = recoveryTargetVisibleCard(input, action);
  const targetRole =
    targetCard
      ? cardPlanRoleForCoverageSearch(targetCard)
      : targetDefinitionId
        ? cardDefinitionPlanRoleForCoverageSearch(targetDefinitionId)
        : "unknown";
  const supportsCoverage =
    targetCard?.known === true
      ? cardProvidesBreakerCoverage(targetCard, requiredCoverage)
      : targetDefinitionId !== undefined &&
        cardDefinitionProvidesBreakerCoverage(targetDefinitionId, requiredCoverage);
  const supportsDrawOrSearchNeed =
    targetRole.includes("search") || targetRole.includes("draw");
  const supportsCreditNeed = targetRole.includes("economy");
  const recoveredCardPlanFit: RecoveryTargetPlanFit = supportsCoverage
    ? "high"
    : supportsDrawOrSearchNeed
      ? "medium"
      : supportsCreditNeed
        ? "low"
        : "none";
  const supportsActiveCapabilityNeed =
    supportsCoverage || supportsDrawOrSearchNeed;
  const recoveryLoopRisk =
    supportsActiveCapabilityNeed
      ? "none"
      : supportsCreditNeed
        ? "high"
        : "medium";
  const penalties = recoveryLoopPenaltiesForCoverageSearch(
    input,
    supportsActiveCapabilityNeed,
    supportsCreditNeed,
  );
  return {
    supportsActiveCapabilityNeed,
    answerRole: supportsActiveCapabilityNeed
      ? "recovery_answer"
      : "not_coverage_answer",
    ...(targetDefinitionId ? { recoveredCardId: targetDefinitionId } : {}),
    recoveredCardRole: targetRole,
    supportsCreditNeed,
    supportsDrawOrSearchNeed,
    supportsSurvivalNeed: false,
    recoveredCardPlanFit,
    recoveryLoopRisk,
    evidence: [
      `activeRequiredCapability:${requiredCoverage}`,
      `coverageAnswerRole:${
        supportsActiveCapabilityNeed ? "recovery_answer" : "not_coverage_answer"
      }`,
      "planStepExpectedRole:search_for_answer",
      `matchedActionRole:recovery`,
      `recoveredCardId:${targetDefinitionId ?? "unknown"}`,
      `recoveredCardRole:${targetRole}`,
      `supportsActiveCapabilityNeed:${supportsActiveCapabilityNeed}`,
      `supportsCreditNeed:${supportsCreditNeed}`,
      `supportsDrawOrSearchNeed:${supportsDrawOrSearchNeed}`,
      `supportsSurvivalNeed:false`,
      `recoveredCardPlanFit:${recoveredCardPlanFit}`,
      `recoveryLoopRisk:${recoveryLoopRisk}`,
      ...recoveryLoopPenaltyEvidence(penalties),
      supportsActiveCapabilityNeed
        ? "why_junkyard_recovery_allowed_or_rejected:allowed_plan_fit"
        : "why_junkyard_recovery_allowed_or_rejected:rejected_no_plan_fit",
    ],
  };
}

function noRecoveryLoopPenalties(): RecoveryLoopPenalties {
  return {
    repeatedRecoverySameCardPenalty: 0,
    repeatedEconomyRecoveryLoopPenalty: 0,
    noProgressOnRequiredCapabilityPenalty: 0,
    fundingNeedReducesRecoveryLoopPenalty: false,
  };
}

function recoveryLoopPenaltiesForCoverageSearch(
  input: AiDecisionInput,
  supportsActiveCapabilityNeed: boolean,
  supportsCreditNeed: boolean,
): RecoveryLoopPenalties {
  if (supportsActiveCapabilityNeed) return noRecoveryLoopPenalties();
  const fundingNeed = runnerHasConcreteFundingNeed(input, []);
  if (supportsCreditNeed) {
    return {
      repeatedRecoverySameCardPenalty: fundingNeed ? 20 : 80,
      repeatedEconomyRecoveryLoopPenalty: fundingNeed ? 60 : 220,
      noProgressOnRequiredCapabilityPenalty: fundingNeed ? 90 : 180,
      fundingNeedReducesRecoveryLoopPenalty: fundingNeed,
    };
  }
  return {
    repeatedRecoverySameCardPenalty: 50,
    repeatedEconomyRecoveryLoopPenalty: 0,
    noProgressOnRequiredCapabilityPenalty: 160,
    fundingNeedReducesRecoveryLoopPenalty: false,
  };
}

function economyFalseMatchLoopPenalties(
  input: AiDecisionInput,
  supportsCreditNeed: boolean,
): RecoveryLoopPenalties {
  if (!supportsCreditNeed) return noRecoveryLoopPenalties();
  const fundingNeed = runnerHasConcreteFundingNeed(input, []);
  return {
    repeatedRecoverySameCardPenalty: 0,
    repeatedEconomyRecoveryLoopPenalty: fundingNeed ? 40 : 120,
    noProgressOnRequiredCapabilityPenalty: fundingNeed ? 80 : 160,
    fundingNeedReducesRecoveryLoopPenalty: fundingNeed,
  };
}

function recoveryLoopPenaltyEvidence(
  penalties: RecoveryLoopPenalties,
): string[] {
  return [
    `repeatedRecoverySameCardPenalty:${penalties.repeatedRecoverySameCardPenalty}`,
    `repeatedEconomyRecoveryLoopPenalty:${penalties.repeatedEconomyRecoveryLoopPenalty}`,
    `noProgressOnRequiredCapabilityPenalty:${penalties.noProgressOnRequiredCapabilityPenalty}`,
    `fundingNeedReducesRecoveryLoopPenalty:${penalties.fundingNeedReducesRecoveryLoopPenalty}`,
  ];
}

function recoveryTargetDefinitionId(
  input: AiDecisionInput,
  action: LegalAction,
): string | undefined {
  const payload = action.payload ?? {};
  const direct =
    payload.targetCardDefinitionId ??
    payload.returnedCardDefinitionId ??
    payload.cardDefinitionId ??
    payload.targetDefinitionId;
  if (typeof direct === "string") return direct;
  const targetCard = recoveryTargetVisibleCard(input, action);
  return targetCard?.definitionId;
}

function recoveryTargetVisibleCard(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const payload = action.payload ?? {};
  const targetId =
    payload.targetCardId ??
    payload.cardImplementationTopTrashTargetId ??
    payload.returnedCardId;
  return typeof targetId === "string"
    ? visibleCardByInstanceId(input.playerView, targetId)
    : undefined;
}

function cardPlanRoleForCoverageSearch(card: VisibleCard): string {
  if (cardProvidesBreakerCoverage(card, "breaker_coverage")) return "breaker";
  const text = cardCoverageSearchText(card);
  if (/search|tutor/.test(text)) return "search";
  if (/draw/.test(text)) return "draw";
  if (/credit|economy|gain\s+\d+/.test(text)) return "economy";
  return card.type ?? "unknown";
}

function cardDefinitionPlanRoleForCoverageSearch(definitionId: string): string {
  if (cardDefinitionProvidesBreakerCoverage(definitionId, "breaker_coverage"))
    return "breaker";
  const definition = DEMO_CARDS_BY_ID[definitionId];
  const text = [
    definition?.title,
    definition?.type,
    ...(definition?.subtypes ?? []),
    definition?.rulesText,
    ...(definition?.mechanics ?? []),
  ].filter(Boolean).join(" ").toLowerCase();
  if (/search|tutor/.test(text)) return "search";
  if (/draw/.test(text)) return "draw";
  if (/credit|economy|gain_credits|gain\s+\d+/.test(text)) return "economy";
  return definition?.type ?? "unknown";
}

function cardDefinitionProvidesBreakerCoverage(
  definitionId: string,
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  const definition = DEMO_CARDS_BY_ID[definitionId];
  if (!definition) return false;
  return cardProvidesBreakerCoverage(
    {
      instanceId: definitionId,
      definitionId,
      title: definition.title,
      owner: "runner",
      controller: "runner",
      type: definition.type,
      known: true,
      subtypes: definition.subtypes,
      rulesText: definition.rulesText,
    },
    requiredCoverage,
  );
}

function planRequiredBreakerCoverage(
  plan: TacticalPlan,
  step: PlanStep,
): RequiredCapabilityKind {
  const capability = [...step.requiredCapabilities, ...plan.requiredCapabilities].find(
    (candidate) => candidate.kind.startsWith("breaker_"),
  );
  return capability?.kind ?? "breaker_coverage";
}

function actionTypeMatchesStep(step: PlanStep, actionType: string): boolean {
  switch (step.kind) {
    case "install_breaker":
      return actionType === "install_card";
    case "resolve_missing_mu":
      return actionType === "install_card" || actionType === "trigger_ability";
    case "pivot_to_alternative":
      return false;
    case "draw_for_answer":
      return actionType === "draw_card";
    case "draw_hand_buffer":
      return actionType === "draw_card";
    case "search_for_answer":
      return (
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability" ||
        actionType === "play_event"
      );
    case "setup_search_engine":
      return actionType === "install_card";
    case "gain_credits":
      return actionType === "gain_credit";
    case "install_development_card":
      return (
        actionType === "install_card" ||
        actionType === "play_event" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "build_remote":
    case "protect_remote":
    case "install_or_prepare_agenda":
      return actionType === "install_card";
    case "build_rez_reserve":
      return (
        actionType === "gain_credit" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "build_bank_counter":
    case "cash_out_bank":
      return actionType === "trigger_ability" || actionType === "activated_card_ability";
    case "run_target":
    case "probe_central":
      return (
        actionType === "start_run" ||
        actionType === "play_event" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability"
      );
    case "rez_outer_ice":
      return actionType === "rez_ice";
    case "advance_score_card":
      return actionType === "advance_card";
    case "score_agenda":
      return actionType === "score_agenda";
    case "apply_punish_pressure":
      return (
        actionType === "play_operation" ||
        actionType === "trigger_ability" ||
        actionType === "activated_card_ability" ||
        actionType === "trash_resource"
      );
  }
}

function candidateTargetMatchesPlan(
  plan: TacticalPlan,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (!plan.target) return true;
  if (plan.target.kind !== "server") return true;
  const payloadServerId = actionServerId(action);
  if (payloadServerId) return payloadServerId === plan.target.id;
  const selectedServer = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetKind === "server",
  );
  if (selectedServer) return selectedServer.targetId === plan.target.id;
  return !candidate.legalActionRef.originalPayloadKeys.some(isServerTargetPayloadKey);
}

function bankStepMatchesCandidate(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (step.kind !== "build_bank_counter" && step.kind !== "cash_out_bank") {
    return true;
  }
  const evidence = candidate.evidence.join(" ").toLowerCase();
  const signals = [
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    candidate.semanticActionType,
  ].join(" ").toLowerCase();
  const label = action.label.toLowerCase();
  if (step.kind === "build_bank_counter") {
    return (
      label.includes("auf broker legen") ||
      label.includes("put") && label.includes("bank") ||
      evidence.includes("auf broker legen") ||
      signals.includes("bank") ||
      signals.includes("counter_bank") ||
      signals.includes("temporary_resource_bank")
    );
  }
  return (
    label.includes("von broker nehmen") ||
    label.includes("take") && label.includes("bank") ||
    evidence.includes("von broker nehmen") ||
    signals.includes("cash") ||
    signals.includes("payout") ||
    signals.includes("bank")
  );
}

function accessCommitmentPlanEvidence(
  commitment: KnownRemoteAccessCommitment | undefined,
  serverId: string,
): string[] {
  if (!commitment || commitment.serverId !== serverId) return [];
  return [
    `structured_access_commitment_server:${commitment.serverId}`,
    `structured_access_commitment_state:${commitment.knownAccessState}`,
    `structured_access_commitment_intended_action:${commitment.intendedAccessAction}`,
    `structured_access_commitment_reason:${commitment.reason}`,
  ];
}

function buildRunnerTacticalPlans(context: TacticalPlanBuildContext): TacticalPlan[] {
  const input = context.input;
  const previousPlan = context.previousPlan;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  const runnerGoalEvidence = runnerTacticalGoalEvidence(context);
  const remoteRunActions = input.legalActions.filter(
    (action) => action.type === "start_run" && isRemoteServer(actionServerId(action)),
  );
  const noPayoffRemoteRunActions: LegalAction[] = [];
  const noPayoffByActionId = new Map<
    string,
    ReturnType<typeof evaluateKnownRemoteAccessPayoff>
  >();
  for (const action of remoteRunActions) {
    const serverId = actionServerId(action);
    const payoff = evaluateKnownRemoteAccessPayoff(input, serverId);
    if (!payoff.knownNoCurrentPayoff) continue;
    noPayoffRemoteRunActions.push(action);
    noPayoffByActionId.set(action.actionId, payoff);
  }
  const emptyRemoteRunActions = remoteRunActions.filter((action) =>
    !noPayoffRemoteRunActions.includes(action) &&
    remoteRunHasNoRootValue(input.playerView, actionServerId(action)),
  );
  const blockedRemoteRuns = remoteRunActions.filter((action) =>
    !noPayoffRemoteRunActions.includes(action) &&
    !emptyRemoteRunActions.includes(action) &&
    runNeedsBreakerCoverage(input.playerView, actionServerId(action)),
  );
  const centralRunActions = input.legalActions.filter(
    (action) =>
      action.type === "start_run" && isCentralServer(actionServerId(action)),
  );
  const pressureBudget = assessRunnerPressureBudget(context);
  const noPayoffCentralRunActions: LegalAction[] = [];
  const noPayoffCentralByActionId = new Map<
    string,
    ReturnType<typeof evaluateKnownCentralAccessPayoff>
  >();
  for (const action of centralRunActions) {
    const serverId = actionServerId(action);
    const payoff = evaluateKnownCentralAccessPayoff(input, serverId);
    if (!payoff.knownNoCurrentPayoff) continue;
    noPayoffCentralRunActions.push(action);
    noPayoffCentralByActionId.set(action.actionId, payoff);
  }
  const blockedCentralRuns = centralRunActions.filter((action) =>
    !noPayoffCentralRunActions.includes(action) &&
    runNeedsBreakerCoverage(input.playerView, actionServerId(action)),
  );
  for (const action of blockedRemoteRuns) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
    const deckCapabilityEvidence = deckCapabilityEvidenceForRequiredCoverage(
      context,
      missingCoverage,
    );
    const coverageStep = runnerBreakerCoverageStep(context, serverId);
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        priority: 920,
        horizonTurns: 2,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `missing_breaker_coverage:${serverId}`,
            kind: "missing_breaker_coverage",
            severity: "soft",
            target: { kind: "server", id: serverId },
            removalStepKind: coverageStep.kind,
            evidence: [
              "visible rezzed ICE path and no visible breaker coverage",
              `missing_coverage:${missingCoverage}`,
              ...deckCapabilityEvidence,
            ],
          },
          ...deckCapabilityBlockersForRequiredCoverage(
            context,
            missingCoverage,
            serverId,
          ),
        ],
        currentStep: coverageStep,
        evidence: [
          `blocked_remote_run_action:${action.actionId}`,
          ...deckCapabilityEvidence,
        ],
        scoreBreakdown: [
          {
            key: "remote_contest_blocked",
            label: "Remote contest blocked",
            value: 920,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
    plans.push(
      createTacticalPlan({
        planId: `runner.obtain_breaker_coverage:${serverId}`,
        side: "runner",
        type: "runner.obtain_breaker_coverage",
        status: coveragePlanStatusForRequiredCoverage(context, missingCoverage),
        priority: 940,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        requiredCapabilities: [
          {
            capabilityId: `breaker_coverage:${serverId}`,
            kind: missingCoverage,
            side: "runner",
            target: { kind: "server", id: serverId },
            evidence: [
              "required to resume blocked remote contest",
              `server:${serverId}`,
            ],
          },
        ],
        currentStep: coverageStep,
        nextSteps: [
          createPlanStep({
            stepId: `runner.contest_remote:${serverId}`,
            kind: "run_target",
            desiredActionSemantics: ["run.start"],
            rationale: ["return to the blocked remote after coverage improves"],
          }),
        ],
        evidence: [
          `unblocks_plan:runner.contest_remote:${serverId}`,
          ...deckCapabilityEvidence,
        ],
        scoreBreakdown: [
          {
            key: "unblocks_remote_contest",
            label: "Unblocks remote contest",
            value: 940,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of noPayoffRemoteRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const payoff = noPayoffByActionId.get(action.actionId);
    const accessCommitmentEvidence = accessCommitmentPlanEvidence(
      context.accessCommitment,
      serverId,
    );
    const noPlanBonusEvidence = accessOutcomeMemoryPlanEvidence(
      context.accessOutcomeMemory,
    );
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "abandoned",
        priority: -680,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `known_remote_no_current_payoff:${serverId}`,
            kind:
              payoff?.payoff === "trash_unaffordable"
                ? "too_expensive"
                : "target_unreachable",
            severity: "hard",
            target: { kind: "server", id: serverId },
            ...(payoff?.payoff === "trash_unaffordable"
              ? { removalStepKind: "gain_credits" as const }
              : {}),
            evidence: [
              "known remote root has no current access payoff",
              ...accessCommitmentEvidence,
              ...noPlanBonusEvidence,
              ...(payoff?.evidence ?? []),
            ],
          },
        ],
        currentStep: createPlanStep({
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "remote is known from Runner memory and currently has no payoff",
          ],
        }),
        evidence: [
          `known_no_payoff_remote_run_action:${action.actionId}`,
          ...accessCommitmentEvidence,
          ...(payoff?.reasons ?? []),
          ...noPlanBonusEvidence,
          ...(payoff?.evidence ?? []),
        ],
        scoreBreakdown: [
          {
            key: "remote_known_no_current_payoff",
            label: "Known remote has no current payoff",
            value: -680,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of emptyRemoteRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "abandoned",
        priority: -200,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: createPlanStep({
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: ["remote has no installed root card to access"],
        }),
        evidence: [`empty_remote_root_run_action:${action.actionId}`],
        scoreBreakdown: [
          {
            key: "empty_remote_no_root_value",
            label: "Empty remote has no root value",
            value: -200,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of noPayoffCentralRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    const payoff = noPayoffCentralByActionId.get(action.actionId);
    plans.push(
      createTacticalPlan({
        planId: `runner.opportunistic_central_run:${serverId}`,
        side: "runner",
        type: "runner.opportunistic_central_run",
        status: "abandoned",
        priority: -640,
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        blockers: [
          {
            blockerId: `known_central_no_current_payoff:${serverId}`,
            kind:
              payoff?.payoff === "trash_unaffordable"
                ? "too_expensive"
                : "target_unreachable",
            severity: "hard",
            target: { kind: "server", id: serverId },
            ...(payoff?.payoff === "trash_unaffordable"
              ? { removalStepKind: "gain_credits" as const }
              : {}),
            evidence: [
              "known central access has no current payoff",
              ...(payoff?.evidence ?? []),
            ],
          },
        ],
        currentStep: createPlanStep({
          stepId: `probe_central:${serverId}`,
          kind: "probe_central",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "central top card is known from Runner memory and currently has no payoff",
          ],
        }),
        evidence: [
          `known_no_payoff_central_run_action:${action.actionId}`,
          ...(payoff?.reasons ?? []),
          ...(payoff?.evidence ?? []),
        ],
        scoreBreakdown: [
          {
            key: "central_known_no_current_payoff",
            label: "Known central access has no current payoff",
            value: -640,
            reason: serverId,
          },
        ],
        stateVersion,
      }),
    );
  }
  for (const action of remoteRunActions) {
    const serverId = actionServerId(action);
    if (
      !serverId ||
      blockedRemoteRuns.includes(action) ||
      emptyRemoteRunActions.includes(action) ||
      noPayoffRemoteRunActions.includes(action)
    ) continue;
    const remoteGoal = runnerRemoteGoalForServer(context, serverId);
    const strategicBoost = tacticalGoalPriorityBoost(remoteGoal);
    plans.push(
      createTacticalPlan({
        planId: `runner.contest_remote:${serverId}`,
        side: "runner",
        type: "runner.contest_remote",
        status: "active",
        priority: runnerAdjustedPlanPriority(
          context,
          action,
          820 + strategicBoost,
        ),
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: runnerRunTargetCurrentStep(context, action, {
          stepId: `run_target:${serverId}`,
          kind: "run_target",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "remote run is legal and no visible coverage blocker was detected",
            ...runnerRunTargetStepRationale(context, action),
          ],
        }),
        evidence: [
          `remote_run_action:${action.actionId}`,
          ...runnerRunTargetPlanEvidence(context, action),
          ...tacticalGoalEvidence(remoteGoal),
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: [
          ...runnerRunTargetPlanScoreBreakdown(context, action, 820),
          ...tacticalGoalScoreBreakdown(remoteGoal, strategicBoost),
        ],
        stateVersion,
      }),
    );
  }
  for (const action of centralRunActions) {
    const serverId = actionServerId(action);
    if (!serverId) continue;
    if (noPayoffCentralRunActions.includes(action)) continue;
    if (blockedCentralRuns.includes(action)) {
      const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
      const deckCapabilityEvidence = deckCapabilityEvidenceForRequiredCoverage(
        context,
        missingCoverage,
      );
      const coverageStep = runnerBreakerCoverageStep(context, serverId);
      const basePriority = serverId === "rd" ? 760 : 740;
      plans.push(
        createTacticalPlan({
          planId: `runner.opportunistic_central_run:${serverId}`,
          side: "runner",
          type: "runner.opportunistic_central_run",
          priority: basePriority,
          horizonTurns: 1,
          target: { kind: "server", id: serverId },
          blockers: [
            {
              blockerId: `missing_breaker_coverage:${serverId}`,
              kind: "missing_breaker_coverage",
              severity: "soft",
              target: { kind: "server", id: serverId },
              removalStepKind: coverageStep.kind,
              evidence: [
                "visible rezzed ICE path and no visible breaker coverage",
                `missing_coverage:${missingCoverage}`,
                ...deckCapabilityEvidence,
              ],
            },
            ...deckCapabilityBlockersForRequiredCoverage(
              context,
              missingCoverage,
              serverId,
            ),
          ],
          currentStep: coverageStep,
          evidence: [
            `blocked_central_run_action:${action.actionId}`,
            ...deckCapabilityEvidence,
          ],
          scoreBreakdown: [
            {
              key: "central_run_blocked",
              label: "Central run blocked",
              value: basePriority,
              reason: serverId,
            },
          ],
          stateVersion,
        }),
      );
      plans.push(
        createTacticalPlan({
          planId: `runner.obtain_breaker_coverage:${serverId}`,
          side: "runner",
          type: "runner.obtain_breaker_coverage",
          status: coveragePlanStatusForRequiredCoverage(context, missingCoverage),
          priority: serverId === "rd" ? 900 : 880,
          horizonTurns: 1,
          target: { kind: "server", id: serverId },
          requiredCapabilities: [
            {
              capabilityId: `breaker_coverage:${serverId}`,
              kind: missingCoverage,
              side: "runner",
              target: { kind: "server", id: serverId },
              evidence: [
                "required to resume blocked central pressure",
                `server:${serverId}`,
              ],
            },
          ],
          currentStep: coverageStep,
          nextSteps: [
            createPlanStep({
              stepId: `runner.opportunistic_central_run:${serverId}`,
              kind: "probe_central",
              desiredActionSemantics: ["run.start"],
              rationale: ["return to the blocked central after coverage improves"],
            }),
          ],
          evidence: [
            `unblocks_plan:runner.opportunistic_central_run:${serverId}`,
            ...deckCapabilityEvidence,
          ],
          scoreBreakdown: [
            {
              key: "unblocks_central_pressure",
              label: "Unblocks central pressure",
              value: serverId === "rd" ? 900 : 880,
              reason: serverId,
            },
          ],
          stateVersion,
        }),
      );
      continue;
    }
    const pressureAllowance = runnerPressureProbeAllowance(
      pressureBudget,
      serverId,
    );
    const basePriority = serverId === "rd" ? 760 : 740;
    const pressureGoal = runnerPressureGoalForServer(context, serverId);
    const strategicBoost = tacticalGoalPriorityBoost(pressureGoal);
    plans.push(
      createTacticalPlan({
        planId: `runner.opportunistic_central_run:${serverId}`,
        side: "runner",
        type: "runner.opportunistic_central_run",
        status: "active",
        priority: runnerAdjustedPlanPriority(
          context,
          action,
          basePriority + pressureAllowance.priorityBonus + strategicBoost,
        ),
        horizonTurns: 1,
        target: { kind: "server", id: serverId },
        currentStep: runnerRunTargetCurrentStep(context, action, {
          stepId: `probe_central:${serverId}`,
          kind: "probe_central",
          desiredActionSemantics: ["run.start"],
          rationale: [
            "central pressure remains available while blocked plans wait",
            ...runnerRunTargetStepRationale(context, action),
          ],
        }),
        evidence: [
          `central_run_action:${action.actionId}`,
          ...pressureAllowance.evidence,
          ...runnerRunTargetPlanEvidence(context, action),
          ...tacticalGoalEvidence(pressureGoal),
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(pressureGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  plans.push(
    ...runnerHandBufferPlans(context, stateVersion, runnerGoalEvidence),
  );
  plans.push(
    ...runnerHandDevelopmentPlans(context, stateVersion, runnerGoalEvidence),
  );
  plans.push(
    ...runnerCreditBasePlans(context, stateVersion, runnerGoalEvidence),
  );
  const bankBuildActions = input.legalActions.filter(isBankBuildAction);
  const runnerBankToolEvidence = bankToolEvidence(context, "runner");
  const runnerBankPayout = largestBankPayout(context, "runner");
  const runnerFundingNeed = runnerHasConcreteFundingNeed(input, [
    ...blockedRemoteRuns,
    ...blockedCentralRuns,
  ]);
  if (
    bankBuildActions.length > 0 &&
    input.playerView.own.credits >= 4 &&
    !runnerFundingNeed
  ) {
    plans.push(
      createTacticalPlan({
        planId: "runner.build_credit_bank",
        side: "runner",
        type: "runner.build_credit_bank",
        status: "active",
        priority: runnerEconomyGoalPriority(context, 700),
        horizonTurns: 2,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:runner",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "runner.bank_capacity",
              kind: "bank_capacity",
              side: "runner",
              target: { kind: "bank", id: "runner_credit_bank" },
              evidence: runnerBankToolEvidence,
            },
          ],
          rationale: ["credits are stable enough to bank for later plan execution"],
        }),
        evidence: [
          ...bankBuildActions.map((action) => `bank_build_action:${action.actionId}`),
          ...runnerBankToolEvidence,
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  const bankPayoutActions = input.legalActions.filter(isBankPayoutAction);
  const mayCashOutBank =
    bankPayoutActions.length > 0 &&
    (input.playerView.own.credits <= 3 || runnerFundingNeed) &&
    !(
      previousPlan?.type === "runner.build_credit_bank" &&
      input.playerView.own.credits > 3 &&
      !runnerFundingNeed
    );
  if (mayCashOutBank) {
    plans.push(
      createTacticalPlan({
        planId: "runner.cash_out_credit_bank",
        side: "runner",
        type: "runner.cash_out_credit_bank",
        status: "active",
        priority: runnerEconomyGoalPriority(context, 880),
        horizonTurns: 1,
        target: { kind: "bank", id: "runner_credit_bank" },
        currentStep: createPlanStep({
          stepId: "cash_out_bank:runner",
          kind: "cash_out_bank",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "runner.bank_payout",
              kind: "bank_payout",
              side: "runner",
              target: { kind: "bank", id: "runner_credit_bank" },
              evidence: [
                ...runnerBankToolEvidence,
                ...(runnerBankPayout !== undefined
                  ? [`bank_estimated_payout:${runnerBankPayout}`]
                  : []),
              ],
            },
          ],
          rationale: [
            runnerFundingNeed
              ? "stored credits can fund an active plan"
              : "low credits make stored bank credits immediately useful",
            ...(runnerBankPayout !== undefined
              ? [`bank_estimated_payout:${runnerBankPayout}`]
              : []),
          ],
        }),
        evidence: [
          ...bankPayoutActions.map((action) => `bank_payout_action:${action.actionId}`),
          ...runnerBankToolEvidence,
          ...runnerGoalEvidence,
        ],
        stateVersion,
      }),
    );
  }
  return applyRunnerDrawOverflowAdjustments(context, plans);
}

function applyRunnerDrawOverflowAdjustments(
  context: TacticalPlanBuildContext,
  plans: readonly TacticalPlan[],
): TacticalPlan[] {
  return plans.map((plan) => {
    if (!runnerPlanUsesGenericDraw(plan)) return plan;
    const assessment = assessRunnerDrawOverflow(context, plan);
    if (!assessment || assessment.severity === "none") return plan;
    const evidence = runnerDrawOverflowEvidence(assessment);
    const adjustedPriority = Math.max(0, plan.priority - assessment.penalty);
    return {
      ...plan,
      priority: adjustedPriority,
      currentStep: {
        ...plan.currentStep,
        rationale: [
          ...plan.currentStep.rationale,
          ...runnerDrawOverflowRationale(assessment),
        ],
      },
      evidence: [...plan.evidence, ...evidence],
      scoreBreakdown: [
        ...plan.scoreBreakdown,
        {
          key: "runner_draw_overflow",
          label: "Runner draw overflow",
          value: -assessment.penalty,
          reason: assessment.severity,
        },
      ],
    };
  });
}

function runnerPlanUsesGenericDraw(plan: TacticalPlan): boolean {
  return plan.side === "runner" && plan.currentStep.kind === "draw_for_answer";
}

function runnerHandBufferPlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
): TacticalPlan[] {
  if (!context.input.legalActions.some((action) => action.type === "draw_card")) {
    return [];
  }
  if (runnerHasNonBasicHandBufferAlternative(context.input)) return [];
  const assessment = runnerHandBufferAssessment(context.input);
  if (!assessment.active) return [];
  if (
    !assessment.damagePressure &&
    runnerEconomyActionPreferredOverHandBuffer(context)
  ) {
    return [];
  }
  if (runnerHighPayoffRunAvailable(context)) return [];
  return [
    createTacticalPlan({
      planId: "runner.restore_hand_buffer",
      side: "runner",
      type: "runner.restore_hand_buffer",
      status: "active",
      priority: assessment.planPriority,
      horizonTurns: 1,
      target: { kind: "capability", id: "runner_hand_buffer" },
      requiredCapabilities: [
        {
          capabilityId: "runner.hand_buffer",
          kind: "hand_buffer",
          side: "runner",
          target: { kind: "capability", id: "runner_hand_buffer" },
          evidence: assessment.evidence,
        },
      ],
      currentStep: createPlanStep({
        stepId: "draw_for_hand_buffer",
        kind: "draw_hand_buffer",
        desiredActionSemantics: ["draw.card"],
        requiredCapabilities: [
          {
            capabilityId: "runner.hand_buffer",
            kind: "hand_buffer",
            side: "runner",
            target: { kind: "capability", id: "runner_hand_buffer" },
            evidence: assessment.evidence,
          },
        ],
        rationale: [
          "runner hand buffer is too low for safe pressure",
          ...assessment.evidence,
        ],
      }),
      evidence: [...assessment.evidence, ...runnerGoalEvidence],
      scoreBreakdown: [
        {
          key: "runner_restore_hand_buffer",
          label: "Runner hand buffer",
          value: assessment.planPriority,
          reason: assessment.reason,
        },
      ],
      stateVersion,
    }),
  ];
}

function runnerHasNonBasicHandBufferAlternative(input: AiDecisionInput): boolean {
  return input.legalActions.some(
    (action) =>
      action.side === "runner" &&
      action.source !== "basic_action" &&
      (action.type === "play_event" ||
        action.type === "trigger_ability" ||
        action.type === "activated_card_ability" ||
        action.type === "install_card"),
  );
}

function runnerEconomyActionPreferredOverHandBuffer(
  context: TacticalPlanBuildContext,
): boolean {
  const legalCreditGainAvailable = context.input.legalActions.some(
    (action) =>
      legalActionCreditGainForPlan(
        context.input,
        action,
        TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
      ) > 0,
  );
  return legalCreditGainAvailable;
}

function runnerHandBufferAssessment(input: AiDecisionInput): {
  active: boolean;
  handCount: number;
  damagePressure: boolean;
  planPriority: number;
  reason: string;
  evidence: string[];
} {
  const handCount = input.playerView.own.gripOrHq.length;
  const damagePressure = runnerVisibleDamagePressure(input);
  const active = handCount <= 1 || (damagePressure && handCount <= 2);
  const planPriority =
    handCount <= 0
      ? damagePressure
        ? 1280
        : 1220
      : handCount === 1
        ? damagePressure
          ? 1140
          : 1060
        : damagePressure
          ? 980
          : 0;
  const reason =
    handCount <= 0
      ? "empty_hand"
      : damagePressure
        ? "low_hand_damage_pressure"
        : "low_hand";
  return {
    active,
    handCount,
    damagePressure,
    planPriority,
    reason,
    evidence: [
      `runner_hand_buffer_count:${handCount}`,
      `runner_hand_buffer_damage_pressure:${damagePressure}`,
      `runner_hand_buffer_reason:${reason}`,
    ],
  };
}

function runnerHighPayoffRunAvailable(
  context: TacticalPlanBuildContext,
): boolean {
  if ((context.runnerRunTargetEvaluations ?? []).some(
    (evaluation) =>
      evaluation.pathPassability === "reachable" &&
      evaluation.creditsAfterRun >= 0 &&
      runnerRunTargetHighPayoff(evaluation),
  )) {
    return true;
  }
  return context.input.legalActions.some((action) => {
    if (action.type !== "start_run") return false;
    const serverId = actionServerId(action);
    if (!serverId || !isRemoteServer(serverId)) return false;
    const server = context.input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (!server) return false;
    return server.root.some(
      (card) =>
        card.known &&
        (card.type === "agenda" ||
          (card.advancementCounters ?? 0) > 0 ||
          remoteRootTrashCostForPlan(card) <=
            context.input.playerView.own.credits),
    );
  });
}

function remoteRootTrashCostForPlan(card: VisibleCard): number {
  if (card.type !== "asset" && card.type !== "upgrade") {
    return Number.POSITIVE_INFINITY;
  }
  return typeof card.trashCost === "number"
    ? card.trashCost
    : Number.POSITIVE_INFINITY;
}

function runnerVisibleDamagePressure(input: AiDecisionInput): boolean {
  if (input.playerView.own.tags > 0) return true;
  const visibleCards = [
    ...input.playerView.own.heapOrArchives,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  if (
    visibleCards.some((card) =>
      card.known !== false &&
      /damage|flatline|net damage|meat damage|brain damage|tag/i.test(
        [card.title, card.rulesText, card.definitionId]
          .filter(Boolean)
          .join(" "),
      ),
    )
  ) {
    return true;
  }
  return [...input.playerView.publicEvents, ...input.eventTail].some((event) =>
    /damage|flatline|tag|trace/i.test(
      [
        event.type,
        String(event.publicPayload.actionType ?? ""),
        String(event.publicPayload.damageType ?? ""),
        String(event.publicPayload.sourceTitle ?? ""),
        String(event.publicPayload.sourceDefinitionId ?? ""),
      ].join(" "),
    ),
  );
}

function runnerHandDevelopmentPlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
): TacticalPlan[] {
  return (context.runnerHandDevelopmentEvaluations ?? [])
    .filter(usefulLegalRunnerHandDevelopment)
    .slice(0, 6)
    .map((evaluation) =>
      createTacticalPlan({
        planId: `runner.develop_hand_card:${evaluation.cardInstanceId}`,
        side: "runner",
        type: "runner.develop_hand_card",
        status: "active",
        priority: runnerHandDevelopmentPlanPriority(context, evaluation),
        horizonTurns: 1,
        target: {
          kind: "card",
          id: evaluation.cardInstanceId,
          label: runnerHandDevelopmentTargetLabel(evaluation),
        },
        currentStep: createPlanStep({
          stepId: `install_development_card:${evaluation.cardInstanceId}`,
          kind: "install_development_card",
          desiredActionSemantics: [
            "install.card",
            "play.runner_event",
            `runner_hand_development.${evaluation.developmentRole}`,
          ],
          rationale: [
            `hand development role ${evaluation.developmentRole} is ${evaluation.currentNeed}`,
            `hand development priority ${evaluation.priority}`,
          ],
        }),
        evidence: [
          `hand_development_role:${evaluation.developmentRole}`,
          `hand_development_need:${evaluation.currentNeed}`,
          `hand_development_fit:${evaluation.strategicFit}`,
          `hand_development_priority:${evaluation.priority}`,
          ...(evaluation.persistentInstallEvaluation
            ? [
                `persistent_install_stackability:${evaluation.persistentInstallEvaluation.stackabilityClass}`,
                `persistent_install_delta:${evaluation.persistentInstallEvaluation.capabilityDelta}`,
                `persistent_install_duplicate:${evaluation.persistentInstallEvaluation.duplicateRole}`,
                `persistent_install_fit:${evaluation.persistentInstallEvaluation.finalInstallFit}`,
              ]
            : []),
          ...evaluation.evidence.slice(0, 6),
          ...runnerGoalEvidence,
        ],
        scoreBreakdown: [
          {
            key: "runner_hand_development",
            label: "Runner hand development",
            value: runnerHandDevelopmentPlanPriority(context, evaluation),
            reason: evaluation.developmentRole,
          },
        ],
        stateVersion,
      }),
    );
}

function runnerHandDevelopmentTargetLabel(
  evaluation: RunnerHandDevelopmentEvaluation,
): string {
  return evaluation.title ?? evaluation.definitionId ?? evaluation.developmentRole;
}

function runnerCreditBasePlans(
  context: TacticalPlanBuildContext,
  stateVersion: number,
  runnerGoalEvidence: readonly string[],
): TacticalPlan[] {
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  if (
    !context.input.legalActions.some(
      (action) =>
        legalActionCreditGainForPlan(
          context.input,
          action,
          TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
        ) > 0,
    )
  ) {
    return [];
  }
  const drawOverflow = assessRunnerDrawOverflow(context);
  const drawOverflowCreditPressure =
    drawOverflow && runnerDrawOverflowSupportsCreditPlan(drawOverflow);
  if (
    (!creditBase || creditBase.economyPriority === "low") &&
    !drawOverflowCreditPressure
  ) {
    return [];
  }
  const basePriority = creditBase
    ? creditBase.economyPriority === "high" ? 930 :
      creditBase.economyPriority === "medium" ? 820 :
      650
    : 650;
  const overflowBoost = drawOverflowCreditPressure
    ? runnerDrawOverflowCreditPriorityBoost(drawOverflow)
    : 0;
  const priority = Math.min(940, basePriority + overflowBoost);
  return [
    createTacticalPlan({
      planId: "runner.build_credit_base",
      side: "runner",
      type: "runner.build_credit_base",
      status: "active",
      priority,
      horizonTurns: 1,
      target: { kind: "capability", id: "runner_credit_base" },
      currentStep: createPlanStep({
        stepId: "gain_credits:runner_credit_base",
        kind: "gain_credits",
        desiredActionSemantics: ["economy.gain_credit"],
        rationale: [
          creditBase
            ? `creditbase recommends ${creditBase.recommendation}`
            : "hand limit pressure makes credits safer than another draw",
          creditBase
            ? `desired reserve ${creditBase.desiredCreditReserve}`
            : "draw overflow pressure is high",
          ...(drawOverflowCreditPressure
            ? runnerDrawOverflowRationale(drawOverflow)
            : []),
        ],
      }),
      evidence: [
        ...(creditBase
          ? [
              `credit_base_recommendation:${creditBase.recommendation}`,
              `credit_base_priority:${creditBase.economyPriority}`,
              `credit_base_funding_need:${creditBase.fundingNeed}`,
              `credit_base_desired_reserve:${creditBase.desiredCreditReserve}`,
              `credit_reserve_remote_score_threat:${creditBase.creditReservePolicy.remoteScoreThreat}`,
              `credit_reserve_contest:${creditBase.creditReservePolicy.contestReserve}`,
              `credit_reserve_below_now:${creditBase.creditReservePolicy.belowReserveNow}`,
              `credit_base_blocked_hand_cards:${creditBase.usefulHandCardsBlockedByCredits}`,
            ]
          : ["credit_base_recommendation:avoid_overdraw"]),
        ...(drawOverflowCreditPressure
          ? runnerDrawOverflowEvidence(drawOverflow)
          : []),
        ...runnerGoalEvidence,
      ],
      scoreBreakdown: [
        {
          key: "runner_credit_base",
          label: "Runner creditbase",
          value: priority,
          reason: creditBase?.recommendation ?? "avoid_overdraw",
        },
      ],
      stateVersion,
    }),
  ];
}

function usefulLegalRunnerHandDevelopment(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  if (evaluation.availability !== "legal_now") return false;
  if (!evaluation.legalActionId) return false;
  if (
    evaluation.persistentInstallEvaluation &&
    (evaluation.persistentInstallEvaluation.finalInstallFit <= 0 ||
      evaluation.persistentInstallEvaluation.duplicateRole ===
        "redundant_duplicate")
  ) {
    return false;
  }
  if (
    evaluation.developmentRole === "duplicate_or_low_value" ||
    evaluation.developmentRole === "unknown"
  ) {
    return false;
  }
  if (evaluation.currentNeed === "none" || evaluation.currentNeed === "later") {
    return false;
  }
  if (
    evaluation.developmentRole === "defense_support" &&
    evaluation.currentNeed !== "acute"
  ) {
    return false;
  }
  return evaluation.priority >= 500;
}

function runnerHandDevelopmentPlanPriority(
  context: TacticalPlanBuildContext,
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  const drawOverflow = assessRunnerDrawOverflow(context);
  const roleScore = runnerHandDevelopmentRolePriority(evaluation);
  const needScore = runnerHandDevelopmentNeedPriority(evaluation);
  const fitScore = runnerHandDevelopmentFitPriority(evaluation);
  const installFitScore =
    evaluation.persistentInstallEvaluation !== undefined
      ? Math.min(
          0,
          Math.round(evaluation.persistentInstallEvaluation.finalInstallFit / 4),
        )
      : 0;
  const creditBaseScore =
    creditBase?.recommendation === "allow_setup_spend" ? 40 :
    creditBase?.recommendation === "preserve_reserve" ? -40 :
    0;
  const drawOverflowScore = runnerHandDevelopmentOverflowBonus(drawOverflow);
  return Math.max(
    0,
    Math.min(
      960,
      roleScore +
        needScore +
        fitScore +
        installFitScore +
        creditBaseScore +
        drawOverflowScore,
    ),
  );
}

function runnerHandDevelopmentRolePriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.developmentRole) {
    case "breaker_or_rig_piece":
      return 780;
    case "memory_support":
      return 760;
    case "access_payoff":
      return 750;
    case "economy_engine":
    case "bank_tool":
      return 730;
    case "draw_or_search_engine":
      return 700;
    case "run_event":
      return 680;
    case "defense_support":
      return evaluation.currentNeed === "acute" ? 780 : 420;
    case "duplicate_or_low_value":
    case "unknown":
      return 0;
  }
}

function runnerHandDevelopmentNeedPriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.currentNeed) {
    case "acute":
      return 110;
    case "useful_now":
      return 80;
    case "setup":
      return 40;
    case "later":
      return -180;
    case "none":
      return -420;
  }
}

function runnerHandDevelopmentFitPriority(
  evaluation: RunnerHandDevelopmentEvaluation,
): number {
  switch (evaluation.strategicFit) {
    case "strong":
      return 60;
    case "medium":
      return 20;
    case "blocked":
      return -80;
    case "weak":
      return -220;
  }
}

function runnerAdjustedPlanPriority(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  basePriority: number,
): number {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (!evaluation) return basePriority;
  return basePriority + runnerRunTargetTacticalPriorityDelta(evaluation);
}

function runnerRunTargetPlanScoreBreakdown(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  basePriority: number,
): PlanScoreBreakdown[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  return [
    {
      key: "runner_run_target_base",
      label: "Remote-Run-Basis",
      value: basePriority,
      reason: actionServerId(action) ?? action.actionId,
    },
    ...(evaluation
      ? [
          {
            key: "runner_run_target_recommendation",
            label: "RunTarget-Empfehlung",
            value: runnerRunTargetTacticalPriorityDelta(evaluation),
            reason: [
              evaluation.recommendation,
              `payoff:${evaluation.accessPayoff}`,
              `score:${evaluation.score}`,
            ].join(";"),
          },
        ]
      : []),
  ];
}

function runnerEconomyGoalPriority(
  context: TacticalPlanBuildContext,
  basePriority: number,
): number {
  const posture = context.runnerEconomyPosture;
  if (!posture) return basePriority;
  if (posture.recommendation === "cash_out_bank") return basePriority + 160;
  if (posture.creditBasePlan.recommendation === "fund_useful_hand_card")
    return basePriority + 140;
  if (posture.creditBasePlan.economyPriority === "high") return basePriority + 120;
  if (posture.recommendation === "build_economy") return basePriority + 90;
  return basePriority;
}

const RUNNER_PRESSURE_PROBE_PRIORITY_BONUS = 180;
const RUNNER_PRESSURE_PROBE_VARIATION_BONUS = 25;
const RUNNER_PRESSURE_PROBE_NEAR_TIE_WINDOW = 25;

function assessRunnerPressureBudget(
  context: TacticalPlanBuildContext,
): RunnerPressureBudget {
  const reservePolicy = context.runnerEconomyPosture?.creditReservePolicy;
  const creditBase = context.runnerEconomyPosture?.creditBasePlan;
  const usefulHandDevelopmentAvailable = (
    context.runnerHandDevelopmentEvaluations ?? []
  ).some(usefulLegalRunnerHandDevelopment);
  const reservePressureActive =
    creditBase !== undefined &&
    creditBase.economyPriority !== "low" &&
    reservePolicy !== undefined &&
    reservePolicy.belowReserveNow;
  const remoteFundingNeed =
    reservePolicy !== undefined &&
    reservePolicy.remoteScoreThreat !== "none" &&
    reservePolicy.belowReserveNow &&
    reservePolicy.canContestIfFunded;
  const allowedProbeEvaluations = (context.runnerRunTargetEvaluations ?? [])
    .filter((evaluation) => runnerPressureProbeTargetAllowed(evaluation));
  const allowedProbeTargets = allowedProbeEvaluations
    .map((evaluation) => evaluation.targetServerId)
    .sort();
  const probeBaselines = allowedProbeEvaluations
    .map((evaluation) => ({
      targetServerId: evaluation.targetServerId,
      priority: runnerPressureProbeBasePriority(evaluation),
    }))
    .sort((left, right) => left.targetServerId.localeCompare(right.targetServerId));
  const bestProbeBaseline = Math.max(
    0,
    ...probeBaselines.map((baseline) => baseline.priority),
  );
  const nearTieProbeTargets = probeBaselines
    .filter(
      (baseline) =>
        bestProbeBaseline - baseline.priority <=
        RUNNER_PRESSURE_PROBE_NEAR_TIE_WINDOW,
    )
    .map((baseline) => baseline.targetServerId);
  const blockedReasons = [
    ...(!reservePressureActive ? ["reserve_pressure_inactive"] : []),
    ...(usefulHandDevelopmentAvailable ? ["useful_hand_development_available"] : []),
    ...(remoteFundingNeed ? ["remote_contest_funding_need"] : []),
    ...(allowedProbeTargets.length === 0 ? ["no_safe_probe_target"] : []),
  ];
  const canSpendActionOnPressure =
    context.input.side === "runner" &&
    reservePressureActive &&
    !usefulHandDevelopmentAvailable &&
    !remoteFundingNeed &&
    allowedProbeTargets.length > 0;
  const boundedVariationApplied =
    canSpendActionOnPressure && nearTieProbeTargets.length > 1;
  const preferredProbeTarget = boundedVariationApplied
    ? runnerPressurePreferredProbeTarget(
        nearTieProbeTargets,
        context.input.playerView.stateVersion,
      )
    : undefined;
  const variationReason = boundedVariationApplied
    ? "near_tie_state_version"
    : "deterministic_priority_only";
  return {
    canSpendActionOnPressure,
    pressureActionBudgetThisTurn: canSpendActionOnPressure ? 1 : 0,
    maxCreditLossForProbe: 0,
    allowedProbeTargets,
    nearTieProbeTargets,
    ...(preferredProbeTarget ? { preferredProbeTarget } : {}),
    blockedReasons,
    boundedVariationApplied,
    variationReason,
    evidence: [
      `pressure_budget:${canSpendActionOnPressure ? "available" : "blocked"}`,
      `pressure_action_budget:${canSpendActionOnPressure ? 1 : 0}`,
      "max_credit_loss_for_probe:0",
      `allowed_probe_targets:${allowedProbeTargets.join("|") || "none"}`,
      `near_tie_probe_targets:${nearTieProbeTargets.join("|") || "none"}`,
      `preferred_probe_target:${preferredProbeTarget ?? "none"}`,
      `blocked_pressure_reasons:${blockedReasons.join("|") || "none"}`,
      `bounded_variation_applied:${boundedVariationApplied}`,
      `variation_reason:${variationReason}`,
    ],
  };
}

function runnerPressureProbeAllowance(
  budget: RunnerPressureBudget,
  serverId: string,
): { priorityBonus: number; evidence: string[] } {
  if (
    !budget.canSpendActionOnPressure ||
    !budget.allowedProbeTargets.includes(serverId)
  ) {
    return {
      priorityBonus: 0,
      evidence: budget.evidence,
    };
  }
  const variationBonus =
    budget.boundedVariationApplied && budget.preferredProbeTarget === serverId
      ? RUNNER_PRESSURE_PROBE_VARIATION_BONUS
      : 0;
  return {
    priorityBonus:
      RUNNER_PRESSURE_PROBE_PRIORITY_BONUS + variationBonus,
    evidence: [
      ...budget.evidence,
      "pressure_probe_allowed:true",
      `pressure_probe_target:${serverId}`,
      `pressure_probe_variation_bonus:${variationBonus}`,
      "economy_pressure_tradeoff:probe_within_budget",
      "why_spend_allowed_despite_reserve:pressure_budget_probe",
    ],
  };
}

function runnerRunTargetEvaluationForAction(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): RunnerRunTargetEvaluation | undefined {
  return context.runnerRunTargetEvaluations?.find(
    (evaluation) => evaluation.actionId === action.actionId,
  );
}

function runnerRunTargetCurrentStep(
  context: TacticalPlanBuildContext,
  action: LegalAction,
  defaultStep: Parameters<typeof createPlanStep>[0],
): PlanStep {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (evaluation?.recommendation === "gain_credits_first") {
    return createPlanStep({
      stepId: `gain_credits_before_run:${evaluation.targetServerId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      rationale: [
        "run target evaluation recommends funding before pressure",
        ...runnerRunTargetStepRationale(context, action),
      ],
    });
  }
  return createPlanStep(defaultStep);
}

function runnerRunTargetPlanEvidence(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): string[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (!evaluation) return [];
  return [
    `runner_run_target_recommendation:${evaluation.recommendation}`,
    `runner_run_target_payoff:${evaluation.accessPayoff}`,
    `runner_run_target_path:${evaluation.pathPassability}`,
    `runner_run_target_score:${evaluation.score}`,
    ...evaluation.evidence.filter(
      (entry) =>
        entry === "known_remote_no_current_payoff" ||
        entry === "repeated_remote_no_progress_suppressed",
    ),
  ];
}

function runnerRunTargetStepRationale(
  context: TacticalPlanBuildContext,
  action: LegalAction,
): string[] {
  const evaluation = runnerRunTargetEvaluationForAction(context, action);
  if (!evaluation) return [];
  return [
    `RunTargetEvaluation recommends ${evaluation.recommendation}.`,
    `Access payoff is ${evaluation.accessPayoff}; path is ${evaluation.pathPassability}.`,
  ];
}

function runnerTacticalGoalEvidence(context: TacticalPlanBuildContext): string[] {
  return tacticalGoalsForPlanEvidence(context).slice(0, 6).map((goal) =>
    [
      `tactical_goal:${goal.goalId}`,
      `priority:${goal.priority}`,
      `urgency:${goal.urgency ?? "unknown"}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
    ].join("|"),
  );
}

function tacticalGoalsForPlanEvidence(
  context: TacticalPlanBuildContext,
): readonly TacticalGoalLike[] {
  return context.tacticalGoals ?? context.runnerTacticalGoals ?? [];
}

function strongestTacticalGoal(
  context: TacticalPlanBuildContext,
  predicate: (goal: TacticalGoalLike) => boolean,
): TacticalGoalLike | undefined {
  return tacticalGoalsForPlanEvidence(context)
    .filter(predicate)
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        urgencyRank(right.urgency) - urgencyRank(left.urgency) ||
        left.goalId.localeCompare(right.goalId),
    )[0];
}

function tacticalGoalPriorityBoost(
  goal: TacticalGoalLike | undefined,
  maxBoost = 140,
): number {
  if (!goal) return 0;
  const urgencyBonus = goal.urgency === "high" ? 25 : 0;
  return Math.min(maxBoost, Math.max(0, Math.round(goal.priority / 10) + urgencyBonus));
}

function tacticalGoalEvidence(
  goal: TacticalGoalLike | undefined,
): string[] {
  if (!goal) return [];
  return [
    `strategic_plan_goal:${goal.goalId}`,
    `strategic_plan_goal_priority:${goal.priority}`,
    `strategic_plan_goal_urgency:${goal.urgency ?? "unknown"}`,
    ...(goal.targetServerId ? [`strategic_plan_goal_target:${goal.targetServerId}`] : []),
    ...(goal.evidence ?? []).slice(0, 6),
  ];
}

function tacticalGoalScoreBreakdown(
  goal: TacticalGoalLike | undefined,
  boost: number,
): PlanScoreBreakdown[] {
  if (!goal || boost <= 0) return [];
  return [
    {
      key: "strategic_tactical_goal_fit",
      label: "Strategic goal fit",
      value: boost,
      reason: goal.goalId,
    },
  ];
}

function isStrategicTacticalGoal(goal: TacticalGoalLike): boolean {
  return (
    goal.source === "strategic_intent" ||
    goal.evidence?.some((entry) =>
      entry.startsWith("strategic_goal_source:"),
    ) === true
  );
}

function urgencyRank(urgency: TacticalGoalLike["urgency"]): number {
  switch (urgency) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function runnerPressureGoalForServer(
  context: TacticalPlanBuildContext,
  serverId: string,
): TacticalGoalLike | undefined {
  return strongestTacticalGoal(
    context,
    (goal) =>
      isStrategicTacticalGoal(goal) &&
      goal.family === "pressure" &&
      (goal.targetServerId === undefined || goal.targetServerId === serverId) &&
      (
        goal.goalId === "runner.strategic.central_pressure" ||
        goal.goalId === "runner.pressure_good_central_target" ||
        goal.goalId.includes("central_pressure") ||
        goal.goalId.includes("rnd_pressure") ||
        goal.goalId.includes("hq_pressure")
      ),
  );
}

function runnerRemoteGoalForServer(
  context: TacticalPlanBuildContext,
  serverId: string,
): TacticalGoalLike | undefined {
  return strongestTacticalGoal(
    context,
    (goal) =>
      isStrategicTacticalGoal(goal) &&
      (goal.family === "remote_contest" || goal.goalId.includes("remote")) &&
      (goal.targetServerId === undefined || goal.targetServerId === serverId),
  );
}

function corpGoalForFamily(
  context: TacticalPlanBuildContext,
  family: string,
): TacticalGoalLike | undefined {
  return strongestTacticalGoal(
    context,
    (goal) =>
      isStrategicTacticalGoal(goal) &&
      goal.goalId.startsWith("corp.") &&
      goal.family === family,
  );
}

function buildCorpTacticalPlans(context: TacticalPlanBuildContext): TacticalPlan[] {
  const input = context.input;
  const stateVersion = input.playerView.stateVersion;
  const plans: TacticalPlan[] = [];
  const scorelineGoal = corpGoalForFamily(context, "corp_scoreline");
  const defenseGoal = corpGoalForFamily(context, "corp_ice_defense");
  const economyGoal = corpGoalForFamily(context, "economy");
  const punishGoal =
    corpGoalForFamily(context, "tag_punish") ??
    corpGoalForFamily(context, "damage_pressure");
  for (const action of input.legalActions.filter((candidate) => candidate.type === "score_agenda")) {
    const strategicBoost = tacticalGoalPriorityBoost(scorelineGoal);
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: "active",
        priority: 980 + strategicBoost,
        horizonTurns: 1,
        currentStep: createPlanStep({
          stepId: `score_agenda:${action.actionId}`,
          kind: "score_agenda",
          desiredActionSemantics: ["score.agenda"],
          rationale: ["agenda score action is already legal"],
        }),
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `score_action:${action.actionId}`,
          "corp_score_sequence:score_now",
          ...tacticalGoalEvidence(scorelineGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(scorelineGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "advance_card")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    const blockers = corpScoreWindowBlockers(input, serverId, action);
    const currentStep = corpScoreWindowCurrentStep(action, blockers);
    const strategicBoost = tacticalGoalPriorityBoost(scorelineGoal);
    if (
      serverId &&
      !remoteIsProtected(input.playerView, serverId) &&
      !advanceCompletesScore(input.playerView, action) &&
      corpHasSafeScoreAlternative(input, action)
    ) {
      continue;
    }
    plans.push(
      createTacticalPlan({
        planId: `corp.create_score_window:${action.actionId}`,
        side: "corp",
        type: "corp.create_score_window",
        status: blockers.length > 0 ? "blocked" : "active",
        priority:
          (serverId && remoteIsProtected(input.playerView, serverId) ? 900 : 760) +
          strategicBoost,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        blockers,
        currentStep,
        nextSteps: corpScoreWindowSequence(action.actionId),
        evidence: [
          `advance_action:${action.actionId}`,
          "corp_score_sequence:advance_score_card",
          ...tacticalGoalEvidence(scorelineGoal),
          ...blockers.flatMap((blocker) => blocker.evidence),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(scorelineGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  for (const action of input.legalActions.filter((candidate) => candidate.type === "rez_ice")) {
    const serverId = actionServerId(action) ?? visibleSourceServerId(input.playerView, action);
    const strategicBoost = tacticalGoalPriorityBoost(defenseGoal);
    plans.push(
      createTacticalPlan({
        planId: `corp.rez_defense:${action.actionId}`,
        side: "corp",
        type: "corp.rez_defense",
        status: "active",
        priority: 930 + strategicBoost,
        horizonTurns: 1,
        ...(serverId ? { target: { kind: "server", id: serverId } } : {}),
        currentStep: createPlanStep({
          stepId: `rez_outer_ice:${action.actionId}`,
          kind: "rez_outer_ice",
          desiredActionSemantics: ["corp_window.rez"],
          rationale: ["rez window can turn existing ICE into defense"],
        }),
        evidence: [
          `rez_action:${action.actionId}`,
          ...tacticalGoalEvidence(defenseGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(defenseGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  for (const candidate of corpPunishCandidates(context, punishGoal)) {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    if (!action) continue;
    const strategicBoost = tacticalGoalPriorityBoost(punishGoal);
    plans.push(
      createTacticalPlan({
        planId: `corp.apply_punish_pressure:${action.actionId}`,
        side: "corp",
        type: "corp.apply_punish_pressure",
        status: "active",
        priority: 730 + strategicBoost,
        horizonTurns: 1,
        currentStep: createPlanStep({
          stepId: `apply_punish_pressure:${action.actionId}`,
          kind: "apply_punish_pressure",
          desiredActionSemantics: [
            "tag.source",
            "trace.source",
            "tag.payoff",
            "damage.payoff",
            "corp_window.punish",
            "card_ability.trigger",
            "card_ability.unknown",
            "play.corp_operation",
          ],
          rationale: ["strategic Corp punish pressure maps to an existing legal action"],
        }),
        evidence: [
          `punish_action:${action.actionId}`,
          `punish_semantic:${candidate.semanticActionType}`,
          ...candidate.actionTacticSignals.map((signal) => `punish_tactic:${signal}`),
          ...candidate.cardContextSignals.map((signal) => `punish_card_signal:${signal}`),
          ...tacticalGoalEvidence(punishGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(punishGoal, strategicBoost),
        stateVersion,
      }),
    );
  }
  const bankBuildActions = input.legalActions.filter(isBankBuildAction);
  const corpBankToolEvidence = bankToolEvidence(context, "corp");
  const economyStrategicBoost = tacticalGoalPriorityBoost(economyGoal, 100);
  if (
    bankBuildActions.length > 0 &&
    input.playerView.own.credits >= 4 &&
    context.previousPlan?.type !== "corp.build_credit_bank"
  ) {
    plans.push(
      createTacticalPlan({
        planId: "corp.build_credit_bank",
        side: "corp",
        type: "corp.build_credit_bank",
        status: "active",
        priority: 690 + economyStrategicBoost,
        horizonTurns: 2,
        target: { kind: "bank", id: "corp_credit_bank" },
        currentStep: createPlanStep({
          stepId: "build_bank_counter:corp",
          kind: "build_bank_counter",
          desiredActionSemantics: ["card_ability.trigger", "card_ability.unknown"],
          requiredCapabilities: [
            {
              capabilityId: "corp.bank_capacity",
              kind: "bank_capacity",
              side: "corp",
              target: { kind: "bank", id: "corp_credit_bank" },
              evidence: corpBankToolEvidence,
            },
          ],
          rationale: ["corp can bank spare credits for future score or rez windows"],
        }),
        evidence: [
          ...bankBuildActions.map((action) => `bank_build_action:${action.actionId}`),
          ...corpBankToolEvidence,
          ...tacticalGoalEvidence(economyGoal),
        ],
        scoreBreakdown: tacticalGoalScoreBreakdown(
          economyGoal,
          economyStrategicBoost,
        ),
        stateVersion,
      }),
    );
  }
  return plans;
}

function corpPunishCandidates(
  context: TacticalPlanBuildContext,
  punishGoal: TacticalGoalLike | undefined,
): ActionSemanticCandidate[] {
  if (!punishGoal) return [];
  return (context.candidates ?? []).filter((candidate) => {
    if (candidate.actorSide !== "corp") return false;
    if (
      candidate.primaryProjectionStatus === "blocked" ||
      candidate.primaryProjectionStatus === "hidden_info_blocked"
    ) {
      return false;
    }
    const text = candidateSemanticText(candidate);
    return /tag\.source|trace\.source|tag\.payoff|damage\.payoff|punish|trash_runner_resource|flatline|net_damage|meat_damage/.test(text);
  });
}

function corpScoreWindowBlockers(
  input: AiDecisionInput,
  serverId: string | undefined,
  action: LegalAction,
): PlanBlocker[] {
  const blockers: PlanBlocker[] = [];
  const target = serverId ? { kind: "server" as const, id: serverId } : undefined;
  if (
    serverId &&
    isRemoteServer(serverId) &&
    !remoteIsProtected(input.playerView, serverId) &&
    !advanceCompletesScore(input.playerView, action)
  ) {
    blockers.push({
      blockerId: `score_window_unprotected:${serverId}`,
      kind: "score_window_unprotected",
      severity: "hard",
      ...(target ? { target } : {}),
      removalStepKind: "protect_remote",
      evidence: [`server:${serverId}`, "remote_protection:false"],
    });
  }
  const remoteContestability =
    serverId && isRemoteServer(serverId)
      ? corpRemoteContestabilityAssessment(input.playerView, serverId)
      : undefined;
  if (
    serverId &&
    remoteContestability?.contestable === true &&
    !advanceCompletesScore(input.playerView, action)
  ) {
    blockers.push({
      blockerId: `score_window_contestable:${serverId}`,
      kind: "score_window_contestable",
      severity: "hard",
      ...(target ? { target } : {}),
      removalStepKind: "protect_remote",
      evidence: [`server:${serverId}`, ...remoteContestability.evidence],
    });
  }
  if (
    serverId &&
    remoteIsProtected(input.playerView, serverId) &&
    serverHasUnrezzedIce(input.playerView, serverId) &&
    input.playerView.own.credits < 4
  ) {
    blockers.push({
      blockerId: `missing_rez_reserve:${serverId}`,
      kind: "missing_rez_reserve",
      severity: "soft",
      ...(target ? { target } : {}),
      removalStepKind: "build_rez_reserve",
      evidence: [
        `server:${serverId}`,
        `corp_credits:${input.playerView.own.credits}`,
        "rez_reserve_below_pragmatic_floor:4",
      ],
    });
  }
  return blockers;
}

function corpScoreWindowCurrentStep(
  action: LegalAction,
  blockers: readonly PlanBlocker[],
): PlanStep {
  if (
    blockers.some(
      (blocker) =>
        blocker.kind === "score_window_unprotected" ||
        blocker.kind === "score_window_contestable",
    )
  ) {
    return createPlanStep({
      stepId: `protect_remote:${action.actionId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "corp_window.rez"],
      requiredCapabilities: [
        {
          capabilityId: `remote_protection:${action.actionId}`,
          kind: "remote_protection",
          side: "corp",
          evidence: blockers.some(
            (blocker) => blocker.kind === "score_window_contestable",
          )
            ? ["score_window_contestable"]
            : ["score_window_unprotected"],
        },
      ],
      rationale: ["score window must be protected before advancing safely"],
    });
  }
  if (blockers.some((blocker) => blocker.kind === "missing_rez_reserve")) {
    return createPlanStep({
      stepId: `build_rez_reserve:${action.actionId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
      requiredCapabilities: [
        {
          capabilityId: `rez_reserve:${action.actionId}`,
          kind: "rez_reserve",
          side: "corp",
          evidence: ["missing_rez_reserve"],
        },
      ],
      rationale: ["score window needs a small rez reserve before advancing"],
    });
  }
  return createPlanStep({
    stepId: `advance_score_card:${action.actionId}`,
    kind: "advance_score_card",
    desiredActionSemantics: ["score.advance_card"],
    rationale: ["advance action progresses a visible score window"],
  });
}

function corpScoreWindowSequence(actionId: string): PlanStep[] {
  return [
    createPlanStep({
      stepId: `build_remote:${actionId}`,
      kind: "build_remote",
      desiredActionSemantics: ["install.card"],
      rationale: ["build or reuse a scoring remote"],
    }),
    createPlanStep({
      stepId: `protect_remote:${actionId}`,
      kind: "protect_remote",
      desiredActionSemantics: ["install.card", "corp_window.rez"],
      requiredCapabilities: [
        {
          capabilityId: `remote_protection:${actionId}`,
          kind: "remote_protection",
          side: "corp",
          evidence: ["score_window_sequence"],
        },
      ],
      rationale: ["protect the scoring remote"],
    }),
    createPlanStep({
      stepId: `build_rez_reserve:${actionId}`,
      kind: "build_rez_reserve",
      desiredActionSemantics: ["economy.gain_credit", "card_ability.trigger"],
      requiredCapabilities: [
        {
          capabilityId: `rez_reserve:${actionId}`,
          kind: "rez_reserve",
          side: "corp",
          evidence: ["score_window_sequence"],
        },
      ],
      rationale: ["hold credits for a relevant rez window"],
    }),
    createPlanStep({
      stepId: `install_or_prepare_agenda:${actionId}`,
      kind: "install_or_prepare_agenda",
      desiredActionSemantics: ["install.card"],
      rationale: ["prepare an agenda or scoreable card"],
    }),
    createPlanStep({
      stepId: `advance_score_card:${actionId}`,
      kind: "advance_score_card",
      desiredActionSemantics: ["score.advance_card"],
      rationale: ["advance the score card"],
    }),
    createPlanStep({
      stepId: `score_agenda:${actionId}`,
      kind: "score_agenda",
      desiredActionSemantics: ["score.agenda"],
      rationale: ["score when the agenda is ready"],
    }),
  ];
}

function serverHasUnrezzedIce(playerView: PlayerView, serverId: string): boolean {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  return server?.ice.some((ice) => ice.rezzed !== true) === true;
}

function runnerBreakerCoverageStep(
  context: TacticalPlanBuildContext,
  serverId: string,
): PlanStep {
  const input = context.input;
  const missingCoverage = missingBreakerCoverageKind(input.playerView, serverId);
  const deckState = deckCoverageStateForRequiredCoverage(context, missingCoverage);
  const deckInventoryEntry = bestDeckBreakerForRequiredCoverage(
    context,
    missingCoverage,
  );
  const memoryAvailable =
    context.deckCapabilities?.runner?.memoryProfile.memoryAvailable ??
    (input.playerView.own.memoryUsed !== undefined &&
    input.playerView.own.memoryLimit !== undefined
      ? Math.max(0, input.playerView.own.memoryLimit - input.playerView.own.memoryUsed)
      : undefined);
  const matchingHandBreaker = runnerHandBreakerForCoverage(
    input.playerView,
    missingCoverage,
  );
  if (deckState?.installed) {
    return createPlanStep({
      stepId: `run_target:${serverId}`,
      kind: "run_target",
      desiredActionSemantics: ["run.start"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability reports installed ${missingCoverage} coverage; retry the target plan`,
      ],
    });
  }
  if (input.legalActions.some(isBreakerInstallAction(input.playerView, missingCoverage))) {
    return createPlanStep({
      stepId: `install_breaker:${serverId}`,
      kind: "install_breaker",
      desiredActionSemantics: ["install.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `visible install action can add ${missingCoverage} coverage`,
      ],
    });
  }
  if (
    deckState?.inHand &&
    memoryAvailable !== undefined &&
    memoryAvailable <= 0
  ) {
    return createPlanStep({
      stepId: `resolve_missing_mu:${serverId}`,
      kind: "resolve_missing_mu",
      desiredActionSemantics: ["install.card", "memory"],
      requiredCapabilities: [
        breakerCoverageCapability(missingCoverage, serverId),
        {
          capabilityId: `mu:${serverId}`,
          kind: "mu",
          side: "runner",
          target: { kind: "capability", id: "memory" },
          evidence: [`memory_available:${memoryAvailable}`],
        },
      ],
      rationale: [
        `matching ${missingCoverage} breaker is in hand but MU is blocked`,
        "deck_capability:breaker_present_but_mu_blocked",
      ],
    });
  }
  if (
    (matchingHandBreaker || deckState?.inHand) &&
    input.legalActions.some((action) => action.type === "gain_credit")
  ) {
    const installCost = deckInventoryEntry?.installCost ?? matchingHandBreaker?.installCost;
    return createPlanStep({
      stepId: `gain_credits:${serverId}`,
      kind: "gain_credits",
      desiredActionSemantics: ["economy.gain_credit"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        installCost !== undefined && installCost > input.playerView.own.credits
          ? `matching ${missingCoverage} breaker is already in hand; needs ${installCost} credits before install`
          : `matching ${missingCoverage} breaker is already in hand; credits are needed before install`,
        matchingHandBreaker
          ? `hand_breaker:${matchingHandBreaker.definitionId ?? matchingHandBreaker.title ?? "unknown"}`
          : "deck_capability:breaker_in_hand",
      ],
    });
  }
  if (deckState?.searchableNow) {
    return createPlanStep({
      stepId: `search_for_answer:${serverId}`,
      kind: "search_for_answer",
      desiredActionSemantics: [
        "setup.program_search",
        "breaker_search",
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has ${missingCoverage} coverage and legal search access`,
      ],
    });
  }
  if (deckState?.inDeckKnown) {
    return createPlanStep({
      stepId: `draw_for_answer:${serverId}`,
      kind: "draw_for_answer",
      desiredActionSemantics: ["draw.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has ${missingCoverage} coverage but no legal search access`,
        "deck_capability:draw_only",
      ],
    });
  }
  if (deckState?.missing && deckCapabilityHasDeckSnapshot(context)) {
    return createPlanStep({
      stepId: `pivot_to_alternative:${serverId}`,
      kind: "pivot_to_alternative",
      desiredActionSemantics: [],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `deck capability has no ${missingCoverage} coverage; do not blind-search`,
        "deck_capability:coverage_not_in_deck",
      ],
    });
  }
  const legalAnswerRole = bestLegalCoverageAnswerRole(input, missingCoverage);
  if (legalAnswerRole === "direct_breaker_install") {
    return createPlanStep({
      stepId: `install_breaker:${serverId}`,
      kind: "install_breaker",
      desiredActionSemantics: ["install.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `legal breaker install can cover ${missingCoverage}`,
        "coverage_answer_role:direct_breaker_install",
      ],
    });
  }
  if (
    legalAnswerRole === "program_search" ||
    legalAnswerRole === "recovery_answer"
  ) {
    return createPlanStep({
      stepId: `search_for_answer:${serverId}`,
      kind: "search_for_answer",
      desiredActionSemantics: [
        "card_ability.trigger",
        "card_ability.unknown",
        "play.runner_event",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `legal search or recovery action can find ${missingCoverage} coverage`,
        `coverage_answer_role:${legalAnswerRole}`,
      ],
    });
  }
  if (legalAnswerRole === "search_engine_setup") {
    return createPlanStep({
      stepId: `setup_search_engine:${serverId}`,
      kind: "setup_search_engine",
      desiredActionSemantics: ["install.card"],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        `legal search engine setup can prepare ${missingCoverage} coverage`,
        "coverage_answer_role:search_engine_setup",
      ],
    });
  }
  if (
    legalAnswerRole === "draw_for_answer" ||
    legalAnswerRole === "basic_draw_fallback"
  ) {
    return createPlanStep({
      stepId: `draw_for_answer:${serverId}`,
      kind: "draw_for_answer",
      desiredActionSemantics: [
        "play.runner_event",
        "card_ability.trigger",
        "card_ability.unknown",
        "draw.card",
      ],
      requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
      rationale: [
        legalAnswerRole === "draw_for_answer"
          ? `legal draw action can dig for ${missingCoverage} coverage`
          : `basic draw is the fallback path toward ${missingCoverage} coverage`,
        `coverage_answer_role:${legalAnswerRole}`,
      ],
    });
  }
  return createPlanStep({
    stepId: `gain_credits:${serverId}`,
    kind: "gain_credits",
    desiredActionSemantics: ["economy.gain_credit"],
    requiredCapabilities: [breakerCoverageCapability(missingCoverage, serverId)],
    rationale: [
      `no ${missingCoverage} answer action is visible; credits preserve future options`,
    ],
  });
}

function breakerCoverageCapability(
  kind: RequiredCapabilityKind,
  serverId: string,
): RequiredCapability {
  return {
    capabilityId: `breaker_coverage:${serverId}`,
    kind,
    side: "runner",
    target: { kind: "server", id: serverId },
    evidence: [`server:${serverId}`, `missing_coverage:${kind}`],
  };
}

function deckCoverageStateForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
) {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  return coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
}

function bestDeckBreakerForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
) {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  if (!coverage) return undefined;
  const inventory = context.deckCapabilities?.runner?.breakerInventory ?? [];
  return inventory.find((breaker) =>
    breaker.coverage.includes(coverage) ||
    breaker.coverage.includes("universal"),
  );
}

function coveragePlanStatusForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
): PlanLifecycle {
  return deckCoverageStateForRequiredCoverage(context, requiredCoverage)?.missing &&
    deckCapabilityHasDeckSnapshot(context)
    ? "blocked"
    : "active";
}

function deckCapabilityHasDeckSnapshot(context: TacticalPlanBuildContext): boolean {
  return context.deckCapabilities?.evidence.includes("deck_snapshot:present") === true;
}

function deckCapabilityEvidenceForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
): string[] {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  const state = coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
  if (!coverage || !state) return [];
  if (state.missing && !deckCapabilityHasDeckSnapshot(context)) return [];
  const status = state.installed
    ? "installed"
    : state.inHand
      ? "in_hand"
      : state.searchableNow
        ? "in_deck/searchable"
        : state.inDeckKnown
          ? "in_deck/draw_only"
          : "missing";
  return [`deck_capability:breaker_${coverage}=${status}`];
}

function bestLegalCoverageAnswerRole(
  input: AiDecisionInput,
  requiredCoverage: RequiredCapabilityKind,
): CoverageAnswerRole | undefined {
  const roles = input.legalActions
    .map((action) =>
      coverageAnswerRoleForLegalAction(input, action, requiredCoverage),
    )
    .filter(
      (role): role is CoverageAnswerRole =>
        role !== undefined && role !== "not_coverage_answer",
    )
    .sort(
      (left, right) =>
        coverageAnswerRolePriority(right) - coverageAnswerRolePriority(left),
    );
  return roles[0];
}

function coverageAnswerRoleForLegalAction(
  input: AiDecisionInput,
  action: LegalAction,
  requiredCoverage: RequiredCapabilityKind,
): CoverageAnswerRole | undefined {
  if (action.side !== "runner") return undefined;
  const sourceCard = visibleCardForAction(input.playerView, action);
  if (
    action.type === "install_card" &&
    sourceCard &&
    cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
  ) {
    return "direct_breaker_install";
  }
  const sourceRole = sourceCard
    ? cardPlanRoleForCoverageSearch(sourceCard)
    : undefined;
  if (sourceRole?.includes("search")) {
    return action.type === "install_card"
      ? "search_engine_setup"
      : "program_search";
  }
  if (sourceRole?.includes("draw") && action.type !== "install_card") {
    return "draw_for_answer";
  }
  if (
    action.type === "trigger_ability" ||
    action.type === "activated_card_ability"
  ) {
    const targetDefinitionId = recoveryTargetDefinitionId(input, action);
    const sourceText = [
      sourceCard?.title,
      sourceCard?.definitionId,
      sourceCard?.rulesText,
      action.label,
    ].filter(Boolean).join(" ").toLowerCase();
    if (
      /recovery|trash|heap|junkyard|bbs/.test(sourceText) ||
      targetDefinitionId !== undefined
    ) {
      const targetRole = targetDefinitionId
        ? cardDefinitionPlanRoleForCoverageSearch(targetDefinitionId)
        : "unknown";
      if (
        targetDefinitionId !== undefined &&
        cardDefinitionProvidesBreakerCoverage(targetDefinitionId, requiredCoverage)
      ) return "recovery_answer";
      if (targetRole.includes("search") || targetRole.includes("draw")) {
        return "recovery_answer";
      }
    }
  }
  if (action.type === "draw_card") return "basic_draw_fallback";
  return undefined;
}

function deckCapabilityBlockersForRequiredCoverage(
  context: TacticalPlanBuildContext,
  requiredCoverage: RequiredCapabilityKind,
  serverId: string,
): PlanBlocker[] {
  const coverage = deckCoverageKindForRequiredCapability(requiredCoverage);
  const state = coverage
    ? context.deckCapabilities?.runner?.breakerCoverageMatrix[coverage]
    : undefined;
  if (!coverage || !state) return [];
  if (state.missing && deckCapabilityHasDeckSnapshot(context)) {
    return [
      {
        blockerId: `deck_missing_${coverage}_coverage:${serverId}`,
        kind: missingCoverageBlockerKind(coverage),
        severity: coverage === "special" || coverage === "subtype_limited" ? "soft" : "hard",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [
          `deck_capability:breaker_${coverage}=missing`,
          "coverage_not_in_deck",
        ],
      },
      {
        blockerId: `coverage_not_in_deck:${serverId}:${coverage}`,
        kind: "coverage_not_in_deck",
        severity: "hard",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [`missing_coverage:${coverage}`],
      },
    ];
  }
  const memoryAvailable = context.deckCapabilities?.runner?.memoryProfile.memoryAvailable;
  if (state.inHand && memoryAvailable !== undefined && memoryAvailable <= 0) {
    return [
      {
        blockerId: `breaker_present_but_mu_blocked:${serverId}:${coverage}`,
        kind: "breaker_present_but_mu_blocked",
        severity: "soft",
        target: { kind: "server", id: serverId },
        removalStepKind: "resolve_missing_mu",
        evidence: [
          `deck_capability:breaker_${coverage}=in_hand`,
          `memory_available:${memoryAvailable}`,
        ],
      },
      {
        blockerId: `missing_mu:${serverId}:${coverage}`,
        kind: "missing_mu",
        severity: "soft",
        target: { kind: "capability", id: "memory" },
        removalStepKind: "resolve_missing_mu",
        evidence: [`memory_available:${memoryAvailable}`],
      },
    ];
  }
  if (state.inDeckKnown && !state.searchableNow && !state.inHand && !state.installed) {
    return [
      {
        blockerId: `search_target_not_available:${serverId}:${coverage}`,
        kind: "search_target_not_available",
        severity: "soft",
        target: { kind: "server", id: serverId },
        removalStepKind: "draw_for_answer",
        evidence: [
          `deck_capability:breaker_${coverage}=in_deck/draw_only`,
          "searchable_now:false",
        ],
      },
    ];
  }
  return [];
}

function deckCoverageKindForRequiredCapability(
  requiredCoverage: RequiredCapabilityKind,
): BreakerCoverageKind | undefined {
  switch (requiredCoverage) {
    case "breaker_wall":
      return "wall";
    case "breaker_code_gate":
      return "code_gate";
    case "breaker_sentry":
      return "sentry";
    case "breaker_ap":
      return "ap";
    case "breaker_trace":
      return "trace";
    case "breaker_universal":
      return "universal";
    case "breaker_coverage":
      return "special";
    default:
      return undefined;
  }
}

function missingCoverageBlockerKind(
  coverage: BreakerCoverageKind,
): PlanBlockerKind {
  switch (coverage) {
    case "wall":
      return "missing_wall_coverage";
    case "code_gate":
      return "missing_code_gate_coverage";
    case "sentry":
      return "missing_sentry_coverage";
    case "ap":
      return "missing_ap_coverage";
    case "trace":
      return "missing_trace_coverage";
    case "universal":
    case "subtype_limited":
    case "special":
      return "missing_breaker_coverage";
  }
}

function missingBreakerCoverageKind(
  playerView: PlayerView,
  serverId: string,
): RequiredCapabilityKind {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  if (!server) return "breaker_coverage";
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    playerView.own.rig ?? [],
    playerView.own.credits,
    server.root,
  );
  const preciseMissingCoverage = coverageKindForAssessment(assessment);
  if (preciseMissingCoverage) return preciseMissingCoverage;
  const blockedIceIndex =
    assessment.unbreakableIceIndex ?? assessment.unpayableIceIndex;
  const blockedIce =
    blockedIceIndex !== undefined ? server.ice[blockedIceIndex] : undefined;
  const rezzedIce = blockedIce?.known && blockedIce.rezzed === true
    ? blockedIce
    : server.ice.find((ice) => ice.known && ice.rezzed === true);
  if (!rezzedIce) return "breaker_coverage";
  const text = [
    rezzedIce.title,
    rezzedIce.definitionId,
    ...(rezzedIce.subtypes ?? []),
    rezzedIce.rulesText,
  ].filter(Boolean).join(" ").toLowerCase();
  if (text.includes("wall") || text.includes("barrier")) return "breaker_wall";
  if (text.includes("code gate") || text.includes("codegate")) {
    return "breaker_code_gate";
  }
  if (text.includes("sentry")) return "breaker_sentry";
  if (text.includes("ap")) return "breaker_ap";
  if (text.includes("trace")) return "breaker_trace";
  return "breaker_universal";
}

function coverageKindForAssessment(
  assessment: ReturnType<typeof assessKnownRezzedIcePath>,
): RequiredCapabilityKind | undefined {
  const [coverage] = assessment.missingCoverage ?? [];
  switch (coverage) {
    case "wall":
      return "breaker_wall";
    case "code_gate":
      return "breaker_code_gate";
    case "sentry":
      return "breaker_sentry";
    case "ap":
      return "breaker_ap";
    case "trace":
      return "breaker_trace";
    case "unknown_special":
      return "breaker_universal";
    default:
      return undefined;
  }
}

function runNeedsBreakerCoverage(
  playerView: PlayerView,
  serverId: string | undefined,
): boolean {
  if (!serverId) return false;
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  if (!server) return false;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    playerView.own.rig ?? [],
    playerView.own.credits,
    server.root,
  );
  return assessment.assessedKnownIceCount > 0 && !assessment.canReachAccess;
}

function remoteRunHasNoRootValue(
  playerView: PlayerView,
  serverId: string | undefined,
): boolean {
  if (!serverId || !isRemoteServer(serverId)) return false;
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  return (server?.root.length ?? 0) === 0;
}

function isBreakerInstallAction(
  playerView: PlayerView,
  requiredCoverage: RequiredCapabilityKind = "breaker_coverage",
) {
  return (action: LegalAction): boolean => {
    if (action.type !== "install_card") return false;
    const sourceCard = visibleCardByInstanceId(playerView, String(action.source));
    return sourceCard
      ? cardProvidesBreakerCoverage(sourceCard, requiredCoverage)
      : /breaker|fracter|decoder|killer/i.test(action.label);
  };
}

function cardLooksLikeBreaker(card: VisibleCard): boolean {
  return (
    card.type === "program" &&
    ((card.subtypes ?? []).some((subtype) =>
      /breaker|icebreaker|fracter|decoder|killer/i.test(subtype),
    ) ||
      /breaker|icebreaker/i.test(card.title ?? "") ||
      /breaker|icebreaker/i.test(card.definitionId ?? ""))
  );
}

function runnerHandBreakerForCoverage(
  playerView: PlayerView,
  requiredCoverage: RequiredCapabilityKind,
): VisibleCard | undefined {
  return playerView.own.gripOrHq.find((card) =>
    card.known && cardProvidesBreakerCoverage(card, requiredCoverage),
  );
}

function cardProvidesBreakerCoverage(
  card: VisibleCard,
  requiredCoverage: RequiredCapabilityKind,
): boolean {
  if (!cardLooksLikeBreaker(card)) return false;
  if (
    requiredCoverage === "breaker_coverage" ||
    requiredCoverage === "breaker_universal"
  ) {
    return true;
  }
  const text = cardCoverageSearchText(card);
  if (cardLooksLikeUniversalBreaker(text)) return true;
  switch (requiredCoverage) {
    case "breaker_wall":
      return /fracter|wall|barrier/.test(text);
    case "breaker_code_gate":
      return /decoder|code gate|codegate/.test(text);
    case "breaker_sentry":
      return /killer|sentry/.test(text);
    case "breaker_ap":
      return /\bap\b|anti-personnel/.test(text);
    case "breaker_trace":
      return /trace/.test(text);
    default:
      return false;
  }
}

function cardCoverageSearchText(card: VisibleCard): string {
  return [
    card.title,
    card.definitionId,
    ...(card.subtypes ?? []),
    card.rulesText,
  ].filter(Boolean).join(" ").toLowerCase();
}

function cardLooksLikeUniversalBreaker(text: string): boolean {
  return (
    /break (?:an? |one |\d+ )?ice subroutine/.test(text) ||
    /break(?:s)? .*subroutine/.test(text) && !/wall|barrier|code gate|codegate|sentry/.test(text)
  );
}

function runnerHasConcreteFundingNeed(
  input: AiDecisionInput,
  blockedRemoteRuns: readonly LegalAction[],
): boolean {
  if (input.playerView.own.credits <= 3) return true;
  return blockedRemoteRuns.length === 0 &&
    input.legalActions.some(
      (action) =>
        action.type === "start_run" &&
        isRemoteServer(actionServerId(action)) &&
        actionCreditCost(action) >= input.playerView.own.credits,
    );
}

function visibleSourceServerId(
  playerView: PlayerView,
  action: LegalAction,
): string | undefined {
  const source = String(action.source);
  for (const server of playerView.servers) {
    if (
      server.root.some((card) => card.instanceId === source) ||
      server.ice.some((card) => card.instanceId === source)
    ) {
      return server.id;
    }
  }
  return undefined;
}

function visibleCardByInstanceId(
  playerView: PlayerView,
  instanceId: string,
): VisibleCard | undefined {
  const ownCards = [
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...(playerView.own.rig ?? []),
    ...playerView.own.scoreArea,
  ];
  const serverCards = playerView.servers.flatMap((server) => [
    ...server.ice,
    ...server.root,
  ]);
  return [...ownCards, ...serverCards].find(
    (card) => card.instanceId === instanceId,
  );
}

function visibleCardForAction(
  playerView: PlayerView,
  action: LegalAction,
): VisibleCard | undefined {
  const source = String(action.source ?? "");
  const byInstance = visibleCardByInstanceId(playerView, source);
  if (byInstance) return byInstance;
  const payload = action.payload ?? {};
  const definitionId =
    typeof payload.cardDefinitionId === "string"
      ? payload.cardDefinitionId
      : typeof payload.sourceDefinitionId === "string"
        ? payload.sourceDefinitionId
        : typeof payload.sourceCardDefinitionId === "string"
          ? payload.sourceCardDefinitionId
          : source.startsWith("onr_") || source.startsWith("simple_")
            ? source
            : undefined;
  const allVisibleCards = [
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...(playerView.own.rig ?? []),
    ...playerView.own.scoreArea,
    ...playerView.servers.flatMap((server) => [...server.ice, ...server.root]),
  ];
  if (definitionId) {
    const byDefinition = allVisibleCards.find(
      (card) => card.definitionId === definitionId,
    );
    if (byDefinition) return byDefinition;
  }
  return allVisibleCards.find(
    (card) =>
      card.title !== undefined &&
      action.label.toLowerCase().includes(card.title.toLowerCase()),
  );
}

function remoteIsProtected(playerView: PlayerView, serverId: string): boolean {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  return (server?.ice.length ?? 0) > 0;
}

function corpRemoteContestabilityAssessment(
  playerView: PlayerView,
  serverId: string,
): { contestable: boolean; evidence: string[] } | undefined {
  const server = playerView.servers.find((candidate) => candidate.id === serverId);
  if (!server || server.ice.length === 0) return undefined;
  const runnerRig = playerView.opponent.rig ?? [];
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    runnerRig,
    playerView.opponent.credits,
    server.root,
  );
  if (assessment.assessedKnownIceCount <= 0) return undefined;
  const contestable =
    assessment.canReachAccess === true && assessment.creditsAfterPath >= 0;
  return {
    contestable,
    evidence: [
      `remote_contestable_by_runner:${contestable}`,
      `runner_credits:${playerView.opponent.credits}`,
      `runner_visible_rig_count:${runnerRig.length}`,
      `assessed_known_ice_count:${assessment.assessedKnownIceCount}`,
      `can_reach_access:${assessment.canReachAccess}`,
      `credits_after_path:${assessment.creditsAfterPath}`,
      ...(assessment.visibleBreakCost !== undefined
        ? [`visible_break_cost:${assessment.visibleBreakCost}`]
        : []),
      ...(assessment.noAccessReason
        ? [`no_access_reason:${assessment.noAccessReason}`]
        : []),
    ],
  };
}

function advanceCompletesScore(
  playerView: PlayerView,
  action: LegalAction,
): boolean {
  const sourceCard = visibleCardByInstanceId(playerView, String(action.source));
  if (!sourceCard) return false;
  const currentAdvancement = sourceCard.advancementCounters ?? 0;
  const requirement = sourceCard.advancementRequirement;
  return requirement !== undefined && currentAdvancement + 1 >= requirement;
}

function corpHasSafeScoreAlternative(
  input: AiDecisionInput,
  actionToSkip: LegalAction,
): boolean {
  return input.legalActions.some(
    (action) =>
      action.actionId !== actionToSkip.actionId &&
      (action.type === "gain_credit" ||
        action.type === "draw_card" ||
        action.type === "install_card" ||
        action.type === "rez_ice" ||
        action.type === "score_agenda"),
  );
}
