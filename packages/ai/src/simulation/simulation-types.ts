export type SimulationControllerMode = "random_legal_bot" | "current_candidate";

export type SimulationBenchmarkProfileId =
  | "random_legal_bot"
  | "current_candidate";

export type SimulationBenchmarkProfile = {
  benchmarkProfileId: SimulationBenchmarkProfileId;
  runnerMode: SimulationControllerMode;
  corpMode: SimulationControllerMode;
};

export type SimulationWorld = {
  worldId: string;
  sourceBeliefVersion: string;
  seed: string;
  hiddenAssumptions: string[];
  redactionSafe: boolean;
};
