import {
  createAiSimulationComposition,
  type AiSimulationCompositionDependencies,
} from "../simulation/ai-simulation-composition";
import {
  createSemanticRuntimeOrchestrationComposition,
  type SemanticRuntimeOrchestrationCompositionDependencies,
} from "./semantic-runtime-orchestration-composition";

export type AiRuntimeSimulationCompositionDependencies =
  SemanticRuntimeOrchestrationCompositionDependencies &
    Omit<
      AiSimulationCompositionDependencies,
      | "chooseAiAction"
      | "chooseRunnerAction"
      | "chooseCorpAction"
      | "chooseRunnerBaselineAction"
      | "chooseCorpBaselineAction"
    >;

export function createAiRuntimeSimulationComposition(
  dependencies: AiRuntimeSimulationCompositionDependencies,
) {
  const runtimeEntrypoints =
    createSemanticRuntimeOrchestrationComposition(dependencies);

  const simulationEntrypoints = createAiSimulationComposition({
    ...dependencies,
    chooseAiAction: runtimeEntrypoints.chooseAiAction,
    chooseRunnerAction: runtimeEntrypoints.chooseRunnerAction,
    chooseCorpAction: runtimeEntrypoints.chooseCorpAction,
    chooseRunnerBaselineAction:
      runtimeEntrypoints.chooseRunnerBaselineAction,
    chooseCorpBaselineAction: runtimeEntrypoints.chooseCorpBaselineAction,
  });

  return {
    ...runtimeEntrypoints,
    ...simulationEntrypoints,
  };
}
