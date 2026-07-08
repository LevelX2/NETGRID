import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import {
  runnerRunPathCreditBudgetWithVisiblePools,
  type RunnerRunPathCreditBudget,
} from "../visible-run-analysis";
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
type PracticalRunnerRunTargets =
  PracticalMicroCandidatesContextDependencies["runnerRunTargets"];

type SemanticRuntimeDecisionKnownPathDependencies = {
  assessKnownRezzedIcePath: (
    ice: VisibleCard[],
    rig: VisibleCard[],
    credits: number | RunnerRunPathCreditBudget,
    root: VisibleCard[],
  ) => KnownPathAssessment;
};

type SemanticRuntimeDecisionPracticalRunTargetDependencies = {
  evaluatePracticalRunnerRunTargets: (params: {
    input: AiDecisionInput;
  }) => ReturnType<PracticalRunnerRunTargets>;
};

export type SemanticRuntimeDecisionCompositionDependencies = Omit<
  PracticalMicroCandidatesContextDependencies,
  "knownPathAssessment" | "runnerRunTargets"
> &
  SemanticRuntimeDecisionKnownPathDependencies &
  SemanticRuntimeDecisionPracticalRunTargetDependencies &
  SemanticRuntimeChoiceCompositionDependencies &
  SemanticRuntimeDebugContextDependencies &
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
          runnerRunPathCreditBudgetWithVisiblePools(
            runtimeInput.playerView.own.credits,
            runtimeInput.playerView.own.rig ?? [],
          ),
          server.root,
        ),
      rolesForAction: dependencies.rolesForAction,
      ...(dependencies.scorelineWindowAssessment
        ? { scorelineWindowAssessment: dependencies.scorelineWindowAssessment }
        : {}),
      actionTypeIsReactive: dependencies.actionTypeIsReactive,
      runnerRunTargets: (runtimeInput) =>
        dependencies.evaluatePracticalRunnerRunTargets({
          input: runtimeInput,
        }),
      runnerRunTargetPlausibleForMultiRun:
        dependencies.runnerRunTargetPlausibleForMultiRun,
      runnerRunTargetHighPayoff: dependencies.runnerRunTargetHighPayoff,
    });

  const { semanticRuntimeChoices } =
    createSemanticRuntimeChoiceComposition(dependencies);

  const {
    semanticRuntimeDecisionDebug,
    semanticRuntimeCoverageSelectionDebug,
  } = createSemanticRuntimeDebugContext({
    visibleSourceCard: dependencies.visibleSourceCard,
  });

  return createSemanticRuntimeDecisionContext({
    semanticRuntimeChoices,
    semanticRuntimeChoiceIsReactive:
      dependencies.semanticRuntimeChoiceIsReactive,
    buildActionSemanticCandidates: dependencies.buildActionSemanticCandidates,
    getTacticalPlanMemorySnapshot: dependencies.getTacticalPlanMemorySnapshot,
    deckCapabilitiesForInput: dependencies.deckCapabilitiesForInput,
    runnerStrategicIntentForInput: dependencies.runnerStrategicIntentForInput,
    evaluateRunnerHandDevelopment: dependencies.evaluateRunnerHandDevelopment,
    buildRunnerEconomyPosture: dependencies.buildRunnerEconomyPosture,
    evaluateRunnerRunTargets: dependencies.evaluateRunnerRunTargets,
    buildRunnerTacticalGoals: dependencies.buildRunnerTacticalGoals,
    evaluateTacticalPlans: dependencies.evaluateTacticalPlans,
    ...(dependencies.scorelineWindowAssessment
      ? { scorelineWindowAssessment: dependencies.scorelineWindowAssessment }
      : {}),
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
