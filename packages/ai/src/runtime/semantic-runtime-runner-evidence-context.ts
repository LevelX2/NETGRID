import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeRunnerEvidence,
  type SemanticRuntimeRunnerEvidenceDependencies,
} from "./semantic-runtime-runner-evidence";

export type SemanticRuntimeRunnerEvidenceContext = {
  semanticRuntimeRunnerEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
};

export function createSemanticRuntimeRunnerEvidenceContext(
  dependencies: SemanticRuntimeRunnerEvidenceDependencies,
): SemanticRuntimeRunnerEvidenceContext {
  return {
    semanticRuntimeRunnerEvidence: (input, action) =>
      semanticRuntimeRunnerEvidence(input, action, dependencies),
  };
}
