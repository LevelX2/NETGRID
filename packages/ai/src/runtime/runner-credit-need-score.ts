import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { actionClickCost } from "./action-cost";
import {
  runnerKnownNetCreditGain,
  type RunnerCreditYieldScoreDependencies,
} from "./runner-credit-yield-score";

export type RunnerCreditNeedScoreDependencies = {
  handFundingTarget: (
    input: AiDecisionInput,
  ) => { value: number; reason: string } | undefined;
  creditYield: RunnerCreditYieldScoreDependencies;
};

export function runnerCreditNeedScoreComponents(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerCreditNeedScoreDependencies,
): AiDecisionScoreComponent[] {
  if (
    action.payload?.cardImplementationAddsHostedCredits === true ||
    action.payload?.cardImplementationTakesHostedCredits === true
  ) {
    return [];
  }
  const netCreditGain = runnerKnownNetCreditGain(
    input,
    action,
    dependencies.creditYield,
  );
  const clickCost = actionClickCost(action);
  const netCreditsPerClick = netCreditGain / clickCost;
  if (
    action.type !== "gain_credit" &&
    (netCreditGain <= 0 || netCreditsPerClick <= 1)
  ) {
    return [];
  }
  const components: AiDecisionScoreComponent[] = [];
  const credits = input.playerView.own.credits;
  if (credits < 5) {
    components.push({
      key: "runner_low_credits",
      label: "Credit-Bedarf",
      value: 700,
      reason: `credits:${credits}|net_gain:${netCreditGain}|click_cost:${clickCost}`,
    });
  }
  const fundingTarget = dependencies.handFundingTarget(input);
  if (fundingTarget) {
    components.push({
      key: "runner_hand_funding_target",
      label: "Handkarte finanzieren",
      value: fundingTarget.value,
      reason: `${fundingTarget.reason}|net_gain:${netCreditGain}|click_cost:${clickCost}`,
    });
  }
  return components;
}
