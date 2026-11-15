import { describe, expect, it } from "vitest";

import { simulateAiGame } from "../product-simulation";
import { runSimulationLeague } from "../simulation";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { createSimulationProfileRunner } from "./simulation-profile-run";
import type { SimulationBenchmarkProfile } from "./simulation-types";
import { CURRENT_BENCHMARK_SEEDS } from "./soak-seed-data";
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

  it("reports zero actions at the action limit and fingerprints different limits", () => {
    const seeds = ["current-simulation-zero-action-limit"];
    const zero = runSimulationLeague({ seeds, maxActions: 0 }).profiles[0]!;
    const one = runSimulationLeague({ seeds, maxActions: 1 }).profiles[0]!;

    expect(zero.summaries[0]).toMatchObject({
      actions: 0,
      winner: "action_limit_reached",
      replayOk: true,
    });
    expect(zero.averageActions).toBe(0);
    expect(zero.fallbackRate).toBe(0);
    expect(one.averageActions).toBe(1);
    expect(zero.simulationId).not.toBe(one.simulationId);
  });

  it("uses effective deck and fixture settings and preserves seed boundaries in the ID", () => {
    const summary = simulateAiGame({ maxActions: 0 });
    const { runSimulationProfile } = createSimulationProfileRunner({
      simulateAiGame: () => summary,
      runExploitRegressionFixtures: () => [],
    });
    const defaults = CURRENT_BENCHMARK_SEEDS.league;
    const seeds = ["a|b", "c"];
    const id = runSimulationProfile(randomProfile, seeds, {}).simulationId;

    expect(
      runSimulationProfile(randomProfile, seeds, defaults).simulationId,
    ).toBe(id);
    expect(
      runSimulationProfile(randomProfile, ["a", "b|c"], {}).simulationId,
    ).not.toBe(id);
    expect(
      runSimulationProfile(randomProfile, ["c", "a|b"], {}).simulationId,
    ).not.toBe(id);
    expect(
      runSimulationProfile(randomProfile, seeds, { agendaPointsToWin: 8 })
        .simulationId,
    ).not.toBe(id);
    expect(
      runSimulationProfile(randomProfile, seeds, {
        runnerDeckId: "demo_runner_004",
      }).simulationId,
    ).not.toBe(id);

    const runnerDeck = {
      id: "custom-runner",
      name: "Custom Runner",
      side: "runner" as const,
      identity: "runner_identity",
      cards: [{ id: "simple_fracter", quantity: 2 }],
    };
    const customId = runSimulationProfile(randomProfile, seeds, {
      runnerDeck,
    }).simulationId;
    expect(
      runSimulationProfile(randomProfile, seeds, {
        runnerDeck: {
          cards: runnerDeck.cards,
          identity: runnerDeck.identity,
          side: runnerDeck.side,
          name: runnerDeck.name,
          id: runnerDeck.id,
        },
        runnerDeckId: "demo_runner_004",
      }).simulationId,
    ).toBe(customId);
    expect(
      runSimulationProfile(randomProfile, seeds, {
        runnerDeck: {
          ...runnerDeck,
          cards: [{ id: "simple_fracter", quantity: 3 }],
        },
      }).simulationId,
    ).not.toBe(customId);

    const candidate = {
      ...randomProfile,
      benchmarkProfileId: "current_candidate",
    } as const;
    expect(runSimulationProfile(candidate, seeds, {}).simulationId).not.toBe(
      runSimulationProfile(candidate, seeds, defaults).simulationId,
    );
  });

  it("reports technical outcomes and rejects a regression even when replay succeeds", () => {
    const summary = simulateAiGame({ maxActions: 0 });
    const regular: AiSimulationSummary = {
      ...summary,
      winner: "corp",
      terminationKind: "game_result",
    };
    const failure: AiSimulationSummary = {
      ...summary,
      winner: "runtime_failure",
      terminationKind: "runtime_failure",
    };
    const { runSimulationProfile } = createSimulationProfileRunner({
      simulateAiGame: (config) =>
        config?.seed === "aborted" ? failure : regular,
      runExploitRegressionFixtures: () => [],
    });
    const candidate = runSimulationProfile(
      randomProfile,
      ["regular", "aborted"],
      {},
    );
    const baseline = runSimulationProfile(
      randomProfile,
      ["regular", "completed"],
      {},
    );

    expect(candidate.replayFailures).toBe(0);
    expect(candidate.winRates).toEqual({
      runner: 0,
      corp: 0.5,
      draw: 0,
      action_limit_reached: 0,
      runtime_failure: 0.5,
    });
    expect(evaluateSimulationQualityGate(candidate, baseline)).toMatchObject({
      accepted: false,
      holdoutDelta: { runtimeFailureRate: 0.5 },
    });

    const manySeeds = Array.from({ length: 2000 }, () => "regular");
    const rareFailure = runSimulationProfile(
      randomProfile,
      [...manySeeds, "aborted"],
      {},
    );
    expect(rareFailure.winRates.runtime_failure).toBe(0);
    expect(evaluateSimulationQualityGate(rareFailure, baseline).accepted).toBe(
      false,
    );
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

const randomProfile = {
  benchmarkProfileId: "random_legal_bot",
  runnerMode: "random_legal_bot",
  corpMode: "random_legal_bot",
} satisfies SimulationBenchmarkProfile;

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
