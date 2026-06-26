import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import type { KnownPositionMemory } from "../belief-state";
import type { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { createRunnerBreakerCoverageDiagnosticsForSimulationAction } from "./runner-breaker-coverage-diagnostics";
import { createRunnerPressureMetricContext } from "./runner-pressure-metrics";

export type RunnerBreakerCoverageCompositionDependencies = {
  runnerStrategicBreakerTargetForMetrics: (
    server: AiDecisionInput["playerView"]["servers"][number],
  ) => boolean;
  assessKnownRezzedIcePath: typeof assessKnownRezzedIcePath;
  knownPositionMemoryForInput: (
    input: AiDecisionInput,
  ) => KnownPositionMemory[];
  definitionTypeForMetrics: (definitionId: string) => string | undefined;
  remoteRootTrashCostForMetrics: (card: VisibleCard) => number | undefined;
  canBreakerDefinitionBreakIce: (
    breakerDefinitionId: string,
    iceDefinitionId: string,
  ) => boolean;
  runnerVisibleIceCreatesCoverageNeedForMetrics: (
    ice: AiDecisionInput["playerView"]["servers"][number]["ice"][number],
  ) => boolean;
  runnerMissingBreakerRolesForMetrics: (definitionId: string) => string[];
  runnerCoverageSearchActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  runnerCoverageRecoveryActionForMetrics: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerEconomyAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isRunnerRigInstallAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function createRunnerBreakerCoverageComposition(
  dependencies: RunnerBreakerCoverageCompositionDependencies,
) {
  const {
    assessRunnerPressureReadyForMetrics,
    assessRunnerCoveragePressureForMetrics,
  } = createRunnerPressureMetricContext({
    runnerStrategicBreakerTargetForMetrics:
      dependencies.runnerStrategicBreakerTargetForMetrics,
    assessKnownRezzedIcePath: dependencies.assessKnownRezzedIcePath,
    knownPositionMemoryForInput: dependencies.knownPositionMemoryForInput,
    definitionTypeForMetrics: dependencies.definitionTypeForMetrics,
    remoteRootTrashCostForMetrics: dependencies.remoteRootTrashCostForMetrics,
    canBreakerDefinitionBreakIce: dependencies.canBreakerDefinitionBreakIce,
    runnerVisibleIceCreatesCoverageNeedForMetrics:
      dependencies.runnerVisibleIceCreatesCoverageNeedForMetrics,
    runnerMissingBreakerRolesForMetrics:
      dependencies.runnerMissingBreakerRolesForMetrics,
    runnerCoverageSearchActionForMetrics:
      dependencies.runnerCoverageSearchActionForMetrics,
    runnerCoverageRecoveryActionForMetrics:
      dependencies.runnerCoverageRecoveryActionForMetrics,
  });

  const runnerBreakerCoverageDiagnosticsForSimulationAction =
    createRunnerBreakerCoverageDiagnosticsForSimulationAction({
      assessRunnerCoveragePressureForMetrics,
      assessRunnerPressureReadyForMetrics,
      isRunnerEconomyAction: dependencies.isRunnerEconomyAction,
      isRunnerRigInstallAction: dependencies.isRunnerRigInstallAction,
      runnerCoverageSearchActionForMetrics:
        dependencies.runnerCoverageSearchActionForMetrics,
    });

  return {
    assessRunnerPressureReadyForMetrics,
    assessRunnerCoveragePressureForMetrics,
    runnerBreakerCoverageDiagnosticsForSimulationAction,
  };
}
