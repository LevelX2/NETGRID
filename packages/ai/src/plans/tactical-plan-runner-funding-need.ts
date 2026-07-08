import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { actionCreditCost } from "./tactical-plan-action-values";
import { actionServerId, isRemoteServer } from "./tactical-plan-server-targets";

export function runnerHasConcreteFundingNeed(
  input: AiDecisionInput,
  blockedRemoteRuns: readonly LegalAction[],
): boolean {
  if (input.playerView.own.credits <= 3) return true;
  return runnerHasConcretePlanFundingNeed(input, blockedRemoteRuns);
}

export function runnerHasConcretePlanFundingNeed(
  input: AiDecisionInput,
  blockedRemoteRuns: readonly LegalAction[],
): boolean {
  const ownCredits = input.playerView.own.credits;
  if (
    input.legalActions.some(
      (action) =>
        actionCreditCost(action) > ownCredits &&
        runnerActionCanRepresentConcreteFundingNeed(action),
    )
  ) {
    return true;
  }
  return (
    blockedRemoteRuns.length === 0 &&
    input.legalActions.some(
      (action) =>
        action.type === "start_run" &&
        isRemoteServer(actionServerId(action)) &&
        actionCreditCost(action) > ownCredits,
    )
  );
}

function runnerActionCanRepresentConcreteFundingNeed(
  action: LegalAction,
): boolean {
  return (
    action.type === "start_run" ||
    action.type === "install_card" ||
    action.type === "play_event" ||
    action.type === "activated_card_ability" ||
    action.type === "trigger_ability"
  );
}
