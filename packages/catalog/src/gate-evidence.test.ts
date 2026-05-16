import { describe, expect, it } from "vitest";
import {
  CATALOG_AI_APPROVAL_BATCHES,
  CATALOG_GATE_BATCHES,
  ONR_V1_RUNTIME_RELEASE_CARD_IDS,
} from "./catalog-gates";
import {
  activeAiApprovedCardIds,
  activeRuntimeCardIds,
  aiApprovalByCardId,
  cardFactsById,
  releaseEvidenceByCardId,
  runtimeGateByCardId,
} from "./index";
import {
  buildAiApprovedCardIds,
  buildAiApprovalByCardId,
  buildCardFactsById,
  buildReleaseEvidenceByCardId,
  buildRuntimeCardIds,
  buildRuntimeGateByCardId,
  findDuplicateAiApprovalCards,
  findDuplicateRuntimeGateCards,
  type CatalogAiApprovalBatch,
  type CatalogGateBatch,
} from "./gate-evidence";

const REQUIRED_MANIFEST_FIELDS = [
  "manifestVersion",
  "status",
  "unitTests",
  "scenarioTests",
  "visibilityTests",
  "replayTests",
] as const;

const testManifest = {
  manifestVersion: "card-implementation-manifest-test",
  status: "test",
  unitTests: ["unit"],
  scenarioTests: ["scenario"],
  visibilityTests: ["visibility"],
  replayTests: ["replay"],
};

describe("catalog gate evidence builders", () => {
  it("builds runtime, AI and release facts from fachliche gate batches", () => {
    const batches: CatalogGateBatch[] = [
      {
        auditReleaseId: "test-gate",
        cardIds: ["card_a", "card_b"],
        implementationManifest: testManifest,
        textOverrides: { card_a: "Display text" },
        numericOverrides: { card_b: { cost: 2 } },
      },
    ];
    const aiBatches: CatalogAiApprovalBatch[] = [
      { approvalId: "test-ai-gate", cardIds: ["card_b"] },
    ];
    const runtimeIds = buildRuntimeCardIds(batches);
    const aiIds = buildAiApprovedCardIds(aiBatches);
    const runtime = buildRuntimeGateByCardId(batches);
    const ai = buildAiApprovalByCardId(aiIds);
    const release = buildReleaseEvidenceByCardId(batches);
    const facts = buildCardFactsById(runtimeIds, runtime, ai, release);

    expect(runtimeIds).toEqual(["card_a", "card_b"]);
    expect(aiIds).toEqual(["card_b"]);
    expect(runtime.card_a).toMatchObject({
      engineCardId: "card_a",
      runtimeStatus: "human_playable",
      deckLegal: true,
      formatLegal: true,
    });
    expect(ai.card_b?.approvalStatus).toBe("ai_supported");
    expect(release.card_a?.textOverrides.card_a).toBe("Display text");
    expect(release.card_b?.numericOverrides.card_b?.cost).toBe(2);
    expect(facts.card_a?.aiApproval).toBeUndefined();
    expect(facts.card_b?.aiApproval?.scenarioGate).toBe(true);
  });

  it("keeps catalog gate audit data in a dedicated batch module", () => {
    expect(buildRuntimeCardIds(CATALOG_GATE_BATCHES)).toEqual(
      ONR_V1_RUNTIME_RELEASE_CARD_IDS,
    );
    expect(CATALOG_GATE_BATCHES.every((batch) => batch.auditReleaseId)).toBe(
      true,
    );
    expect(CATALOG_AI_APPROVAL_BATCHES.every((batch) => batch.approvalId)).toBe(
      true,
    );
  });

  it("validates active catalog gates from evidence instead of release import lists", () => {
    const runtimeIdsFromEvidence = buildRuntimeCardIds(CATALOG_GATE_BATCHES);
    const aiIdsFromEvidence = buildAiApprovedCardIds(
      CATALOG_AI_APPROVAL_BATCHES,
    );
    const runtimeSet = new Set(activeRuntimeCardIds);

    const missingManifestFields = CATALOG_GATE_BATCHES.flatMap((batch) =>
      REQUIRED_MANIFEST_FIELDS.filter((field) => {
        const value = batch.implementationManifest[field];
        return Array.isArray(value) ? value.length === 0 : !value;
      }).map((field) => `${batch.auditReleaseId}:${field}`),
    );
    const aiCardsWithoutRuntimeGate = activeAiApprovedCardIds.filter(
      (cardId) => !runtimeSet.has(cardId),
    );
    const runtimeCardsWithoutFacts = activeRuntimeCardIds.filter(
      (cardId) =>
        !runtimeGateByCardId[cardId] ||
        !releaseEvidenceByCardId[cardId] ||
        !cardFactsById[cardId]?.runtimeGate ||
        !cardFactsById[cardId]?.releaseEvidence,
    );
    const aiCardsWithoutFacts = activeAiApprovedCardIds.filter(
      (cardId) =>
        !aiApprovalByCardId[cardId] || !cardFactsById[cardId]?.aiApproval,
    );

    expect(findDuplicateRuntimeGateCards(CATALOG_GATE_BATCHES)).toEqual([]);
    expect(findDuplicateAiApprovalCards(CATALOG_AI_APPROVAL_BATCHES)).toEqual(
      [],
    );
    expect(missingManifestFields).toEqual([]);
    expect(runtimeIdsFromEvidence).toEqual(activeRuntimeCardIds);
    expect(aiIdsFromEvidence).toEqual(activeAiApprovedCardIds);
    expect(
      aiCardsWithoutRuntimeGate.filter(
        (cardId) => !cardFactsById[cardId]?.aiApproval,
      ),
    ).toEqual([]);
    expect(runtimeCardsWithoutFacts).toEqual([]);
    expect(aiCardsWithoutFacts).toEqual([]);
  });
});
