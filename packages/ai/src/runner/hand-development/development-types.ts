import type {
  RunnerDevelopmentFundingMilestone,
  RunnerFundingRouteAssessment,
} from "../../plans/runner-funding-contracts";

export type RunnerRestrictedProgramInstallSequenceStep = {
  order: number;
  cardInstanceId: string;
  definitionId: string;
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
  sourceDefinitionId: string;
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

export type RunnerDevelopmentSignal = {
  developmentId: string;
  definitionId: string;
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
    sourceDefinitionId: string;
    sourceCapabilityKey: string;
    selectedAtStateVersion?: number;
    engineContinuationAtStateVersion?: number;
    targetCardInstanceId: string;
    targetDefinitionId: string;
    installMemorySacrificeBinding?: {
      targetCardInstanceId: string;
      targetMemoryCost: number;
      requiredMemoryToFree: number;
      selectedCards: Array<{
        cardInstanceId: string;
        memoryCost: number;
      }>;
    };
  };
  eventInstallChoiceBinding?: {
    choiceId: string;
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    sourceCapabilityKey: string;
    sourceStateVersion: number;
    originSelectedAtStateVersion: number;
    choiceSource: string;
    selectedOptionId: string;
    targetCardInstanceId: string;
    targetDefinitionId: string;
  };
  delayedProgramSearchChoiceBinding?: {
    choiceId: string;
    choiceSource: string;
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    sourceStateVersion: number;
    selectedOptionId: string;
    targetCardInstanceId: string;
    targetDefinitionId: string;
    installMemorySacrificeBinding?: {
      targetCardInstanceId: string;
      targetMemoryCost: number;
      requiredMemoryToFree: number;
      selectedCards: Array<{
        cardInstanceId: string;
        memoryCost: number;
      }>;
    };
  };
  programSearchCommitment?: {
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    targetDefinitionId: string;
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
    sourceDefinitionId: string;
    searchFilter: "program" | "any_card";
    targetCardInstanceId: string;
    targetDefinitionId: string;
    targetPurpose: "generic_heap_recovery";
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
