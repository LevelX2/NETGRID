import {
  createPracticalMicroCandidatesContext,
  type PracticalMicroCandidatesContextDependencies,
} from "./practical-micro-candidates-context";
import {
  createSemanticRuntimeDebugContext,
  type SemanticRuntimeDebugContextDependencies,
} from "./semantic-runtime-debug-context";
import {
  createSemanticRuntimeDecisionContext,
  type SemanticRuntimeDecisionContextDependencies,
} from "./semantic-runtime-decision-context";

export type SemanticRuntimeDecisionCompositionDependencies =
  PracticalMicroCandidatesContextDependencies &
    SemanticRuntimeDebugContextDependencies &
    Omit<
      SemanticRuntimeDecisionContextDependencies,
      | "practicalMicroRuntimeCandidates"
      | "semanticRuntimeCoverageSelectionDebug"
      | "semanticRuntimeDecisionDebug"
    >;

export function createSemanticRuntimeDecisionComposition(
  dependencies: SemanticRuntimeDecisionCompositionDependencies,
) {
  const { practicalMicroRuntimeCandidates } =
    createPracticalMicroCandidatesContext({
      visibleSourceCard: dependencies.visibleSourceCard,
      isVisibleIcebreakerProgram: dependencies.isVisibleIcebreakerProgram,
      visibleBreakerCardCanAddressIce:
        dependencies.visibleBreakerCardCanAddressIce,
      serverId: dependencies.serverId,
      knownPathAssessment: dependencies.knownPathAssessment,
      rolesForAction: dependencies.rolesForAction,
      scoreTerminalWindow: dependencies.scoreTerminalWindow,
      actionTypeIsReactive: dependencies.actionTypeIsReactive,
      runnerRunTargets: dependencies.runnerRunTargets,
      runnerRunTargetPlausibleForMultiRun:
        dependencies.runnerRunTargetPlausibleForMultiRun,
      runnerRunTargetHighPayoff: dependencies.runnerRunTargetHighPayoff,
    });

  const {
    semanticRuntimeDecisionDebug,
    semanticRuntimeCoverageSelectionDebug,
  } = createSemanticRuntimeDebugContext({
    scoreBreakdown: dependencies.scoreBreakdown,
    visibleSourceCard: dependencies.visibleSourceCard,
  });

  return createSemanticRuntimeDecisionContext({
    semanticRuntimeChoices: dependencies.semanticRuntimeChoices,
    semanticRuntimeChoiceIsReactive:
      dependencies.semanticRuntimeChoiceIsReactive,
    buildActionSemanticCandidates: dependencies.buildActionSemanticCandidates,
    getTacticalPlanMemorySnapshot:
      dependencies.getTacticalPlanMemorySnapshot,
    deckCapabilitiesForInput: dependencies.deckCapabilitiesForInput,
    runnerStrategicIntentForInput:
      dependencies.runnerStrategicIntentForInput,
    evaluateRunnerHandDevelopment:
      dependencies.evaluateRunnerHandDevelopment,
    buildRunnerEconomyPosture: dependencies.buildRunnerEconomyPosture,
    evaluateRunnerRunTargets: dependencies.evaluateRunnerRunTargets,
    buildRunnerTacticalGoals: dependencies.buildRunnerTacticalGoals,
    evaluateTacticalPlans: dependencies.evaluateTacticalPlans,
    bestSemanticRuntimeChoice: dependencies.bestSemanticRuntimeChoice,
    bestSemanticRuntimeChoiceForTacticalPlanOverride:
      dependencies.bestSemanticRuntimeChoiceForTacticalPlanOverride,
    tacticalPlanMappedChoice: dependencies.tacticalPlanMappedChoice,
    runnerSelfDamageImmediateWinSemanticChoice:
      dependencies.runnerSelfDamageImmediateWinSemanticChoice,
    semanticRuntimeChoiceWithEvidence:
      dependencies.semanticRuntimeChoiceWithEvidence,
    tacticalPlanMappingOverrideEvidence:
      dependencies.tacticalPlanMappingOverrideEvidence,
    tacticalPlanRuntimeAlignedToChoice:
      dependencies.tacticalPlanRuntimeAlignedToChoice,
    runnerRunOnlyActionAdjustedSemanticChoice:
      dependencies.runnerRunOnlyActionAdjustedSemanticChoice,
    semanticRuntimeCoverageSelectionDebug,
    selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
    rememberTacticalPlanRuntime: dependencies.rememberTacticalPlanRuntime,
    scrubEvidence: dependencies.scrubEvidence,
    semanticRuntimeDecisionDebug,
    practicalMicroRuntimeCandidates,
  });
}
