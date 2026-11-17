import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { roundNumber as round } from "../runtime/number-rounding";
import { CURRENT_BENCHMARK_SEEDS } from "./soak-seed-data";
import type { SimulationBenchmarkProfileId } from "./simulation-types";

export type AiSimulationRunResult = {
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

export type AiSimulationQualityGateResult = {
  accepted: boolean;
  holdoutDelta: {
    winRate: number;
    fallbackRate: number;
    timeoutRate: number;
    runtimeFailureRate: number;
    illegalActions: number;
    replayFailures: number;
  };
  reason: string;
};

export type AiSimulationLeagueResult = {
  version: "ai-simulation-league-v1";
  profiles: AiSimulationRunResult[];
  holdoutSeeds: string[];
  tuningSeeds: string[];
};

export type AiSimulationLeagueConfig = Partial<AiSimulationConfig> & {
  includeHoldout?: boolean;
  seeds?: string[];
};

export function benchmarkSeeds(config: AiSimulationLeagueConfig): string[] {
  if (config.seeds && config.seeds.length > 0) {
    return [...config.seeds];
  }
  return config.includeHoldout === false
    ? CURRENT_BENCHMARK_SEEDS.tuningSeeds
    : [
        ...CURRENT_BENCHMARK_SEEDS.tuningSeeds,
        ...CURRENT_BENCHMARK_SEEDS.holdoutSeeds,
      ];
}

export function evaluateSimulationQualityGate(
  candidate: AiSimulationRunResult,
  baseline: AiSimulationRunResult,
): AiSimulationQualityGateResult {
  const runtimeFailureRateDelta =
    runtimeFailureRate(candidate) - runtimeFailureRate(baseline);
  const holdoutDelta = {
    winRate: round(
      (candidate.winRates.runner ?? 0) - (baseline.winRates.runner ?? 0),
    ),
    fallbackRate: round(candidate.fallbackRate - baseline.fallbackRate),
    timeoutRate:
      candidate.timeouts / Math.max(candidate.games, 1) -
      baseline.timeouts / Math.max(baseline.games, 1),
    runtimeFailureRate: runtimeFailureRateDelta,
    illegalActions: candidate.illegalActions - baseline.illegalActions,
    replayFailures: candidate.replayFailures - baseline.replayFailures,
  };
  const hardRegression =
    holdoutDelta.illegalActions > 0 ||
    holdoutDelta.replayFailures > 0 ||
    holdoutDelta.timeoutRate > 0 ||
    runtimeFailureRateDelta > 0;
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

function runtimeFailureRate(result: AiSimulationRunResult): number {
  return countSimulationRuntimeFailures(result) / Math.max(result.games, 1);
}

export function countSimulationRuntimeFailures(
  run: Pick<AiSimulationRunResult, "summaries">,
): number {
  return run.summaries.filter(
    ({ terminationKind }) => terminationKind === "runtime_failure",
  ).length;
}
