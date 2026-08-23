import type { CueDisplayMode } from "../settings/settings-model";

export function shouldUseFloatingCue(
  displayMode: CueDisplayMode,
  manualAdvanceRequired: boolean,
): boolean {
  return displayMode === "floating" && !manualAdvanceRequired;
}
