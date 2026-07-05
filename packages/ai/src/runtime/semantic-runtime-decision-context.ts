import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import type { AiDecisionRuntimeOptions } from "./choose-ai-action";
import { chooseSemanticRuntimeAction as chooseSemanticRuntimeActionFromRuntime } from "./semantic-runtime";
import type { SemanticRuntimeDependencies } from "./semantic-runtime";
import { memoizeLegacyDecision } from "./legacy-decision-provider";
import {
  applyPracticalMicroRuntimeComparator,
  practicalMicroRuntimeMode,
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
    legacyDecisionProvider?: () => AiDecision,
  ) => AiDecision;
};

export function createSemanticRuntimeDecisionContext(
  dependencies: SemanticRuntimeDecisionContextDependencies,
): SemanticRuntimeDecisionContext {
  function chooseSemanticRuntimeAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions,
    legacyDecisionProvider?: () => AiDecision,
  ): AiDecision {
    const runtimeDecision = chooseSemanticRuntimeActionFromRuntime(
      input,
      options,
      dependencies,
    );
    if (practicalMicroRuntimeMode(options) === "off") {
      return applyPracticalTacticOverlay(input, runtimeDecision, options);
    }
    if (!legacyDecisionProvider) {
      return applyPracticalTacticOverlay(input, runtimeDecision, options);
    }
    const lazyLegacyDecision = memoizeLegacyDecision(legacyDecisionProvider);
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
