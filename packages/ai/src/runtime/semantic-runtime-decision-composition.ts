import type { VisibleCard } from "@netgrid/shared";
import {
  createPracticalMicroCandidatesContext,
  type PracticalMicroCandidatesContextDependencies,
} from "./practical-micro-candidates-context";
import {
  createSemanticRuntimeDebugContext,
  type SemanticRuntimeDebugContextDependencies,
} from "./semantic-runtime-debug-context";
import {
  createSemanticRuntimeChoiceComposition,
  type SemanticRuntimeChoiceCompositionDependencies,
} from "./semantic-runtime-choice-composition";
import {
  createSemanticRuntimeDecisionContext,
  type SemanticRuntimeDecisionContextDependencies,
} from "./semantic-runtime-decision-context";

type KnownPathAssessment = ReturnType<
  PracticalMicroCandidatesContextDependencies["knownPathAssessment"]
>;

type SemanticRuntimeDecisionKnownPathDependencies = {
  assessKnownRezzedIcePath: (
    ice: VisibleCard[],
    rig: VisibleCard[],
    credits: number,
    root: VisibleCard[],
  ) => KnownPathAssessment;
};

export type SemanticRuntimeDecisionCompositionDependencies =
  Omit<
    PracticalMicroCandidatesContextDependencies,
    "knownPathAssessment"
  > &
    SemanticRuntimeDecisionKnownPathDependencies &
    SemanticRuntimeChoiceCompositionDependencies &
    Omit<SemanticRuntimeDebugContextDependencies, "scoreBreakdown"> &
    Omit<
      SemanticRuntimeDecisionContextDependencies,
      | "practicalMicroRuntimeCandidates"
      | "semanticRuntimeChoices"
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
      knownPathAssessment: (server, runtimeInput) =>
        dependencies.assessKnownRezzedIcePath(
          server.ice,
          runtimeInput.playerView.own.rig ?? [],
          runtimeInput.playerView.own.credits,
          server.root,
        ),
      rolesForAction: dependencies.rolesForAction,
      scoreTerminalWindow: dependencies.scoreTerminalWindow,
      actionTypeIsReactive: dependencies.actionTypeIsReactive,
      runnerRunTargets: dependencies.runnerRunTargets,
      runnerRunTargetPlausibleForMultiRun:
        dependencies.runnerRunTargetPlausibleForMultiRun,
      runnerRunTargetHighPayoff: dependencies.runnerRunTargetHighPayoff,
    });

  const {
    semanticRuntimeScoreBreakdown,
    semanticRuntimeChoices,
  } = createSemanticRuntimeChoiceComposition(dependencies);

  const {
    semanticRuntimeDecisionDebug,
    semanticRuntimeCoverageSelectionDebug,
  } = createSemanticRuntimeDebugContext({
    scoreBreakdown: semanticRuntimeScoreBreakdown,
    visibleSourceCard: dependencies.visibleSourceCard,
  });

  return createSemanticRuntimeDecisionContext({
    semanticRuntimeChoices,
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
