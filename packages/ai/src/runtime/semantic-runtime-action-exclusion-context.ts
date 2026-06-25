import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  semanticRuntimeActionExclusion,
  type SemanticRuntimeActionExclusionDependencies,
} from "./semantic-runtime-action-exclusion";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type SemanticRuntimeActionExclusionContext = {
  semanticRuntimeActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createSemanticRuntimeActionExclusionContext(
  dependencies: SemanticRuntimeActionExclusionDependencies,
): SemanticRuntimeActionExclusionContext {
  return {
    semanticRuntimeActionExclusion: (input, action) =>
      semanticRuntimeActionExclusion(input, action, dependencies),
  };
}
