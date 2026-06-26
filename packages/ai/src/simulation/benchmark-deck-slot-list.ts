import type { AiBenchmarkDeckSlotDefinition } from "./benchmark-deck-types";
import { MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS } from "./benchmark-deck-slots";

export function listMatchProgressionBenchmarkDeckSlots(): AiBenchmarkDeckSlotDefinition[] {
  return MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS.map((slot) => ({ ...slot }));
}
