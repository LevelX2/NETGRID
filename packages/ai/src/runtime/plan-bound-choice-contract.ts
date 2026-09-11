import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
export type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

export type PendingChoiceOptions = PendingChoice["options"];

export function unresolvedChoiceFailure(
  input: AiDecisionInput,
  action: LegalAction,
  removalCondition: string,
): PlanResolutionFailure {
  return new PlanResolutionFailure("window_origin_missing", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((legalAction) => legalAction.type),
    unresolvedActionIds: [action.actionId],
    owner: "window_resolution",
    removalCondition,
  });
}
