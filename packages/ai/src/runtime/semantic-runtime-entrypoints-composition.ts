import { createAiActionEntrypointsComposition } from "./ai-action-entrypoints-composition";
import {
  createSemanticRuntimeDecisionContext,
  type SemanticRuntimeDecisionContextDependencies,
} from "./semantic-runtime-decision-context";

export type SemanticRuntimeEntrypointsCompositionDependencies =
  SemanticRuntimeDecisionContextDependencies;

export function createSemanticRuntimeEntrypointsComposition(
  dependencies: SemanticRuntimeEntrypointsCompositionDependencies,
) {
  const { chooseSemanticRuntimeAction } =
    createSemanticRuntimeDecisionContext(dependencies);

  const entrypoints = createAiActionEntrypointsComposition({
    ...dependencies,
    chooseSemanticRuntimeAction,
  });

  return {
    chooseSemanticRuntimeAction,
    ...entrypoints,
  };
}
