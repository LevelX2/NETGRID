import type { AiBenchmarkDeckSlotResult } from "./ai-match-progression-types";
import type { SimulationBenchmarkProfileId } from "./simulation-types";
import type { AiDoctrineQualityBenchmarkConfig } from "./doctrine-quality-benchmark-types";
import type { AiBenchmarkDeckSlotDefinition } from "./benchmark-deck-types";
import { deckReferenceLabel } from "./benchmark-deck-reference-label";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";
import { validateSimulationDeckSupport } from "./deck-support";

export function runMatchProgressionBenchmarkSlot(
  slot: AiBenchmarkDeckSlotDefinition,
  config: AiDoctrineQualityBenchmarkConfig,
  comparisonProfiles: SimulationBenchmarkProfileId[],
  runMatchProgressionBenchmark: (
    slotConfig: AiDoctrineQualityBenchmarkConfig,
  ) => NonNullable<AiBenchmarkDeckSlotResult["benchmark"]>,
): AiBenchmarkDeckSlotResult {
  const runnerDeckRef = deckReferenceLabel(slot.runner);
  const corpDeckRef = deckReferenceLabel(slot.corp);
  if (slot.status !== "runnable") {
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: slot.status,
      tuningUse: slot.tuningUse,
      runnerDeckRef,
      corpDeckRef,
      reason: slot.pendingReason ?? "Slot ist nicht lauffaehig konfiguriert.",
    };
  }
  const resolved = resolveBenchmarkDeckSlot(slot);
  if (!resolved.ok) {
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: "disabled",
      tuningUse: slot.tuningUse,
      runnerDeckRef,
      corpDeckRef,
      reason: resolved.reason,
    };
  }
  const slotConfig: AiDoctrineQualityBenchmarkConfig = {
    ...config,
    ...resolved.config,
    comparisonProfiles,
  };
  const supportErrors = validateSimulationDeckSupport(slotConfig);
  if (supportErrors.length > 0) {
    return {
      slotId: slot.slotId,
      label: slot.label,
      slotType: slot.slotType,
      status: "disabled",
      tuningUse: slot.tuningUse,
      runnerDeckRef,
      corpDeckRef,
      reason: supportErrors.join(" | "),
    };
  }
  return {
    slotId: slot.slotId,
    label: slot.label,
    slotType: slot.slotType,
    status: "runnable",
    tuningUse: slot.tuningUse,
    runnerDeckRef,
    corpDeckRef,
    benchmark: runMatchProgressionBenchmark(slotConfig),
  };
}
