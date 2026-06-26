import {
  createLegacyCorpActionScorer,
  type LegacyCorpActionScorerDependencies,
} from "./corp-baseline-action-score";
import {
  createLegacyRunnerActionScorer,
  type LegacyRunnerActionScorerDependencies,
} from "./runner-baseline-action-score";

export type LegacyActionScoringCompositionDependencies =
  LegacyRunnerActionScorerDependencies & LegacyCorpActionScorerDependencies;

export function createLegacyActionScoringComposition(
  dependencies: LegacyActionScoringCompositionDependencies,
) {
  const { scoreRunnerAction } = createLegacyRunnerActionScorer({
    rolesForAction: dependencies.rolesForAction,
    rolesForCardId: dependencies.rolesForCardId,
    runnerProgramInstallTrashAssessment:
      dependencies.runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction:
      dependencies.runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallDisplacementPenalty:
      dependencies.runnerProgramInstallDisplacementPenalty,
    runnerRemoteTrashAccessContext: dependencies.runnerRemoteTrashAccessContext,
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
  });

  const { scoreCorpAction } = createLegacyCorpActionScorer({
    rolesForAction: dependencies.rolesForAction,
    rolesForCardId: dependencies.rolesForCardId,
    corpTagPunishOntologyAssessmentForAction:
      dependencies.corpTagPunishOntologyAssessmentForAction,
    corpOntologyPayoffAvailableForTagSource:
      dependencies.corpOntologyPayoffAvailableForTagSource,
  });

  return {
    scoreRunnerAction,
    scoreCorpAction,
  };
}
