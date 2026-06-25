import type { AiDifficulty } from "@netgrid/shared";
import soakSeedsData from "../../../../data/ai/ai-soak-seeds-0.9.json";
import soakSeeds143Data from "../../../../data/ai/ai-soak-seeds-1.4.3.json";

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

export const SOAK_SEEDS_143 = soakSeeds143Data as {
  version: "1.4.3";
  tuningSeeds: string[];
  holdoutSeeds: string[];
  league: {
    runnerDeckId: "demo_runner_008";
    corpDeckId: "demo_corp_008";
    agendaPointsToWin: number;
    maxActions: number;
  };
};
