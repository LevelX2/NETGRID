import {
  type AiDecisionInput,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import { redactedDeckCapabilityFacts } from "./deck-capabilities";
import { redactedMergedTacticalGoalFacts } from "./decision/tactical-goal-merge";
import { redactedRunnerHandDevelopmentFacts } from "./runner-hand-development";
import { redactedRunnerTacticalGoalFacts } from "./runner-tactical-goals";
import { createAiHintsByCard } from "./ai-hints";
import { getTacticalPlanMemorySnapshot } from "./plans/plan-memory";
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
  visibleCardForAction,
} from "./plans/tactical-plan-visible-cards";
import { buildCorpTacticalPlans } from "./plans/tactical-plan-corp-plans";
import { buildRunnerTacticalPlans } from "./plans/tactical-plan-runner-plans";
import type { TacticalPlanCreditValueDependencies } from "./plans/tactical-plan-action-values";
import { mapPlanStepToLegalActionsWithDependencies } from "./plans/tactical-plan-legal-action-mapping";
import {
  planCanMapToCurrentAction,
  progressTacticalPlans,
  rankTacticalPlans,
} from "./plans/tactical-plan-progression";
import type {
  PlanStep,
  TacticalPlan,
  TacticalPlanBuildContext,
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
    ? buildRunnerTacticalPlans(context, TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES)
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
  return mapPlanStepToLegalActionsWithDependencies(
    plan,
    step,
    candidates,
    input,
    TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
  );
}
