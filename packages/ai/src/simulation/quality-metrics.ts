import type { AiSimulationSummary } from "./ai-simulation-summary";
import { sortedUnique } from "../runtime/collection";
import { roundNumber as round } from "../runtime/number-rounding";
import type { AiDoctrineQualityMetrics } from "./doctrine-quality-types";
import type { AiQualityMetrics } from "./quality-metric-types";
export type { AiQualityMetrics } from "./quality-metric-types";

export type AiSoakResult = {
  summaries: AiSimulationSummary[];
  aggregate: {
    seeds: number;
    games: number;
    illegalActions: number;
    replayFailures: number;
    fallbackRate: number;
    timeoutRate: number;
    reasonCodeCoverage: string[];
    actionTypeCoverage: string[];
    holdoutSeeds: string[];
  };
};

export type SimulationFailureCounts = {
  illegalActions: number;
  total: number;
};

export function metricsForSimulationActionSequence(
  actionSequence: AiSimulationSummary["actionSequence"],
  failures: SimulationFailureCounts,
  replayOk: boolean,
  holdout: boolean,
  summarizeDoctrineQualityMetrics: (
    entries: AiSimulationSummary["actionSequence"],
  ) => AiDoctrineQualityMetrics,
): AiQualityMetrics {
  const actions = actionSequence.length || 1;
  const reasonCodeCoverage = sortedUnique(
    actionSequence.map((entry) =>
      entry.reasonCode.split(".").slice(0, 2).join("."),
    ),
  );
  const doctrine = summarizeDoctrineQualityMetrics(actionSequence);
  return {
    illegalActions: failures.illegalActions,
    fallbackRate: round(
      actionSequence.filter((entry) => entry.fallbackUsed).length / actions,
    ),
    timeoutRate: round(
      actionSequence.filter((entry) => entry.timeoutUsed).length / actions,
    ),
    reasonCodeCoverage,
    actionTypeCoverage: sortedUnique(
      actionSequence.map((entry) => entry.actionType),
    ),
    roleCoverage: sortedUnique(
      actionSequence.flatMap((entry) =>
        entry.evidence
          .filter((item) => item.startsWith("role:"))
          .map((item) => item.slice("role:".length)),
      ),
    ),
    progressScore: round(
      actionSequence.length + (replayOk ? 10 : 0) - failures.total * 10,
    ),
    holdout,
    doctrine,
  };
}
