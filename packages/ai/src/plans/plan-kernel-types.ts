import type { Side } from "@netgrid/shared";

export type PlanModuleId = `${Side}.${string}`;

export type PlanExecutionClass =
  | "urgent_response"
  | "bounded_sequence"
  | "recurring_cycle"
  | "development_project"
  | "strategic_campaign";

export type PlanViability =
  | "dormant"
  | "ready"
  | "blocked"
  | "completed"
  | "abandoned";

export type PlanProposalViability = Exclude<
  PlanViability,
  "completed" | "abandoned"
>;

export type PlanPortfolioRole = "foreground" | "background" | "unassigned";

export type PlanExecutionState = "idle" | "executor" | "preempted";

export type PlanPersistencePolicy =
  | "locked_sequence"
  | "sticky_goal"
  | "flexible_support"
  | "recurring_cadence";

export type PlanTargetRef = {
  kind:
    | "server"
    | "card"
    | "ice"
    | "capability"
    | "bank"
    | "window"
    | "player";
  id: string;
  label?: string;
};

export type PlanConditionRef = {
  code: string;
  detail?: string;
};

export type PlanBlocker = {
  code: string;
  owner:
    | "plan_module"
    | "action_semantics"
    | "resource_ledger"
    | "support_graph"
    | "rules_contract"
    | "window_resolution";
  removable: boolean;
  resumeCondition?: PlanConditionRef;
};

export type PlanProgress = {
  status:
    | "not_started"
    | "progress"
    | "no_progress"
    | "regression"
    | "completed"
    | "invalidated";
  value: number;
  milestone: string;
  reasonCode: string;
};

export type PlanCadence = {
  turnKey: string;
  maxExecutionsPerTurn: number;
  executionsUsed: number;
};

export type PlanEvidenceRef = {
  code: string;
  source:
    | "deck_strategy"
    | "goal_signal"
    | "threat_signal"
    | "visible_state"
    | "public_event"
    | "own_card"
    | "plan_outcome";
};

export type PlanRetentionPolicy = {
  blockedStateVersionTtl: number;
  dormantStateVersionTtl: number;
  completedHistoryStateVersionTtl: number;
  abandonWhenTargetMissing: boolean;
  protectedWhileNeedOpen: boolean;
  protectedWhileCommitted: boolean;
};

export type PlanProposal = {
  moduleId: PlanModuleId;
  moduleVersion: string;
  dedupeKey: string;
  side: Side;
  strategyLineIds: string[];
  executionClass: PlanExecutionClass;
  initialViability: PlanProposalViability;
  persistencePolicy: PlanPersistencePolicy;
  retentionPolicy: PlanRetentionPolicy;
  target?: PlanTargetRef;
  parentInstanceId?: string;
  phase: string;
  milestone: string;
  moduleState: unknown;
  blockers: PlanBlocker[];
  resumeConditions: PlanConditionRef[];
  completionConditions: PlanConditionRef[];
  abandonmentConditions: PlanConditionRef[];
  cadence?: PlanCadence;
  evidenceRefs: PlanEvidenceRef[];
};

export type PlanInstance = {
  instanceId: string;
  dedupeKey: string;
  moduleId: PlanModuleId;
  moduleVersion: string;
  side: Side;
  strategyLineIds: string[];
  executionClass: PlanExecutionClass;
  viability: PlanViability;
  portfolioRole: PlanPortfolioRole;
  executionState: PlanExecutionState;
  persistencePolicy: PlanPersistencePolicy;
  retentionPolicy: PlanRetentionPolicy;
  target?: PlanTargetRef;
  parentInstanceId?: string;
  openNeedIds: string[];
  phase: string;
  milestone: string;
  moduleState: unknown;
  blockers: PlanBlocker[];
  resumeConditions: PlanConditionRef[];
  completionConditions: PlanConditionRef[];
  abandonmentConditions: PlanConditionRef[];
  resourceClaimIds: string[];
  acceptedReservationIds: string[];
  commitmentId?: string;
  cadence?: PlanCadence;
  progress: PlanProgress;
  createdAtStateVersion: number;
  updatedAtStateVersion: number;
  lastProductiveAtStateVersion?: number;
  evidenceRefs: PlanEvidenceRef[];
};

export type PlanInstanceStateIssue =
  | "module_side_mismatch"
  | "blank_dedupe_key"
  | "blank_phase"
  | "non_ready_executor"
  | "non_ready_preempted"
  | "terminal_plan_assigned"
  | "terminal_plan_has_open_need"
  | "terminal_plan_has_commitment"
  | "blocked_plan_without_blocker"
  | "ready_plan_has_blocker"
  | "invalid_state_version_order";
