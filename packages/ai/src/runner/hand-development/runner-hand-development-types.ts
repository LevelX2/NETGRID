import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type { DeckCapabilityProfile } from "../../deck-capabilities";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";

export const RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION =
  "runner-hand-development-evaluation-v1" as const;
export const RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION =
  "runner-persistent-install-evaluation-v1" as const;

export type RunnerHandDevelopmentAvailability =
  | "legal_now"
  | "missing_credits"
  | "missing_mu"
  | "timing_blocked"
  | "not_relevant_now";

export type RunnerHandDevelopmentRole =
  | "access_payoff"
  | "breaker_or_rig_piece"
  | "memory_support"
  | "economy_engine"
  | "bank_tool"
  | "draw_or_search_engine"
  | "defense_support"
  | "run_event"
  | "duplicate_or_low_value"
  | "unknown";

export type RunnerHandDevelopmentStrategicFit =
  | "strong"
  | "medium"
  | "weak"
  | "blocked";

export type RunnerHandDevelopmentCurrentNeed =
  | "acute"
  | "useful_now"
  | "setup"
  | "later"
  | "none";

export type RunnerHandDevelopmentDeferReason =
  | "none"
  | "missing_credits"
  | "missing_mu"
  | "no_current_need"
  | "duplicate"
  | "timing"
  | "preserve_credit_floor"
  | "stronger_override";

export type RunnerHandDevelopmentLiquidityTiming =
  | "immediate"
  | "delayed"
  | "none";

export type RunnerHandDevelopmentFundingNeed = {
  installOrPlayCost: number;
  missingCredits: number;
  reason: "cannot_pay" | "would_break_floor" | "would_break_run_reserve";
};

export type RunnerPersistentInstallCapabilityDelta =
  | "none"
  | "backup_only"
  | "new_coverage"
  | "stable_upgrade"
  | "cost_upgrade"
  | "risk_reduction"
  | "cumulative_capacity"
  | "synergy_support";

export type RunnerPersistentInstallStackabilityClass =
  | "absolute_non_stackable"
  | "replacement_upgrade"
  | "backup_redundancy"
  | "cumulative_capacity"
  | "action_bank_parallel"
  | "synergy_support"
  | "risk_mitigation"
  | "unknown";

export type RunnerPersistentInstallDuplicateRole =
  | "none"
  | "useful_backup"
  | "redundant_duplicate"
  | "emergency_redundancy";

export type RunnerPersistentInstallEvaluation = {
  schemaVersion: typeof RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION;
  actionId: string;
  cardId?: string;
  title?: string;
  cardType?: VisibleCard["type"];
  installCost: number;
  creditsAfterInstall: number;
  handAfterInstall: number;
  memoryCost?: number;
  memoryAfterInstall?: number;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
  existingFunctionalCoverage: string[];
  newFunctionalCoverage: string[];
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  stackabilityClass: RunnerPersistentInstallStackabilityClass;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
  marginalUtilityScore: number;
  opportunityPenalty: number;
  reservePenalty: number;
  handBufferPenalty: number;
  muPressurePenalty: number;
  displacementPenalty: number;
  finalInstallFit: number;
  evidence: string[];
};

export type RunnerHandDevelopmentEvaluation = {
  schemaVersion: typeof RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION;
  cardInstanceId: string;
  definitionId?: string;
  title?: string;
  cardType?: VisibleCard["type"];
  availability: RunnerHandDevelopmentAvailability;
  developmentRole: RunnerHandDevelopmentRole;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  liquidityTiming?: RunnerHandDevelopmentLiquidityTiming;
  priority: number;
  fundingNeed?: RunnerHandDevelopmentFundingNeed;
  deferReason: RunnerHandDevelopmentDeferReason;
  legalActionId?: string;
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation;
  evidence: string[];
};

export type EvaluateRunnerHandDevelopmentParams = {
  input: AiDecisionInput;
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
  actionCandidates?: readonly ActionSemanticCandidate[];
};
