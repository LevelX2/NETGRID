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

export function countCorpMultiIceInstallOrderFutureEffectDead(
  sequence: AiSimulationSummary["actionSequence"],
): number {
  return sequence.filter((entry, index) => {
    if (
      entry.side !== "corp" ||
      entry.actionType !== "install_card" ||
      entry.installPlacement !== "ice" ||
      entry.corpFutureRunIceInstalledAsDeadEffect !== true ||
      !entry.targetServerId ||
      !entry.turnNumber
    )
      return false;
    return sequence
      .slice(index + 1)
      .some(
        (later) =>
          later.side === "corp" &&
          later.turnNumber === entry.turnNumber &&
          later.actionType === "install_card" &&
          later.installPlacement === "ice" &&
          later.targetServerId === entry.targetServerId,
      );
  }).length;
}

export function countCorpMultiIceInstallOrderOptimized(
  sequence: AiSimulationSummary["actionSequence"],
): number {
  return sequence.filter((entry, index) => {
    if (
      entry.side !== "corp" ||
      entry.actionType !== "install_card" ||
      entry.installPlacement !== "ice" ||
      entry.corpFutureRunIceInstalledAsLiveEffect !== true ||
      !entry.targetServerId ||
      !entry.turnNumber
    )
      return false;
    return sequence
      .slice(0, index)
      .some(
        (previous) =>
          previous.side === "corp" &&
          previous.turnNumber === entry.turnNumber &&
          previous.actionType === "install_card" &&
          previous.installPlacement === "ice" &&
          previous.targetServerId === entry.targetServerId &&
          previous.corpFutureRunIceInstalled !== true,
      );
  }).length;
}
