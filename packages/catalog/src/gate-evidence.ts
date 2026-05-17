import type {
  CatalogManifestReference,
  CatalogNumericFields,
} from "./catalog-types";

export type RuntimeGateEvidence = {
  cardId: string;
  engineCardId: string;
  runtimeStatus: "human_playable";
  deckLegal: boolean;
  formatLegal: boolean;
};

export type AiApprovalEvidence = {
  cardId: string;
  approvalStatus: "ai_supported";
  scenarioGate: true;
};

export type ReleaseEvidence = {
  cardId: string;
  auditReleaseId: string;
  implementationManifest: CatalogManifestReference;
  textOverrides: Partial<Record<string, string>>;
  numericOverrides: Partial<Record<string, Partial<CatalogNumericFields>>>;
};

export type CardFactEvidence = {
  cardId: string;
  runtimeGate?: RuntimeGateEvidence;
  aiApproval?: AiApprovalEvidence;
  releaseEvidence?: ReleaseEvidence;
};

export type CatalogGateBatch = {
  auditReleaseId: string;
  cardIds: readonly string[];
  implementationManifest: CatalogManifestReference;
  textOverrides: Partial<Record<string, string>>;
  numericOverrides: Partial<Record<string, Partial<CatalogNumericFields>>>;
  deckLegal?: boolean;
  formatLegal?: boolean;
};

export type CatalogAiApprovalBatch = {
  approvalId: string;
  cardIds: readonly string[];
};

export type DuplicateGateCard = {
  cardId: string;
  firstBatchId: string;
  duplicateBatchId: string;
};

function findDuplicateCards(
  batches: readonly { batchId: string; cardIds: readonly string[] }[],
): readonly DuplicateGateCard[] {
  const firstBatchByCardId = new Map<string, string>();
  const duplicates: DuplicateGateCard[] = [];
  for (const batch of batches) {
    for (const cardId of batch.cardIds) {
      const firstBatchId = firstBatchByCardId.get(cardId);
      if (firstBatchId) {
        duplicates.push({
          cardId,
          firstBatchId,
          duplicateBatchId: batch.batchId,
        });
        continue;
      }
      firstBatchByCardId.set(cardId, batch.batchId);
    }
  }
  return Object.freeze(duplicates);
}

export function findDuplicateRuntimeGateCards(
  batches: readonly CatalogGateBatch[],
): readonly DuplicateGateCard[] {
  return findDuplicateCards(
    batches.map((batch) => ({
      batchId: batch.auditReleaseId,
      cardIds: batch.cardIds,
    })),
  );
}

export function findDuplicateAiApprovalCards(
  batches: readonly CatalogAiApprovalBatch[],
): readonly DuplicateGateCard[] {
  return findDuplicateCards(
    batches.map((batch) => ({
      batchId: batch.approvalId,
      cardIds: batch.cardIds,
    })),
  );
}

export function buildRuntimeCardIds(
  batches: readonly CatalogGateBatch[],
): readonly string[] {
  return Object.freeze(
    batches.flatMap((batch) => [...batch.cardIds]),
  );
}

export function buildAiApprovedCardIds(
  batches: readonly CatalogAiApprovalBatch[],
): readonly string[] {
  return Object.freeze(
    batches.flatMap((batch) => [...batch.cardIds]),
  );
}

export function buildRuntimeGateByCardId(
  batches: readonly CatalogGateBatch[],
): Readonly<Record<string, RuntimeGateEvidence>> {
  return Object.freeze(
    Object.fromEntries(
      batches.flatMap((batch) =>
        batch.cardIds.map((cardId) => [
          cardId,
          {
            cardId,
            engineCardId: cardId,
            runtimeStatus: "human_playable" as const,
            deckLegal: batch.deckLegal ?? true,
            formatLegal: batch.formatLegal ?? batch.deckLegal ?? true,
          },
        ]),
      ),
    ),
  );
}

export function buildAiApprovalByCardId(
  approvedCardIds: Iterable<string>,
): Readonly<Record<string, AiApprovalEvidence>> {
  return Object.freeze(
    Object.fromEntries(
      [...approvedCardIds].map((cardId) => [
        cardId,
        {
          cardId,
          approvalStatus: "ai_supported" as const,
          scenarioGate: true as const,
        },
      ]),
    ),
  );
}

export function buildReleaseEvidenceByCardId(
  batches: readonly CatalogGateBatch[],
): Readonly<Record<string, ReleaseEvidence>> {
  return Object.freeze(
    Object.fromEntries(
      batches.flatMap((batch) =>
        batch.cardIds.map((cardId) => [
          cardId,
          {
            cardId,
            auditReleaseId: batch.auditReleaseId,
            implementationManifest: batch.implementationManifest,
            textOverrides: batch.textOverrides,
            numericOverrides: batch.numericOverrides,
          },
        ]),
      ),
    ),
  );
}

export function buildCardFactsById(
  cardIds: readonly string[],
  runtimeGateByCardId: Readonly<Record<string, RuntimeGateEvidence>>,
  aiApprovalByCardId: Readonly<Record<string, AiApprovalEvidence>>,
  releaseEvidenceByCardId: Readonly<Record<string, ReleaseEvidence>>,
): Readonly<Record<string, CardFactEvidence>> {
  return Object.freeze(
    Object.fromEntries(
      cardIds.map((cardId) => {
        const fact: CardFactEvidence = { cardId };
        const runtimeGate = runtimeGateByCardId[cardId];
        const aiApproval = aiApprovalByCardId[cardId];
        const releaseEvidence = releaseEvidenceByCardId[cardId];
        if (runtimeGate) fact.runtimeGate = runtimeGate;
        if (aiApproval) fact.aiApproval = aiApproval;
        if (releaseEvidence) fact.releaseEvidence = releaseEvidence;
        return [cardId, fact];
      }),
    ),
  );
}
