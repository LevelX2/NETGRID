import currentBenchmarkProfileData from "../../../../data/ai/ai-benchmark-profiles-1.4.3.json";

import type { SimulationBenchmarkProfile } from "./simulation-types";

export const CURRENT_BENCHMARK_PROFILES = currentBenchmarkProfileData as {
  profiles: SimulationBenchmarkProfile[];
};

export function listCurrentBenchmarkProfiles(): SimulationBenchmarkProfile[] {
  return CURRENT_BENCHMARK_PROFILES.profiles.map((profile) => ({ ...profile }));
}
