import type { VisibleCard } from "@netgrid/shared";
import { visibleBreakerEncounterQuote } from "@netgrid/engine";

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

/** Quote the already funded pump before crossing the encounter boundary. */
export function runnerRigAfterPumpAndEncounter(
  rig: readonly VisibleCard[],
  breaker: VisibleCard,
  ice: VisibleCard,
  pumpAmount: number,
  pumpCount: number,
): VisibleCard[] {
  const quote =
    breaker.definitionId && ice.definitionId
      ? visibleBreakerEncounterQuote({
          breakerDefinitionId: breaker.definitionId,
          breakerInstanceId: breaker.instanceId,
          breakerStrength: breaker.strength ?? 0,
          ...(breaker.selectedTargetCardId !== undefined
            ? { selectedTargetCardId: breaker.selectedTargetCardId }
            : {}),
          ...(breaker.selectedSubtype !== undefined
            ? { selectedSubtype: breaker.selectedSubtype }
            : {}),
          ...(breaker.randomRunStrengthState !== undefined
            ? { randomRunStrengthState: breaker.randomRunStrengthState }
            : {}),
          iceDefinitionId: ice.definitionId,
          iceInstanceId: ice.instanceId,
          ...(ice.subtypes !== undefined ? { iceSubtypes: ice.subtypes } : {}),
        })
      : undefined;
  const options = quote?.pumpOptions.filter(
    (option) => option.strengthGain === pumpAmount,
  );
  const horizons = new Set(
    options?.map((option) => option.duration !== "current_encounter"),
  );
  if (horizons.size !== 1) {
    throw new Error(
      `runner_projected_pump_horizon_unresolved:${breaker.instanceId}:${pumpAmount}`,
    );
  }
  const futureRig = runnerRigAfterEncounter(rig);
  if (!horizons.has(true)) return futureRig;
  return futureRig.map((card) => {
    if (card.instanceId !== breaker.instanceId) return card;
    const strength = (card.strength ?? 0) + pumpAmount * pumpCount;
    return {
      ...card,
      strength,
      ...(card.strengthAfterEncounter !== undefined
        ? { strengthAfterEncounter: strength }
        : {}),
    };
  });
}
