import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import {
  semanticRuntimeCorpDoctrineWeight,
  semanticRuntimeCorpScoreNowDoctrineWeight,
  type SemanticRuntimeCorpDoctrineWeightDependencies,
  type SemanticRuntimeDoctrineConsumer,
} from "./semantic-runtime-doctrine-score";

export type SemanticRuntimeCorpDoctrineContext = {
  semanticRuntimeCorpDoctrineWeight: (
    input: AiDecisionInput,
    action: LegalAction,
    planKey: string,
    consumer: SemanticRuntimeDoctrineConsumer,
  ) => AiDecisionScoreComponent | undefined;
  semanticRuntimeCorpScoreNowDoctrineWeight: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function createSemanticRuntimeCorpDoctrineContext(
  dependencies: SemanticRuntimeCorpDoctrineWeightDependencies<SemanticRuntimeDoctrineConsumer>,
): SemanticRuntimeCorpDoctrineContext {
  return {
    semanticRuntimeCorpDoctrineWeight: (input, action, planKey, consumer) =>
      semanticRuntimeCorpDoctrineWeight(
        input,
        action,
        planKey,
        consumer,
        dependencies,
      ),
    semanticRuntimeCorpScoreNowDoctrineWeight: (input, action) =>
      semanticRuntimeCorpScoreNowDoctrineWeight(
        input,
        action,
        "corp_score_now",
        dependencies,
      ),
  };
}
