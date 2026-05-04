import { describe, expect, it } from "vitest";
import snapshotData from "../../../data/card-import/card-snapshot-0.5.json";
import snapshotData08 from "../../../data/card-import/card-snapshot-0.8.json";
import catalogIndexData from "../../../data/card-import/catalog-index-0.5.json";
import {
  assertCatalogPayloadSafe,
  computeSnapshotHash,
  createCatalogIndex,
  getCatalogCard,
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
});
