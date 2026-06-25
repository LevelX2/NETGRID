import {
  type SimulationBenchmarkProfile,
  type SimulationBenchmarkProfileId,
} from "./simulation-types";

export function benchmarkProfileById(
  profileId: SimulationBenchmarkProfileId,
  profiles: readonly SimulationBenchmarkProfile[],
): SimulationBenchmarkProfile {
  const profile = profiles.find(
    (candidate) => candidate.benchmarkProfileId === profileId,
  );
  if (profile) return profile;
  return {
    benchmarkProfileId: profileId,
    runnerMode: profileId,
    corpMode: profileId,
  };
}
