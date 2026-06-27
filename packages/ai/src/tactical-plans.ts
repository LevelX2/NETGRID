import {
  type AiDecisionInput,
  type LegalAction,
  type PlayerView,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import { accessOutcomeMemoryPlanEvidence } from "./access/access-outcome-memory";
import type {
  DeckCapabilityProfile,
} from "./deck-capabilities";
import { redactedDeckCapabilityFacts } from "./deck-capabilities";
import { evaluateKnownCentralAccessPayoff } from "./known-central-access-payoff";
import { evaluateKnownRemoteAccessPayoff } from "./known-remote-access-payoff";
import { redactedMergedTacticalGoalFacts } from "./decision/tactical-goal-merge";
import { redactedRunnerHandDevelopmentFacts } from "./runner-hand-development";
import {
  redactedRunnerTacticalGoalFacts,
  type RunnerTacticalGoal,
} from "./runner-tactical-goals";
import { createAiHintsByCard } from "./ai-hints";
import { getTacticalPlanMemorySnapshot } from "./plans/plan-memory";
import { accessCommitmentPlanEvidence } from "./plans/tactical-plan-access-commitment";
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
} from "./plans/tactical-plan-server-targets";
import {
  visibleCardByInstanceId,
  visibleCardForAction,
} from "./plans/tactical-plan-visible-cards";
import {
  cardLooksLikeBreaker,
  cardProvidesBreakerCoverage,
} from "./plans/tactical-plan-breaker-cards";
import {
  remoteRunHasNoRootValue,
  runNeedsBreakerCoverage,
} from "./plans/tactical-plan-run-reachability";
import { missingBreakerCoverageKind } from "./plans/tactical-plan-breaker-coverage";
import {
  coveragePlanStatusForRequiredCoverage,
  deckCapabilityBlockersForRequiredCoverage,
  deckCapabilityEvidenceForRequiredCoverage,
} from "./plans/tactical-plan-deck-coverage";
import {
  bankStepMatchesCandidate,
  candidateTargetMatchesPlan,
} from "./plans/tactical-plan-candidate-matching";
import {
  coverageAnswerRoleMatchesStep,
  coverageAnswerRolePriority,
  coverageSearchRequiredCapability,
  isCoverageAnswerStep,
  planRequiredBreakerCoverage,
} from "./plans/tactical-plan-coverage-answers";
import {
  coverageSearchActionFit,
  matchedCoverageSearchRationales,
  rejectedCoverageSearchFalseMatches,
} from "./plans/tactical-plan-coverage-search-fit";
import { buildCorpTacticalPlans } from "./plans/tactical-plan-corp-plans";
import {
  runnerPressureGoalForServer,
  runnerRemoteGoalForServer,
  runnerTacticalGoalEvidence,
  tacticalGoalEvidence,
  tacticalGoalPriorityBoost,
  tacticalGoalScoreBreakdown,
} from "./plans/tactical-plan-goal-evidence";
import { developmentCardStepMatchesAction } from "./plans/tactical-plan-development-card-matching";
import {
  applyRunnerDrawOverflowAdjustments,
  runnerHandBufferPlans,
} from "./plans/tactical-plan-runner-hand-buffer";
import { runnerCreditBasePlans } from "./plans/tactical-plan-runner-credit-base";
import { runnerBreakerCoverageStep } from "./plans/tactical-plan-runner-breaker-coverage-step";
import {
  isRunPlanStep,
  runPlanStepMatchesAction,
} from "./plans/tactical-plan-run-action-matching";
import {
  assessRunnerPressureBudget,
  runnerAdjustedPlanPriority,
  runnerEconomyGoalPriority,
  runnerPressureProbeAllowance,
  runnerRunTargetCurrentStep,
  runnerRunTargetPlanEvidence,
  runnerRunTargetPlanScoreBreakdown,
  runnerRunTargetStepRationale,
} from "./plans/tactical-plan-runner-run-targets";
import {
  runnerHandDevelopmentPlans,
} from "./plans/tactical-plan-runner-hand-development";
import {
  candidateMappingRationale,
  mappingStatusForStep,
} from "./plans/tactical-plan-mapping-helpers";
import {
  actionTypeMatchesStep,
  candidateSemanticsMatchStep,
} from "./plans/tactical-plan-step-semantics";
import {
  legalActionCreditGainForPlan,
  legalActionCreditNetGain,
  type TacticalPlanCreditValueDependencies,
} from "./plans/tactical-plan-action-values";
import { runnerHasConcreteFundingNeed } from "./plans/tactical-plan-runner-funding-need";
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
  const coverageSearchFundingNeed = runnerHasConcreteFundingNeed(input, []);
  const rejectedFalseMatches = rejectedCoverageSearchFalseMatches(
    plan,
    step,
    candidates,
    legalActionsById,
    input,
    coverageSearchFundingNeed,
  );
  const matchedCoverageSearchFits = matchedCoverageSearchRationales(
    plan,
    step,
    matchedCandidates,
    legalActionsById,
    input,
    coverageSearchFundingNeed,
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

function planStepCandidatePriority(
  plan: TacticalPlan,
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction | undefined,
  input: AiDecisionInput,
): number {
  if (!action) return 0;
  if (isCoverageAnswerStep(step)) {
    const fit = coverageSearchActionFit(
      plan,
      step,
      candidate,
      action,
      input,
      runnerHasConcreteFundingNeed(input, []),
    );
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
    const fit = coverageSearchActionFit(
      plan,
      step,
      candidate,
      action,
      input,
      runnerHasConcreteFundingNeed(input, []),
    );
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
    return runPlanStepMatchesAction(step, candidate, action, actionTypeMatchesStep) &&
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
    ...runnerHandBufferPlans(
      context,
      stateVersion,
      runnerGoalEvidence,
      TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
    ),
  );
  plans.push(
    ...runnerHandDevelopmentPlans(context, stateVersion, runnerGoalEvidence),
  );
  plans.push(
    ...runnerCreditBasePlans(
      context,
      stateVersion,
      runnerGoalEvidence,
      TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
    ),
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
