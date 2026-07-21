import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  buildSemanticRuntimeChoices,
  type SemanticRuntimeChoiceBuilderDependencies,
} from "./semantic-runtime-choice-builder";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";
import type { CreditDemand } from "../plans/credit-demand";

export type SemanticRuntimeChoiceBuilderContext = {
  semanticRuntimeChoices: (
    input: AiDecisionInput,
    actionSemanticCandidates?: readonly ActionSemanticCandidate[],
    creditDemands?: readonly CreditDemand[],
  ) => SemanticRuntimeChoice[];
};

export function createSemanticRuntimeChoiceBuilderContext(
  dependencies: SemanticRuntimeChoiceBuilderDependencies,
): SemanticRuntimeChoiceBuilderContext {
  return {
    semanticRuntimeChoices: (
      input,
      actionSemanticCandidates = [],
      creditDemands = [],
    ) =>
      buildSemanticRuntimeChoices(
        input,
        actionSemanticCandidates,
        dependencies,
        creditDemands,
      ),
  };
}
