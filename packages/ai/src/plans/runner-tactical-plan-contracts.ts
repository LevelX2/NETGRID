import { type RunnerCorePlanDomain } from "./runner-core-plan-contracts";
import type { RunnerAccessFacts } from "../access/runner-access-facts";
import type {
  RunnerPrerunReserveQuote,
  RunnerRunTargetEvaluation,
} from "../run-analysis/runner-run-target-types";
import type { RunnerExposeInformationSignal } from "../runner/expose-information/expose-information-types";
import { RunnerDevelopmentSignal } from "../runner/hand-development/development-types";
import type { RunnerTerminalWinSignal } from "../runner/terminal-win/terminal-win-types";
import type { RunnerTargetedBypassCommitment } from "../runtime/runner-targeted-bypass-plan";
import type { RunnerTargetedIceTrashCommitment } from "../runtime/runner-targeted-ice-trash-plan";

export type RunnerRunRiskContractSignal = {
  schemaVersion: "runner-run-risk-contract-v1";
  serverId: string;
  observedAtStateVersion: number;
  runCommitment: "probe_only" | "full_path";
  unrezzedIceRisk: number;
  runnerCreditsAtEntry: number;
  runnerHandCountAtEntry: number;
  visibleDuringRunRezSupport: boolean;
  reserveQuote: RunnerPrerunReserveQuote;
  evidenceCodes: string[];
};

export type RunnerRunRiskReassessmentSignal = {
  schemaVersion: "runner-run-risk-reassessment-v1";
  serverId: string;
  observedAtStateVersion: number;
  decision: "preserve_continuation" | "prefer_jack_out";
  currentUnrezzedIceRisk?: number;
  baselineReserveQuote: RunnerPrerunReserveQuote;
  currentReserveQuote?: RunnerPrerunReserveQuote;
  evidenceCodes: string[];
  failureCode?: "current_server_risk_model_missing";
};

export type RunnerRunActionRouteDiagnostic = {
  rawRouteScore: number;
  opportunityCost: number;
  effectiveRouteScore: number;
};

export type RunnerPressureSignal = {
  pressureId: string;
  serverId: "hq" | "rd" | "archives";
  purpose: "access" | "multiaccess" | "information";
  strategyLineIds: string[];
  priorityClass: "P2" | "P3" | "P4" | "P5" | "P6";
  reachable: boolean;
  marginalValue: number;
  evidenceCode: string;
  sourceDefinitionIds?: string[];
  runActionIds?: string[];
  runActionValues?: Record<string, number>;
  runActionEvidence?: Record<string, string[]>;
  runActionDifferentialPayoffIds?: string[];
  runActionRouteDiagnostics?: Record<string, RunnerRunActionRouteDiagnostic>;
  runActionExclusions?: Record<string, string[]>;
  preparationActionIds?: string[];
  rejectedPreparationActionIds?: string[];
  supportNeedId?: string;
  routePreparation?:
    | "release_run_lock"
    | "develop_payoff"
    | "convert_accumulated_pressure"
    | "targeted_bypass"
    | "targeted_ice_trash";
  targetedBypassCommitment?: RunnerTargetedBypassCommitment;
  targetedIceTrashCommitment?: RunnerTargetedIceTrashCommitment;
  encounterCreditSpendLimit?: number;
  accessCommitment?: RunnerRunAccessCommitmentSignal;
  runRiskContract?: RunnerRunRiskContractSignal;
  informationBoundaryReassessment?: RunnerInformationBoundaryReassessmentSignal;
  accessPayoffCampaign?: {
    payoffCardInstanceId: string;
    payoffDefinitionId: string;
    desiredCopyCount: number;
    installedCopyCount: number;
    selectedCopyOrdinal: number;
    installCost: number;
    fundingTargetCredits: number;
    runFundingTargetCredits: number;
    totalFundingEnvelope: number;
    fundingGap: number;
    reserveFundingOptional: boolean;
    horizon: "same_turn" | "bounded_multi_turn";
    milestone: "fund_install" | "install_payoff";
    blocker?: string;
    evidenceCodes: string[];
  };
};

export type RunnerRemoteContestSignal = {
  contestId: string;
  serverId: string;
  purpose: "contest" | "information";
  knownAgendaThreat: boolean;
  terminalPatternThreat?: boolean;
  reachable: boolean;
  marginalValue: number;
  constrainedActionCapacity?: boolean;
  evidenceCode: string;
  runActionAssessments: Record<
    string,
    {
      verdict: "executable" | "explicitly_nonproductive";
      stepValue: number;
      evidenceCodes: string[];
      routeDiagnostic?: RunnerRunActionRouteDiagnostic;
    }
  >;
  preparationActionIds?: string[];
  supportNeedId?: string;
  routePreparation?:
    | "release_run_lock"
    | "expose_remote"
    | "prepare_access_payoff"
    | "targeted_bypass"
    | "targeted_ice_trash";
  targetedBypassCommitment?: RunnerTargetedBypassCommitment;
  targetedIceTrashCommitment?: RunnerTargetedIceTrashCommitment;
  encounterCreditSpendLimit?: number;
  accessCommitment?: RunnerRunAccessCommitmentSignal;
  runRiskContract?: RunnerRunRiskContractSignal;
  informationBoundaryReassessment?: RunnerInformationBoundaryReassessmentSignal;
};

export type RunnerInformationBoundaryReassessmentSignal = {
  startedAsInformation: true;
  previousPurpose: "access" | "multiaccess" | "information" | "contest";
  nextPurpose: "access" | "information" | "contest";
  decision: "convert_to_access" | "convert_to_contest" | "retain_information";
  boundaryKind: "visible_ice_path_changed";
  observedAtStateVersion: number;
  observedIceInstanceId: string;
  knownPathCost: number;
  knownPathReachable: boolean;
  unknownIceCount: number;
  runnerCreditsBeforeQuote: number;
  creditsAfterKnownPath: number;
  reservedCredits: number;
  fundingGap: number;
  unavoidableHazardCount: number;
  remainingClicks: number;
  encounterBudget: number;
  evidenceCodes: string[];
};

export type RunnerRunAccessCommitmentSignal = {
  payoff:
    | "agenda"
    | "score_threat"
    | "trash_affordable"
    | "trash_unaffordable"
    | "known_low_value"
    | "unknown"
    | "fresh"
    | "access_bonus";
  intendedAction: "steal" | "trash" | "decline" | "access";
  knownTargetDefinitionIds: string[];
  trashBudget: RunnerAccessFacts["trashBudget"];
  evidenceCode: string;
};

export type RunnerRunWindowSignal = {
  windowId: string;
  serverId?: string;
  rootPlanInstanceId: string;
  leafPlanInstanceId: string;
  semanticActionTypes: string[];
  purposeCode: string;
  evidenceCode: string;
  accessCommitment?: RunnerRunAccessCommitmentSignal;
  runRiskReassessment?: RunnerRunRiskReassessmentSignal;
  safetyIntent?: "jack_out";
  safetyEvidenceCode?: string;
  encounterIntent?: "mitigate_threat";
  encounterEvidenceCode?: string;
  actionAssessments?: Record<string, RunnerRunWindowActionAssessment>;
};

export type RunnerRunWindowActionAssessment = {
  admissible: boolean;
  value?: number;
  evidenceCodes: string[];
};

export type RunnerTacticalPlanDomain = {
  terminalWins: RunnerTerminalWinSignal[];
  centralPressure: RunnerPressureSignal[];
  remoteContests: RunnerRemoteContestSignal[];
  developments: RunnerDevelopmentSignal[];
  exposeInformation: RunnerExposeInformationSignal[];
  runWindows: RunnerRunWindowSignal[];
  runTargetEvaluations?: RunnerRunTargetEvaluation[];
};

export type RunnerPlanDomain = RunnerCorePlanDomain & RunnerTacticalPlanDomain;
