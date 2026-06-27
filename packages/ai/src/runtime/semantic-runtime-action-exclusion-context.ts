import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  semanticRuntimeActionExclusion,
  type SemanticRuntimeActionExclusionDependencies,
} from "./semantic-runtime-action-exclusion";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type SemanticRuntimeActionExclusionContext = {
  semanticRuntimeActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
    actionSemanticCandidate?: ActionSemanticCandidate,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createSemanticRuntimeActionExclusionContext(
  dependencies: SemanticRuntimeActionExclusionDependencies,
): SemanticRuntimeActionExclusionContext {
  return {
    semanticRuntimeActionExclusion: (input, action, actionSemanticCandidate) =>
      semanticRuntimeActionExclusion(
        input,
        action,
        actionSemanticCandidate,
        dependencies,
      ),
  };
}
