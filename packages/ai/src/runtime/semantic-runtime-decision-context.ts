import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import type { SemanticRuntimeDependencies } from "./semantic-runtime";
import type { PracticalMicroCandidate } from "./practical-micro-runtime";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import { choosePlanFirstLiveAction } from "./plan-first-live-runtime";
import { withDecisionDerivedCache } from "./decision-derived-cache";

export type SemanticRuntimeDecisionContextDependencies =
  SemanticRuntimeDependencies & {
    runnerEncounterActionExclusion: (
      input: AiDecisionInput,
      action: AiDecisionInput["legalActions"][number],
    ) => SemanticRuntimeExclusion | undefined;
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
