import { describe, expect, it, vi } from "vitest";
import { CURRENT_RULES_BASELINE } from "@netgrid/shared";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { createAiSoakRunner } from "./ai-soak-runner";
import { SOAK_SEEDS } from "./soak-seed-data";

describe("createAiSoakRunner", () => {
  it("runs an explicit two-sided difficulty override only once per seed", () => {
    const simulateAiGame = vi.fn(
      (): AiSimulationSummary => ({
        seed: "soak-test-seed",
        terminationKind: "action_limit",
        winner: "action_limit_reached",
        actions: 0,
        turns: 0,
        finalAgendaPoints: { runner: 0, corp: 0 },
        finalStateHash: "soak-test-state",
        eventLogLength: 0,
        actionSequence: [],
        errors: [],
        cardPoolVersion: CURRENT_RULES_BASELINE.engineSchemaVersion,
        metrics: {
          illegalActions: 0,
          runtimeFailures: 0,
          fallbackRate: 0,
          timeoutRate: 0,
          reasonCodeCoverage: [],
          actionTypeCoverage: [],
          roleCoverage: [],
          progressScore: 0,
          holdout: false,
          doctrine: {
            nakedAgendaInstalls: 0,
            agendaFloodExposure: 0,
            scoreWindowMissed: 0,
            remoteOverbuild: 0,
            economyStall: 0,
            repeatedLowValueCentralRun: 0,
            rigStall: 0,
            assetTrashNeglect: 0,
          },
        },
        replayOk: true,
        replayErrors: [],
      }),
    );

    const { simulateAiSoak } = createAiSoakRunner({ simulateAiGame });
    const custom = simulateAiSoak({
      runnerDifficulty: "hard",
      corpDifficulty: "easy",
    });
    const seedCount = new Set([
      ...SOAK_SEEDS.tuningSeeds,
      ...SOAK_SEEDS.holdoutSeeds,
    ]).size;
    expect(custom.aggregate.seeds).toBe(seedCount);
    expect(custom.aggregate.games).toBe(simulateAiGame.mock.calls.length);

    expect(simulateAiGame).toHaveBeenCalledTimes(
      SOAK_SEEDS.tuningSeeds.length + SOAK_SEEDS.holdoutSeeds.length,
    );
    expect(simulateAiGame).toHaveBeenCalledWith(
      expect.objectContaining({
        runnerDifficulty: "hard",
        corpDifficulty: "easy",
      }),
    );

    simulateAiGame.mockClear();
    const matrix = simulateAiSoak();
    expect(matrix.aggregate.seeds).toBe(seedCount);
    expect(matrix.aggregate.games).toBe(
      custom.aggregate.games * SOAK_SEEDS.matrix.difficulties.length,
    );
    expect(matrix.aggregate.games).toBe(simulateAiGame.mock.calls.length);
  });
});
