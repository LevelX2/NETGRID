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
  const slotMetadata = {
    slotId: slot.slotId,
    label: slot.label,
    slotType: slot.slotType,
    tuningUse: slot.tuningUse,
    runnerArchetype: slot.runnerArchetype,
    corpArchetype: slot.corpArchetype,
    runnerDeckRef: deckReferenceLabel(slot.runner),
    corpDeckRef: deckReferenceLabel(slot.corp),
  };
  if (slot.status !== "runnable") {
    return {
      ...slotMetadata,
      status: slot.status,
      reason: slot.pendingReason ?? "Slot ist nicht lauffähig konfiguriert.",
    };
  }
  const resolved = resolveBenchmarkDeckSlot(slot);
  if (!resolved.ok) {
    return {
      ...slotMetadata,
      status: "disabled",
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
      ...slotMetadata,
      status: "disabled",
      reason: supportErrors.join(" | "),
    };
  }
  return {
    ...slotMetadata,
    status: "runnable",
    benchmark: runMatchProgressionBenchmark(slotConfig),
  };
}
