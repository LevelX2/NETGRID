import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import type { SemanticRuntimeDependencies } from "./semantic-runtime";
import type { PracticalMicroCandidate } from "./practical-micro-runtime";
import { choosePlanFirstLiveAction } from "./plan-first-live-runtime";
import { withDecisionDerivedCache } from "./decision-derived-cache";

export type SemanticRuntimeDecisionContextDependencies =
  SemanticRuntimeDependencies & {
    practicalMicroRuntimeCandidates: (
      input: AiDecisionInput,
      runtimeDecision: AiDecision,
    ) => PracticalMicroCandidate[];
  };

export type SemanticRuntimeDecisionContext = {
  chooseSemanticRuntimeAction: (
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions,
  ) => AiDecision;
};

export function createSemanticRuntimeDecisionContext(
  dependencies: SemanticRuntimeDecisionContextDependencies,
): SemanticRuntimeDecisionContext {
  function chooseSemanticRuntimeAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions,
  ): AiDecision {
    return withDecisionDerivedCache(() => {
      return choosePlanFirstLiveAction(
        input,
        options,
        dependencies,
      );
    });
  }

  return { chooseSemanticRuntimeAction };
}
