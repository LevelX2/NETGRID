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
