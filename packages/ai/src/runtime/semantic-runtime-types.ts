import type { AiDecisionDebug, LegalAction } from "@netgrid/shared";

export type SemanticRuntimeExclusion = {
  key: string;
  label: string;
  reason: string;
};

export type SemanticRuntimeChoice = {
  action: LegalAction;
  scopeId: string;
  exclusion?: SemanticRuntimeExclusion;
  score: number;
  scoreBreakdown: NonNullable<AiDecisionDebug["scoreBreakdown"]>;
  reasonCode: string;
  explanation: string;
  evidence: string[];
  confidence?: number;
};

export type TacticalPlanMappedChoiceResult = {
  outcome?:
    | "plan_mapping_selected"
    | "semantic_choice_selected"
    | "semantic_choice_blocked";
  choice?: SemanticRuntimeChoice;
  overrideChoice?: SemanticRuntimeChoice;
  overriddenMappedChoice?: SemanticRuntimeChoice;
  overrideReason?: string;
  overrideBlockedChoice?: SemanticRuntimeChoice;
  overrideBlockedReason?: string;
  overrideThreshold?: number;
  scoreGap?: number;
};

export type SemanticRuntimeCoverageSelectionDebug = {
  capabilityKind: string;
  capabilityLabel: string;
  answerFit: string;
  sourceTitle: string;
  evidence: string[];
};

export type SemanticRuntimeRunOnlyActionAdjustment = {
  choice: SemanticRuntimeChoice;
  rankedChoices: SemanticRuntimeChoice[];
  memoryAction?: LegalAction;
};
