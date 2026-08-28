import type { CueDisplayMode } from "../settings/settings-model";

export function shouldUseFloatingCue(
  displayMode: CueDisplayMode,
  manualAdvanceRequired: boolean,
  forceWindow = false,
): boolean {
  return displayMode === "floating" && !manualAdvanceRequired && !forceWindow;
}
