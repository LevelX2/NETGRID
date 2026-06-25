import benchmarkProfiles143Data from "../../../../data/ai/ai-benchmark-profiles-1.4.3.json";
import exploitFixtures143Data from "../../../../data/scenarios/ai-v143-exploit-regression-fixtures.json";
import type { SimulationBenchmarkProfile } from "./simulation-types";
import type { V143ExploitFixture } from "./v143-fixture-types";

export const BENCHMARK_PROFILES_143 = benchmarkProfiles143Data as {
  version: "1.4.3";
  profiles: SimulationBenchmarkProfile[];
};

export const EXPLOIT_FIXTURES_143 = exploitFixtures143Data as {
  version: "1.4.3";
  fixtures: V143ExploitFixture[];
};

export function listV143BenchmarkProfiles(): SimulationBenchmarkProfile[] {
  return BENCHMARK_PROFILES_143.profiles.map((profile) => ({ ...profile }));
}

export function listV143ExploitFixtures(): V143ExploitFixture[] {
  return EXPLOIT_FIXTURES_143.fixtures.map((fixture) => ({ ...fixture }));
}
