import { describe, expect, it } from "vitest";

import { runSimulationLeague } from "../simulation";
import {
  benchmarkSeeds,
  evaluateSimulationQualityGate,
  type AiSimulationRunResult,
} from "./simulation-quality-gate";

describe("current simulation quality gate", () => {
  it("uses explicit seeds without exposing a historical framework version", () => {
    expect(benchmarkSeeds({ seeds: ["seed-b", "seed-a"] })).toEqual([
      "seed-b",
      "seed-a",
    ]);
  });

  it("accepts a stable candidate and rejects safety regressions", () => {
    const baseline = simulationRun();
    expect(
      evaluateSimulationQualityGate(simulationRun(), baseline),
    ).toMatchObject({
      accepted: true,
      reason: "holdout_improved_or_stable",
    });
    expect(
      evaluateSimulationQualityGate(
        simulationRun({ illegalActions: 1 }),
        baseline,
      ),
    ).toMatchObject({
      accepted: false,
      reason: "holdout_regression_on_safety_or_replay",
    });
  });

  it("runs a deterministic league under a neutral schema version", () => {
    const config = {
      seeds: ["current-simulation-league-smoke"],
      maxActions: 2,
    };
    const first = runSimulationLeague(config);
    const second = runSimulationLeague(config);

    expect(first.version).toBe("ai-simulation-league-v1");
    expect(first.profiles.map((profile) => profile.benchmarkProfile)).toEqual([
      "random_legal_bot",
      "current_candidate",
    ]);
    expect(first.profiles.map((profile) => profile.simulationId)).toEqual(
      second.profiles.map((profile) => profile.simulationId),
    );
    expect(first.profiles.map((profile) => profile.summaries)).toEqual(
      second.profiles.map((profile) => profile.summaries),
    );
  });
});

function simulationRun(
  overrides: Partial<AiSimulationRunResult> = {},
): AiSimulationRunResult {
  return {
    simulationId: "benchmark:current_candidate:test",
    benchmarkProfile: "current_candidate",
    games: 1,
    illegalActions: 0,
    timeouts: 0,
    fallbackRate: 0,
    winRates: { runner: 0.5 },
    agendaPoints: { runner: 0, corp: 0 },
    averageActions: 1,
    replayFailures: 0,
    notableExploitRefs: [],
    summaries: [],
    ...overrides,
  };
}
