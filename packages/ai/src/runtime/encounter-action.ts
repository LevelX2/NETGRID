import { CARD_DEFINITIONS_BY_ID, type LegalAction } from "@netgrid/shared";

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
  breakerDefinitionId: string,
): number {
  if (typeof action.payload?.pumpStrengthAmount === "number")
    return action.payload.pumpStrengthAmount;
  const pumpAbility = CARD_DEFINITIONS_BY_ID[breakerDefinitionId]?.abilities?.find(
    (ability) => ability.type === "pump_strength",
  );
  return Math.max(0, pumpAbility?.amount ?? 1);
}
