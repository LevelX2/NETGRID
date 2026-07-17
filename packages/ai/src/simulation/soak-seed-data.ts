import type { AiDifficulty } from "@netgrid/shared";
import soakSeedsData from "../../../../data/ai/ai-soak-seeds-0.9.json";
import currentBenchmarkSeedData from "../../../../data/ai/ai-soak-seeds-1.4.3.json";

export const SOAK_SEEDS = soakSeedsData as {
  tuningSeeds: string[];
  holdoutSeeds: string[];
  matrix: {
    runnerDeckId: "demo_runner_008";
    corpDeckId: "demo_corp_008";
    agendaPointsToWin: number;
    difficulties: AiDifficulty[];
    maxActions: number;
  };
};

export const CURRENT_BENCHMARK_SEEDS = {
  tuningSeeds: currentBenchmarkSeedData.tuningSeeds,
  holdoutSeeds: currentBenchmarkSeedData.holdoutSeeds,
  league: currentBenchmarkSeedData.league as {
    runnerDeckId: "demo_runner_008";
    corpDeckId: "demo_corp_008";
    agendaPointsToWin: number;
    maxActions: number;
  },
};
