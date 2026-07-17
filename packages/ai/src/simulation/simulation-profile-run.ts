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
import type { ExploitRegressionResult } from "./regression/exploit-regression-fixtures";
import { fnv1a } from "../runtime/stable-hash";
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
    const runnerProfileId = profileIdForMode("runner", profile.runnerMode);
    const corpProfileId = profileIdForMode("corp", profile.corpMode);
    const summaries = seeds.map((seed) =>
      dependencies.simulateAiGame({
        seed,
        ...simulationDeckConfig(config, {
          runnerDeckId: CURRENT_BENCHMARK_SEEDS.league.runnerDeckId,
          corpDeckId: CURRENT_BENCHMARK_SEEDS.league.corpDeckId,
        }),
        agendaPointsToWin:
          config.agendaPointsToWin ??
          CURRENT_BENCHMARK_SEEDS.league.agendaPointsToWin,
        maxActions:
          config.maxActions ?? CURRENT_BENCHMARK_SEEDS.league.maxActions,
        runnerControllerMode: profile.runnerMode,
        corpControllerMode: profile.corpMode,
        ...(runnerProfileId ? { runnerProfileId } : {}),
        ...(corpProfileId ? { corpProfileId } : {}),
        simulationRngSeed: `${seed}:${profile.benchmarkProfileId}:simrng`,
      }),
    );
    const totalActions =
      summaries.reduce((sum, summary) => sum + summary.actions, 0) || 1;
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
    const winCounts = summaries.reduce(
      (counts, summary) => {
        const key = summary.winner;
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      },
      {} as Record<AiSimulationSummary["winner"], number>,
    );
    const exploitRefs =
      profile.benchmarkProfileId === "current_candidate"
        ? dependencies
            .runExploitRegressionFixtures(config)
            .filter((result) => !result.passed)
            .map((result) => result.fixtureId)
        : [];
    return {
      simulationId: `benchmark:${profile.benchmarkProfileId}:${fnv1a(seeds.join("|"))}`,
      benchmarkProfile: profile.benchmarkProfileId,
      games: summaries.length,
      illegalActions: summaries.reduce(
        (sum, summary) => sum + summary.metrics.illegalActions,
        0,
      ),
      timeouts: timeoutActions,
      fallbackRate: round(fallbackActions / totalActions),
      winRates: {
        runner: round((winCounts.runner ?? 0) / Math.max(summaries.length, 1)),
        corp: round((winCounts.corp ?? 0) / Math.max(summaries.length, 1)),
        draw: round((winCounts.draw ?? 0) / Math.max(summaries.length, 1)),
        action_limit_reached: round(
          (winCounts.action_limit_reached ?? 0) / Math.max(summaries.length, 1),
        ),
      },
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
      averageActions: round(totalActions / Math.max(summaries.length, 1)),
      replayFailures: summaries.filter((summary) => !summary.replayOk).length,
      notableExploitRefs: sortedUnique(exploitRefs),
      summaries,
    };
  }

  return { runSimulationProfile };
}
