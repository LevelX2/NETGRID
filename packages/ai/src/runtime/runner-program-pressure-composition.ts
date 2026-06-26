import {
  createRunnerMuPressureContext,
  type RunnerMuPressureContextDependencies,
} from "./runner-mu-pressure-context";
import {
  createRunnerProgramInstallTrashContext,
  type RunnerProgramInstallTrashContextDependencies,
} from "./runner-program-install-trash-context";

export type RunnerProgramPressureCompositionDependencies =
  RunnerProgramInstallTrashContextDependencies &
    Omit<
      RunnerMuPressureContextDependencies,
      "programInstallTrashAssessmentForAction"
    >;

export function createRunnerProgramPressureComposition(
  dependencies: RunnerProgramPressureCompositionDependencies,
) {
  const {
    selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds,
    runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallDisplacementPenalty,
    runnerProgramSacrificeExclusion,
  } = createRunnerProgramInstallTrashContext({
    safeNonNegativeInteger: dependencies.safeNonNegativeInteger,
    visibleMemoryCost: dependencies.visibleMemoryCost,
    visibleCardsByInstanceId: dependencies.visibleCardsByInstanceId,
    visibleBreakerRoleCounts: dependencies.visibleBreakerRoleCounts,
    visibleBreakerRoles: dependencies.visibleBreakerRoles,
    rolesForCardId: dependencies.rolesForCardId,
    isRunnerPressureRole: dependencies.isRunnerPressureRole,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
    visibleCounterValue: dependencies.visibleCounterValue,
    visibleInstallCost: dependencies.visibleInstallCost,
  });

  const {
    runnerMuPressureInstallScoreComponent,
    runnerMuPressureFundingScoreComponent,
    runnerMuPressureInstallPriorityBonus,
    runnerMuPressureFundingPriorityBonus,
    runnerMuPressureActionEvidence,
  } = createRunnerMuPressureContext({
    safeNonNegativeInteger: dependencies.safeNonNegativeInteger,
    findVisibleCard: dependencies.findVisibleCard,
    visibleMemoryCost: dependencies.visibleMemoryCost,
    visibleInstallCost: dependencies.visibleInstallCost,
    programInstallTrashAssessmentForAction:
      runnerProgramInstallTrashAssessmentForAction,
    actionCreditCost: dependencies.actionCreditCost,
    rolesForCardId: dependencies.rolesForCardId,
    rolesForAction: dependencies.rolesForAction,
    isRunnerPressureRole: dependencies.isRunnerPressureRole,
    isRunnerEconomyRole: dependencies.isRunnerEconomyRole,
  });

  return {
    selectedRunnerProgramInstallTrashOptionIds,
    selectedRunnerForcedProgramTrashOptionIds,
    runnerProgramInstallTrashAssessment,
    runnerProgramInstallTrashAssessmentForAction,
    runnerProgramInstallDisplacementPenalty,
    runnerProgramSacrificeExclusion,
    runnerMuPressureInstallScoreComponent,
    runnerMuPressureFundingScoreComponent,
    runnerMuPressureInstallPriorityBonus,
    runnerMuPressureFundingPriorityBonus,
    runnerMuPressureActionEvidence,
  };
}
