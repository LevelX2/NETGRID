import {
  createAiLiveRuntimeComposition,
  type AiLiveRuntimeCompositionDependencies,
} from "../runtime/ai-live-runtime-composition";
import { createAiContextDiagnosticsComposition } from "../runtime/ai-context-diagnostics-composition";
import {
  createSemanticRuntimeCorpScoringComposition,
  type SemanticRuntimeCorpScoringCompositionDependencies,
} from "../runtime/semantic-runtime-corp-scoring-composition";
import {
  createAiGameSimulator,
  type AiGameSimulatorDependencies,
} from "./ai-game-simulator";
import { createSimulationDecisionContext } from "./simulation-decision-context";
import { createQualityTagsForAction } from "./simulation-quality-adapters";

type ContextDiagnostics = ReturnType<
  typeof createAiContextDiagnosticsComposition
>;
type ContextDependencyKeys =
  | keyof ContextDiagnostics
  | "closeout"
  | "extractFeatures"
  | "hasKnownUnaffordableLegalRun"
  | "remoteTrashAccessContext"
  | "tagPunishAssessmentForAction"
  | "trashAccessContext";

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
    Omit<
      SemanticRuntimeCorpScoringCompositionDependencies<string>,
      ContextDependencyKeys
    > &
    Omit<
      Parameters<typeof createQualityTagsForAction>[0],
      ContextDependencyKeys
    >;

function withContextDiagnostics(
  dependencies: AiProductSimulationCompositionDependencies,
  diagnostics: ContextDiagnostics,
) {
  return {
    ...dependencies,
    ...diagnostics,
    closeout: diagnostics.bestTrueCentralCloseoutProfileForMetrics,
    extractFeatures: diagnostics.extractAiFeatures,
    hasKnownUnaffordableLegalRun:
      diagnostics.runnerHasKnownUnaffordableLegalRun,
    remoteTrashAccessContext: diagnostics.runnerRemoteTrashAccessContext,
    tagPunishAssessmentForAction:
      diagnostics.corpTagPunishOntologyAssessmentForAction,
    trashAccessContext: diagnostics.runnerRemoteTrashAccessContext,
  };
}

export function createAiProductSimulationComposition(
  dependencies: AiProductSimulationCompositionDependencies,
) {
  const diagnostics = createAiContextDiagnosticsComposition(dependencies);
  const corpScoring = createSemanticRuntimeCorpScoringComposition(
    withContextDiagnostics(dependencies, diagnostics),
  );
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
      selectedChoicesForDecision: runtime.selectedChoicesForDecision,
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
    tagPunishWindowDiagnosticsForSimulationAction:
      corpScoring.tagPunishWindowDiagnosticsForSimulationAction,
    corpFutureRunIceDiagnosticsForSimulationAction:
      diagnostics.corpFutureRunIceDiagnosticsForSimulationAction,
    qualityTagsForAction,
  });

  return { simulateAiGame };
}
