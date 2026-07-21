import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import { redactedDeckCapabilityFacts } from "./deck-capabilities";
import { redactedMergedTacticalGoalFacts } from "./decision/tactical-goal-merge";
import { redactedRunnerHandDevelopmentFacts } from "./runner-hand-development";
import { redactedRunnerTacticalGoalFacts } from "./runner-tactical-goals";
import { redactedRemoteDoctrineFacts } from "./remote-doctrine-profile";
import { createAiHintsByCard } from "./ai-hints";
import { getTacticalPlanMemorySnapshot } from "./plans/plan-memory";
import { getPlanPortfolioMemorySnapshot } from "./plans/plan-portfolio-memory";
import {
  aggregatePlanActionContributions,
  buildPlanPortfolioActionContributions,
  buildPlanPortfolio,
  planPortfolioEntryCanAct,
  planPortfolioEntryForPlan,
  planPortfolioFundingStep,
  planPortfolioTurnKey,
  redactedPlanActionContributionFacts,
  redactedPlanPortfolioFacts,
} from "./plans/plan-portfolio";
import {
  redactedAccessCommitmentFacts,
  redactedAccessOutcomeMemoryFacts,
  redactedCorpStrategicIntentFacts,
  redactedRunnerEconomyPostureFacts,
  redactedRunnerRunTargetEvaluationFacts,
  redactedRunnerStrategicIntentFacts,
  redactedStrategicIntentStateFacts,
} from "./plans/tactical-plan-redaction";
import { visibleCardForAction } from "./plans/tactical-plan-visible-cards";
import { buildCorpTacticalPlans } from "./plans/tactical-plan-corp-plans";
import { buildRunnerTacticalPlans } from "./plans/tactical-plan-runner-plans";
import { publishTacticalPlanCreditDemands } from "./plans/tactical-plan-credit-demands";
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
  TacticalPlanRuntimeResult,
} from "./plans/tactical-plan-types";

const AI_HINTS_BY_CARD = createAiHintsByCard();
const TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES: TacticalPlanCreditValueDependencies =
  {
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
  getPlanContinuityMemorySnapshot,
  getTacticalPlanMemorySnapshot,
  rememberTacticalPlanRuntime,
  resetTacticalPlanMemory,
} from "./plans/plan-memory";
export type { PlanContinuityMemorySnapshot } from "./plans/plan-memory";
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
  TacticalPlanRuntimeResult,
} from "./plans/tactical-plan-types";

// TacticalPlans are a mapping layer: they organize TacticalGoals, capabilities,
// memory and ActionSemanticCandidates onto existing LegalActions. New card
// semantics belong in action/card semantic modules, not in plan matching.
export function buildTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlan[] {
  const plans =
    context.input.side === "runner"
      ? buildRunnerTacticalPlans(
          context,
          TACTICAL_PLAN_CREDIT_VALUE_DEPENDENCIES,
        )
      : buildCorpTacticalPlans(context);
  return plans.map((plan) =>
    publishTacticalPlanCreditDemands(
      plan,
      context.input.playerView.own.credits,
    ),
  );
}
export function evaluateTacticalPlans(
  context: TacticalPlanBuildContext,
): TacticalPlanRuntimeResult {
  const previousPlan =
    context.previousPlan ?? getTacticalPlanMemorySnapshot(context.input);
  const deckCapabilitiesUsed = context.deckCapabilities
    ? redactedDeckCapabilityFacts(context.deckCapabilities)
    : [];
  const strategicIntentStateUsed = context.strategicIntentState
    ? redactedStrategicIntentStateFacts(context.strategicIntentState)
    : [];
  const corpStrategicIntentUsed = context.corpStrategicIntent
    ? redactedCorpStrategicIntentFacts(context.corpStrategicIntent)
    : [];
  const remoteDoctrineUsed = context.remoteDoctrine
    ? redactedRemoteDoctrineFacts(context.remoteDoctrine)
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
  const runnerHandDevelopmentEvaluationsUsed =
    context.runnerHandDevelopmentEvaluations
      ? redactedRunnerHandDevelopmentFacts(
          context.runnerHandDevelopmentEvaluations,
        )
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
  const previousPlanPortfolio =
    context.previousPlanPortfolio ??
    getPlanPortfolioMemorySnapshot(context.input);
  const rawPlans = buildTacticalPlans({
    ...context,
    ...(previousPlan ? { previousPlan } : {}),
    ...(previousPlanPortfolio ? { previousPlanPortfolio } : {}),
  });
  const progression = progressTacticalPlans(
    rawPlans,
    previousPlan,
    context.input,
  );
  const planAlternatives = rankTacticalPlans(progression.plans);
  const blockedPlans = planAlternatives.filter(
    (plan) => plan.status === "blocked",
  );
  const candidates = context.candidates ?? [];
  const planPortfolio = buildPlanPortfolio({
    input: context.input,
    tacticalPlans: planAlternatives,
    candidates,
    ...(previousPlanPortfolio ? { previous: previousPlanPortfolio } : {}),
    turnKey: planPortfolioTurnKey(context.input),
  });
  const interruptPlan = planPortfolio.interrupt
    ? planAlternatives.find(
        (plan) => plan.planId === planPortfolio.interrupt?.sourcePlanId,
      )
    : undefined;
  const interruptCurrentMapping = interruptPlan
    ? mapPlanStepToLegalActions(
        interruptPlan,
        interruptPlan.currentStep,
        candidates,
        context.input,
      )
    : undefined;
  const interruptFundingStep =
    interruptPlan && planPortfolio.interrupt
      ? planPortfolioFundingStep(planPortfolio.interrupt, candidates)
      : undefined;
  const interruptFundingMapping =
    interruptPlan && interruptFundingStep
      ? mapPlanStepToLegalActions(
          interruptPlan,
          interruptFundingStep,
          candidates,
          context.input,
        )
      : undefined;
  const interruptMapping =
    interruptCurrentMapping?.status === "matched"
      ? interruptCurrentMapping
      : (interruptFundingMapping ?? interruptCurrentMapping);
  const interruptCanAct =
    interruptMapping?.status === "matched" &&
    interruptMapping.legalActions.length > 0;
  const planPortfolioUsed = [
    ...redactedPlanPortfolioFacts(planPortfolio),
    ...(planPortfolio.interrupt && !interruptCanAct
      ? [
          `plan_portfolio_unmappable_interrupt_released:${planPortfolio.interrupt.planType}`,
        ]
      : []),
  ];
  const planActionContributionScores = aggregatePlanActionContributions({
    portfolio: planPortfolio,
    contributions: buildPlanPortfolioActionContributions(planPortfolio),
  });
  const planActionContributionsUsed = redactedPlanActionContributionFacts(
    planActionContributionScores,
  );
  const foregroundPlan = planPortfolio.foreground
    ? planAlternatives.find(
        (plan) => plan.planId === planPortfolio.foreground?.sourcePlanId,
      )
    : undefined;
  const portfolioOrderedPlans = [
    ...(interruptPlan ? [interruptPlan] : []),
    ...(foregroundPlan ? [foregroundPlan] : []),
    ...planAlternatives,
  ].filter(
    (plan, index, plans) =>
      plans.findIndex((candidate) => candidate.planId === plan.planId) ===
      index,
  );
  for (const plan of portfolioOrderedPlans) {
    const portfolioEntry = planPortfolioEntryForPlan(planPortfolio, plan);
    const releasedSuspendedEntry =
      portfolioEntry?.lifecycle === "suspended" &&
      !interruptCanAct &&
      planPortfolioEntryCanAct({ ...portfolioEntry, lifecycle: "active" });
    if (
      portfolioEntry &&
      !planPortfolioEntryCanAct(portfolioEntry) &&
      !releasedSuspendedEntry
    ) {
      continue;
    }
    if (!planCanMapToCurrentAction(plan)) continue;
    const currentMapping = mapPlanStepToLegalActions(
      plan,
      plan.currentStep,
      candidates,
      context.input,
    );
    const fundingStep = portfolioEntry
      ? planPortfolioFundingStep(portfolioEntry, candidates)
      : undefined;
    const fundingMapping = fundingStep
      ? mapPlanStepToLegalActions(plan, fundingStep, candidates, context.input)
      : undefined;
    const mapping =
      currentMapping.status === "matched" &&
      plan.currentStep.kind !== "gain_credits"
        ? currentMapping
        : fundingMapping?.status === "matched"
          ? fundingMapping
          : currentMapping;
    if (mapping.status === "matched" && mapping.legalActions.length > 0) {
      return {
        planPortfolio,
        planPortfolioUsed,
        planActionContributionsUsed,
        ...(previousPlan ? { previousPlan } : {}),
        ...(deckCapabilitiesUsed.length > 0 ? { deckCapabilitiesUsed } : {}),
        ...(strategicIntentStateUsed.length > 0
          ? { strategicIntentStateUsed }
          : {}),
        ...(corpStrategicIntentUsed.length > 0
          ? { corpStrategicIntentUsed }
          : {}),
        ...(remoteDoctrineUsed.length > 0 ? { remoteDoctrineUsed } : {}),
        ...(tacticalGoalsUsed.length > 0 ? { tacticalGoalsUsed } : {}),
        ...(runnerStrategicIntentUsed.length > 0
          ? { runnerStrategicIntentUsed }
          : {}),
        ...(runnerRunTargetEvaluationsUsed.length > 0
          ? { runnerRunTargetEvaluationsUsed }
          : {}),
        ...(runnerEconomyPostureUsed.length > 0
          ? { runnerEconomyPostureUsed }
          : {}),
        ...(runnerHandDevelopmentEvaluationsUsed.length > 0
          ? { runnerHandDevelopmentEvaluationsUsed }
          : {}),
        ...(runnerTacticalGoalsUsed.length > 0
          ? { runnerTacticalGoalsUsed }
          : {}),
        ...(accessCommitmentUsed.length > 0 ? { accessCommitmentUsed } : {}),
        ...(accessOutcomeMemoryUsed.length > 0
          ? { accessOutcomeMemoryUsed }
          : {}),
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
    planPortfolio,
    planPortfolioUsed,
    planActionContributionsUsed,
    ...(previousPlan ? { previousPlan } : {}),
    ...(deckCapabilitiesUsed.length > 0 ? { deckCapabilitiesUsed } : {}),
    ...(strategicIntentStateUsed.length > 0
      ? { strategicIntentStateUsed }
      : {}),
    ...(corpStrategicIntentUsed.length > 0 ? { corpStrategicIntentUsed } : {}),
    ...(remoteDoctrineUsed.length > 0 ? { remoteDoctrineUsed } : {}),
    ...(tacticalGoalsUsed.length > 0 ? { tacticalGoalsUsed } : {}),
    ...(runnerStrategicIntentUsed.length > 0
      ? { runnerStrategicIntentUsed }
      : {}),
    ...(runnerRunTargetEvaluationsUsed.length > 0
      ? { runnerRunTargetEvaluationsUsed }
      : {}),
    ...(runnerEconomyPostureUsed.length > 0
      ? { runnerEconomyPostureUsed }
      : {}),
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
