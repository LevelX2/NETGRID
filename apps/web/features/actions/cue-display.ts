import type { CueDisplayMode } from "../settings/settings-model";

export function shouldUseFloatingCue(
  displayMode: CueDisplayMode,
  requiresLocalAttention: boolean,
  manualAdvanceRequired: boolean,
): boolean {
  return displayMode === "floating" && !requiresLocalAttention && !manualAdvanceRequired;
}
