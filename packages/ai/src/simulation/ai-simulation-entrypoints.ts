import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { createAiSelfplayTraceMiningRunner } from "./ai-selfplay-trace-mining-runner";
import { createAiSoakRunner } from "./ai-soak-runner";
import { createDoctrineQualityBenchmarkRunner } from "./doctrine-quality-benchmark-runner";
import { createMatchProgressionBenchmarkRunner } from "./match-progression-benchmark-runner";
import { createMatchProgressionBenchmarkSuiteRunner } from "./match-progression-benchmark-suite-runner";
import { createExploitRegressionFixturesRunner } from "./regression/exploit-regression-fixtures";
import { createSimulationLeagueRunner } from "./simulation-league";
import { createSimulationProfileRunner } from "./simulation-profile-run";

export type AiSimulationEntrypointDependencies = {
  simulateAiGame: (config?: AiSimulationConfig) => AiSimulationSummary;
  summarizeMatchProgressionMetrics: (
    summaries: AiSimulationSummary[],
  ) => AiMatchProgressionMetrics;
  chooseRunnerAction: (input: AiDecisionInput) => AiDecision;
};

export function createAiSimulationEntrypoints(
  dependencies: AiSimulationEntrypointDependencies,
) {
  const { runExploitRegressionFixtures } =
    createExploitRegressionFixturesRunner({
      simulateAiGame: dependencies.simulateAiGame,
      chooseRunnerAction: dependencies.chooseRunnerAction,
    });
  const { runSimulationProfile } = createSimulationProfileRunner({
    simulateAiGame: dependencies.simulateAiGame,
    runExploitRegressionFixtures,
  });
  const { runSimulationLeague } = createSimulationLeagueRunner({
    runSimulationProfile,
  });
  const { runDoctrineQualityBenchmark } = createDoctrineQualityBenchmarkRunner({
    runSimulationProfile,
  });
  const { runMatchProgressionBenchmark } =
    createMatchProgressionBenchmarkRunner({
      runSimulationProfile,
      summarizeMatchProgressionMetrics:
        dependencies.summarizeMatchProgressionMetrics,
    });
  const { runMatchProgressionBenchmarkSuite } =
    createMatchProgressionBenchmarkSuiteRunner({
      runMatchProgressionBenchmark,
    });
  const { runAiSelfplayTraceMining } = createAiSelfplayTraceMiningRunner({
    simulateAiGame: dependencies.simulateAiGame,
    summarizeMatchProgressionMetrics:
      dependencies.summarizeMatchProgressionMetrics,
  });
  const { simulateAiSoak } = createAiSoakRunner({
    simulateAiGame: dependencies.simulateAiGame,
  });

  return {
    runSimulationLeague,
    runDoctrineQualityBenchmark,
    runMatchProgressionBenchmark,
    runMatchProgressionBenchmarkSuite,
    runAiSelfplayTraceMining,
    simulateAiSoak,
  };
}
