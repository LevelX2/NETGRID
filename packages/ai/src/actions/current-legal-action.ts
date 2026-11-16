import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

export function actionMatchesCurrentDecision(
  input: AiDecisionInput,
  action: LegalAction | undefined,
): action is LegalAction {
  return (
    action !== undefined &&
    action.side === input.side &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion
  );
}
