import {
  createRunnerCentralPressureDiagnosticsComposition,
  type RunnerCentralPressureDiagnosticsCompositionDependencies,
} from "./runner-central-pressure-diagnostics-composition";
import {
  createRunnerInstallClassificationComposition,
  type RunnerInstallClassificationCompositionDependencies,
} from "./runner-install-classification-composition";
import {
  createRunnerKnownPathDiagnosticsComposition,
  type RunnerKnownPathDiagnosticsCompositionDependencies,
} from "./runner-known-path-diagnostics-composition";
import {
  createRunnerSimulationDiagnosticsComposition,
  type RunnerSimulationDiagnosticsCompositionDependencies,
} from "./runner-simulation-diagnostics-composition";

export type RunnerAiDiagnosticsCompositionDependencies =
  RunnerKnownPathDiagnosticsCompositionDependencies &
    RunnerInstallClassificationCompositionDependencies &
    Omit<
      RunnerCentralPressureDiagnosticsCompositionDependencies,
      "runnerCreditReserveTargetForInput" | "isRunnerEconomyAction"
    > &
    Omit<
      RunnerSimulationDiagnosticsCompositionDependencies,
      | "runnerCreditReserveTargetForInput"
      | "isRunnerEconomyAction"
      | "runnerKnownPathDiagnosticsForAction"
      | "runnerRemoteThreatTargetingDiagnosticsForAction"
      | "isRunnerLowValueDuplicateInstall"
      | "runnerRemoteTrashAccessContext"
      | "runnerDrawKindForSimulationAction"
      | "hasRunnerPlayableEconomyAction"
      | "hasRunnerInstallableBreakerAction"
      | "hasRunnerRunnablePressureAction"
      | "runnerDiscardChoiceRoles"
      | "isRunnerDuplicateInstall"
      | "isRunnerRigInstallAction"
      | "isRunnerPressureAction"
      | "runnerCoverageRecoveryActionForMetrics"
      | "runnerCoverageSearchActionForMetrics"
      | "runnerHasKnownUnaffordableLegalRun"
      | "runnerVisibleMissingBreakerCoverage"
      | "runnerHasKnownBlockedPathByCoverage"
      | "runnerMissingCoverageTypesForInput"
      | "runnerRunKnownPathCost"
    >;

export function createRunnerAiDiagnosticsComposition(
  dependencies: RunnerAiDiagnosticsCompositionDependencies,
) {
  const knownPath = createRunnerKnownPathDiagnosticsComposition(dependencies);
  const installClassification =
    createRunnerInstallClassificationComposition(dependencies);

  const centralPressure =
    createRunnerCentralPressureDiagnosticsComposition({
      ...dependencies,
      runnerCreditReserveTargetForInput:
        knownPath.runnerCreditReserveTargetForInput,
      isRunnerEconomyAction: installClassification.isRunnerEconomyAction,
    });

  const simulationDiagnostics =
    createRunnerSimulationDiagnosticsComposition({
      ...dependencies,
      runnerCreditReserveTargetForInput:
        knownPath.runnerCreditReserveTargetForInput,
      isRunnerEconomyAction: installClassification.isRunnerEconomyAction,
      runnerKnownPathDiagnosticsForAction:
        knownPath.runnerKnownPathDiagnosticsForAction,
      runnerRemoteThreatTargetingDiagnosticsForAction:
        centralPressure.runnerRemoteThreatTargetingDiagnosticsForAction,
      isRunnerLowValueDuplicateInstall:
        installClassification.isRunnerLowValueDuplicateInstall,
      runnerRemoteTrashAccessContext:
        knownPath.runnerRemoteTrashAccessContext,
      runnerDrawKindForSimulationAction:
        installClassification.runnerDrawKindForSimulationAction,
      hasRunnerPlayableEconomyAction:
        installClassification.hasRunnerPlayableEconomyAction,
      hasRunnerInstallableBreakerAction:
        installClassification.hasRunnerInstallableBreakerAction,
      hasRunnerRunnablePressureAction:
        installClassification.hasRunnerRunnablePressureAction,
      runnerDiscardChoiceRoles:
        installClassification.runnerDiscardChoiceRoles,
      isRunnerDuplicateInstall:
        installClassification.isRunnerDuplicateInstall,
      isRunnerRigInstallAction:
        installClassification.isRunnerRigInstallAction,
      isRunnerPressureAction: installClassification.isRunnerPressureAction,
      runnerCoverageRecoveryActionForMetrics:
        knownPath.runnerCoverageRecoveryActionForMetrics,
      runnerCoverageSearchActionForMetrics:
        knownPath.runnerCoverageSearchActionForMetrics,
      runnerHasKnownUnaffordableLegalRun:
        knownPath.runnerHasKnownUnaffordableLegalRun,
      runnerVisibleMissingBreakerCoverage:
        knownPath.runnerVisibleMissingBreakerCoverage,
      runnerHasKnownBlockedPathByCoverage:
        knownPath.runnerHasKnownBlockedPathByCoverage,
      runnerMissingCoverageTypesForInput:
        knownPath.runnerMissingCoverageTypesForInput,
      runnerRunKnownPathCost: knownPath.runnerRunKnownPathCost,
    });

  return {
    ...knownPath,
    ...installClassification,
    ...centralPressure,
    ...simulationDiagnostics,
  };
}
