import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { AccessOutcomeMemoryStatus } from "../access/access-outcome-memory";
import type { RankedKnownRemoteAccessCandidate } from "../access/access-target-ranking";
import type { BeliefState } from "../belief-state";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { RunnerHandDevelopmentEvaluation } from "../runner/hand-development/runner-hand-development-types";
import type { VisibleIceRunHazard } from "./visible-run-analysis-contracts";
import type { RunnerRunRouteQuote } from "./runner-run-route-quote";

export const RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION =
  "runner-run-target-evaluation-v1" as const;
export const RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION =
  "runner-economy-posture-v1" as const;
export const RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION =
  "runner-credit-base-plan-v1" as const;

export type RunnerRunTargetKind = "hq" | "rd" | "archives" | "remote";

export type RunnerAccessPayoff =
  | "agenda"
  | "trash_affordable"
  | "trash_unaffordable"
  | "known_low_value"
  | "unknown"
  | "fresh"
  | "access_bonus"
  | "score_threat";

export type RunnerInstalledRunPayoff = {
  immediateAccessValue: number;
  futureSetupValue: number;
  purgeTaxValue: number;
  economyValue: number;
  riskPenalty: number;
  scoreBonus: number;
  multiaccessAvailable: boolean;
  evidence: string[];
};

export type RunnerRunActionSourceKind =
  | "basic_action"
  | "event"
  | "resource_ability"
  | "program_ability"
  | "hardware_ability"
  | "identity_ability"
  | "card_ability"
  | "choice"
  | "extra_action"
  | "unknown";

export type RunnerRunActionStructure =
  | "direct_start_run"
  | "event_run"
  | "extra_run"
  | "bonus_run"
  | "followup_run"
  | "multi_run_sequence"
  | "target_choice"
  | "run_enabler";

export type RunnerRunActionProjectionStatus =
  | "concrete_target"
  | "missing_target_options";

export type RunActionProjection = {
  actionId: string;
  actionType: string;
  sourceKind: RunnerRunActionSourceKind;
  sourceCardId?: string;
  targetServerId?: string;
  targetKind?: RunnerRunTargetKind;
  accessServerId?: string;
  structure: RunnerRunActionStructure;
  accessPayoffSignals: string[];
  accessReplacement?: string;
  accessReplacementLookCount?: number;
  constraintSignals: string[];
  riskSignals: string[];
  temporaryRunCredits?: number;
  postRunSelfDamage?: number;
  spendLimit?: number;
  noNoisyBreakers: boolean;
  bypassFirstIce: boolean;
  projectionStatus: RunnerRunActionProjectionStatus;
  evidence: string[];
};

export type RunnerKnownAccessState =
  | "known_payoff"
  | "known_no_current_payoff"
  | "unknown"
  | "changed"
  | "fresh";

export type RunnerPathPassability =
  | "reachable"
  | "blocked_missing_coverage"
  | "blocked_by_random_break_damage_hand_buffer"
  | "blocked_unpayable"
  | "blocked_unbreakable";

export type RunnerRunTargetRecommendation =
  | "run_now"
  | "run_if_free"
  | "setup_first"
  | "draw_for_damage_buffer"
  | "gain_credits_first"
  | "find_breaker_first"
  | "known_no_current_payoff"
  | "remote_changed_reassess"
  | "declined_trash_memory_active"
  | "do_not_run_now";

export type RandomBreakOrDamageRiskSeverity =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "lethal";

export type RandomBreakOrDamageRiskPayoffOverride =
  | "none"
  | "known_agenda"
  | "remote_score_threat"
  | "immediate_win"
  | "survival";

export type RandomBreakOrDamageRiskAssessment = {
  currentHandCount: number;
  handAfterActionCost: number;
  randomBreakUsesLikely: number;
  visibleSubroutinesLikely: number;
  maxSingleFailureDamage: number;
  worstCaseDamageEstimate: number;
  lethalOnAnyFailure: boolean;
  lethalOnHighFailure: boolean;
  survivesOneFailedUse: boolean;
  riskSeverity: RandomBreakOrDamageRiskSeverity;
  payoffOverride: RandomBreakOrDamageRiskPayoffOverride;
  stableCoverageAvailable: boolean;
  pathDependsOnRandomBreakOrDamage: boolean;
  breakWouldBeExcludedInEncounter: boolean;
  blockedByHandBuffer: boolean;
  noProgressRunExpected: boolean;
  expectedEtrUnbroken: boolean;
  recentFailure: boolean;
  recentDamageAmount: number;
  sameServerRepeatedRiskPenalty: number;
  evidence: string[];
};

export type RunnerRandomBreakRecoveryAssessment = {
  active: boolean;
  targetServerId?: string;
  currentHandCount: number;
  handBufferTooLow: boolean;
  recentFailure: boolean;
  recentDamageAmount: number;
  sameServerRepeatedRiskPenalty: number;
  evidence: string[];
};

export type RunnerCreditBasePlanRecommendation =
  | "build_credit_base"
  | "acquire_economy"
  | "fund_useful_hand_card"
  | "preserve_reserve"
  | "allow_setup_spend"
  | "allow_pressure";

export type RunnerCreditReservePhase = "opening" | "midgame" | "late_contest";

export type RunnerRemoteScoreThreat =
  | "none"
  | "possible"
  | "visible"
  | "urgent";

export type RunnerEconomyRoute =
  | "bank_cashout"
  | "bank_build"
  | "installed_action_economy"
  | "hand_bank_tool"
  | "hand_economy_engine"
  | "draw_for_economy"
  | "burst_event"
  | "basic_credit_fallback";

export type RunnerEconomyTransitionPhase =
  | "opening_access"
  | "economy_transition"
  | "sustainable_pressure"
  | "endgame_contest";

export type RunnerEconomyTransitionAssessment = {
  phase: RunnerEconomyTransitionPhase;
  commitment:
    | "none"
    | "acquire_economy"
    | "fund_economy"
    | "install_economy"
    | "activate_economy";
  fundingHorizon: "none" | "short" | "long";
  targetCardInstanceId?: string;
  missingCredits?: number;
  sustainableEconomyInstalled: boolean;
  ordinaryPaidRunsDeferred: boolean;
  evidence: string[];
};

export type RunnerCreditReservePolicy = {
  schemaVersion: 1;
  phase: RunnerCreditReservePhase;
  currentCredits: number;
  convertibleBankCredits?: number;
  availableCreditPool?: number;
  minimumCreditFloor: number;
  breakerUseReserve: number;
  contestReserve: number;
  remotePressureReserve?: number;
  remotePressureServerId?: string;
  remotePressureReserveActive?: boolean;
  rdPressureSpendTarget?: number;
  pressureRunwayTarget?: number;
  developmentReserve: number;
  emergencyReserve: number;
  desiredCreditReserve: number;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  canContestIfFunded: boolean;
  belowReserveNow: boolean;
  spendingWouldDropBelowReserve: boolean;
  creditsAfterAction?: number;
  reserveDrivers: string[];
  reserveOverrides: string[];
  evidence: string[];
};

export type RunnerCreditBaseHandCandidate = {
  developmentRole: RunnerHandDevelopmentEvaluation["developmentRole"];
  currentNeed: RunnerHandDevelopmentEvaluation["currentNeed"];
  priority: number;
  installOrPlayCost: number;
  missingCredits: number;
  deferReason: RunnerHandDevelopmentEvaluation["deferReason"];
};

export type RunnerCreditBasePlan = {
  schemaVersion: typeof RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION;
  currentCredits: number;
  minimumCreditFloor: number;
  desiredCreditReserve: number;
  runCostReserve: number;
  creditReservePolicy: RunnerCreditReservePolicy;
  fundingNeed: boolean;
  usefulHandCardsBlockedByCredits: number;
  usefulHandCardsAffordableNow: number;
  topBlockedHandCandidate?: RunnerCreditBaseHandCandidate;
  recommendation: RunnerCreditBasePlanRecommendation;
  economyPriority: "low" | "medium" | "high";
  evidence: string[];
};

export type RunnerRunTargetEvaluation = {
  schemaVersion: typeof RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION;
  targetServerId: string;
  targetKind: RunnerRunTargetKind;
  accessServerId: string;
  accessTargetKind: RunnerRunTargetKind;
  actionId: string;
  accessPayoff: RunnerAccessPayoff;
  accessPayoffContestable?: boolean;
  knownAccessState: RunnerKnownAccessState;
  multiaccessAvailable: boolean;
  pathPassability: RunnerPathPassability;
  pathCost: number;
  futureClicksLost?: number;
  routeQuote?: RunnerRunRouteQuote;
  creditsAfterRun: number;
  runCommitment: "probe_only" | "full_path";
  unknownUnrezzedIceCount?: number;
  unrezzedIceRisk?: number;
  unrezzedIceRiskCreditBuffer?: number;
  unrezzedIceRiskUnderfunded?: boolean;
  visibleIceRunHazards?: VisibleIceRunHazard[];
  visibleIceHazardPenalty?: number;
  visibleIceHazardAvoidanceCost?: number;
  creditsAfterAvoidingVisibleIceHazards?: number;
  expectedTagsFromVisibleIce?: number;
  unavoidableVisibleIceHazardCount?: number;
  visibleTraceTagHazardUnavoidable?: boolean;
  stealOrTrashAffordable: boolean | "unknown";
  installedRunPayoff: RunnerInstalledRunPayoff;
  runActionPayoff: RunnerInstalledRunPayoff;
  runActionProjection: RunActionProjection;
  bypassedFirstIce?: boolean;
  riskyUniversalCoverage: boolean;
  randomBreakOrDamageRiskAssessment?: RandomBreakOrDamageRiskAssessment;
  scoreThreat: boolean;
  recommendation: RunnerRunTargetRecommendation;
  score: number;
  evidence: string[];
};

export type RunnerEconomyPosture = {
  schemaVersion: typeof RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION;
  minimumCreditFloor: number;
  desiredCreditReserve: number;
  creditReservePolicy: RunnerCreditReservePolicy;
  creditBasePlan: RunnerCreditBasePlan;
  preferredEconomyRoute?: RunnerEconomyRoute;
  transition?: RunnerEconomyTransitionAssessment;
  riskAdjustedRunReserve: boolean;
  buildEconomyBeforePressure: boolean;
  bankToolsRelevant: boolean;
  fundingNeed: boolean;
  recommendation:
    | "stable"
    | "build_economy"
    | "cash_out_bank"
    | "can_spend_for_high_payoff";
  evidence: string[];
};

export type EvaluateRunnerRunTargetsParams = {
  input: AiDecisionInput;
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
  beliefState?: BeliefState;
  handDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  actionCandidates?: readonly ActionSemanticCandidate[];
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  rankedAccessTargets?: readonly RankedKnownRemoteAccessCandidate[];
};
