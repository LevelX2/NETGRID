import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  runnerSourceCardAnswerRole as buildRunnerSourceCardAnswerRole,
  type RunnerSourceCardAnswerRoleDependencies,
} from "./runner-source-card-answer-role";

export type RunnerSourceCardAnswerRoleContext = {
  semanticRuntimeRunnerSourceCardAnswerRole: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => "search" | "draw" | undefined;
};

export function createRunnerSourceCardAnswerRoleContext(
  dependencies: RunnerSourceCardAnswerRoleDependencies,
): RunnerSourceCardAnswerRoleContext {
  function semanticRuntimeRunnerSourceCardAnswerRole(
    input: AiDecisionInput,
    action: LegalAction,
  ): "search" | "draw" | undefined {
    return buildRunnerSourceCardAnswerRole(input, action, dependencies);
  }

  return { semanticRuntimeRunnerSourceCardAnswerRole };
}
