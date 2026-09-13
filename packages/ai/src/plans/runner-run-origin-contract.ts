import {
  type RunnerInformationBoundaryReassessmentSignal,
  type RunnerPlanDomain,
  type RunnerPressureSignal,
  type RunnerRemoteContestSignal,
  type RunnerRunAccessCommitmentSignal,
  type RunnerRunRiskContractSignal,
} from "./runner-tactical-plan-contracts";
export type RunnerRunOrigin = {
  postBreakTrashCommitment?: RunnerPressureSignal["postBreakTrashCommitment"];
  purpose?: "access" | "multiaccess" | "information" | "contest";
  encounterCreditSpendLimit?: number;
  accessCommitment?: RunnerRunAccessCommitmentSignal;
  runRiskContract?: RunnerRunRiskContractSignal;
  informationBoundaryReassessment?: RunnerInformationBoundaryReassessmentSignal;
};

export type ActiveRunnerRunRoot = RunnerRunOrigin & {
  instanceId: string;
  restrictedRunBinding?: RunnerPlanDomain["runWindows"][number];
  parentBinding?:
    | {
        moduleId: "runner.pressure_central";
        signal: RunnerPressureSignal;
      }
    | {
        moduleId: "runner.contest_remote";
        signal: RunnerRemoteContestSignal;
      };
};
