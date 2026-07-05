import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import {
  type AiDecisionRuntimeOptions,
  chooseAiActionFromSides,
} from "./choose-ai-action";

export type AiActionEntrypointDependencies = {
  chooseSemanticRuntimeAction: (
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions,
  ) => AiDecision;
};

export function createAiActionEntrypoints(
  dependencies: AiActionEntrypointDependencies,
): {
  chooseAiAction: (
    input: AiDecisionInput,
    options?: AiDecisionRuntimeOptions,
  ) => AiDecision;
  chooseCorpAction: (
    input: AiDecisionInput,
    options?: AiDecisionRuntimeOptions,
  ) => AiDecision;
  chooseRunnerAction: (
    input: AiDecisionInput,
    options?: AiDecisionRuntimeOptions,
  ) => AiDecision;
} {
  function chooseAiAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions = {},
  ): AiDecision {
    return chooseAiActionFromSides(input, options, {
      corp: chooseCorpAction,
      runner: chooseRunnerAction,
    });
  }

  function chooseCorpAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions = {},
  ): AiDecision {
    return dependencies.chooseSemanticRuntimeAction(input, options);
  }

  function chooseRunnerAction(
    input: AiDecisionInput,
    options: AiDecisionRuntimeOptions = {},
  ): AiDecision {
    return dependencies.chooseSemanticRuntimeAction(input, options);
  }

  return {
    chooseAiAction,
    chooseCorpAction,
    chooseRunnerAction,
  };
}
