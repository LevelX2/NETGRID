import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { actionCreditCost } from "./tactical-plan-action-values";
import {
  actionServerId,
  isRemoteServer,
} from "./tactical-plan-server-targets";

export function runnerHasConcreteFundingNeed(
  input: AiDecisionInput,
  blockedRemoteRuns: readonly LegalAction[],
): boolean {
  if (input.playerView.own.credits <= 3) return true;
  return blockedRemoteRuns.length === 0 &&
    input.legalActions.some(
      (action) =>
        action.type === "start_run" &&
        isRemoteServer(actionServerId(action)) &&
        actionCreditCost(action) >= input.playerView.own.credits,
    );
}
