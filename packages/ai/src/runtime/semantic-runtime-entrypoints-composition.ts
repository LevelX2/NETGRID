import { createAiActionEntrypoints } from "./ai-action-entrypoints";
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

  const entrypoints = createAiActionEntrypoints({
    chooseSemanticRuntimeAction,
  });

  return {
    chooseSemanticRuntimeAction,
    ...entrypoints,
  };
}
