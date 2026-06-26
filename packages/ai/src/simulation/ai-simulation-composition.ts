import {
  createAiGameSimulator,
  type AiGameSimulatorDependencies,
} from "./ai-game-simulator";
import {
  createAiSimulationEntrypoints,
  type AiSimulationEntrypointDependencies,
} from "./ai-simulation-entrypoints";
import {
  createSimulationDecisionContext,
  type SimulationDecisionContextDependencies,
} from "./simulation-decision-context";
import { createQualityTagsForAction } from "./simulation-quality-adapters";

export type AiSimulationCompositionDependencies =
  Parameters<typeof createQualityTagsForAction>[0] &
    SimulationDecisionContextDependencies &
    Omit<
      AiGameSimulatorDependencies,
      | "chooseDecisionForSimulation"
      | "simulationSideUsesSemanticRuntime"
      | "qualityTagsForAction"
    > &
    Omit<AiSimulationEntrypointDependencies, "simulateAiGame">;

export function createAiSimulationComposition(
  dependencies: AiSimulationCompositionDependencies,
) {
  const qualityTagsForAction = createQualityTagsForAction({
    extractFeatures: dependencies.extractFeatures,
    findVisibleCard: dependencies.findVisibleCard,
    rolesForAction: dependencies.rolesForAction,
  });

  const {
    chooseDecisionForSimulation,
    simulationSideUsesSemanticRuntime,
  } = createSimulationDecisionContext({
    chooseAiAction: dependencies.chooseAiAction,
    chooseRunnerAction: dependencies.chooseRunnerAction,
    chooseCorpAction: dependencies.chooseCorpAction,
    chooseRunnerBaselineAction: dependencies.chooseRunnerBaselineAction,
    chooseCorpBaselineAction: dependencies.chooseCorpBaselineAction,
    selectedChoicesForDecision: dependencies.selectedChoicesForDecision,
  });

  const { simulateAiGame } = createAiGameSimulator({
    chooseDecisionForSimulation,
    simulationSideUsesSemanticRuntime,
    runnerHandUseDiagnosticsForSimulationAction:
      dependencies.runnerHandUseDiagnosticsForSimulationAction,
    runnerReserveDiagnosticsForSimulationAction:
      dependencies.runnerReserveDiagnosticsForSimulationAction,
    runnerCentralPressureDiagnosticsForSimulationAction:
      dependencies.runnerCentralPressureDiagnosticsForSimulationAction,
    runnerBreakerCoverageDiagnosticsForSimulationAction:
      dependencies.runnerBreakerCoverageDiagnosticsForSimulationAction,
    runnerEconomySetupDiagnosticsForSimulationAction:
      dependencies.runnerEconomySetupDiagnosticsForSimulationAction,
    tagPunishWindowDiagnosticsForSimulationAction:
      dependencies.tagPunishWindowDiagnosticsForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction:
      dependencies.corpFutureRunIceDiagnosticsForSimulationAction,
    corpIcePortfolioDiagnosticsForSimulationAction:
      dependencies.corpIcePortfolioDiagnosticsForSimulationAction,
    corpScoreTerminalDiagnosticsForSimulationAction:
      dependencies.corpScoreTerminalDiagnosticsForSimulationAction,
    corpEconomyBeforeScoreDiagnosticsForSimulationAction:
      dependencies.corpEconomyBeforeScoreDiagnosticsForSimulationAction,
    qualityTagsForAction,
  });

  const simulationEntrypoints = createAiSimulationEntrypoints({
    simulateAiGame,
    summarizeMatchProgressionMetrics:
      dependencies.summarizeMatchProgressionMetrics,
    chooseRunnerAction: dependencies.chooseRunnerAction,
  });

  return {
    simulateAiGame,
    ...simulationEntrypoints,
  };
}
