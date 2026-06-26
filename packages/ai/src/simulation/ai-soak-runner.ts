import { sortedUnique } from "../runtime/collection";
import { roundNumber as round } from "../runtime/number-rounding";
import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import type { AiSoakResult } from "./quality-metrics";
import { SOAK_SEEDS } from "./soak-seed-data";

export type AiSoakRunnerDependencies = {
  simulateAiGame: (config?: AiSimulationConfig) => AiSimulationSummary;
};

export function createAiSoakRunner(
  dependencies: AiSoakRunnerDependencies,
): {
  simulateAiSoak: (config?: Partial<AiSimulationConfig>) => AiSoakResult;
} {
  function simulateAiSoak(
    config: Partial<AiSimulationConfig> = {},
  ): AiSoakResult {
    const summaries = [
      ...SOAK_SEEDS.tuningSeeds,
      ...SOAK_SEEDS.holdoutSeeds,
    ].flatMap((seed) =>
      SOAK_SEEDS.matrix.difficulties.map((difficulty) =>
        dependencies.simulateAiGame({
          seed,
          runnerDeckId: config.runnerDeckId ?? SOAK_SEEDS.matrix.runnerDeckId,
          corpDeckId: config.corpDeckId ?? SOAK_SEEDS.matrix.corpDeckId,
          agendaPointsToWin:
            config.agendaPointsToWin ?? SOAK_SEEDS.matrix.agendaPointsToWin,
          maxActions: config.maxActions ?? SOAK_SEEDS.matrix.maxActions,
          runnerDifficulty: config.runnerDifficulty ?? difficulty,
          corpDifficulty: config.corpDifficulty ?? difficulty,
        }),
      ),
    );
    const totalActions =
      summaries.reduce(
        (sum, summary) => sum + summary.actionSequence.length,
        0,
      ) || 1;
    const fallbacks = summaries.reduce(
      (sum, summary) =>
        sum +
        summary.actionSequence.filter((entry) => entry.fallbackUsed).length,
      0,
    );
    const timeouts = summaries.reduce(
      (sum, summary) =>
        sum +
        summary.actionSequence.filter((entry) => entry.timeoutUsed).length,
      0,
    );
    return {
      summaries,
      aggregate: {
        seeds: summaries.length,
        illegalActions: summaries.reduce(
          (sum, summary) => sum + summary.metrics.illegalActions,
          0,
        ),
        replayFailures: summaries.filter((summary) => !summary.replayOk).length,
        fallbackRate: round(fallbacks / totalActions),
        timeoutRate: round(timeouts / totalActions),
        reasonCodeCoverage: sortedUnique(
          summaries.flatMap((summary) => summary.metrics.reasonCodeCoverage),
        ),
        actionTypeCoverage: sortedUnique(
          summaries.flatMap((summary) => summary.metrics.actionTypeCoverage),
        ),
        holdoutSeeds: SOAK_SEEDS.holdoutSeeds,
      },
    };
  }

  return { simulateAiSoak };
}
