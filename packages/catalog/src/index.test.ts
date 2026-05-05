import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import snapshotData from "../../../data/card-import/card-snapshot-0.5.json";
import snapshotData08 from "../../../data/card-import/card-snapshot-0.8.json";
import catalogIndexData from "../../../data/card-import/catalog-index-0.5.json";
import {
  assertCatalogPayloadSafe,
  computeSnapshotHash,
  createCatalogIndex,
  createRuntimeCardsById,
  getCatalogCard,
  ONR_V1_0_5K_RELEASE_CARD_IDS,
  searchCatalog,
  validateSnapshot,
  type CardSnapshot
} from "./index";

const snapshot = snapshotData as CardSnapshot;
const snapshot08 = snapshotData08 as CardSnapshot;

describe("catalog import and status logic", () => {
  it("validates the local V0.5 snapshot", () => {
    expect(validateSnapshot(snapshot)).toEqual({ ok: true, errors: [] });
  });

  it("computes the frozen snapshot hash deterministically", () => {
    expect(computeSnapshotHash(snapshot)).toBe("fnv1a:a85f7985");
  });

  it("recreates the committed catalog index", () => {
    const recreated = createCatalogIndex(snapshot, computeSnapshotHash(snapshot));
    expect(recreated.cards).toEqual(catalogIndexData.cards);
    expect(recreated.byId).toEqual(catalogIndexData.byId);
    expect(recreated.filters).toEqual(catalogIndexData.filters);
    expect(recreated.statusSummary).toEqual(catalogIndexData.statusSummary);
  });

  it("searches and filters without exposing non-catalog data", () => {
    const runnerResults = searchCatalog(snapshot, { q: "run", side: "runner" });
    expect(runnerResults.some((card) => card.catalogCardId === "simple_run_event")).toBe(true);
    expect(runnerResults.every((card) => card.side === "runner")).toBe(true);
    expect(assertCatalogPayloadSafe(runnerResults)).toEqual({ ok: true, errors: [] });
  });

  it("keeps import-only and blocked cards out of playability", () => {
    const importOnly = getCatalogCard(snapshot, "catalog_preview_operation_001");
    expect(importOnly?.statuses.catalog_ready).toBe(true);
    expect(importOnly?.statuses.implemented).toBe(false);
    expect(importOnly?.statuses.playable).toBe(false);
    expect(importOnly?.statuses.deck_legal).toBe(false);

    const blocked = getCatalogCard(snapshot, "catalog_preview_resource_001");
    expect(blocked?.statuses.blocked).toBe(true);
    expect(blocked?.blockReasons.length).toBeGreaterThan(0);
    expect(blocked?.statuses.deck_legal).toBe(false);
  });

  it("validates the V0.8 playable local starter slice without promoting import-only cards", () => {
    expect(validateSnapshot(snapshot08)).toEqual({ ok: true, errors: [] });
    expect(computeSnapshotHash(snapshot08)).toBe("fnv1a:b4c03f20");

    const burst = getCatalogCard(snapshot08, "v08_burst_credit_event");
    expect(burst?.engineCardId).toBe("v08_burst_credit_event");
    expect(burst?.statuses.playable).toBe(true);
    expect(burst?.statuses.deck_legal).toBe(true);
    expect(burst?.implementationManifest?.manifestVersion).toBe("card-implementation-manifest-v0.8");

    const importOnly = getCatalogCard(snapshot08, "catalog_preview_operation_001");
    expect(importOnly?.statuses.playable).toBe(false);
    expect(importOnly?.statuses.deck_legal).toBe(false);
  });

  it("keeps private local O:NR playable deck-legal cards aligned with manifest and review coverage when present", () => {
    const localSnapshotPath = "data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json";
    if (!existsSync(localSnapshotPath)) return;

    const localSnapshot = JSON.parse(readFileSync(localSnapshotPath, "utf8")) as CardSnapshot;
    expect(validateSnapshot(localSnapshot)).toEqual({ ok: true, errors: [] });

    const playableDeckLegal = localSnapshot.cards.filter((card) => card.statuses.playable && card.statuses.deck_legal);
    const missingManifest = playableDeckLegal.filter((card) => !card.implementationManifest).map((card) => card.catalogCardId);
    const missingCoverage = playableDeckLegal
      .filter((card) => {
        const manifest = card.implementationManifest;
        return !manifest || manifest.unitTests.length === 0 || manifest.scenarioTests.length === 0 || manifest.visibilityTests.length === 0 || manifest.replayTests.length === 0;
      })
      .map((card) => card.catalogCardId);
    const reviewFiles = [
      "data/local/card-import/onr-v1-limited/agenda-implementation-review.local.md",
      "data/local/card-import/onr-v1-limited/asset-implementation-review.local.md",
      "data/local/card-import/onr-v1-limited/agenda-text-review.local.md",
      "data/local/card-import/onr-v1-limited/asset-text-review.local.md"
    ];

    expect(playableDeckLegal.length).toBeGreaterThan(0);
    expect(missingManifest).toEqual([]);
    expect(missingCoverage).toEqual([]);
    expect(reviewFiles.filter((file) => existsSync(file))).toHaveLength(reviewFiles.length);
  });

  it("applies the V1.0.5K release gate to private local O:NR runtime cards when present", () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_015_codeslinger"]) return;

    expect(ONR_V1_0_5K_RELEASE_CARD_IDS).toHaveLength(12);
    for (const cardId of ONR_V1_0_5K_RELEASE_CARD_IDS) {
      const card = cardsById[cardId];
      expect(card, cardId).toBeDefined();
      expect(card?.engineCardId).toBe(cardId);
      expect(card?.statuses.implemented).toBe(true);
      expect(card?.statuses.playable).toBe(true);
      expect(card?.statuses.deck_legal).toBe(true);
      expect(card?.implementationManifest?.manifestVersion).toBe("card-implementation-manifest-v1.0.5k");
      expect(card?.implementationManifest?.unitTests.length).toBeGreaterThan(0);
      expect(card?.implementationManifest?.scenarioTests.length).toBeGreaterThan(0);
      expect(card?.implementationManifest?.visibilityTests.length).toBeGreaterThan(0);
      expect(card?.implementationManifest?.replayTests.length).toBeGreaterThan(0);
    }

    expect(cardsById["onr_v1_237_data-wall"]?.numeric.strength).toBe(1);
    expect(cardsById["onr_v1_238_data-wall-2-0"]?.numeric.strength).toBe(3);
    expect(cardsById["onr_v1_239_endless-corridor"]?.numeric.strength).toBe(4);
    expect(cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.statuses.deck_legal).toBe(false);
    expect(cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.engineCardId).toBeNull();
  });
});
