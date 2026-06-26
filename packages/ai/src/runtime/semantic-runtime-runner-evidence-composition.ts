import {
  createSemanticRuntimeRunnerEvidenceContext,
} from "./semantic-runtime-runner-evidence-context";
import type { SemanticRuntimeRunnerEvidenceDependencies } from "./semantic-runtime-runner-evidence";

export function createSemanticRuntimeRunnerEvidenceComposition(
  dependencies: SemanticRuntimeRunnerEvidenceDependencies,
) {
  return createSemanticRuntimeRunnerEvidenceContext(dependencies);
}
