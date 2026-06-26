import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import {
  profileIdForMode,
  simulationDeckConfig,
} from "./simulation-config-helpers";
import type {
  SimulationBenchmarkProfile,
} from "./simulation-types";
import type {
  V143LeagueConfig,
  V143SimulationRunResult,
} from "./v143-tuning-gate";
import { SOAK_SEEDS_143 } from "./soak-seed-data";
import type { V143ExploitRegressionResult } from "./v143-fixture-types";
import { fnv1a } from "../runtime/stable-hash";
import { roundNumber as round } from "../runtime/number-rounding";
import { sortedUnique } from "../runtime/collection";

export type V143ProfileRunDependencies = {
  simulateAiGame: (config?: AiSimulationConfig) => AiSimulationSummary;
  runExploitRegressionFixtures: (
    config?: Partial<AiSimulationConfig>,
  ) => V143ExploitRegressionResult[];
};

export function createV143ProfileRunner(
  dependencies: V143ProfileRunDependencies,
): {
  runV143Profile: (
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: V143LeagueConfig,
  ) => V143SimulationRunResult;
} {
  function runV143Profile(
    profile: SimulationBenchmarkProfile,
    seeds: string[],
    config: V143LeagueConfig,
  ): V143SimulationRunResult {
    const runnerProfileId = profileIdForMode("runner", profile.runnerMode);
    const corpProfileId = profileIdForMode("corp", profile.corpMode);
    const summaries = seeds.map((seed) =>
      dependencies.simulateAiGame({
        seed,
        ...simulationDeckConfig(config, {
          runnerDeckId: SOAK_SEEDS_143.league.runnerDeckId,
          corpDeckId: SOAK_SEEDS_143.league.corpDeckId,
        }),
        agendaPointsToWin:
          config.agendaPointsToWin ?? SOAK_SEEDS_143.league.agendaPointsToWin,
        maxActions: config.maxActions ?? SOAK_SEEDS_143.league.maxActions,
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
      profile.benchmarkProfileId === "current_candidate" ||
      profile.benchmarkProfileId === "belief_ai_v1_4_2"
        ? dependencies
            .runExploitRegressionFixtures(config)
            .filter((result) => !result.passed)
            .map((result) => result.fixtureId)
        : [];
    return {
      simulationId: `v143:${profile.benchmarkProfileId}:${fnv1a(seeds.join("|"))}`,
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

  return { runV143Profile };
}
