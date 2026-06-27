import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeEvidence,
  type SemanticRuntimeEvidenceDependencies,
} from "./semantic-runtime-evidence";

export type SemanticRuntimeEvidenceContext = {
  semanticRuntimeEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
    scopeId: string,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => string[];
};

export function createSemanticRuntimeEvidenceContext(
  dependencies: SemanticRuntimeEvidenceDependencies,
): SemanticRuntimeEvidenceContext {
  return {
    semanticRuntimeEvidence: (input, action, scopeId, actionSemanticCandidate) =>
      semanticRuntimeEvidence(
        input,
        action,
        scopeId,
        actionSemanticCandidate,
        dependencies,
      ),
  };
}
