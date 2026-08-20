export type SimulationControllerMode = "random_legal_bot" | "current_candidate";

export type SimulationBenchmarkProfileId =
  | "random_legal_bot"
  | "current_candidate";

export type SimulationBenchmarkProfile = {
  benchmarkProfileId: SimulationBenchmarkProfileId;
  runnerMode: SimulationControllerMode;
  corpMode: SimulationControllerMode;
};
