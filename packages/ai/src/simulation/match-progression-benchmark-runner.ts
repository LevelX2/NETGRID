import { sortedUnique } from "../runtime/collection";
import { benchmarkProfileById } from "./benchmark-profile-lookup";
import type {
  AiMatchProgressionBenchmarkResult,
  AiMatchProgressionMetrics,
} from "./ai-match-progression-types";
import type { AiDoctrineQualityBenchmarkConfig } from "./doctrine-quality-benchmark-types";
import { diffMatchProgressionMetrics } from "./match-progression-metric-delta";
import type {
  SimulationBenchmarkProfile,
  SimulationBenchmarkProfileId,
} from "./simulation-types";
import {
  type AiSimulationRunResult,
  benchmarkSeeds,
} from "./simulation-quality-gate";
import { CURRENT_BENCHMARK_PROFILES } from "./benchmark-profile-data";
import { CURRENT_BENCHMARK_SEEDS } from "./soak-seed-data";

export type MatchProgressionBenchmarkDependencies = {
  runSimulationProfile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: AiDoctrineQualityBenchmarkConfig,
  ) => AiSimulationRunResult;
  summarizeMatchProgressionMetrics: (
    summaries: AiSimulationRunResult["summaries"],
  ) => AiMatchProgressionMetrics;
};

export function createMatchProgressionBenchmarkRunner(
  dependencies: MatchProgressionBenchmarkDependencies,
): {
  runMatchProgressionBenchmark: (
    config?: AiDoctrineQualityBenchmarkConfig,
  ) => AiMatchProgressionBenchmarkResult;
} {
  function runMatchProgressionBenchmark(
    config: AiDoctrineQualityBenchmarkConfig = {},
  ): AiMatchProgressionBenchmarkResult {
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
    const baseline = dependencies.summarizeMatchProgressionMetrics(
      baselineRun.summaries,
    );
    const candidate = dependencies.summarizeMatchProgressionMetrics(
      candidateRun.summaries,
    );
    const comparisonProfileIds = sortedUnique([
      ...(config.comparisonProfiles ?? [
        "random_legal_bot",
        "current_candidate",
      ]),
      baselineProfileId,
      candidateProfileId,
    ]) as SimulationBenchmarkProfileId[];
    const profileComparisons = comparisonProfileIds.map((profileId) => {
      if (profileId === baselineProfileId)
        return { profile: profileId, metrics: baseline };
      if (profileId === candidateProfileId)
        return { profile: profileId, metrics: candidate };
      return {
        profile: profileId,
        metrics: dependencies.summarizeMatchProgressionMetrics(
          dependencies.runSimulationProfile(
            benchmarkProfileById(
              profileId,
              CURRENT_BENCHMARK_PROFILES.profiles,
            ),
            seeds,
            config,
          ).summaries,
        ),
      };
    });
    return {
      version: "ai-match-progression-v1",
      baselineProfile: baselineProfileId,
      candidateProfile: candidateProfileId,
      seeds,
      runnerDeckId:
        config.runnerDeck?.id ??
        config.runnerDeckId ??
        CURRENT_BENCHMARK_SEEDS.league.runnerDeckId,
      corpDeckId:
        config.corpDeck?.id ??
        config.corpDeckId ??
        CURRENT_BENCHMARK_SEEDS.league.corpDeckId,
      maxActions:
        config.maxActions ?? CURRENT_BENCHMARK_SEEDS.league.maxActions,
      diagnosticOnly: true,
      baseline,
      candidate,
      delta: diffMatchProgressionMetrics(candidate, baseline),
      profileComparisons,
      baselineRun,
      candidateRun,
    };
  }

  return { runMatchProgressionBenchmark };
}
