import { describe, expect, it, vi } from "vitest";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { createAiSoakRunner } from "./ai-soak-runner";
import { SOAK_SEEDS } from "./soak-seed-data";

describe("createAiSoakRunner", () => {
  it("runs an explicit two-sided difficulty override only once per seed", () => {
    const simulateAiGame = vi.fn(
      () =>
        ({
          actionSequence: [],
          metrics: {
            illegalActions: 0,
            reasonCodeCoverage: [],
            actionTypeCoverage: [],
          },
          replayOk: true,
        }) as AiSimulationSummary,
    );

    createAiSoakRunner({ simulateAiGame }).simulateAiSoak({
      runnerDifficulty: "hard",
      corpDifficulty: "easy",
    });

    expect(simulateAiGame).toHaveBeenCalledTimes(
      SOAK_SEEDS.tuningSeeds.length + SOAK_SEEDS.holdoutSeeds.length,
    );
    expect(simulateAiGame).toHaveBeenCalledWith(
      expect.objectContaining({
        runnerDifficulty: "hard",
        corpDifficulty: "easy",
      }),
    );
  });
});
