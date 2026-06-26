import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  isCorpRemoteAdvancementProgress,
  progressionEntriesWithRunTargets,
} from "./progression-action-sequence";
import { roundNumber as round } from "../runtime/number-rounding";

export function averageFirstProgressionTurn(
  summaries: AiSimulationSummary[],
  predicate: (entry: AiSimulationSummary["actionSequence"][number]) => boolean,
): number {
  const observedTurns = summaries
    .map(
      (summary) =>
        progressionEntriesWithRunTargets(summary.actionSequence).find(predicate)
          ?.turnNumber ?? 0,
    )
    .filter((turn) => turn > 0);
  if (observedTurns.length === 0) return 0;
  return round(
    observedTurns.reduce((sum, turn) => sum + turn, 0) / observedTurns.length,
  );
}

export function averageTurnsFromFirstAdvanceToScore(
  summaries: AiSimulationSummary[],
): number {
  const deltas = summaries
    .map((summary) => {
      const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
      const firstAdvance = sequence.find(
        (entry) =>
          isCorpRemoteAdvancementProgress(entry) &&
          (entry.advancementTargetTypes?.includes("agenda") ||
            entry.targetCardType === "agenda"),
      );
      if (!firstAdvance?.turnNumber) return undefined;
      const firstScore = sequence.find(
        (entry) =>
          entry.side === "corp" &&
          entry.actionType === "score_agenda" &&
          (entry.turnNumber ?? 0) >= firstAdvance.turnNumber!,
      );
      if (!firstScore?.turnNumber) return undefined;
      return Math.max(0, firstScore.turnNumber - firstAdvance.turnNumber);
    })
    .filter((value): value is number => typeof value === "number");
  if (deltas.length === 0) return 0;
  return round(deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length);
}

export function countFinalAdvancesResolvedBySameTurnCorpScore(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce((count, summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return (
      count +
      sequence.filter((entry, index) => {
        if (entry.side !== "corp" || entry.finalAdvance !== true) return false;
        return sequence
          .slice(index + 1)
          .some(
            (later) =>
              later.side === "corp" &&
              later.actionType === "score_agenda" &&
              later.turnNumber === entry.turnNumber,
          );
      }).length
    );
  }, 0);
}

export function countFinalAdvancesStolenBeforeCorpScore(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce((count, summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return (
      count +
      sequence.filter((entry, index) => {
        if (entry.side !== "corp" || entry.finalAdvance !== true) return false;
        const later = sequence
          .slice(index + 1)
          .find(
            (candidate) =>
              candidate.actionType === "score_agenda" ||
              candidate.actionType === "steal_agenda",
          );
        return later?.actionType === "steal_agenda";
      }).length
    );
  }, 0);
}

export function countRunnerDrawThenDiscardSameTurn(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce((count, summary) => {
    const sequence = progressionEntriesWithRunTargets(summary.actionSequence);
    return (
      count +
      sequence.filter((entry, index) => {
        if (entry.side !== "runner" || entry.runnerDrawAction !== true)
          return false;
        return sequence
          .slice(index + 1)
          .some(
            (later) =>
              later.side === "runner" &&
              later.runnerDiscardChoice === true &&
              later.turnNumber === entry.turnNumber,
          );
      }).length
    );
  }, 0);
}

export function averageFinalAdvanceNumber(
  entries: AiSimulationSummary["actionSequence"],
  key: "remoteProtectionScore",
): number {
  const values = entries
    .map((entry) => entry[key])
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function averageRunnerContestRisk(
  entries: AiSimulationSummary["actionSequence"],
): number {
  const values = entries
    .map((entry): number | undefined => {
      if (entry.runnerContestRisk === "high") return 1;
      if (entry.runnerContestRisk === "medium") return 0.5;
      if (entry.runnerContestRisk === "low") return 0;
      return undefined;
    })
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
