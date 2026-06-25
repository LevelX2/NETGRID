import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

export function corpVisibleRunnerRigTrashTarget(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const targetIds = [
    action.payload?.cardId,
    action.payload?.targetCardId,
  ].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  return (input.playerView.opponent.rig ?? []).find(
    (card) => card.known && targetIds.includes(card.instanceId),
  );
}

export function corpVisibleRunnerHardwareTrashTarget(
  input: AiDecisionInput,
): VisibleCard | undefined {
  return (input.playerView.opponent.rig ?? []).find(
    (card) => card.known && card.type === "hardware",
  );
}
