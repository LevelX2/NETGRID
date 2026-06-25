import type { AiSimulationSummary } from "../index";
import { sortedUnique } from "../runtime/collection";
import type { AiDoctrineQualityMetrics } from "./doctrine-quality-tags";

export type AiQualityMetrics = {
  illegalActions: number;
  fallbackRate: number;
  timeoutRate: number;
  reasonCodeCoverage: string[];
  actionTypeCoverage: string[];
  roleCoverage: string[];
  progressScore: number;
  holdout: boolean;
  doctrine: AiDoctrineQualityMetrics;
};

export type AiSoakResult = {
  summaries: AiSimulationSummary[];
  aggregate: {
    seeds: number;
    illegalActions: number;
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
  errors: string[],
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
    illegalActions: errors.length,
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
      actionSequence.length + (replayOk ? 10 : 0) - errors.length * 10,
    ),
    holdout,
    doctrine,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
