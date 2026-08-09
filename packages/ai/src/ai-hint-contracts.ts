import type { Side } from "@netgrid/shared";

import type { AiHintOntologyExtension } from "./hint-ontology";

export type AiCardHint = AiHintOntologyExtension & {
  cardId: string;
  side: Side;
  cardType?: string;
  roles: string[];
  planRoles: string[];
  strategicRole?: string[];
  riskTags?: string[];
  requiredMechanics?: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  valueHints?: AiRuntimeValueHints;
  manualNotes?: string[];
  strategicNotes?: string[];
  descriptorGaps?: string[];
  opponentSignals?: Array<
    Record<string, unknown> & { visibleEvidenceOnly: true }
  >;
  scenarioRefs?: string[];
};

export type AiRuntimeValueHintKey =
  | "damage"
  | "economy"
  | "installCreditGain"
  | "leavePlayPayCost"
  | "remoteRootValue"
  | "startOfTurnCreditLoss";

export type AiRuntimeValueHints = Partial<
  Record<AiRuntimeValueHintKey, number>
>;

export const CS06_AI_HINT_COMPILER_VERSION =
  "cs06-ai-hint-compiler-v1" as const;
export const CS06_AI_HINT_ARTIFACT_SCHEMA_VERSION =
  "cs06-ai-hint-artifact-v1" as const;

export type Cs06AiHintArtifact = {
  schemaVersion: typeof CS06_AI_HINT_ARTIFACT_SCHEMA_VERSION;
  compilerVersion: typeof CS06_AI_HINT_COMPILER_VERSION;
  evidence: {
    scenarioPackId: string;
    scenarioId: string;
    status: "ai_supported";
    fingerprint: string;
  };
  cardIds: string[];
  cards: Array<{
    cardId: string;
    cardRulesFingerprint: string;
    planningAnnotationsFingerprint: string;
    hint: AiCardHint;
  }>;
};
