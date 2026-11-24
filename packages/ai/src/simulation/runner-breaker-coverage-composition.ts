import {
  createRunnerBreakerCoverageDiagnosticsForSimulationAction,
  type RunnerBreakerCoverageDiagnosticsDependencies,
} from "./runner-breaker-coverage-diagnostics";
import {
  createRunnerPressureMetricContext,
  type RunnerPressureMetricDependencies,
} from "./runner-pressure-metrics";

export type RunnerBreakerCoverageCompositionDependencies =
  RunnerPressureMetricDependencies &
    Pick<
      RunnerBreakerCoverageDiagnosticsDependencies,
      "isRunnerEconomyAction" | "isRunnerRigInstallAction"
    >;

export function createRunnerBreakerCoverageComposition(
  dependencies: RunnerBreakerCoverageCompositionDependencies,
) {
  const {
    assessRunnerPressureReadyForMetrics,
    assessRunnerCoveragePressureForMetrics,
  } = createRunnerPressureMetricContext(dependencies);

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
