import type { AiDecisionInput, LegalAction, Side } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { AccessOutcomeMemoryStatus } from "../access/access-outcome-memory";
import type { DeckCapabilityProfile } from "../deck-capabilities";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type { KnownRemoteAccessCommitment } from "../decision/known-remote-access-commitment";
import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import type { RunnerEconomyPosture, RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { RunnerHandDevelopmentEvaluation } from "../runner-hand-development";
import type { RunnerTacticalGoal } from "../runner-tactical-goals";
import type { RunnerStrategicIntentProfile } from "../runner-strategic-intent";
import type { StrategicIntentState } from "../strategic-intent-state";

export const TACTICAL_PLAN_SCHEMA_VERSION = "tactical-plan-v1" as const;

export type PlanLifecycle =
  | "proposed"
  | "active"
  | "blocked"
  | "progressing"
  | "satisfied"
  | "failed"
  | "expired"
  | "abandoned";

export type TacticalPlanType =
  | "runner.obtain_breaker_coverage"
  | "runner.contest_remote"
  | "runner.opportunistic_central_run"
  | "runner.restore_hand_buffer"
  | "runner.develop_hand_card"
  | "runner.build_credit_base"
  | "runner.build_credit_bank"
  | "runner.cash_out_credit_bank"
  | "corp.create_score_window"
  | "corp.build_credit_bank"
  | "corp.rez_defense"
  | "corp.apply_punish_pressure";

export type PlanStepKind =
  | "install_breaker"
  | "resolve_missing_mu"
  | "pivot_to_alternative"
  | "draw_for_answer"
  | "draw_hand_buffer"
  | "search_for_answer"
  | "setup_search_engine"
  | "gain_credits"
  | "install_development_card"
  | "build_remote"
  | "protect_remote"
  | "build_rez_reserve"
  | "install_or_prepare_agenda"
  | "build_bank_counter"
  | "cash_out_bank"
  | "run_target"
  | "probe_central"
  | "rez_outer_ice"
  | "advance_score_card"
  | "score_agenda"
  | "apply_punish_pressure";

export type PlanMappingStatus =
  | "unmapped"
  | "matched"
  | "blocked_no_legal_action"
  | "blocked_missing_capability"
  | "blocked_too_expensive"
  | "blocked_timing"
  | "defer_to_reactive_window";

export type RequiredCapabilityKind =
  | "breaker_coverage"
  | "breaker_wall"
  | "breaker_code_gate"
  | "breaker_sentry"
  | "breaker_ap"
  | "breaker_trace"
  | "breaker_universal"
  | "mu"
  | "credits"
  | "card_draw"
  | "hand_buffer"
  | "card_search"
  | "server_access"
  | "bank_capacity"
  | "bank_payout"
  | "remote_protection"
  | "agenda_score_window"
  | "rez_reserve"
  | "rez_window";

export type RequiredCapability = {
  capabilityId: string;
  kind: RequiredCapabilityKind;
  side: Side;
  target?: PlanTarget;
  minimumCredits?: number;
  evidence: string[];
};

export type PlanBlockerKind =
  | "missing_breaker_coverage"
  | "missing_wall_coverage"
  | "missing_code_gate_coverage"
  | "missing_sentry_coverage"
  | "missing_ap_coverage"
  | "missing_trace_coverage"
  | "coverage_not_in_deck"
  | "search_target_not_available"
  | "breaker_present_but_unaffordable"
  | "breaker_present_but_mu_blocked"
  | "missing_mu"
  | "too_expensive"
  | "target_unreachable"
  | "bank_tool_not_installed"
  | "bank_empty"
  | "score_window_unprotected"
  | "score_window_contestable"
  | "missing_rez_reserve"
  | "missing_credits"
  | "missing_legal_action"
  | "missing_remote_protection"
  | "timing_window_unavailable"
  | "reactive_window";

export type PlanBlocker = {
  blockerId: string;
  kind: PlanBlockerKind;
  severity: "soft" | "hard";
  target?: PlanTarget;
  removalStepKind?: PlanStepKind;
  evidence: string[];
};

export type PlanTarget = {
  kind: "server" | "card" | "ice" | "capability" | "bank";
  id: string;
  label?: string;
};

export type PlanScoreBreakdown = {
  key: string;
  label: string;
  value: number;
  reason: string;
};

export type RunnerDrawOverflowSeverity =
  | "none"
  | "minor"
  | "moderate"
  | "high";

export type RunnerDrawOverflowUrgencyOverride =
  | "none"
  | "find_breaker_for_score_threat"
  | "find_survival_answer"
  | "find_run_access_payoff"
  | "find_economy";

export type RunnerPressureBudget = {
  canSpendActionOnPressure: boolean;
  pressureActionBudgetThisTurn: number;
  maxCreditLossForProbe: number;
  allowedProbeTargets: string[];
  nearTieProbeTargets: string[];
  preferredProbeTarget?: string;
  blockedReasons: string[];
  boundedVariationApplied: boolean;
  variationReason: string;
  evidence: string[];
};

export type RunnerDrawOverflowAssessment = {
  currentHandCount: number;
  maxHandSize: number;
  cardsToDraw: number;
  remainingClicks: number;
  projectedHandAfterDraw: number;
  projectedOverflow: number;
  severity: RunnerDrawOverflowSeverity;
  discardFodderCount: number;
  valuableCardsAtRisk: number;
  usefulPlayableCardsInHand: number;
  usefulHandCardsBlockedByCredits: number;
  urgencyOverride: RunnerDrawOverflowUrgencyOverride;
  penalty: number;
  reasons: string[];
};

export type PlanStep = {
  stepId: string;
  kind: PlanStepKind;
  desiredActionSemantics: string[];
  requiredCapabilities: RequiredCapability[];
  mappingStatus?: PlanMappingStatus;
  actionCandidateIds: string[];
  rationale: string[];
};

export type TacticalPlan = {
  schemaVersion: typeof TACTICAL_PLAN_SCHEMA_VERSION;
  planId: string;
  side: Side;
  type: TacticalPlanType;
  status: PlanLifecycle;
  priority: number;
  horizonTurns: number;
  target?: PlanTarget;
  requiredCapabilities: RequiredCapability[];
  blockers: PlanBlocker[];
  currentStep: PlanStep;
  nextSteps: PlanStep[];
  evidence: string[];
  scoreBreakdown: PlanScoreBreakdown[];
  createdAtStateVersion: number;
  updatedAtStateVersion: number;
};

export type TacticalPlanCorpScorelinePathAssessment = {
  actionId: string;
  serverId?: string;
  recommendedNextStep: string;
  blockers: readonly string[];
  evidence: readonly string[];
};

export type TacticalPlanCorpScorelineAssessment = {
  recommendedNextStep: string;
  blockedByCredits: boolean;
  bestPath?: TacticalPlanCorpScorelinePathAssessment;
  paths: readonly TacticalPlanCorpScorelinePathAssessment[];
  evidence: readonly string[];
};

export type TacticalPlanBuildContext = {
  input: AiDecisionInput;
  candidates?: readonly ActionSemanticCandidate[];
  previousPlan?: TacticalPlanSnapshot;
  deckCapabilities?: DeckCapabilityProfile;
  strategicIntentState?: StrategicIntentState;
  corpStrategicIntent?: CorpStrategicIntentProfile;
  tacticalGoals?: readonly TacticalGoalLike[];
  runnerStrategicIntent?: RunnerStrategicIntentProfile;
  runnerRunTargetEvaluations?: readonly RunnerRunTargetEvaluation[];
  runnerEconomyPosture?: RunnerEconomyPosture;
  runnerHandDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  runnerTacticalGoals?: readonly RunnerTacticalGoal[];
  accessCommitment?: KnownRemoteAccessCommitment;
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  corpScorelineWindowAssessment?: TacticalPlanCorpScorelineAssessment;
};

export type PlanProgressionStatus =
  | "active"
  | "blocked"
  | "progressing"
  | "satisfied"
  | "abandoned";

export type TacticalPlanMemorySnapshot = {
  schemaVersion: typeof TACTICAL_PLAN_SCHEMA_VERSION;
  memoryId: string;
  side: Side;
  planId: string;
  type: TacticalPlanType;
  status: PlanProgressionStatus;
  target?: PlanTarget;
  selectedStepKind?: PlanStepKind;
  selectedActionId?: string;
  blockedBy: string[];
  ttlDecisionsRemaining: number;
  planProgressionReason: string;
  whyPlanAbandoned?: string;
  updatedAtStateVersion: number;
};

export type TacticalPlanSnapshot = TacticalPlanMemorySnapshot;

export type PlanStepMappingResult = {
  plan: TacticalPlan;
  step: PlanStep;
  status: PlanMappingStatus;
  actionCandidateIds: string[];
  legalActions: LegalAction[];
  rationale: string[];
};

export type TacticalPlanRuntimeResult = {
  previousPlan?: TacticalPlanMemorySnapshot;
  deckCapabilitiesUsed?: string[];
  strategicIntentStateUsed?: string[];
  corpStrategicIntentUsed?: string[];
  tacticalGoalsUsed?: string[];
  runnerStrategicIntentUsed?: string[];
  runnerRunTargetEvaluationsUsed?: string[];
  runnerEconomyPostureUsed?: string[];
  runnerHandDevelopmentEvaluationsUsed?: string[];
  runnerTacticalGoalsUsed?: string[];
  accessCommitmentUsed?: string[];
  accessOutcomeMemoryUsed?: string[];
  planAlternatives: TacticalPlan[];
  blockedPlans: TacticalPlan[];
  selectedPlan?: TacticalPlan;
  selectedStep?: PlanStep;
  selectedMapping?: PlanStepMappingResult;
  planProgressionReason?: string;
  whyPlanAbandoned?: string;
};
