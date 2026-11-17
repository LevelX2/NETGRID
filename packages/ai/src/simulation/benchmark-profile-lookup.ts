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
  if (!profile) {
    throw new Error(`Unknown simulation benchmark profile: ${profileId}`);
  }
  return profile;
}
