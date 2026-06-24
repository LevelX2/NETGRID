import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpAdvancementCounterPlacementAssessment,
  type CorpAdvancementCounterPlacementAssessment,
  type SemanticRuntimeCorpAdvancementCounterDependencies,
} from "./semantic-runtime-corp-advancement-counter";

export type SemanticRuntimeCorpAdvancementCounterContext = {
  semanticRuntimeCorpAdvancementCounterPlacementAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => CorpAdvancementCounterPlacementAssessment | undefined;
};

export function createSemanticRuntimeCorpAdvancementCounterContext(
  dependencies: SemanticRuntimeCorpAdvancementCounterDependencies,
): SemanticRuntimeCorpAdvancementCounterContext {
  return {
    semanticRuntimeCorpAdvancementCounterPlacementAssessment: (input, action) =>
      semanticRuntimeCorpAdvancementCounterPlacementAssessment(
        input,
        action,
        dependencies,
      ),
  };
}
