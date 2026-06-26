import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import {
  createRunnerBreakerCoverageComposition,
  type RunnerBreakerCoverageCompositionDependencies,
} from "./runner-breaker-coverage-composition";
import {
  createRunnerEconomySetupDiagnosticsForSimulationAction,
  type RunnerEconomySetupDiagnosticsDependencies,
} from "./runner-economy-setup-diagnostics";
import { createRunnerEconomySetupActionClassContext } from "./runner-economy-setup-types";
import {
  createRunnerHandUseDiagnosticsForSimulationAction,
  type RunnerHandUseDiagnosticsDependencies,
} from "./runner-hand-use-diagnostics";
import {
  createRunnerReserveDiagnosticsForSimulationAction,
  type RunnerReserveDiagnosticsDependencies,
} from "./runner-reserve-diagnostics";
import { reconstructBeliefState } from "../belief-state";

type RunnerEconomySetupDefinition = {
  type?: string;
  mechanics?: unknown;
};

type RunnerEconomySetupActionClassCompositionDependencies = {
  definitionForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEconomySetupDefinition | undefined;
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
  runnerCoverageRecoveryActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerCoverageSearchActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  sourceDefinitionIdForSimulationAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
};

export type RunnerSimulationDiagnosticsCompositionDependencies =
  RunnerReserveDiagnosticsDependencies &
    RunnerHandUseDiagnosticsDependencies &
    Omit<
      RunnerBreakerCoverageCompositionDependencies,
      "knownPositionMemoryForInput"
    > &
    Omit<
      RunnerEconomySetupDiagnosticsDependencies,
      "runnerEconomySetupActionClass"
    > &
    RunnerEconomySetupActionClassCompositionDependencies;

export function createRunnerSimulationDiagnosticsComposition(
  dependencies: RunnerSimulationDiagnosticsCompositionDependencies,
) {
  const runnerReserveDiagnosticsForSimulationAction =
    createRunnerReserveDiagnosticsForSimulationAction({
      runnerCreditReserveTargetForInput:
        dependencies.runnerCreditReserveTargetForInput,
      isRunnerEconomyAction: dependencies.isRunnerEconomyAction,
      runnerKnownPathDiagnosticsForAction:
        dependencies.runnerKnownPathDiagnosticsForAction,
      runnerRemoteThreatTargetingDiagnosticsForAction:
        dependencies.runnerRemoteThreatTargetingDiagnosticsForAction,
      isRunnerLowValueDuplicateInstall:
        dependencies.isRunnerLowValueDuplicateInstall,
      runnerHasVisibleRemoteScoreThreat:
        dependencies.runnerHasVisibleRemoteScoreThreat,
      runnerRemoteTrashAccessContext:
        dependencies.runnerRemoteTrashAccessContext,
      runnerTrashBlockedByCredits: dependencies.runnerTrashBlockedByCredits,
      runnerStealBlockedByCredits: dependencies.runnerStealBlockedByCredits,
      runnerContestBlockedByCredits:
        dependencies.runnerContestBlockedByCredits,
    });

  const runnerHandUseDiagnosticsForSimulationAction =
    createRunnerHandUseDiagnosticsForSimulationAction({
      runnerDrawKindForSimulationAction:
        dependencies.runnerDrawKindForSimulationAction,
      hasRunnerPlayableEconomyAction:
        dependencies.hasRunnerPlayableEconomyAction,
      hasRunnerInstallableBreakerAction:
        dependencies.hasRunnerInstallableBreakerAction,
      hasRunnerRunnablePressureAction:
        dependencies.hasRunnerRunnablePressureAction,
      hasRunnerRemoteTrashAction: dependencies.hasRunnerRemoteTrashAction,
      runnerDiscardChoiceRoles: dependencies.runnerDiscardChoiceRoles,
      isRunnerDuplicateInstall: dependencies.isRunnerDuplicateInstall,
      isRunnerLowValueDuplicateInstall:
        dependencies.isRunnerLowValueDuplicateInstall,
      isRunnerEconomyAction: dependencies.isRunnerEconomyAction,
      isRunnerRigInstallAction: dependencies.isRunnerRigInstallAction,
      isRunnerPressureAction: dependencies.isRunnerPressureAction,
      sourceDefinitionIdForSimulationAction:
        dependencies.sourceDefinitionIdForSimulationAction,
      runnerRemoteTrashAccessContext:
        dependencies.runnerRemoteTrashAccessContext,
      runnerAdvancedRemoteContestContext:
        dependencies.runnerAdvancedRemoteContestContext,
    });

  const runnerEconomySetupActionClass =
    createRunnerEconomySetupActionClassContext({
      definitionForAction: dependencies.definitionForSimulationAction,
      isRunnerEconomyAction: dependencies.isRunnerEconomyAction,
      rolesForAction: dependencies.rolesForAction,
      runnerCoverageRecoveryActionForMetrics:
        dependencies.runnerCoverageRecoveryActionForMetrics,
      runnerCoverageSearchActionForMetrics:
        dependencies.runnerCoverageSearchActionForMetrics,
      sourceDefinitionIdForAction:
        dependencies.sourceDefinitionIdForSimulationAction,
    });

  const runnerEconomySetupDiagnosticsForSimulationAction =
    createRunnerEconomySetupDiagnosticsForSimulationAction({
      runnerEconomySetupActionClass,
      runnerCreditReserveTargetForInput:
        dependencies.runnerCreditReserveTargetForInput,
      runnerHasKnownUnaffordableLegalRun:
        dependencies.runnerHasKnownUnaffordableLegalRun,
      runnerAdvancedRemoteContestContext:
        dependencies.runnerAdvancedRemoteContestContext,
      hasRunnerRunnablePressureAction:
        dependencies.hasRunnerRunnablePressureAction,
      hasRunnerInstallableBreakerAction:
        dependencies.hasRunnerInstallableBreakerAction,
      hasRunnerRemoteTrashAction: dependencies.hasRunnerRemoteTrashAction,
      runnerDrawKindForSimulationAction:
        dependencies.runnerDrawKindForSimulationAction,
      isRunnerRigInstallAction: dependencies.isRunnerRigInstallAction,
      runnerVisibleMissingBreakerCoverage:
        dependencies.runnerVisibleMissingBreakerCoverage,
      runnerHasKnownBlockedPathByCoverage:
        dependencies.runnerHasKnownBlockedPathByCoverage,
      runnerMissingCoverageTypesForInput:
        dependencies.runnerMissingCoverageTypesForInput,
      definitionForSimulationAction:
        dependencies.definitionForSimulationAction,
      runnerRunKnownPathCost: dependencies.runnerRunKnownPathCost,
      runnerSetupChosenFamilyForEntry:
        dependencies.runnerSetupChosenFamilyForEntry,
    });

  const {
    assessRunnerPressureReadyForMetrics,
    assessRunnerCoveragePressureForMetrics,
    runnerBreakerCoverageDiagnosticsForSimulationAction,
  } = createRunnerBreakerCoverageComposition({
    runnerStrategicBreakerTargetForMetrics:
      dependencies.runnerStrategicBreakerTargetForMetrics,
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    knownPositionMemoryForInput: (input) =>
      reconstructBeliefState(input).runnerOpponentModel?.knownPositionMemory ??
      [],
    definitionTypeForMetrics: dependencies.definitionTypeForMetrics,
    remoteRootTrashCostForMetrics:
      dependencies.remoteRootTrashCostForMetrics,
    canBreakerDefinitionBreakIce: dependencies.canBreakerDefinitionBreakIce,
    runnerVisibleIceCreatesCoverageNeedForMetrics:
      dependencies.runnerVisibleIceCreatesCoverageNeedForMetrics,
    runnerMissingBreakerRolesForMetrics:
      dependencies.runnerMissingBreakerRolesForMetrics,
    runnerCoverageSearchActionForMetrics:
      dependencies.runnerCoverageSearchActionForMetrics,
    runnerCoverageRecoveryActionForMetrics:
      dependencies.runnerCoverageRecoveryActionForMetrics,
    isRunnerEconomyAction: dependencies.isRunnerEconomyAction,
    isRunnerRigInstallAction: dependencies.isRunnerRigInstallAction,
  });

  return {
    runnerReserveDiagnosticsForSimulationAction,
    runnerHandUseDiagnosticsForSimulationAction,
    runnerEconomySetupDiagnosticsForSimulationAction,
    assessRunnerPressureReadyForMetrics,
    assessRunnerCoveragePressureForMetrics,
    runnerBreakerCoverageDiagnosticsForSimulationAction,
  };
}
