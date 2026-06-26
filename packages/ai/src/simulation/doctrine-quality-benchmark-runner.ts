import { roundNumber as round } from "../runtime/number-rounding";
import { benchmarkProfileById } from "./benchmark-profile-lookup";
import type {
  AiDoctrineQualityBenchmarkConfig,
  AiDoctrineQualityBenchmarkResult,
} from "./doctrine-quality-benchmark-types";
import {
  diffDoctrineMetrics,
  sumDoctrineMetrics,
} from "./simulation-metric-aggregation";
import type { SimulationBenchmarkProfile } from "./simulation-types";
import {
  V143SimulationRunResult,
} from "./v143-tuning-gate";
import { BENCHMARK_PROFILES_143 } from "./v143-data";
import { SOAK_SEEDS_143 } from "./soak-seed-data";

export type DoctrineQualityBenchmarkDependencies = {
  runV143Profile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: AiDoctrineQualityBenchmarkConfig,
  ) => V143SimulationRunResult;
};

export function createDoctrineQualityBenchmarkRunner(
  dependencies: DoctrineQualityBenchmarkDependencies,
): {
  runDoctrineQualityBenchmark: (
    config?: AiDoctrineQualityBenchmarkConfig,
  ) => AiDoctrineQualityBenchmarkResult;
} {
  function runDoctrineQualityBenchmark(
    config: AiDoctrineQualityBenchmarkConfig = {},
  ): AiDoctrineQualityBenchmarkResult {
    const baselineProfileId = config.baselineProfile ?? "belief_ai_v1_4_2";
    const candidateProfileId = config.candidateProfile ?? "current_candidate";
    const baselineProfile = benchmarkProfileById(
      baselineProfileId,
      BENCHMARK_PROFILES_143.profiles,
    );
    const candidateProfile = benchmarkProfileById(
      candidateProfileId,
      BENCHMARK_PROFILES_143.profiles,
    );
    const seeds =
      config.includeHoldout === false
        ? SOAK_SEEDS_143.tuningSeeds
        : [...SOAK_SEEDS_143.tuningSeeds, ...SOAK_SEEDS_143.holdoutSeeds];
    const baselineRun = dependencies.runV143Profile(
      baselineProfile,
      seeds,
      config,
    );
    const candidateRun = dependencies.runV143Profile(
      candidateProfile,
      seeds,
      config,
    );
    const baseline = sumDoctrineMetrics(
      baselineRun.summaries.map((summary) => summary.metrics.doctrine),
    );
    const candidate = sumDoctrineMetrics(
      candidateRun.summaries.map((summary) => summary.metrics.doctrine),
    );
    return {
      version: "ai-deck-doctrine-quality-v1",
      baselineProfile: baselineProfileId,
      candidateProfile: candidateProfileId,
      seeds,
      baseline,
      candidate,
      delta: diffDoctrineMetrics(candidate, baseline),
      safety: {
        illegalActionDelta:
          candidateRun.illegalActions - baselineRun.illegalActions,
        replayFailureDelta:
          candidateRun.replayFailures - baselineRun.replayFailures,
        timeoutRateDelta: round(
          candidateRun.timeouts / Math.max(candidateRun.games, 1) -
            baselineRun.timeouts / Math.max(baselineRun.games, 1),
        ),
        fallbackRateDelta: round(
          candidateRun.fallbackRate - baselineRun.fallbackRate,
        ),
      },
      baselineRun,
      candidateRun,
    };
  }

  return { runDoctrineQualityBenchmark };
}
