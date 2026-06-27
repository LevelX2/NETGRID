import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeCorpScoreComponents as buildSemanticRuntimeCorpScoreComponents,
  type SemanticRuntimeCorpScoreDependencies,
} from "./semantic-runtime-corp-score";

export type SemanticRuntimeCorpScoreContext = {
  semanticRuntimeCorpScore: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => number;
  semanticRuntimeCorpScoreComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
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
    actionSemanticCandidate?: ActionSemanticCandidate,
  ): AiDecisionScoreComponent[] {
    return buildSemanticRuntimeCorpScoreComponents(
      input,
      action,
      scopeId,
      dependencies,
      actionSemanticCandidate,
    );
  }

  return {
    semanticRuntimeCorpScore: (input, action, scopeId, actionSemanticCandidate) =>
      scoreFromComponents(
        semanticRuntimeCorpScoreComponents(
          input,
          action,
          scopeId,
          actionSemanticCandidate,
        ),
      ),
    semanticRuntimeCorpScoreComponents,
  };
}
