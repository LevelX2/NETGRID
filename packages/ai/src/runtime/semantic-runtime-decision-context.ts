import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import { chooseSemanticRuntimeAction as chooseSemanticRuntimeActionFromRuntime } from "./semantic-runtime";
import type { SemanticRuntimeDependencies } from "./semantic-runtime";
import {
  applyPracticalMicroRuntimeComparator,
  type PracticalMicroCandidate,
} from "./practical-micro-runtime";
import { applyPracticalTacticOverlay } from "./practical-tactic-overlay";

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
    const runtimeDecision = chooseSemanticRuntimeActionFromRuntime(
      input,
      options,
      dependencies,
    );
    const practicalMicroDecision = applyPracticalMicroRuntimeComparator(
      input,
      runtimeDecision,
      options,
      dependencies.practicalMicroRuntimeCandidates(input, runtimeDecision),
    );
    return applyPracticalTacticOverlay(input, practicalMicroDecision, options);
  }

  return { chooseSemanticRuntimeAction };
}
