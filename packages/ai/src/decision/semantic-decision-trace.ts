import type { SemanticDecisionFrame } from "./semantic-decision-frame";

export const SEMANTIC_DECISION_TRACE_SCHEMA_VERSION =
  "semantic-decision-trace-v1" as const;

export type SemanticScoreComponentTrace = {
  component: string;
  delta: number;
  evidence: string[];
};

export type SemanticRankedAction = {
  actionId: string;
  rank: number;
  score: number;
  primaryGoalId?: string;
  components: SemanticScoreComponentTrace[];
  blockers: string[];
  explanation: string;
};

export type SemanticRejectedAction = {
  actionId: string;
  reason: string;
  blockers: string[];
  evidence: string[];
};

export type SemanticDecisionTraceTargetChoiceShadowSummary = {
  schemaVersion: "target-choice-shadow-v1";
  scope: "target_choice_shadow_trace_summary";
  reportOnly: true;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  actionCount: number;
  rankedOptionCount: number;
  blockedRequirementCount: number;
  topActionId?: string;
  topOptionId?: string;
  selectionOutput: {
    selectedChoicesCreated: false;
    selectedTargetsCreated: false;
  };
  evidence: string[];
};

export const SEMANTIC_DECISION_TRACE_DIAGNOSTIC_SECTION_IDS = [
  "semantic_shadow_top",
  "pilot_scope",
  "calibration_profile",
  "target_choice_shadow",
  "mistake_summary",
] as const;

export type SemanticDecisionTraceDiagnosticSectionId =
  (typeof SEMANTIC_DECISION_TRACE_DIAGNOSTIC_SECTION_IDS)[number];

export type SemanticDecisionTraceDiagnosticSection = {
  id: SemanticDecisionTraceDiagnosticSectionId;
  title: string;
  items: string[];
};

export type SemanticDecisionTrace = {
  schemaVersion: typeof SEMANTIC_DECISION_TRACE_SCHEMA_VERSION;
  frameSummary: {
    side: SemanticDecisionFrame["side"];
    stateVersion: number;
    profileId?: string;
    legalActionCount: number;
    actionCandidateCount: number;
    tacticalGoalCount: number;
    hiddenInfoPolicy: SemanticDecisionFrame["hiddenInfoPolicy"];
    calibrationProfileId?: string;
    calibrationMode?: string;
  };
  rankedActions: SemanticRankedAction[];
  rejectedActions: SemanticRejectedAction[];
  targetChoiceShadow?: SemanticDecisionTraceTargetChoiceShadowSummary;
  selectedActionId?: string;
  noRuntimeEffect?: boolean;
};

export function buildEmptySemanticDecisionTrace(
  frame: SemanticDecisionFrame,
): SemanticDecisionTrace {
  return {
    schemaVersion: SEMANTIC_DECISION_TRACE_SCHEMA_VERSION,
    frameSummary: {
      side: frame.side,
      stateVersion: frame.stateVersion,
      ...(frame.profileId ? { profileId: frame.profileId } : {}),
      legalActionCount: frame.legalActionIds.length,
      actionCandidateCount: frame.actionCandidates.length,
      tacticalGoalCount: frame.tacticalGoals.length,
      hiddenInfoPolicy: frame.hiddenInfoPolicy,
    },
    rankedActions: [],
    rejectedActions: [],
    noRuntimeEffect: true,
  };
}
