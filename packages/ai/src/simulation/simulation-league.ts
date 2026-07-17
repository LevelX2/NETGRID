import type { SimulationBenchmarkProfile } from "./simulation-types";
import {
  type AiSimulationLeagueConfig,
  type AiSimulationLeagueResult,
  type AiSimulationRunResult,
  benchmarkSeeds,
} from "./simulation-quality-gate";
import { CURRENT_BENCHMARK_PROFILES } from "./benchmark-profile-data";
import { CURRENT_BENCHMARK_SEEDS } from "./soak-seed-data";

export type SimulationLeagueDependencies = {
  runSimulationProfile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: AiSimulationLeagueConfig,
  ) => AiSimulationRunResult;
};

export function createSimulationLeagueRunner(
  dependencies: SimulationLeagueDependencies,
): {
  runSimulationLeague: (
    config?: AiSimulationLeagueConfig,
  ) => AiSimulationLeagueResult;
} {
  function runSimulationLeague(
    config: AiSimulationLeagueConfig = {},
  ): AiSimulationLeagueResult {
    const tuningSeeds = CURRENT_BENCHMARK_SEEDS.tuningSeeds;
    const holdoutSeeds = CURRENT_BENCHMARK_SEEDS.holdoutSeeds;
    const seeds = benchmarkSeeds(config);
    const profiles = CURRENT_BENCHMARK_PROFILES.profiles.map((profile) =>
      dependencies.runSimulationProfile(profile, seeds, config),
    );
    return {
      version: "ai-simulation-league-v1",
      profiles,
      holdoutSeeds,
      tuningSeeds,
    };
  }

  return { runSimulationLeague };
}
