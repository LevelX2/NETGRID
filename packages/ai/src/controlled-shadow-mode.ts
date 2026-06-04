import type {
  ActionGateId,
  ActionPrimaryProjectionStatus,
  ActionProjectionIssue,
} from "./action-semantic-candidate";
import type {
  DeckDoctrineV2ReadinessStatus,
  TacticalGoalFamily,
} from "./action-doctrine-goal-diagnostics";

export const SHADOW_MODE_TRACE_CONTRACT_SCHEMA_VERSION =
  "shadow-mode-trace-contract-v1" as const;

export const CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS = {
  actualDecisionOverride: false,
  productiveScoring: false,
  plannerWeightChange: false,
  engineMutation: false,
  legalityGeneration: false,
  publicPayloadChange: false,
  hiddenInfoLeak: false,
  featureFlagCutover: false,
} as const satisfies ShadowModeNoEffectFlags;

export const FORBIDDEN_SHADOW_TRACE_CONSUMERS = [
  "applyAction",
  "PlayerAction",
  "PublicEvent",
  "PlayerView",
  "WebSocket payload",
  "Reconnect payload",
  "Undo preview",
  "Replay payload",
  "Client error",
  "Planner weights",
  "Productive feature flag",
] as const;

export type ShadowModeNoEffectFlags = {
  actualDecisionOverride: false;
  productiveScoring: false;
  plannerWeightChange: false;
  engineMutation: false;
  legalityGeneration: false;
  publicPayloadChange: false;
  hiddenInfoLeak: false;
  featureFlagCutover: false;
};

export type ShadowTraceVisibilityScope = "developer_only";

export type ShadowActorSide = "runner" | "corp";

export type LegacyDecisionTrace = {
  selectedActionId: string;
  selectedActionType: string;
  source: "legacy_ai";
  selectedFromLegalActions: true;
  evidence: string[];
};

export type SemanticShadowScoreStatus =
  | "ranked_shadow_only"
  | "blocked_by_gate"
  | "blocked_by_gap"
  | "no_candidate"
  | "not_scored";

export type ShadowCandidateRank = {
  candidateId: string;
  actionId: string;
  actionType: string;
  rankIndex: number;
  scoreStatus: SemanticShadowScoreStatus;
  evidenceBuckets: {
    goalAlignment: string[];
    doctrineAlignment: string[];
    basicActionValue: string[];
    costPenalty: string[];
    riskPenalty: string[];
    timingFit: string[];
    targetFit: string[];
    boardThreatResponse: string[];
  };
};

export type ShadowBlockingReason = {
  candidateId: string;
  scoreStatus: Extract<
    SemanticShadowScoreStatus,
    "blocked_by_gate" | "blocked_by_gap" | "not_scored"
  >;
  gateId?: ActionGateId;
  gap?: ActionProjectionIssue;
  reason: string;
  evidence: string[];
};

export type WhyNotTrace = {
  candidateId: string;
  comparedWithCandidateId?: string;
  reason:
    | "hard_gate_blocked"
    | "required_gap"
    | "lower_goal_alignment"
    | "lower_doctrine_alignment"
    | "cost_or_timing_unknown"
    | "target_context_missing"
    | "not_scored";
  evidence: string[];
};

export type SemanticShadowDecisionTrace = {
  selectedActionId?: string;
  selectedCandidateId?: string;
  scoreStatus: SemanticShadowScoreStatus;
  topCandidates: ShadowCandidateRank[];
  blockedCandidates: ShadowBlockingReason[];
  whyNot: WhyNotTrace[];
  noRuntimeEffect: true;
};

export type LegalActionTraceSummary = {
  actionId: string;
  actionType: string;
  source: "engine_legal_actions";
  timingPoint?: string;
  visibilityScope: "actor_private" | "public" | "developer_only";
};

export type ActionSemanticCandidateSummary = {
  candidateId: string;
  actionId: string;
  actionType: string;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  hardGateStatus: "pass" | "blocked" | "unknown" | "mixed";
  projectionIssues: ActionProjectionIssue[];
};

export type TacticalGoalTrace = {
  goalId: string;
  family: TacticalGoalFamily;
  side: ShadowActorSide;
  readiness: "ready" | "partial" | "blocked" | "unknown";
  evidence: string[];
};

export type DeckDoctrineReadinessTrace = {
  status: DeckDoctrineV2ReadinessStatus | "unknown";
  gaps: string[];
  evidence: string[];
};

export type ShadowHardGateTraceStatus =
  | "pass"
  | "blocked"
  | "unknown"
  | "not_applicable";

export type ShadowHardGateTraceEntry = {
  gateId: ActionGateId | "actual_decision_legacy_only";
  status: ShadowHardGateTraceStatus;
  severity: "info" | "warning" | "error";
  evidence: string[];
};

export type ShadowHardGateSummary = {
  gateResults: ShadowHardGateTraceEntry[];
  illegalSemanticDecisionCount: 0;
  hiddenInfoViolationCount: 0;
  runtimeEffectCount: 0;
  actualDecisionOverrideCount: 0;
  nonEngineLegalAssumptionCount: 0;
};

export type LegacySemanticDeltaCategory =
  | "same_exact_action"
  | "same_action_type_different_target"
  | "semantic_prefers_economy"
  | "semantic_prefers_setup"
  | "semantic_prefers_run_pressure"
  | "semantic_prefers_remote_contest"
  | "semantic_prefers_score_window"
  | "semantic_prefers_defense"
  | "semantic_avoids_hidden_info"
  | "semantic_blocked_by_target_context"
  | "semantic_blocked_by_ability_gap"
  | "semantic_blocked_by_cost_gap"
  | "semantic_lacks_card_semantics"
  | "legacy_selected_unknown_semantics"
  | "semantic_selected_risky_action"
  | "semantic_selected_unreachable_action"
  | "semantic_selected_low_value_action";

export type LegacySemanticComparisonTrace = {
  agreement:
    | "same_action"
    | "same_action_type"
    | "different_but_plausible"
    | "semantic_better_candidate"
    | "legacy_better_candidate"
    | "semantic_blocked"
    | "comparison_unavailable";
  deltaCategory: LegacySemanticDeltaCategory[];
  explanation: string[];
};

export type ShadowDecisionTrace = {
  traceId: string;
  matchId?: string;
  stateVersion: number;
  actorSide: ShadowActorSide;
  legacyDecision: LegacyDecisionTrace;
  semanticShadowDecision?: SemanticShadowDecisionTrace;
  legalActionSummary: LegalActionTraceSummary[];
  candidateSummary: ActionSemanticCandidateSummary[];
  tacticalGoals: TacticalGoalTrace[];
  doctrineReadiness: DeckDoctrineReadinessTrace;
  hardGates: ShadowHardGateSummary;
  comparison?: LegacySemanticComparisonTrace;
  visibilityScope: ShadowTraceVisibilityScope;
  noRuntimeEffect: true;
};

export type ShadowModeTraceContractReport = {
  schemaVersion: typeof SHADOW_MODE_TRACE_CONTRACT_SCHEMA_VERSION;
  scope: "trace_contract_only";
  typeName: "ShadowDecisionTrace";
  requiredTraceFields: Array<keyof ShadowDecisionTrace>;
  requiredLegacyDecisionFields: Array<keyof LegacyDecisionTrace>;
  requiredSemanticDecisionFields: Array<keyof SemanticShadowDecisionTrace>;
  requiredLegalActionSummaryFields: Array<keyof LegalActionTraceSummary>;
  requiredCandidateSummaryFields: Array<keyof ActionSemanticCandidateSummary>;
  visibilityScope: ShadowTraceVisibilityScope;
  actualDecisionContract: "actualDecision_equals_legacyDecision";
  noRuntimeEffect: true;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  forbiddenConsumers: readonly string[];
  noEffectFlags: ShadowModeNoEffectFlags;
};

export function buildShadowModeTraceContractReport(): ShadowModeTraceContractReport {
  return {
    schemaVersion: SHADOW_MODE_TRACE_CONTRACT_SCHEMA_VERSION,
    scope: "trace_contract_only",
    typeName: "ShadowDecisionTrace",
    requiredTraceFields: [
      "traceId",
      "stateVersion",
      "actorSide",
      "legacyDecision",
      "legalActionSummary",
      "candidateSummary",
      "tacticalGoals",
      "doctrineReadiness",
      "hardGates",
      "visibilityScope",
      "noRuntimeEffect",
    ],
    requiredLegacyDecisionFields: [
      "selectedActionId",
      "selectedActionType",
      "source",
      "selectedFromLegalActions",
      "evidence",
    ],
    requiredSemanticDecisionFields: [
      "scoreStatus",
      "topCandidates",
      "blockedCandidates",
      "whyNot",
      "noRuntimeEffect",
    ],
    requiredLegalActionSummaryFields: ["actionId", "actionType", "source"],
    requiredCandidateSummaryFields: [
      "candidateId",
      "primaryProjectionStatus",
      "hardGateStatus",
    ],
    visibilityScope: "developer_only",
    actualDecisionContract: "actualDecision_equals_legacyDecision",
    noRuntimeEffect: true,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    forbiddenConsumers: FORBIDDEN_SHADOW_TRACE_CONSUMERS,
    noEffectFlags: CONTROLLED_SHADOW_MODE_NO_EFFECT_FLAGS,
  };
}
