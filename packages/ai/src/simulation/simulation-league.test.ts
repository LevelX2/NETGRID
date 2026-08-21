import { describe, expect, it } from "vitest";

import { createSimulationLeagueRunner } from "./simulation-league";
import { CURRENT_BENCHMARK_SEEDS } from "./soak-seed-data";

describe("simulation league", () => {
  it("does not expose the mutable benchmark seed registry", () => {
    const runner = createSimulationLeagueRunner({
      runSimulationProfile: () => ({}) as never,
    });
    const result = runner.runSimulationLeague();
    const expectedFirst = CURRENT_BENCHMARK_SEEDS.tuningSeeds[0];

    result.tuningSeeds[0] = "mutated";

    expect(CURRENT_BENCHMARK_SEEDS.tuningSeeds[0]).toBe(expectedFirst);
  });
});
