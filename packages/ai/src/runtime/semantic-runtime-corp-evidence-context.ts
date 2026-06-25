import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeCorpEvidence,
  type SemanticRuntimeCorpEvidenceDependencies,
} from "./semantic-runtime-corp-evidence";

type VisibleCorpServer = AiDecisionInput["playerView"]["servers"][number];

export type SemanticRuntimeCorpEvidenceContext = {
  semanticRuntimeCorpEvidence: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string[];
};

export function createSemanticRuntimeCorpEvidenceContext(
  dependencies: SemanticRuntimeCorpEvidenceDependencies<VisibleCorpServer>,
): SemanticRuntimeCorpEvidenceContext {
  return {
    semanticRuntimeCorpEvidence: (input, action) =>
      semanticRuntimeCorpEvidence(input, action, dependencies),
  };
}
