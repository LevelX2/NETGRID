import type { AiDecisionInput } from "@netgrid/shared";
import {
  runnerHandFundingTarget as buildRunnerHandFundingTarget,
  type RunnerHandFundingTarget,
  type RunnerHandFundingTargetDependencies,
} from "./runner-hand-funding-target";

export type RunnerHandFundingContext = {
  runnerHandFundingTarget: (
    input: AiDecisionInput,
  ) => RunnerHandFundingTarget | undefined;
};

export function createRunnerHandFundingContext(
  dependencies: RunnerHandFundingTargetDependencies,
): RunnerHandFundingContext {
  function runnerHandFundingTarget(
    input: AiDecisionInput,
  ): RunnerHandFundingTarget | undefined {
    return buildRunnerHandFundingTarget(input, dependencies);
  }

  return { runnerHandFundingTarget };
}
