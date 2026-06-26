import type { SimulationBenchmarkProfile } from "./simulation-types";
import type {
  V143LeagueConfig,
  V143SimulationRunResult,
  V143SoakResult,
} from "./v143-tuning-gate";
import { BENCHMARK_PROFILES_143 } from "./v143-data";
import { SOAK_SEEDS_143 } from "./soak-seed-data";

export type V143SimulationLeagueDependencies = {
  runV143Profile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: V143LeagueConfig,
  ) => V143SimulationRunResult;
};

export function createV143SimulationLeagueRunner(
  dependencies: V143SimulationLeagueDependencies,
): {
  runV143SimulationLeague: (config?: V143LeagueConfig) => V143SoakResult;
} {
  function runV143SimulationLeague(
    config: V143LeagueConfig = {},
  ): V143SoakResult {
    const tuningSeeds = SOAK_SEEDS_143.tuningSeeds;
    const holdoutSeeds = SOAK_SEEDS_143.holdoutSeeds;
    const seeds =
      config.includeHoldout === false
        ? tuningSeeds
        : [...tuningSeeds, ...holdoutSeeds];
    const profiles = BENCHMARK_PROFILES_143.profiles.map((profile) =>
      dependencies.runV143Profile(profile, seeds, config),
    );
    return {
      version: "1.4.3",
      profiles,
      holdoutSeeds,
      tuningSeeds,
    };
  }

  return { runV143SimulationLeague };
}
