import {
  createAiActionEntrypoints,
  type AiActionEntrypointDependencies,
} from "./ai-action-entrypoints";

export type AiActionEntrypointsCompositionDependencies =
  AiActionEntrypointDependencies;

export function createAiActionEntrypointsComposition(
  dependencies: AiActionEntrypointsCompositionDependencies,
) {
  const entrypoints = createAiActionEntrypoints({
    chooseSemanticRuntimeAction: dependencies.chooseSemanticRuntimeAction,
  });

  return entrypoints;
}
