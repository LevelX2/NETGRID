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

export function pumpStrengthAmountForAction(
  action: LegalAction,
): number | undefined {
  const gain = action.payload?.pumpStrengthAmount;
  return action.type === "pump_breaker" &&
    typeof gain === "number" &&
    Number.isSafeInteger(gain) &&
    gain > 0
    ? gain
    : undefined;
}
