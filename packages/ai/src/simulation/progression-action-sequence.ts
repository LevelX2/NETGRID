import type { AiSimulationSummary } from "../index";
import { averageNumber } from "./simulation-metric-aggregation";

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

export function averageTurnsFromFinalAdvanceToScoreOrSteal(
  summaries: AiSimulationSummary[],
): number {
  const deltas = summaries.flatMap((summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return sequence
      .map((entry, index) => {
        if (entry.side !== "corp" || entry.finalAdvance !== true)
          return undefined;
        const later = sequence
          .slice(index + 1)
          .find(
            (candidate) =>
              candidate.actionType === "score_agenda" ||
              candidate.actionType === "steal_agenda",
          );
        if (!later?.turnNumber || !entry.turnNumber) return undefined;
        return Math.max(0, later.turnNumber - entry.turnNumber);
      })
      .filter((value): value is number => typeof value === "number");
  });
  return averageNumber(deltas);
}
