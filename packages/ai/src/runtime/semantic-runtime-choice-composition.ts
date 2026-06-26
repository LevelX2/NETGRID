import {
  createSemanticRuntimeChoiceBuilderContext,
} from "./semantic-runtime-choice-builder-context";
import type { SemanticRuntimeChoiceBuilderDependencies } from "./semantic-runtime-choice-builder";
import {
  createSemanticRuntimeScoreBreakdownContext,
  type SemanticRuntimeScoreBreakdownContextDependencies,
} from "./semantic-runtime-score-breakdown";

export type SemanticRuntimeChoiceCompositionDependencies =
  SemanticRuntimeScoreBreakdownContextDependencies &
    Omit<SemanticRuntimeChoiceBuilderDependencies, "scoreBreakdown">;

export function createSemanticRuntimeChoiceComposition(
  dependencies: SemanticRuntimeChoiceCompositionDependencies,
) {
  const { semanticRuntimeScoreBreakdown } =
    createSemanticRuntimeScoreBreakdownContext({
      runnerComponents: dependencies.runnerComponents,
      corpComponents: dependencies.corpComponents,
      actionCreditCost: dependencies.actionCreditCost,
    });

  const { semanticRuntimeChoices } = createSemanticRuntimeChoiceBuilderContext({
    scope: dependencies.scope,
    actionExclusion: dependencies.actionExclusion,
    scoreBreakdown: semanticRuntimeScoreBreakdown,
    actionCreditCost: dependencies.actionCreditCost,
    evidence: dependencies.evidence,
    explanation: dependencies.explanation,
    compareAction: dependencies.compareAction,
  });

  return {
    semanticRuntimeScoreBreakdown,
    semanticRuntimeChoices,
  };
}
