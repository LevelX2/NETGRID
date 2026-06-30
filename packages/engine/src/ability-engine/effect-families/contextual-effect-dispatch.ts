import type { CardEffectFamilyInput } from "./family-runtime";
import { executeAgendaHandDisruptionEffect } from "./agenda-hand-disruption-effects";
import { executeEncounterTraceMovementEffect } from "./encounter-trace-movement-effects";
import { executeHiddenInformationEffect } from "./hidden-information-effects";
import { executeHiddenZoneResourceEffect } from "./hidden-zone-resource-effects";
import { executeIceStrengthEffect } from "./ice-strength-effects";
import { executeResourceCostLinkEffect } from "./resource-cost-link-effects";
import { executeRunSequenceEffect } from "./run-sequence-effects";
import { executeSearchRunEffect } from "./search-run-effects";

export function executeContextualEffect(input: CardEffectFamilyInput): void {
  if (
    executeEncounterTraceMovementEffect(input) ||
    executeAgendaHandDisruptionEffect(input) ||
    executeRunSequenceEffect(input) ||
    executeHiddenInformationEffect(input) ||
    executeSearchRunEffect(input) ||
    executeHiddenZoneResourceEffect(input) ||
    executeIceStrengthEffect(input) ||
    executeResourceCostLinkEffect(input)
  )
    return;

  const unknownEffect = input.effect as { kind?: string };
  throw new Error(
    `Unsupported card implementation effect: ${unknownEffect.kind ?? "unknown"}`,
  );
}
