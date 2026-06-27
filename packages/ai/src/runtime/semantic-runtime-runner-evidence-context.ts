import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeRunnerEvidence,
  type SemanticRuntimeRunnerEvidenceDependencies,
} from "./semantic-runtime-runner-evidence";

export type SemanticRuntimeRunnerEvidenceContext = {
  semanticRuntimeRunnerEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => string[];
};

export function createSemanticRuntimeRunnerEvidenceContext(
  dependencies: SemanticRuntimeRunnerEvidenceDependencies,
): SemanticRuntimeRunnerEvidenceContext {
  return {
    semanticRuntimeRunnerEvidence: (input, action, actionSemanticCandidate) =>
      semanticRuntimeRunnerEvidence(
        input,
        action,
        actionSemanticCandidate,
        dependencies,
      ),
  };
}
