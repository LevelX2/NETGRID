import type { AiSimulationSummary } from "./ai-simulation-summary";
import { progressionEntriesWithRunTargets } from "./progression-action-sequence";
import { averageNumber } from "./simulation-metric-aggregation";
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
  const observedTurns = summaries.flatMap(({ agendaProgressionOutcomes }) => {
    const turnGap = agendaProgressionOutcomes?.firstAdvanceToScoreTurns;
    return turnGap === undefined ? [] : [turnGap];
  });
  return averageNumber(observedTurns);
}

export function countFinalAdvancesResolvedBySameTurnCorpScore(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce(
    (sum, { agendaProgressionOutcomes }) =>
      sum + (agendaProgressionOutcomes?.finalAdvancesScoredSameTurn ?? 0),
    0,
  );
}

export function countFinalAdvancesStolenBeforeCorpScore(
  summaries: AiSimulationSummary[],
): number {
  return summaries.reduce(
    (sum, { agendaProgressionOutcomes }) =>
      sum + (agendaProgressionOutcomes?.finalAdvancesStolen ?? 0),
    0,
  );
}

export function averageTurnsFromFinalAdvanceToScoreOrSteal(
  summaries: AiSimulationSummary[],
): number {
  let count = 0;
  let turnTotal = 0;
  for (const { agendaProgressionOutcomes } of summaries) {
    if (!agendaProgressionOutcomes) continue;
    count += agendaProgressionOutcomes.resolvedFinalAdvances;
    turnTotal += agendaProgressionOutcomes.finalAdvanceResolutionTurnTotal;
  }
  return count === 0 ? 0 : round(turnTotal / count);
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
