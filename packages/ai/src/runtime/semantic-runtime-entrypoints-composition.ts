import { createAiActionEntrypointsComposition } from "./ai-action-entrypoints-composition";
import {
  createSemanticRuntimeDecisionComposition,
  type SemanticRuntimeDecisionCompositionDependencies,
} from "./semantic-runtime-decision-composition";

export type SemanticRuntimeEntrypointsCompositionDependencies =
  SemanticRuntimeDecisionCompositionDependencies;

export function createSemanticRuntimeEntrypointsComposition(
  dependencies: SemanticRuntimeEntrypointsCompositionDependencies,
) {
  const { chooseSemanticRuntimeAction } =
    createSemanticRuntimeDecisionComposition(dependencies);

  const entrypoints = createAiActionEntrypointsComposition({
    ...dependencies,
    chooseSemanticRuntimeAction,
  });

  return {
    chooseSemanticRuntimeAction,
    ...entrypoints,
  };
}
