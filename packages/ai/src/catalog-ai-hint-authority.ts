import { cardSpecAiHintsGeneratedData as generatedCardSpecAiHints } from "@netgrid/runtime-data/card-spec-ai-hints";
import {
  CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION,
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type AiCardHint,
  type AiRuntimeValueHintKey,
  type AiRuntimeValueHints,
} from "./ai-hint-contracts";
import { validateGeneratedArtifact } from "./generated-ai-hint-artifact-validation";

export { validateGeneratedArtifact } from "./generated-ai-hint-artifact-validation";

export type { AiCardHint, AiRuntimeValueHintKey, AiRuntimeValueHints };

const generatedArtifact = validateGeneratedArtifact(generatedCardSpecAiHints);
export const AI_HINTS_BY_CARD = new Map<string, AiCardHint>();
const derivedCardSpecAiHintIds = new Set(generatedArtifact.cardIds);

export function cardIdHasGeneratedCardSpecAiHint(cardId: string): boolean {
  return derivedCardSpecAiHintIds.has(cardId);
}

for (const record of generatedArtifact.cards) {
  AI_HINTS_BY_CARD.set(record.cardId, deepFreezeCatalogReadModel(record.hint));
}

export function createAiHintsByCard(): Map<string, AiCardHint> {
  return new Map(AI_HINTS_BY_CARD);
}

export type CatalogAiHintProvenance = {
  schemaVersion: "ai-hint-provenance-v1";
  authority: "card_spec_compiler";
  artifactSchemaVersion: typeof CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION;
  compilerVersion: typeof CARD_SPEC_AI_HINT_COMPILER_VERSION;
  cardRulesFingerprint: string;
  planningAnnotationsFingerprint: string;
  evidenceFingerprint: string;
  sourceRefs: readonly [
    "data/ai/card-spec-ai-hints-generated.json",
    "packages/ai/src/card-spec-ai-hint-compiler.ts#deriveCardSpecAiHint",
    "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
  ];
};

export type CatalogAiHintReadModel = {
  hint: AiCardHint;
  provenance: CatalogAiHintProvenance;
};

export type CatalogAiHintSummaryReadModel = {
  cardId: string;
  aiSupportStatus: AiCardHint["aiSupportStatus"];
  mechanicalFactsFound: boolean;
  hasClassifications: boolean;
  hasWarnings: boolean;
};

/** Keyed server/API detail view from the canonical generated artifact. */
export function catalogAiHintReadModelForCardId(
  cardId: string,
): CatalogAiHintReadModel | undefined {
  const hint = AI_HINTS_BY_CARD.get(cardId);
  if (hint === undefined) return undefined;

  const record = generatedArtifact.cards.find(
    (candidate) => candidate.cardId === cardId,
  );
  if (record === undefined)
    throw new Error(`missing_generated_ai_hint_provenance: ${cardId}`);
  return Object.freeze({
    hint,
    provenance: deepFreezeCatalogReadModel({
      schemaVersion: "ai-hint-provenance-v1" as const,
      authority: "card_spec_compiler" as const,
      artifactSchemaVersion: generatedArtifact.schemaVersion,
      compilerVersion: generatedArtifact.compilerVersion,
      cardRulesFingerprint: record.cardRulesFingerprint,
      planningAnnotationsFingerprint: record.planningAnnotationsFingerprint,
      evidenceFingerprint: generatedArtifact.evidence.fingerprint,
      sourceRefs: [
        "data/ai/card-spec-ai-hints-generated.json",
        "packages/ai/src/card-spec-ai-hint-compiler.ts#deriveCardSpecAiHint",
        "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
      ] as const,
    }),
  });
}

/** Primitive-only list view; never clones or exposes the legacy hint graph. */
export function catalogAiHintSummaryForCardId(
  cardId: string,
): CatalogAiHintSummaryReadModel | undefined {
  const hint = AI_HINTS_BY_CARD.get(cardId);
  if (hint === undefined) return undefined;
  return Object.freeze({
    cardId,
    aiSupportStatus: hint.aiSupportStatus,
    mechanicalFactsFound: hasCatalogMechanicalFacts(hint),
    hasClassifications: Boolean(
      hint.functionSignals?.length ||
      hint.strategyAnchors?.length ||
      hint.strategySupportPairs?.length ||
      hint.lineSupport?.length,
    ),
    hasWarnings: Boolean(
      hint.quality?.needsHumanReview || hint.descriptorGaps?.length,
    ),
  });
}

function hasCatalogMechanicalFacts(hint: AiCardHint): boolean {
  return Boolean(
    hint.effects?.length ||
    hint.conditions?.length ||
    hint.targetProfiles?.length ||
    (hint.costProfile && Object.keys(hint.costProfile).length > 0) ||
    (hint.breakerProfile && Object.keys(hint.breakerProfile).length > 0) ||
    (hint.remoteRole && Object.keys(hint.remoteRole).length > 0),
  );
}

function deepFreezeCatalogReadModel<T extends object>(value: T): T {
  for (const nested of Object.values(value))
    if (typeof nested === "object" && nested !== null)
      deepFreezeCatalogReadModel(nested);
  return Object.freeze(value);
}
