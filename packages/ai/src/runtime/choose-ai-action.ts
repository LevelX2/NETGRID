import { type AiDecision, type AiDecisionInput } from "@netgrid/shared";

export type AiDecisionRuntimeOptions = {
  persistTacticalPlanMemory?: boolean;
};

export type ChooseSideAction = (
  input: AiDecisionInput,
  options?: AiDecisionRuntimeOptions,
) => AiDecision;

export function chooseAiActionFromSides(
  input: AiDecisionInput,
  options: AiDecisionRuntimeOptions,
  delegates: {
    corp: ChooseSideAction;
    runner: ChooseSideAction;
  },
): AiDecision {
  return input.side === "runner"
    ? delegates.runner(input, options)
    : delegates.corp(input, options);
}
