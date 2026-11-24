import { createHash } from "node:crypto";
import { canonicalSerialize } from "@netgrid/cards/planning";

import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  profileIdForMode,
  simulationDeckConfig,
} from "./simulation-config-helpers";
import type { SimulationBenchmarkProfile } from "./simulation-types";
import type {
  AiSimulationLeagueConfig,
  AiSimulationRunResult,
} from "./simulation-quality-gate";
import { CURRENT_BENCHMARK_SEEDS } from "./soak-seed-data";
import {
  exploitRegressionConfig,
  type ExploitRegressionResult,
} from "./regression/exploit-regression-fixtures";
import { roundNumber as round } from "../runtime/number-rounding";
import { sortedUnique } from "../runtime/collection";

export type SimulationProfileRunDependencies = {
  simulateAiGame: (config?: AiSimulationConfig) => AiSimulationSummary;
  runExploitRegressionFixtures: (
    config?: Partial<AiSimulationConfig>,
  ) => ExploitRegressionResult[];
};

export function createSimulationProfileRunner(
  dependencies: SimulationProfileRunDependencies,
): {
  runSimulationProfile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: AiSimulationLeagueConfig,
  ) => AiSimulationRunResult;
} {
  function runSimulationProfile(
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: AiSimulationLeagueConfig,
  ): AiSimulationRunResult {
    const defaults = CURRENT_BENCHMARK_SEEDS.league;
    const gameConfig = {
      ...simulationDeckConfig(config, defaults),
      agendaPointsToWin: config.agendaPointsToWin ?? defaults.agendaPointsToWin,
      maxActions: config.maxActions ?? defaults.maxActions,
      runnerControllerMode: profile.runnerMode,
      corpControllerMode: profile.corpMode,
      runnerProfileId: profileIdForMode("runner", profile.runnerMode),
      corpProfileId: profileIdForMode("corp", profile.corpMode),
    };
    const regressionConfig =
      profile.benchmarkProfileId === "current_candidate"
        ? exploitRegressionConfig(config)
        : null;
    const configurationHash = createHash("sha256")
      .update(canonicalSerialize({ seeds, gameConfig, regressionConfig }))
      .digest("hex");
    const summaries = seeds.map((seed) =>
      dependencies.simulateAiGame({
        ...gameConfig,
        seed,
        simulationRngSeed: `${seed}:${profile.benchmarkProfileId}:simrng`,
      }),
    );
    const totalActions = summaries.reduce(
      (sum, summary) => sum + summary.actions,
      0,
    );
    const timeoutActions = summaries.reduce(
      (sum, summary) =>
        sum +
        summary.actionSequence.filter((action) => action.timeoutUsed).length,
      0,
    );
    const fallbackActions = summaries.reduce(
      (sum, summary) =>
        sum +
        summary.actionSequence.filter((action) => action.fallbackUsed).length,
      0,
    );
    const outcomeCounts = {
      runner: 0,
      corp: 0,
      draw: 0,
      action_limit_reached: 0,
      runtime_failure: 0,
    } satisfies Record<AiSimulationSummary["winner"], number>;
    for (const { winner } of summaries) outcomeCounts[winner] += 1;
    const gameDenominator = Math.max(summaries.length, 1);
    const winRates = Object.fromEntries(
      Object.entries(outcomeCounts).map(([outcome, count]) => [
        outcome,
        round(count / gameDenominator),
      ]),
    );
    const exploitRefs = regressionConfig
      ? dependencies
          .runExploitRegressionFixtures(regressionConfig)
          .filter((result) => !result.passed)
          .map((result) => result.fixtureId)
      : [];
    return {
      simulationId: `benchmark:${profile.benchmarkProfileId}:${configurationHash}`,
      benchmarkProfile: profile.benchmarkProfileId,
      games: summaries.length,
      illegalActions: summaries.reduce(
        (sum, summary) => sum + summary.metrics.illegalActions,
        0,
      ),
      runtimeFailures: summaries.reduce(
        (sum, summary) => sum + summary.metrics.runtimeFailures,
        0,
      ),
      timeouts: timeoutActions,
      timeoutRate: totalActions === 0 ? 0 : timeoutActions / totalActions,
      fallbackRate:
        totalActions === 0 ? 0 : round(fallbackActions / totalActions),
      winRates,
      agendaPoints: {
        runner: summaries.reduce(
          (sum, summary) => sum + summary.finalAgendaPoints.runner,
          0,
        ),
        corp: summaries.reduce(
          (sum, summary) => sum + summary.finalAgendaPoints.corp,
          0,
        ),
      },
      averageActions: round(totalActions / gameDenominator),
      replayFailures: summaries.filter((summary) => !summary.replayOk).length,
      notableExploitRefs: sortedUnique(exploitRefs),
      summaries,
    };
  }

  return { runSimulationProfile };
}
