import type {
  RunnerDevelopmentFundingMilestone,
  RunnerFundingRouteAssessment,
} from "../../plans/runner-funding-contracts";

export type RunnerRestrictedProgramInstallSequenceStep = {
  order: number;
  cardInstanceId: string;
  definitionId: number;
  installCost: number;
  memoryCost: number;
  projectedRunnerCreditsAfter: number;
  projectedMemoryAvailableAfter: number;
  projectedGripCountAfter: number;
  purposeCode: string;
  evidenceCode: string;
};

export type RunnerRestrictedProgramInstallSequenceCommitment = {
  kind: "restricted_program_install_sequence";
  sourceActionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: number;
  plannedAtStateVersion: number;
  runnerCreditsBeforeOpening: number;
  grantedActionCount: number;
  temporaryInstallCredits: number;
  minimumCreditFloor: number;
  minimumHandBuffer: number;
  ordinaryClicksAfterOpening: number;
  targetSteps: RunnerRestrictedProgramInstallSequenceStep[];
  admissionReason:
    | "multiple_productive_programs"
    | "acute_temporary_credit_bridge";
  evidenceCodes: string[];
};

type DevelopmentInstallMemorySacrificeBinding = {
  targetCardInstanceId: string;
  targetMemoryCost: number;
  requiredMemoryToFree: number;
  selectedCards: Array<{
    cardInstanceId: string;
    memoryCost: number;
  }>;
};

export type RunnerDevelopmentSignal = {
  developmentId: string;
  definitionId: number;
  targetKind?: "card" | "capability";
  phase:
    | "execute"
    | "fund"
    | "prepare_restricted_sequence"
    | "open_restricted_sequence"
    | "execute_restricted_sequence"
    | "complete_restricted_sequence"
    | "resolve_event_install_choice"
    | "resolve_delayed_program_search_choice";
  purposeCode?: string;
  assignedDomainPlanIds: string[];
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
  semanticActionTypes: string[];
  actionIds: string[];
  fundingGap?: number;
  supportNeedId?: string;
  developmentFundingMilestone?: RunnerDevelopmentFundingMilestone;
  fundingRouteActionIds?: string[];
  fundingRouteAssessment?: RunnerFundingRouteAssessment;
  priorityClass: "P3" | "P4" | "P5" | "P6";
  value: number;
  evidenceCode: string;
  evidenceCodes?: string[];
  restrictedProgramInstallCommitment?: RunnerRestrictedProgramInstallSequenceCommitment;
  eventInstallChoiceCommitment?: {
    sourceActionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: number;
    sourceCapabilityKey: string;
    selectedAtStateVersion?: number;
    engineContinuationAtStateVersion?: number;
    targetCardInstanceId: string;
    targetDefinitionId: number;
    installMemorySacrificeBinding?: DevelopmentInstallMemorySacrificeBinding;
  };
  eventInstallChoiceBinding?: {
    choiceId: string;
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: number;
    sourceCapabilityKey: string;
    sourceStateVersion: number;
    originSelectedAtStateVersion: number;
    choiceSource: string;
    selectedOptionId: string;
    targetCardInstanceId: string;
    targetDefinitionId: number;
  };
  delayedProgramSearchChoiceBinding?: {
    choiceId: string;
    choiceSource: string;
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: number;
    sourceStateVersion: number;
    selectedOptionId: string;
    targetCardInstanceId: string;
    targetDefinitionId: number;
    installMemorySacrificeBinding?: DevelopmentInstallMemorySacrificeBinding;
  };
  programSearchCommitment?: {
    sourceCardInstanceId: string;
    sourceDefinitionId: number;
    targetDefinitionId: number;
    targetPurpose:
      | "recurring_breaker_economy"
      | "memory_support"
      | "rd_pressure_support"
      | "hq_pressure_support";
    plannedAtStateVersion: number;
    selectedActionId?: string;
    selectedAtStateVersion?: number;
    engineContinuationAtStateVersion?: number;
  };
  recoverySearchCommitment?: {
    sourceCardInstanceId: string;
    sourceDefinitionId: number;
    searchFilter: "program" | "any_card";
    targetCardInstanceId: string;
    targetDefinitionId: number;
    targetPurpose: "generic_heap_recovery" | "generic_hosted_program_recovery";
    plannedAtStateVersion: number;
    selectedActionId?: string;
    selectedAtStateVersion?: number;
    engineContinuationAtStateVersion?: number;
  };
};

export type DevelopmentState = {
  kind: "development";
  signal: RunnerDevelopmentSignal;
};
