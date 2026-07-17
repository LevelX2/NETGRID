import { aiLiveRuntimeDependencies } from "./ai-runtime-public-entrypoints";
import { createAiRuntimeSimulationComposition } from "./simulation/ai-runtime-simulation-composition";
import { summarizeMatchProgressionMetrics } from "./simulation/match-progression-summary";

const {
  runAiSelfplayTraceMining,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runSimulationLeague,
  simulateAiGame,
  simulateAiSoak,
} = createAiRuntimeSimulationComposition({
  ...aiLiveRuntimeDependencies,
  summarizeMatchProgressionMetrics,
});

export {
  runAiSelfplayTraceMining,
  runDoctrineQualityBenchmark,
  runMatchProgressionBenchmark,
  runMatchProgressionBenchmarkSuite,
  runSimulationLeague,
  simulateAiGame,
  simulateAiSoak,
  summarizeMatchProgressionMetrics,
};
