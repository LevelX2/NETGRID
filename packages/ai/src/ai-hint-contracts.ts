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

export const CARD_SPEC_AI_HINT_COMPILER_VERSION =
  "card-spec-ai-hint-compiler-v2" as const;
export const CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION =
  "card-spec-ai-hint-artifact-v2" as const;

export type CardSpecAiHintArtifact = {
  schemaVersion: typeof CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION;
  compilerVersion: typeof CARD_SPEC_AI_HINT_COMPILER_VERSION;
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
