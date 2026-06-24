import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  semanticRuntimeCorpPassiveScoreLinePenalty,
  type SemanticRuntimeCorpPassiveScoreLineDependencies,
} from "./semantic-runtime-corp-passive-scoreline";

export type SemanticRuntimeCorpPassiveScoreLineContext = {
  semanticRuntimeCorpPassiveScoreLinePenalty: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function createSemanticRuntimeCorpPassiveScoreLineContext(
  dependencies: SemanticRuntimeCorpPassiveScoreLineDependencies,
): SemanticRuntimeCorpPassiveScoreLineContext {
  return {
    semanticRuntimeCorpPassiveScoreLinePenalty: (input, action) =>
      semanticRuntimeCorpPassiveScoreLinePenalty(input, action, dependencies),
  };
}
