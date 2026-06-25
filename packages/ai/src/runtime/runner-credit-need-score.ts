import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export type RunnerCreditNeedScoreDependencies = {
  handFundingTarget: (
    input: AiDecisionInput,
  ) => { value: number; reason: string } | undefined;
};

export function runnerCreditNeedScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerCreditNeedScoreDependencies,
): AiDecisionScoreComponent[] {
  if (action.type !== "gain_credit") return [];
  const components: AiDecisionScoreComponent[] = [];
  const credits = input.playerView.own.credits;
  if (credits < 5) {
    components.push({
      key: "runner_low_credits",
      label: "Credit-Bedarf",
      value: 700,
      reason: `credits:${credits}`,
    });
  }
  const fundingTarget = dependencies.handFundingTarget(input);
  if (fundingTarget) {
    components.push({
      key: "runner_hand_funding_target",
      label: "Handkarte finanzieren",
      value: fundingTarget.value,
      reason: fundingTarget.reason,
    });
  }
  return components;
}
