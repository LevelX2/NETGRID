import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import generatedCardSpecAiHints from "../../../data/ai/card-spec-ai-hints-generated.json";
import {
  CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION,
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type AiCardHint,
  type AiRuntimeValueHintKey,
  type AiRuntimeValueHints,
  type CardSpecAiHintArtifact,
} from "./ai-hint-contracts";

export type { AiCardHint, AiRuntimeValueHintKey, AiRuntimeValueHints };

const generatedArtifact = validateGeneratedArtifact(generatedCardSpecAiHints);
export const AI_HINTS_BY_CARD = new Map<string, AiCardHint>();
const derivedCardSpecAiHintIds = new Set(generatedArtifact.cardIds);

export function cardIdHasGeneratedCardSpecAiHint(cardId: string): boolean {
  return derivedCardSpecAiHintIds.has(cardId);
}

for (const hint of activeAiHintsData.cards as AiCardHint[]) {
  if (AI_HINTS_BY_CARD.has(hint.cardId))
    throw new Error(`duplicate_legacy_ai_hint_authority: ${hint.cardId}`);
  AI_HINTS_BY_CARD.set(hint.cardId, hint);
}
for (const record of generatedArtifact.cards) {
  if (AI_HINTS_BY_CARD.has(record.cardId))
    throw new Error(`overlapping_ai_hint_authority: ${record.cardId}`);
  AI_HINTS_BY_CARD.set(record.cardId, deepFreezeCatalogReadModel(record.hint));
}

export function createAiHintsByCard(): Map<string, AiCardHint> {
  return new Map(AI_HINTS_BY_CARD);
}

export type CatalogAiHintProvenance =
  | {
      schemaVersion: "ai-hint-provenance-v1";
      authority: "legacy_active_hint_json";
      sourceRefs: readonly ["data/ai/ai-card-hints-active.json"];
    }
  | {
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

const LEGACY_AI_HINT_PROVENANCE: Extract<
  CatalogAiHintProvenance,
  { authority: "legacy_active_hint_json" }
> = Object.freeze({
  schemaVersion: "ai-hint-provenance-v1" as const,
  authority: "legacy_active_hint_json" as const,
  sourceRefs: Object.freeze(["data/ai/ai-card-hints-active.json"] as const),
});

/** Keyed server/API detail view. Legacy values are copied per response. */
export function catalogAiHintReadModelForCardId(
  cardId: string,
): CatalogAiHintReadModel | undefined {
  const hint = AI_HINTS_BY_CARD.get(cardId);
  if (hint === undefined) return undefined;
  if (!derivedCardSpecAiHintIds.has(cardId))
    return Object.freeze({
      hint: deepFreezeCatalogReadModel(structuredClone(hint)),
      provenance: LEGACY_AI_HINT_PROVENANCE,
    });

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

export function validateGeneratedArtifact(
  value: unknown,
): CardSpecAiHintArtifact {
  if (typeof value !== "object" || value === null)
    throw new Error("invalid_card_spec_ai_hint_artifact");
  const artifact = value as Partial<CardSpecAiHintArtifact>;
  if (
    artifact.schemaVersion !== CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION ||
    artifact.compilerVersion !== CARD_SPEC_AI_HINT_COMPILER_VERSION ||
    artifact.evidence?.status !== "ai_supported" ||
    artifact.evidence.scenarioPackId !== "card-support-ai-supported-current" ||
    artifact.evidence.scenarioId !== "active_card_support_ai_supported" ||
    !artifact.evidence.fingerprint.startsWith(
      "fnv1a64x2:card-spec-ai-hint-evidence-v2:",
    ) ||
    !Array.isArray(artifact.cardIds) ||
    !Array.isArray(artifact.cards) ||
    artifact.cardIds.length !== 46 ||
    artifact.cards.length !== 46
  )
    throw new Error("invalid_card_spec_ai_hint_artifact_contract");
  const expectedIds = [...artifact.cardIds].sort(compareText);
  const actualIds = artifact.cards
    .map((record) => record.cardId)
    .sort(compareText);
  if (
    new Set(expectedIds).size !== expectedIds.length ||
    expectedIds.some((entry, index) => entry !== actualIds[index]) ||
    artifact.cards.some(
      (record) =>
        record.hint.cardId !== record.cardId ||
        record.hint.aiSupportStatus !== "ai_supported" ||
        !record.hint.scenarioRefs?.includes(
          "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
        ) ||
        !record.cardRulesFingerprint.startsWith("fnv1a64x2:card-rules-v1:") ||
        !record.planningAnnotationsFingerprint.startsWith(
          "fnv1a64x2:card-planning-annotations-v1:",
        ),
    )
  )
    throw new Error("invalid_card_spec_ai_hint_artifact_rows");
  return artifact as CardSpecAiHintArtifact;
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

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
