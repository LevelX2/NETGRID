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
