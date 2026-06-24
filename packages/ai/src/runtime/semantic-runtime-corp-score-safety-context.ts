import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpScoreNowSafetyGate,
  type SemanticRuntimeCorpScoreSafetyDependencies,
  type SemanticRuntimeCorpScoreSafetyGate,
} from "./semantic-runtime-corp-score-safety";

export type SemanticRuntimeCorpScoreSafetyContext = {
  semanticRuntimeCorpScoreNowSafetyGate: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeCorpScoreSafetyGate;
};

export function createSemanticRuntimeCorpScoreSafetyContext(
  dependencies: SemanticRuntimeCorpScoreSafetyDependencies,
): SemanticRuntimeCorpScoreSafetyContext {
  return {
    semanticRuntimeCorpScoreNowSafetyGate: (input, action) =>
      semanticRuntimeCorpScoreNowSafetyGate(input, action, dependencies),
  };
}
