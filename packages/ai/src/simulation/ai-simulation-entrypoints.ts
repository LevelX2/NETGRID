import type { AiDecision, AiDecisionInput } from "@netgrid/shared";
import type { AiMatchProgressionMetrics } from "./ai-match-progression-types";
import type { AiSimulationConfig } from "./ai-simulation-config";
import type { AiSimulationSummary } from "./ai-simulation-summary";
import { createAiSelfplayTraceMiningRunner } from "./ai-selfplay-trace-mining-runner";
import { createAiSoakRunner } from "./ai-soak-runner";
import { createDoctrineQualityBenchmarkRunner } from "./doctrine-quality-benchmark-runner";
import { createMatchProgressionBenchmarkRunner } from "./match-progression-benchmark-runner";
import { createMatchProgressionBenchmarkSuiteRunner } from "./match-progression-benchmark-suite-runner";
import { createV143ExploitRegressionFixturesRunner } from "./v143-exploit-regression-fixtures";
import { createV143ProfileRunner } from "./v143-profile-run";
import { createV143SimulationLeagueRunner } from "./v143-simulation-league";

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
  const { runV143ExploitRegressionFixtures } =
    createV143ExploitRegressionFixturesRunner({
      simulateAiGame: dependencies.simulateAiGame,
      chooseRunnerAction: dependencies.chooseRunnerAction,
    });
  const { runV143Profile } = createV143ProfileRunner({
    simulateAiGame: dependencies.simulateAiGame,
    runExploitRegressionFixtures: runV143ExploitRegressionFixtures,
  });
  const { runV143SimulationLeague } = createV143SimulationLeagueRunner({
    runV143Profile,
  });
  const { runDoctrineQualityBenchmark } = createDoctrineQualityBenchmarkRunner({
    runV143Profile,
  });
  const { runMatchProgressionBenchmark } =
    createMatchProgressionBenchmarkRunner({
      runV143Profile,
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
    runV143ExploitRegressionFixtures,
    runV143Profile,
    runV143SimulationLeague,
    runDoctrineQualityBenchmark,
    runMatchProgressionBenchmark,
    runMatchProgressionBenchmarkSuite,
    runAiSelfplayTraceMining,
    simulateAiSoak,
  };
}
