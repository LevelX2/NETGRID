import type {
  ActionPrimaryProjectionStatus,
  ActionProjectionIssue,
  ActionSemanticCandidate,
  ActionSemanticSourceKind,
} from "../action-semantic-candidate";

export const ACTION_SEMANTIC_CANDIDATE_COVERAGE_REPORT_VERSION =
  "action-semantic-candidate-coverage-v1" as const;

export const ACTION_SEMANTIC_COVERAGE_GROUPS = [
  "basic_action",
  "game_rule",
  "runner_card_action",
  "corp_card_action",
  "choice_resolution",
  "run_action",
  "access_action",
  "corp_window_action",
  "score_action",
  "install_action",
  "advance_action",
  "rez_action",
] as const;

export type ActionSemanticCoverageGroup =
  (typeof ACTION_SEMANTIC_COVERAGE_GROUPS)[number];

export type ActionSemanticTargetContextStatus =
  | "engine_provided"
  | "not_available"
  | "target_context_unavailable"
  | "missing";

export const ACTION_SEMANTIC_TARGET_CONTEXT_STATUSES = [
  "engine_provided",
  "not_available",
  "target_context_unavailable",
  "missing",
] as const satisfies readonly ActionSemanticTargetContextStatus[];

export type ActionSemanticCandidateCoverageRow = {
  actionType: string;
  semanticActionType: string;
  primaryProjectionStatus: ActionPrimaryProjectionStatus;
  sourceKind: ActionSemanticSourceKind;
  hasSourceCardId: boolean;
  hasAbilityId: boolean;
  hasPrimitiveKind: boolean;
  hasEffectKind: boolean;
  hasCostProfile: boolean;
  hasTimingProfile: boolean;
  hasTargetContext: boolean;
  targetContextStatus: ActionSemanticTargetContextStatus;
  hiddenInfoBlocked: boolean;
  usesNeutralFallback: boolean;
  redactionSafe: boolean;
  projectionIssues: ActionProjectionIssue[];
  groups: ActionSemanticCoverageGroup[];
};

export type ActionSemanticCandidateCoverageSummary = {
  version: typeof ACTION_SEMANTIC_CANDIDATE_COVERAGE_REPORT_VERSION;
  totalCandidates: number;
  redactionSafe: boolean;
  redactionUnsafeRows: number;
  forbiddenMarkers: string[];
  hiddenInfoBlockers: number;
  schemaGapRows: number;
  fieldCoverage: {
    hasSourceCardId: number;
    hasAbilityId: number;
    hasPrimitiveKind: number;
    hasEffectKind: number;
    hasCostProfile: number;
    hasTimingProfile: number;
    hasTargetContext: number;
    usesNeutralFallback: number;
    redactionSafe: number;
  };
  actionTypes: Record<string, number>;
  semanticActionTypes: Record<string, number>;
  primaryProjectionStatuses: Record<string, number>;
  sourceKinds: Record<string, number>;
  projectionIssues: Record<string, number>;
  schemaGaps: Record<string, number>;
  targetContextStatuses: Record<string, number>;
  targetContextByGroup: Record<
    ActionSemanticCoverageGroup,
    Record<ActionSemanticTargetContextStatus, number>
  >;
  groups: Record<ActionSemanticCoverageGroup, number>;
  rows: ActionSemanticCandidateCoverageRow[];
};

export type ActionSemanticCandidateCoverageSourceInput = {
  syntheticCandidates: readonly ActionSemanticCandidate[];
  engineBackedCandidates: readonly ActionSemanticCandidate[];
};

export type ActionSemanticCandidateCoverageSourceSummary = {
  syntheticCandidates: number;
  engineBackedCandidates: number;
  sourceResolvedRate: number;
  abilityResolvedRate: number;
  targetContextRate: number;
  costKnownRate: number;
  timingKnownRate: number;
  hiddenInfoBlockedCount: number;
  schemaGapCount: number;
  redactionUnsafeRows: number;
};
