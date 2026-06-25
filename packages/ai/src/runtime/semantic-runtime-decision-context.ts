import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import { chooseSemanticRuntimeAction as chooseSemanticRuntimeActionFromRuntime } from "./semantic-runtime";
import type { SemanticRuntimeDependencies } from "./semantic-runtime";
import { memoizeLegacyDecision } from "./legacy-decision-provider";
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
    legacyDecisionProvider: () => AiDecision,
    options: AiDecisionRuntimeOptions,
  ) => AiDecision;
};

export function createSemanticRuntimeDecisionContext(
  dependencies: SemanticRuntimeDecisionContextDependencies,
): SemanticRuntimeDecisionContext {
  function chooseSemanticRuntimeAction(
    input: AiDecisionInput,
    legacyDecisionProvider: () => AiDecision,
    options: AiDecisionRuntimeOptions,
  ): AiDecision {
    const lazyLegacyDecision = memoizeLegacyDecision(legacyDecisionProvider);
    const runtimeDecision = chooseSemanticRuntimeActionFromRuntime(
      input,
      lazyLegacyDecision,
      options,
      dependencies,
    );
    const legacyDecision = lazyLegacyDecision();
    const practicalMicroDecision = applyPracticalMicroRuntimeComparator(
      input,
      legacyDecision,
      runtimeDecision,
      options,
      dependencies.practicalMicroRuntimeCandidates(input, runtimeDecision),
    );
    return applyPracticalTacticOverlay(input, practicalMicroDecision, options);
  }

  return { chooseSemanticRuntimeAction };
}
