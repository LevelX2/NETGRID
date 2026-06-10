import type { LegalAction } from "@netgrid/shared";

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
  reasonCode: string;
  explanation: string;
  evidence: string[];
  confidence?: number;
};

export type TacticalPlanMappedChoiceResult = {
  choice?: SemanticRuntimeChoice;
  overrideChoice?: SemanticRuntimeChoice;
  overriddenMappedChoice?: SemanticRuntimeChoice;
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
