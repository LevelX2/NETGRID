import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
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
  breakerDefinitionId: string,
): number | undefined {
  if (typeof action.payload?.pumpStrengthAmount === "number") {
    return Number.isFinite(action.payload.pumpStrengthAmount)
      ? Math.max(0, action.payload.pumpStrengthAmount)
      : undefined;
  }
  const pumpAbility = CARD_DEFINITIONS_BY_ID[
    breakerDefinitionId
  ]?.abilities?.find((ability) => ability.type === "pump_strength");
  return typeof pumpAbility?.amount === "number" &&
    Number.isFinite(pumpAbility.amount)
    ? Math.max(0, pumpAbility.amount)
    : undefined;
}
