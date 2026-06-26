import {
  createRunnerScoringSupportComposition,
  type RunnerScoringSupportCompositionDependencies,
} from "./runner-scoring-support-composition";
import {
  createSemanticRuntimeActionExclusionComposition,
  type SemanticRuntimeActionExclusionCompositionDependencies,
} from "./semantic-runtime-action-exclusion-composition";
import {
  createSemanticRuntimeEntrypointsComposition,
  type SemanticRuntimeEntrypointsCompositionDependencies,
} from "./semantic-runtime-entrypoints-composition";

type RunnerBadPublicityRelevanceWithoutSelfDamage = Omit<
  RunnerScoringSupportCompositionDependencies["badPublicityRelevance"],
  "selfDamageSurvivalAssessment"
>;

type RunnerGoalFitWithoutSourceRole = Omit<
  RunnerScoringSupportCompositionDependencies["goalFit"],
  "sourceCardAnswerRole"
>;

export type SemanticRuntimeOrchestrationCompositionDependencies =
  SemanticRuntimeActionExclusionCompositionDependencies &
    Omit<
      RunnerScoringSupportCompositionDependencies,
      "badPublicityRelevance" | "goalFit"
    > & {
      badPublicityRelevance: RunnerBadPublicityRelevanceWithoutSelfDamage;
      goalFit: RunnerGoalFitWithoutSourceRole;
    } &
    Omit<
      SemanticRuntimeEntrypointsCompositionDependencies,
      | "runnerSourceCardAnswerRole"
      | "actionExclusion"
      | "runnerComponents"
      | "selfDamageSurvivalAssessment"
      | "runnerSelfDamageImmediateWinSemanticChoice"
      | "scoreRunnerAction"
      | "scoreCorpAction"
      | "runnerSelfDamageGuardedDecision"
    >;

export function createSemanticRuntimeOrchestrationComposition(
  dependencies: SemanticRuntimeOrchestrationCompositionDependencies,
) {
  const actionExclusion = createSemanticRuntimeActionExclusionComposition(
    dependencies,
  );

  const { semanticRuntimeRunnerScoreComponents } =
    createRunnerScoringSupportComposition({
      ...dependencies,
      badPublicityRelevance: {
        ...dependencies.badPublicityRelevance,
        selfDamageSurvivalAssessment:
          actionExclusion.runnerSelfDamageSurvivalAssessment,
      },
      goalFit: {
        ...dependencies.goalFit,
        sourceCardAnswerRole:
          actionExclusion.semanticRuntimeRunnerSourceCardAnswerRole,
      },
    });

  return createSemanticRuntimeEntrypointsComposition({
    ...dependencies,
    runnerSourceCardAnswerRole:
      actionExclusion.semanticRuntimeRunnerSourceCardAnswerRole,
    actionExclusion: actionExclusion.semanticRuntimeActionExclusion,
    runnerComponents: semanticRuntimeRunnerScoreComponents,
    selfDamageSurvivalAssessment:
      actionExclusion.runnerSelfDamageSurvivalAssessment,
    runnerSelfDamageImmediateWinSemanticChoice:
      actionExclusion.runnerSelfDamageImmediateWinSemanticChoice,
    runnerSelfDamageGuardedDecision:
      actionExclusion.runnerSelfDamageGuardedDecision,
    scoreRunnerAction: actionExclusion.scoreRunnerAction,
    scoreCorpAction: actionExclusion.scoreCorpAction,
  });
}
