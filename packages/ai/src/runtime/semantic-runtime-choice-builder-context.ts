import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  buildSemanticRuntimeChoices,
  type SemanticRuntimeChoiceBuilderDependencies,
} from "./semantic-runtime-choice-builder";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

export type SemanticRuntimeChoiceBuilderContext = {
  semanticRuntimeChoices: (
    input: AiDecisionInput,
    actionSemanticCandidates?: readonly ActionSemanticCandidate[],
  ) => SemanticRuntimeChoice[];
};

export function createSemanticRuntimeChoiceBuilderContext(
  dependencies: SemanticRuntimeChoiceBuilderDependencies,
): SemanticRuntimeChoiceBuilderContext {
  return {
    semanticRuntimeChoices: (input, actionSemanticCandidates = []) =>
      buildSemanticRuntimeChoices(input, actionSemanticCandidates, dependencies),
  };
}
