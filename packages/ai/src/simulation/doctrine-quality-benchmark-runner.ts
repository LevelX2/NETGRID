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
  type AiSimulationRunResult,
  benchmarkSeeds,
} from "./simulation-quality-gate";
import { CURRENT_BENCHMARK_PROFILES } from "./benchmark-profile-data";

export type DoctrineQualityBenchmarkDependencies = {
  runSimulationProfile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: AiDoctrineQualityBenchmarkConfig,
  ) => AiSimulationRunResult;
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
    const baselineProfileId = config.baselineProfile ?? "random_legal_bot";
    const candidateProfileId = config.candidateProfile ?? "current_candidate";
    const baselineProfile = benchmarkProfileById(
      baselineProfileId,
      CURRENT_BENCHMARK_PROFILES.profiles,
    );
    const candidateProfile = benchmarkProfileById(
      candidateProfileId,
      CURRENT_BENCHMARK_PROFILES.profiles,
    );
    const seeds = benchmarkSeeds(config);
    const baselineRun = dependencies.runSimulationProfile(
      baselineProfile,
      seeds,
      config,
    );
    const candidateRun = dependencies.runSimulationProfile(
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
