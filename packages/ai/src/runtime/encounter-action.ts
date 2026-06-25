import { type LegalAction } from "@netgrid/shared";

export function breakerIdForEncounterAction(
  action: LegalAction,
): string | undefined {
  if (typeof action.payload?.breakerId === "string")
    return action.payload.breakerId;
  return action.source === "basic_action" || action.source === "game_rule"
    ? undefined
    : action.source;
}
