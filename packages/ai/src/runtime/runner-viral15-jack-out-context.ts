import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  runnerViral15JackOutScoreComponent as buildRunnerViral15JackOutScoreComponent,
} from "./runner-viral15-jack-out-score";

export type RunnerViral15JackOutContextDependencies = {
  actionCreditCost: (action: LegalAction) => number;
  isVisibleIcebreakerProgram: (card: VisibleCard) => boolean;
};

export type RunnerViral15JackOutContext = {
  runnerViral15JackOutScoreComponent: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent | undefined;
};

export function createRunnerViral15JackOutContext(
  dependencies: RunnerViral15JackOutContextDependencies,
): RunnerViral15JackOutContext {
  function runnerViral15JackOutScoreComponent(
    input: AiDecisionInput,
    action: LegalAction,
  ): AiDecisionScoreComponent | undefined {
    return buildRunnerViral15JackOutScoreComponent(input, action, dependencies);
  }

  return { runnerViral15JackOutScoreComponent };
}
