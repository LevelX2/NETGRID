import {
  createAiLiveRuntimeComposition,
  type AiLiveRuntimeCompositionDependencies,
} from "../runtime/ai-live-runtime-composition";
import {
  aiContextDiagnosticDependencies,
  createAiContextDiagnosticsComposition,
} from "../runtime/ai-context-diagnostics-composition";
import {
  createCorpTagPunishWindowComposition,
  type CorpTagPunishWindowCompositionDependencies,
} from "./corp-tag-punish-window-composition";
import {
  createAiGameSimulator,
  type AiGameSimulatorDependencies,
} from "./ai-game-simulator";
import { createSimulationDecisionContext } from "./simulation-decision-context";
import { createQualityTagsForAction } from "./simulation-quality-adapters";

type ContextDependencyKeys = keyof ReturnType<
  typeof aiContextDiagnosticDependencies
>;

export type AiProductSimulationCompositionDependencies =
  AiLiveRuntimeCompositionDependencies &
    Omit<
      AiGameSimulatorDependencies,
      | "chooseDecisionForSimulation"
      | "simulationSideUsesSemanticRuntime"
      | "qualityTagsForAction"
      | "tagPunishWindowDiagnosticsForSimulationAction"
      | ContextDependencyKeys
    > &
    Omit<CorpTagPunishWindowCompositionDependencies, ContextDependencyKeys> &
    Omit<
      Parameters<typeof createQualityTagsForAction>[0],
      ContextDependencyKeys
    >;

export function createAiProductSimulationComposition(
  dependencies: AiProductSimulationCompositionDependencies,
) {
  const diagnostics = createAiContextDiagnosticsComposition(dependencies);
  const { tagPunishWindowDiagnosticsForSimulationAction } =
    createCorpTagPunishWindowComposition({
      ...dependencies,
      ...aiContextDiagnosticDependencies(diagnostics),
    });
  const runtime = createAiLiveRuntimeComposition(dependencies);
  const qualityTagsForAction = createQualityTagsForAction({
    extractFeatures: diagnostics.extractAiFeatures,
    findVisibleCard: dependencies.findVisibleCard,
    rolesForAction: diagnostics.rolesForAction,
  });
  const { chooseDecisionForSimulation, simulationSideUsesSemanticRuntime } =
    createSimulationDecisionContext({
      chooseAiAction: runtime.chooseAiAction,
      chooseRunnerAction: runtime.chooseRunnerAction,
      chooseCorpAction: runtime.chooseCorpAction,
    });
  const { simulateAiGame } = createAiGameSimulator({
    chooseDecisionForSimulation,
    simulationSideUsesSemanticRuntime,
    runnerHandUseDiagnosticsForSimulationAction:
      diagnostics.runnerHandUseDiagnosticsForSimulationAction,
    runnerReserveDiagnosticsForSimulationAction:
      diagnostics.runnerReserveDiagnosticsForSimulationAction,
    runnerCentralPressureDiagnosticsForSimulationAction:
      diagnostics.runnerCentralPressureDiagnosticsForSimulationAction,
    runnerBreakerCoverageDiagnosticsForSimulationAction:
      diagnostics.runnerBreakerCoverageDiagnosticsForSimulationAction,
    runnerEconomySetupDiagnosticsForSimulationAction:
      diagnostics.runnerEconomySetupDiagnosticsForSimulationAction,
    tagPunishWindowDiagnosticsForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction:
      diagnostics.corpFutureRunIceDiagnosticsForSimulationAction,
    qualityTagsForAction,
  });

  return { simulateAiGame };
}
