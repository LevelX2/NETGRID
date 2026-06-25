import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  semanticRuntimeCorpScoreComponents as buildSemanticRuntimeCorpScoreComponents,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score";

export type SemanticRuntimeCorpScoreContext = {
  semanticRuntimeCorpScore: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
  ) => number;
  semanticRuntimeCorpScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
  ) => AiDecisionScoreComponent[];
};

export function createSemanticRuntimeCorpScoreContext<
  TConsumer extends string,
>(
  dependencies: SemanticRuntimeCorpScoreDependencies<TConsumer>,
  scoreFromComponents: (components: AiDecisionScoreComponent[]) => number,
): SemanticRuntimeCorpScoreContext {
  function semanticRuntimeCorpScoreComponents(
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
  ): AiDecisionScoreComponent[] {
    return buildSemanticRuntimeCorpScoreComponents(
      input,
      action,
      scopeId,
      dependencies,
    );
  }

  return {
    semanticRuntimeCorpScore: (input, action, scopeId) =>
      scoreFromComponents(
        semanticRuntimeCorpScoreComponents(input, action, scopeId),
      ),
    semanticRuntimeCorpScoreComponents,
  };
}
