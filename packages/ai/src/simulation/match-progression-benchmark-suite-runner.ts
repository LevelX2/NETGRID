import { sortedUnique } from "../runtime/collection";
import type {
  AiMatchProgressionBenchmarkResult,
  AiMatchProgressionBenchmarkSuiteResult,
} from "./ai-match-progression-types";
import { MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS } from "./benchmark-deck-slots";
import { runMatchProgressionBenchmarkSlot } from "./benchmark-deck-slot-runner";
import type { AiDoctrineQualityBenchmarkConfig } from "./doctrine-quality-benchmark-types";
import type { SimulationBenchmarkProfileId } from "./simulation-types";
import { v143BenchmarkSeeds } from "./v143-tuning-gate";

export type MatchProgressionBenchmarkSuiteDependencies = {
  runMatchProgressionBenchmark: (
    config?: AiDoctrineQualityBenchmarkConfig,
  ) => AiMatchProgressionBenchmarkResult;
};

export function createMatchProgressionBenchmarkSuiteRunner(
  dependencies: MatchProgressionBenchmarkSuiteDependencies,
): {
  runMatchProgressionBenchmarkSuite: (
    config?: AiDoctrineQualityBenchmarkConfig,
  ) => AiMatchProgressionBenchmarkSuiteResult;
} {
  function runMatchProgressionBenchmarkSuite(
    config: AiDoctrineQualityBenchmarkConfig = {},
  ): AiMatchProgressionBenchmarkSuiteResult {
    const baselineProfile = config.baselineProfile ?? "belief_ai_v1_4_2";
    const candidateProfile = config.candidateProfile ?? "current_candidate";
    const comparisonProfiles = sortedUnique([
      ...(config.comparisonProfiles ?? [
        "basic_corp_ai",
        "basic_runner_ai",
        "belief_ai_v1_4_2",
        "current_candidate",
      ]),
      baselineProfile,
      candidateProfile,
    ]) as SimulationBenchmarkProfileId[];
    const seeds = v143BenchmarkSeeds(config);
    const slots = MATCH_PROGRESSION_BENCHMARK_DECK_SLOTS.map((slot) =>
      runMatchProgressionBenchmarkSlot(
        slot,
        config,
        comparisonProfiles,
        dependencies.runMatchProgressionBenchmark,
      ),
    );
    return {
      version: "ai-match-progression-suite-v1",
      diagnosticOnly: true,
      baselineProfile,
      candidateProfile,
      comparisonProfiles,
      seeds,
      slots,
    };
  }

  return { runMatchProgressionBenchmarkSuite };
}
