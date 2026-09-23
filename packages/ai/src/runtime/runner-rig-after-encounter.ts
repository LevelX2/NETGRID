import type { LegalAction, VisibleCard } from "@netgrid/shared";
import { icebreakerAbilitiesForDefinition } from "@netgrid/engine";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";

/** Apply the Engine's encounter-boundary fact. No card-rule reconstruction. */
export function runnerRigAfterEncounter(
  rig: readonly VisibleCard[],
): VisibleCard[] {
  return rig.map((card) =>
    card.strengthAfterEncounter !== undefined
      ? { ...card, strength: card.strengthAfterEncounter }
      : card,
  );
}

/** Project the bound pump before applying the encounter-boundary fact. */
export function runnerRigWithPlannedPump(
  rig: readonly VisibleCard[],
  action: LegalAction,
  strengthGain: number,
): VisibleCard[] {
  const breaker = rig.find((card) => card.instanceId === action.source);
  const definition = breaker?.definitionId
    ? CARD_DEFINITIONS_BY_ID[breaker.definitionId]
    : undefined;
  const ability =
    definition &&
    icebreakerAbilitiesForDefinition(definition).find(
      (candidate) =>
        candidate.type === "pump_strength" &&
        candidate.id === action.abilityRef?.sourceAbilityId,
    );
  if (
    !breaker ||
    !ability ||
    action.type !== "pump_breaker" ||
    action.abilityRef?.sourceCardInstanceId !== breaker.instanceId ||
    !Number.isFinite(breaker.strength) ||
    !Number.isFinite(strengthGain) ||
    strengthGain <= 0
  ) {
    throw new Error(
      `runner_pump_projection_binding_missing:${action.actionId}`,
    );
  }
  const retainedGain =
    ability.strengthDuration === "current_run" ||
    ability.strengthDuration === "current_turn"
      ? strengthGain
      : 0;
  return rig.map((card) =>
    card.instanceId === breaker.instanceId
      ? {
          ...card,
          strength: breaker.strength! + strengthGain,
          strengthAfterEncounter:
            (breaker.strengthAfterEncounter ?? breaker.strength!) +
            retainedGain,
        }
      : card,
  );
}
