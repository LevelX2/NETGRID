import {
  createSemanticRuntimeChoiceBuilderContext,
} from "./semantic-runtime-choice-builder-context";
import type { SemanticRuntimeChoiceBuilderDependencies } from "./semantic-runtime-choice-builder";
import {
  createSemanticRuntimeEvidenceContext,
} from "./semantic-runtime-evidence-context";
import type { SemanticRuntimeEvidenceDependencies } from "./semantic-runtime-evidence";
import {
  createSemanticRuntimeScoreBreakdownContext,
  type SemanticRuntimeScoreBreakdownContextDependencies,
} from "./semantic-runtime-score-breakdown";

export type SemanticRuntimeChoiceCompositionDependencies =
  SemanticRuntimeScoreBreakdownContextDependencies &
    SemanticRuntimeEvidenceDependencies &
    Omit<
      SemanticRuntimeChoiceBuilderDependencies,
      "scoreBreakdown" | "evidence"
    >;

export function createSemanticRuntimeChoiceComposition(
  dependencies: SemanticRuntimeChoiceCompositionDependencies,
) {
  const { semanticRuntimeScoreBreakdown } =
    createSemanticRuntimeScoreBreakdownContext({
      runnerComponents: dependencies.runnerComponents,
      corpComponents: dependencies.corpComponents,
      actionCreditCost: dependencies.actionCreditCost,
    });

  const { semanticRuntimeEvidence } = createSemanticRuntimeEvidenceContext({
    serverId: dependencies.serverId,
    runnerEvidence: dependencies.runnerEvidence,
    corpEvidence: dependencies.corpEvidence,
  });

  const { semanticRuntimeChoices } = createSemanticRuntimeChoiceBuilderContext({
    scope: dependencies.scope,
    actionExclusion: dependencies.actionExclusion,
    scoreBreakdown: semanticRuntimeScoreBreakdown,
    actionCreditCost: dependencies.actionCreditCost,
    evidence: semanticRuntimeEvidence,
    explanation: dependencies.explanation,
    compareAction: dependencies.compareAction,
  });

  return {
    semanticRuntimeScoreBreakdown,
    semanticRuntimeChoices,
  };
}
