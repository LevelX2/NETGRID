import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";

export type RunnerShellTradersPipelineSignal = {
  pipelineId: string;
  phase: "prepare" | "progress" | "hold";
  sourceCardInstanceId: string;
  sourceDefinitionId: "onr_v1_176_the-shell-traders";
  targetCardInstanceId: string;
  targetDefinitionId: string;
  targetCardType: "program" | "hardware";
  actionIds: string[];
  rejectedActionIds?: string[];
  priorityClass: "P2" | "P4" | "P5";
  value: number;
  shellCountersBefore: number;
  shellCountersAfterAction: number;
  targetInstallCost: number;
  targetMemoryCost: number;
  freeMemory: number;
  replacementAssessment: Readonly<{
    status: "not_needed" | "available" | "harmful" | "unknown";
    requiredMemory: number;
    selectedProgramInstanceIds: string[];
    freedMemory: number;
    displacedValue: number;
  }>;
  coverageBinding?: Readonly<{
    gapId: string;
    requiredRole: RunnerCoverageGapSignal["requiredRole"];
    targetServerId?: string;
  }>;
  targetRoles: string[];
  evidenceCodes: string[];
};

export type ShellTradersPipelineState = {
  kind: "shell_traders_pipeline";
  phase: RunnerShellTradersPipelineSignal["phase"];
  signal: RunnerShellTradersPipelineSignal;
};
