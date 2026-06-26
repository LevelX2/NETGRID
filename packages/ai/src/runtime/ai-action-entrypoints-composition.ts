import {
  createLegacyActionScoringComposition,
  type LegacyActionScoringCompositionDependencies,
} from "../legacy/legacy-action-scoring-composition";
import {
  scoreActionsForLegacy,
  type LegacyActionScorerDependencies,
} from "../legacy/legacy-action-scorer";
import {
  createAiActionEntrypoints,
  type AiActionEntrypointDependencies,
} from "./ai-action-entrypoints";

export type AiActionEntrypointsCompositionDependencies =
  Omit<AiActionEntrypointDependencies, "scoreActions"> &
    LegacyActionScoringCompositionDependencies &
    Pick<LegacyActionScorerDependencies, "extractAiFeatures">;

export function createAiActionEntrypointsComposition(
  dependencies: AiActionEntrypointsCompositionDependencies,
) {
  const { scoreRunnerAction, scoreCorpAction } =
    createLegacyActionScoringComposition({
      rolesForAction: dependencies.rolesForAction,
      rolesForCardId: dependencies.rolesForCardId,
      runnerProgramInstallTrashAssessment:
        dependencies.runnerProgramInstallTrashAssessment,
      runnerProgramInstallTrashAssessmentForAction:
        dependencies.runnerProgramInstallTrashAssessmentForAction,
      runnerProgramInstallDisplacementPenalty:
        dependencies.runnerProgramInstallDisplacementPenalty,
      runnerRemoteTrashAccessContext:
        dependencies.runnerRemoteTrashAccessContext,
      encounterBreakReserveContext: dependencies.encounterBreakReserveContext,
      pumpViabilityAssessment: dependencies.pumpViabilityAssessment,
      runnerMuPressureInstallPriorityBonus:
        dependencies.runnerMuPressureInstallPriorityBonus,
      runnerMuPressureFundingPriorityBonus:
        dependencies.runnerMuPressureFundingPriorityBonus,
      runnerPersistentInstallEvaluationForAction:
        dependencies.runnerPersistentInstallEvaluationForAction,
      runnerPersistentInstallLegacyScoreDelta:
        dependencies.runnerPersistentInstallLegacyScoreDelta,
      corpTagPunishOntologyAssessmentForAction:
        dependencies.corpTagPunishOntologyAssessmentForAction,
      corpOntologyPayoffAvailableForTagSource:
        dependencies.corpOntologyPayoffAvailableForTagSource,
    });

  const entrypoints = createAiActionEntrypoints({
    chooseSemanticRuntimeAction: dependencies.chooseSemanticRuntimeAction,
    scoreActions: (input, side) =>
      scoreActionsForLegacy(input, side, {
        extractAiFeatures: dependencies.extractAiFeatures,
        scoreRunnerAction,
        scoreCorpAction,
      }),
    decisionFromChoices: dependencies.decisionFromChoices,
    hasCorpPlanAction: dependencies.hasCorpPlanAction,
    isCorpReactiveBaselineDecision:
      dependencies.isCorpReactiveBaselineDecision,
    chooseCorpPlanAction: dependencies.chooseCorpPlanAction,
    hasRunnerPlanAction: dependencies.hasRunnerPlanAction,
    isRunnerReactiveBaselineDecision:
      dependencies.isRunnerReactiveBaselineDecision,
    baselineShellTradersPlanIsVisible:
      dependencies.baselineShellTradersPlanIsVisible,
    runnerHasConditionalPaymentContinueDecision:
      dependencies.runnerHasConditionalPaymentContinueDecision,
    chooseRunnerPlanAction: dependencies.chooseRunnerPlanAction,
    runnerSelfDamageGuardedDecision:
      dependencies.runnerSelfDamageGuardedDecision,
  });

  return {
    ...entrypoints,
    scoreRunnerAction,
    scoreCorpAction,
  };
}
