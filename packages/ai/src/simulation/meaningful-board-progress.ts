import type { AiSimulationActionSequenceEntry } from "./ai-simulation-action-sequence-entry";
import { planConversionEntryHasMeaningfulBoardProgress } from "./plan-conversion-predicates";
import { isCorpRemoteAdvancementProgress } from "./progression-action-sequence";

export function isMeaningfulBoardProgress(
  entry: AiSimulationActionSequenceEntry,
): boolean {
  return planConversionEntryHasMeaningfulBoardProgress(
    entry,
    isCorpRemoteAdvancementProgress,
  );
}
