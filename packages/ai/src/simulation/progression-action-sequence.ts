import type { AiSimulationSummary } from "../index";

export function progressionEntriesWithRunTargets(
  actionSequence: AiSimulationSummary["actionSequence"],
): AiSimulationSummary["actionSequence"] {
  let currentRunTarget: string | undefined;
  return actionSequence.map((entry) => {
    if (entry.side === "runner" && entry.actionType === "start_run") {
      currentRunTarget = entry.targetServerId;
      return entry;
    }
    if (
      entry.side === "runner" &&
      !entry.targetServerId &&
      [
        "access_card",
        "steal_agenda",
        "trash_accessed_card",
        "decline_trash",
        "jack_out",
      ].includes(entry.actionType) &&
      currentRunTarget
    ) {
      return { ...entry, targetServerId: currentRunTarget };
    }
    return entry;
  });
}
