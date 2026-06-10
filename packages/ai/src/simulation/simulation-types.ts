export type SimulationControllerMode =
  | "random_legal_bot"
  | "basic_corp_ai"
  | "basic_runner_ai"
  | "plan_corp_v1_4_0"
  | "plan_runner_v1_4_1"
  | "belief_ai_v1_4_2"
  | "current_candidate";

export type SimulationBenchmarkProfileId =
  | "random_legal_bot"
  | "basic_corp_ai"
  | "basic_runner_ai"
  | "plan_corp_v1_4_0"
  | "plan_runner_v1_4_1"
  | "belief_ai_v1_4_2"
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

