import {
  createSemanticRuntimeEntrypointsComposition,
  type SemanticRuntimeEntrypointsCompositionDependencies,
} from "./semantic-runtime-entrypoints-composition";

export type SemanticRuntimeOrchestrationCompositionDependencies =
  SemanticRuntimeEntrypointsCompositionDependencies;

export function createSemanticRuntimeOrchestrationComposition(
  dependencies: SemanticRuntimeOrchestrationCompositionDependencies,
) {
  return createSemanticRuntimeEntrypointsComposition(dependencies);
}
