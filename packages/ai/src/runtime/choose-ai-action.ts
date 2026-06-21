import { type AiDecision, type AiDecisionInput } from "@netgrid/shared";

export type AiDecisionRuntimeOptions = {
  persistTacticalPlanMemory?: boolean;
  practicalMicroRuntime?: PracticalMicroRuntimeOptions;
};

export type PracticalMicroRuntimeMode = "off" | "compare" | "apply";

export type PracticalMicroRuntimeRuleId =
  | "runner_visible_coverage_install"
  | "corp_stale_punish_deactivation"
  | "corp_safe_scoreline"
  | "runner_run_payoff_completion";

export type PracticalMicroRuntimeOptions = {
  mode?: PracticalMicroRuntimeMode;
  enabledRules?: readonly PracticalMicroRuntimeRuleId[];
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
