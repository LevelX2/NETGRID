import {
  createSemanticRuntimeDecisionContext,
  type SemanticRuntimeDecisionContextDependencies,
} from "./semantic-runtime-decision-context";

export type SemanticRuntimeDecisionCompositionDependencies =
  SemanticRuntimeDecisionContextDependencies;

export function createSemanticRuntimeDecisionComposition(
  dependencies: SemanticRuntimeDecisionCompositionDependencies,
) {
  return createSemanticRuntimeDecisionContext(dependencies);
}
