import type { AiSimulationRuntimeFailure } from "./ai-simulation-runtime-failure";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { sortedUnique } from "../runtime/collection";
import type { AiDoctrineQualityMetrics } from "./doctrine-quality-types";
import type { AiQualityMetrics } from "./quality-metric-types";
export type { AiQualityMetrics } from "./quality-metric-types";

export type AiSoakResult = {
  summaries: AiSimulationSummary[];
  aggregate: {
    seeds: number;
    illegalActions: number;
    runtimeFailures: number;
    replayFailures: number;
    fallbackRate: number;
    timeoutRate: number;
    reasonCodeCoverage: string[];
    actionTypeCoverage: string[];
    holdoutSeeds: string[];
  };
};

export function metricsForSimulationActionSequence(
  actionSequence: AiSimulationSummary["actionSequence"],
  failures: readonly AiSimulationRuntimeFailure[],
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
  const illegalActions = failures.filter(
    (failure) => failure.illegalAction,
  ).length;
  return {
    illegalActions,
    runtimeFailures: failures.length - illegalActions,
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
      actionSequence.length + (replayOk ? 10 : 0) - failures.length * 10,
    ),
    holdout,
    doctrine,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
