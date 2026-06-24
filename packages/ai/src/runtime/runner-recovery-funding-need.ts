import type { AiDecisionInput } from "@netgrid/shared";

export type RunnerRecoveryFundingNeedContext = {
  active: boolean;
  reason: string;
};

export type RunnerRecoveryFundingNeedDependencies = {
  handFundingTarget: (input: AiDecisionInput) => unknown;
  bankHasConcreteFundingNeed: (input: AiDecisionInput) => boolean;
  hasKnownUnaffordableLegalRun: (input: AiDecisionInput) => boolean;
};

export function runnerRecoveryFundingNeedContext(
  input: AiDecisionInput,
  dependencies: RunnerRecoveryFundingNeedDependencies,
): RunnerRecoveryFundingNeedContext {
  if (dependencies.handFundingTarget(input)) {
    return { active: true, reason: "hand_funding_target" };
  }
  if (dependencies.bankHasConcreteFundingNeed(input)) {
    return { active: true, reason: "concrete_bank_funding_need" };
  }
  if (
    input.playerView.own.credits <= 2 &&
    dependencies.hasKnownUnaffordableLegalRun(input)
  ) {
    return { active: true, reason: "known_unaffordable_run" };
  }
  if (input.playerView.own.credits <= 1) {
    return { active: true, reason: "emergency_low_credits" };
  }
  return { active: false, reason: "none" };
}
