import {
  CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION,
  CARD_SPEC_AI_HINT_COMPILER_VERSION,
  type CardSpecAiHintArtifact,
  validateAiHintActionCapabilitySemanticsContract,
  validateAiHintActionPlanOwnerBindings,
} from "./ai-hint-contracts";

export function validateGeneratedArtifact(
  value: unknown,
): CardSpecAiHintArtifact {
  if (typeof value !== "object" || value === null)
    throw new Error("invalid_card_spec_ai_hint_artifact");
  const artifact = value as Partial<CardSpecAiHintArtifact>;
  if (
    artifact.schemaVersion !== CARD_SPEC_AI_HINT_ARTIFACT_SCHEMA_VERSION ||
    artifact.compilerVersion !== CARD_SPEC_AI_HINT_COMPILER_VERSION ||
    !isRecord(artifact.evidence) ||
    artifact.evidence.status !== "ai_supported" ||
    artifact.evidence.scenarioPackId !== "card-support-ai-supported-current" ||
    artifact.evidence.scenarioId !== "active_card_support_ai_supported" ||
    typeof artifact.evidence.fingerprint !== "string" ||
    !artifact.evidence.fingerprint.startsWith(
      "fnv1a64x2:card-spec-ai-hint-evidence-v2:",
    ) ||
    !Array.isArray(artifact.cardIds) ||
    artifact.cardIds.some((cardId) => typeof cardId !== "string") ||
    !Array.isArray(artifact.cards) ||
    artifact.cardIds.length !== 618 ||
    artifact.cards.length !== 618
  )
    throw new Error("invalid_card_spec_ai_hint_artifact_contract");
  if (
    artifact.cards.some(
      (record: unknown) =>
        !isRecord(record) ||
        typeof record.cardId !== "string" ||
        typeof record.cardRulesFingerprint !== "string" ||
        typeof record.planningAnnotationsFingerprint !== "string" ||
        !isRecord(record.hint),
    )
  )
    throw new Error("invalid_card_spec_ai_hint_artifact_rows");
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
        !Array.isArray(record.hint.scenarioRefs) ||
        record.hint.scenarioRefs.some(
          (scenarioRef) => typeof scenarioRef !== "string",
        ) ||
        !record.hint.scenarioRefs.includes(
          "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported",
        ) ||
        !record.cardRulesFingerprint.startsWith("fnv1a64x2:card-rules-v1:") ||
        !record.planningAnnotationsFingerprint.startsWith(
          "fnv1a64x2:card-planning-annotations-v1:",
        ),
    )
  )
    throw new Error("invalid_card_spec_ai_hint_artifact_rows");
  for (const record of artifact.cards) {
    const ownerValidation = validateAiHintActionPlanOwnerBindings(
      record.hint.actionPlanOwnerBindings,
      record.hint.side,
    );
    if (!ownerValidation.valid)
      throw new Error(
        `invalid_card_spec_ai_hint_artifact_hint:${record.cardId}:${ownerValidation.errors[0]?.path ?? "$"}`,
      );
    const capabilityValidation = validateAiHintActionCapabilitySemanticsContract(
      record.hint.actionCapabilitySemantics,
    );
    if (!capabilityValidation.valid)
      throw new Error(
        `invalid_card_spec_ai_hint_artifact_hint:${record.cardId}:${capabilityValidation.errors[0]?.path ?? "$"}`,
      );
  }
  return artifact as CardSpecAiHintArtifact;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
