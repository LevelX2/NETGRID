export const ACTION_SEMANTIC_CANDIDATE_SCHEMA_VERSION =
  "action-semantic-candidate-v1" as const;

export type ActionSemanticVisibilityScope =
  | "actor_private"
  | "public"
  | "corp_private"
  | "runner_private"
  | "developer_only";

export type ActionSemanticSourceKind =
  | "card"
  | "basic_action"
  | "game_rule"
  | "choice"
  | "unknown";

export type ActionAbilityBindingMethod =
  | "explicit_ability_id"
  | "engine_payload"
  | "single_legal_ability_inferred"
  | "unresolved";

export type ActionSemanticConfidence = "none" | "low" | "medium" | "high";

export type ActionPrimaryProjectionStatus =
  | "projected"
  | "neutral_projected"
  | "partial_projected"
  | "blocked"
  | "schema_gap"
  | "hidden_info_blocked";

export type ActionProjectionIssue =
  | "source_unresolved"
  | "ability_unresolved"
  | "target_context_unavailable"
  | "hidden_info_blocked"
  | "cost_unknown"
  | "timing_unknown"
  | "card_semantics_unavailable";

export type ActionGateId =
  | "engine_legal_action"
  | "side_visibility"
  | "hidden_info"
  | "source_resolution"
  | "ability_resolution"
  | "target_context"
  | "cost_known"
  | "timing_known"
  | "runtime_no_effect";

export type ActionGateResult = {
  gateId: ActionGateId;
  status: "pass" | "block" | "unknown" | "not_applicable";
  severity: "info" | "warning" | "error";
  reason?: string;
  evidence?: string[];
};

export type StrategySupportPair = {
  strategyId: string;
  role: string;
  confidence: "low" | "medium" | "high";
  evidence: string;
};

export type SemanticCondition = {
  conditionId?: string;
  kind: string;
  status: "present" | "absent" | "unknown" | "not_evaluated";
  evidence?: string[];
};

export type SemanticRisk = {
  riskId?: string;
  kind: string;
  severity: "low" | "medium" | "high" | "unknown";
  evidence?: string[];
};

export type SemanticConstraint = {
  constraintId?: string;
  kind: string;
  status: "satisfied" | "unsatisfied" | "unknown" | "not_evaluated";
  evidence?: string[];
};

export type DamageAmount = {
  type: "net" | "meat" | "brain" | "core" | "unknown";
  amount: number | "unknown";
};

export type ActionCostProfile = {
  clickCost?: number;
  creditCost?: number;
  trashCost?: number;
  agendaPointCost?: number;
  forfeitAgenda?: boolean;
  selfDamage?: DamageAmount[];
  selfTag?: number;
  discardCost?: number;
  xValue?: number | "choice" | "unknown";
  paidBy?: "runner" | "corp" | "unknown";
  beneficiary?: "runner" | "corp" | "none" | "unknown";
  costKnownStatus: "known" | "partial" | "unknown" | "not_applicable";
  variableCost?: {
    kind: "x" | "trace_boost" | "trash_cost" | "rez_cost" | "choice" | "unknown";
    min?: number;
    max?: number;
    chosen?: number;
  };
  additionalCosts: string[];
};

export type ActionTimingProfile = {
  phase?: string;
  turnSide?: "runner" | "corp";
  window?: string;
  runPhase?: string;
  encounterPhase?: string;
  accessPhase?: boolean;
  scoreWindow?: boolean;
  rezWindow?: boolean;
  responseWindow?: boolean;
};

export type LegalTarget = {
  targetId: string;
  targetKind: "card" | "server" | "ice" | "program" | "resource" | "hardware" | "agenda" | "choice" | "unknown";
  targetSide: "runner" | "corp" | "both" | "unknown";
  targetZone?: string;
  visibilityScope: ActionSemanticVisibilityScope;
  evidence: string[];
};

export type LegalTargetSummary = {
  targetId: string;
  targetKind: LegalTarget["targetKind"];
  targetSide: LegalTarget["targetSide"];
  targetZone?: string;
  evidence: string[];
};

export type TargetProfileMatch = {
  targetProfileId?: string;
  status: "matched" | "not_matched" | "unknown" | "not_available";
  issues: ActionProjectionIssue[];
  evidence: string[];
};

export type ConstraintResult = {
  constraintId?: string;
  status: "pass" | "block" | "unknown" | "not_applicable";
  reason?: string;
  evidence: string[];
};

export type ActionTargetContext = {
  selectedTargets: LegalTarget[];
  availableTargets?: LegalTargetSummary[];
  targetKind:
    | "card"
    | "server"
    | "ice"
    | "program"
    | "resource"
    | "hardware"
    | "agenda"
    | "choice"
    | "unknown";
  targetZones: string[];
  targetSide: "runner" | "corp" | "both" | "unknown";
  hiddenInfoPolicy: string;
  availableTargetsStatus:
    | "engine_provided"
    | "not_available"
    | "target_context_unavailable";
  targetProfileMatches: TargetProfileMatch[];
  targetConstraintResults: ConstraintResult[];
};

export type BoardContextSummary = {
  source: "ai_decision_input" | "player_view" | "not_projected";
  sideSafe: boolean;
  stateVersion?: number;
  timingPoint?: string;
  notes: string[];
};

export type ActionSemanticCandidate = {
  actionId: string;
  actionType: string;
  actorSide: "runner" | "corp";
  actorId?: string;
  observerSide?: "runner" | "corp" | "system";
  visibilityScope: ActionSemanticVisibilityScope;
  legalActionRef: {
    actionId: string;
    actionType: string;
    originalPayloadKeys: string[];
    payloadHash?: string;
  };
  stateVersion?: number;
  sourceKind: ActionSemanticSourceKind;
  sourceCardId?: string;
  abilityId?: string;
  abilityBindingMethod: ActionAbilityBindingMethod;
  semanticActionType: string;
  cardContextSignals: string[];
  actionTacticSignals: string[];
  strategySupport: StrategySupportPair[];
  conditions: SemanticCondition[];
  risks: SemanticRisk[];
  constraints: SemanticConstraint[];
  costProfile: ActionCostProfile;
  timingProfile: ActionTimingProfile;
  targetContext?: ActionTargetContext;
  boardContext: BoardContextSummary;
  confidence: ActionSemanticConfidence;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  projectionIssues: ActionProjectionIssue[];
  hardGates: ActionGateResult[];
  evidence: string[];
};
