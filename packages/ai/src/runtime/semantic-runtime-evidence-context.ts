import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeEvidence,
  type SemanticRuntimeEvidenceDependencies,
} from "./semantic-runtime-evidence";

export type SemanticRuntimeEvidenceContext = {
  semanticRuntimeEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
  ) => string[];
};

export function createSemanticRuntimeEvidenceContext(
  dependencies: SemanticRuntimeEvidenceDependencies,
): SemanticRuntimeEvidenceContext {
  return {
    semanticRuntimeEvidence: (input, action, scopeId) =>
      semanticRuntimeEvidence(input, action, scopeId, dependencies),
  };
}
