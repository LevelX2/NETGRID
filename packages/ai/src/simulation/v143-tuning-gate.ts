import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { roundNumber as round } from "../runtime/number-rounding";
import { SOAK_SEEDS_143 } from "./soak-seed-data";
import type { SimulationBenchmarkProfileId } from "./simulation-types";

export type V143SimulationRunResult = {
  simulationId: string;
  benchmarkProfile: SimulationBenchmarkProfileId;
  games: number;
  illegalActions: number;
  timeouts: number;
  fallbackRate: number;
  winRates: Record<string, number>;
  agendaPoints: Record<string, number>;
  averageActions: number;
  replayFailures: number;
  notableExploitRefs: string[];
  summaries: AiSimulationSummary[];
};

export type V143TuningGateResult = {
  accepted: boolean;
  holdoutDelta: {
    winRate: number;
    fallbackRate: number;
    timeoutRate: number;
    illegalActions: number;
    replayFailures: number;
  };
  reason: string;
};

export type V143SoakResult = {
  version: "1.4.3";
  profiles: V143SimulationRunResult[];
  holdoutSeeds: string[];
  tuningSeeds: string[];
};

export type V143LeagueConfig = Partial<AiSimulationConfig> & {
  includeHoldout?: boolean;
  seeds?: string[];
};

export function v143BenchmarkSeeds(config: V143LeagueConfig): string[] {
  if (config.seeds && config.seeds.length > 0) {
    return [...config.seeds];
  }
  return config.includeHoldout === false
    ? SOAK_SEEDS_143.tuningSeeds
    : [...SOAK_SEEDS_143.tuningSeeds, ...SOAK_SEEDS_143.holdoutSeeds];
}

export function evaluateV143TuningGate(
  candidate: V143SimulationRunResult,
  baseline: V143SimulationRunResult,
): V143TuningGateResult {
  const holdoutDelta = {
    winRate: round(
      (candidate.winRates.runner ?? 0) - (baseline.winRates.runner ?? 0),
    ),
    fallbackRate: round(candidate.fallbackRate - baseline.fallbackRate),
    timeoutRate: round(
      candidate.timeouts / Math.max(candidate.games, 1) -
        baseline.timeouts / Math.max(baseline.games, 1),
    ),
    illegalActions: candidate.illegalActions - baseline.illegalActions,
    replayFailures: candidate.replayFailures - baseline.replayFailures,
  };
  const hardRegression =
    holdoutDelta.illegalActions > 0 ||
    holdoutDelta.replayFailures > 0 ||
    holdoutDelta.timeoutRate > 0;
  if (hardRegression) {
    return {
      accepted: false,
      holdoutDelta,
      reason: "holdout_regression_on_safety_or_replay",
    };
  }
  const improved =
    holdoutDelta.winRate >= 0 &&
    holdoutDelta.fallbackRate <= 0 &&
    holdoutDelta.timeoutRate <= 0;
  return {
    accepted: improved,
    holdoutDelta,
    reason: improved
      ? "holdout_improved_or_stable"
      : "tradeoff_review_required",
  };
}
