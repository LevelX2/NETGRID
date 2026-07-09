import { aiLiveRuntimeDependencies } from "./ai-runtime-public-entrypoints";
import { createAiRuntimeSimulationComposition } from "./simulation/ai-runtime-simulation-composition";
import { summarizeMatchProgressionMetrics } from "./simulation/match-progression-summary";

const {
  chooseCorpBaselineAction,
  chooseRunnerBaselineAction,
  runAiSelfplayTraceMining,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  simulateAiGame,
  simulateAiSoak,
} = createAiRuntimeSimulationComposition({
  ...aiLiveRuntimeDependencies,
  summarizeMatchProgressionMetrics,
});

export {
  chooseCorpBaselineAction,
  chooseRunnerBaselineAction,
  runAiSelfplayTraceMining,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runV143ExploitRegressionFixtures,
  runV143SimulationLeague,
  simulateAiGame,
  simulateAiSoak,
  summarizeMatchProgressionMetrics,
};
