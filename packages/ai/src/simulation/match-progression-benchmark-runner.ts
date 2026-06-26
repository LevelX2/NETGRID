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
import type { V143SimulationRunResult } from "./v143-tuning-gate";
import { BENCHMARK_PROFILES_143 } from "./v143-data";
import { SOAK_SEEDS_143 } from "./soak-seed-data";

export type MatchProgressionBenchmarkDependencies = {
  runV143Profile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: AiDoctrineQualityBenchmarkConfig,
  ) => V143SimulationRunResult;
  summarizeMatchProgressionMetrics: (
    summaries: V143SimulationRunResult["summaries"],
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
    const baseline = dependencies.summarizeMatchProgressionMetrics(
      baselineRun.summaries,
    );
    const candidate = dependencies.summarizeMatchProgressionMetrics(
      candidateRun.summaries,
    );
    const comparisonProfileIds = sortedUnique([
      ...(config.comparisonProfiles ?? [
        "basic_corp_ai",
        "basic_runner_ai",
        "belief_ai_v1_4_2",
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
          dependencies.runV143Profile(
            benchmarkProfileById(profileId, BENCHMARK_PROFILES_143.profiles),
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
        SOAK_SEEDS_143.league.runnerDeckId,
      corpDeckId:
        config.corpDeck?.id ??
        config.corpDeckId ??
        SOAK_SEEDS_143.league.corpDeckId,
      maxActions: config.maxActions ?? SOAK_SEEDS_143.league.maxActions,
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
