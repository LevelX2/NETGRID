import { describe, expect, it } from "vitest";
import {
  CATALOG_AI_HINT_FILTERS,
  CATALOG_BLOCK_STATUS_FILTERS,
  catalogSetDetailLabel,
  catalogRarityLabel,
  catalogSetFilterOptions,
  catalogSetKeyForCard,
  catalogSetShortLabelForSetId,
  filterCatalogCardsByBlockStatus,
  filterCatalogCardsByAiHint,
  filterCatalogCardsBySetId,
  filterCatalogCardsByRarity,
  filterCatalogCardsBySet,
  filterCatalogCardsByType,
  nextCatalogSelection,
  summarizeCatalogBlockStatusFilters,
  summarizeCatalogAiHintFilters,
  summarizeCatalogRarityFilters,
  summarizeCatalogSetFilters,
  type CatalogAiHintFilterKey,
  type CatalogBlockStatusFilterKey,
  type CatalogTypeFilterState
} from "./catalog-ui";

const allTypes: CatalogTypeFilterState = {
  ice: true,
  agenda: true,
  icebreaker: true,
  asset: true,
  upgrade: true,
  operation: true,
  event: true,
  hardware: true,
  resource: true,
  program: true
};

const noTypes: CatalogTypeFilterState = {
  ice: false,
  agenda: false,
  icebreaker: false,
  asset: false,
  upgrade: false,
  operation: false,
  event: false,
  hardware: false,
  resource: false,
  program: false
};

describe("catalog UI filtering", () => {
  it("does not select a card when status results are excluded by the active type filters", () => {
    const cards = [
      { catalogCardId: "implemented_event", type: "event", subtypes: [] },
      { catalogCardId: "implemented_ice", type: "ice", subtypes: [] }
    ];

    expect(nextCatalogSelection(null, cards, noTypes)).toBeNull();
  });

  it("keeps or picks only cards visible through type filters", () => {
    const cards = [
      { catalogCardId: "implemented_event", type: "event", subtypes: [] },
      { catalogCardId: "implemented_ice", type: "ice", subtypes: [] }
    ];
    const onlyIce = { ...noTypes, ice: true };

    expect(nextCatalogSelection("implemented_event", cards, onlyIce)).toBe("implemented_ice");
    expect(nextCatalogSelection("implemented_ice", cards, onlyIce)).toBe("implemented_ice");
    expect(nextCatalogSelection(null, cards, allTypes)).toBe("implemented_event");
  });

  it("separates original cards from local test cards in the deck editor source filter", () => {
    const cards = [
      { catalogCardId: "onr", setId: "onr-v1-limited-private-local" },
      { catalogCardId: "originalset", setId: "originalset-v1" },
      { catalogCardId: "testset", setId: "testset-v1" },
      { catalogCardId: "demo", setId: "mvp-0.8-demo" },
      { catalogCardId: "proteus", setId: "proteus-v1" },
      { catalogCardId: "future", setId: "future-private-set" }
    ];

    expect(catalogSetKeyForCard(cards[0]!)).toBe("original");
    expect(catalogSetKeyForCard(cards[1]!)).toBe("original");
    expect(catalogSetKeyForCard(cards[2]!)).toBe("test");
    expect(catalogSetKeyForCard(cards[3]!)).toBe("test");
    expect(catalogSetKeyForCard(cards[4]!)).toBe("other");
    expect(catalogSetKeyForCard(cards[5]!)).toBe("other");
    expect(filterCatalogCardsBySet(cards, "original").map((card) => card.catalogCardId)).toEqual(["onr", "originalset"]);
    expect(filterCatalogCardsBySet(cards, "test").map((card) => card.catalogCardId)).toEqual(["testset", "demo"]);
    expect(summarizeCatalogSetFilters(cards)).toEqual({ all: 6, original: 2, test: 2, other: 2 });
  });

  it("keeps originalset filtering composable with search and type filters", () => {
    const cards = [
      { catalogCardId: "original_ice", title: "Original Ice", setId: "originalset-v1", type: "ice", subtypes: [] },
      { catalogCardId: "original_event", title: "Original Event", setId: "originalset-v1", type: "event", subtypes: [] },
      { catalogCardId: "test_ice", title: "Original Test Ice", setId: "testset-v1", type: "ice", subtypes: [] },
      { catalogCardId: "proteus_ice", title: "Original Proteus Ice", setId: "proteus-v1", type: "ice", subtypes: [] }
    ];
    const onlyIce = { ...noTypes, ice: true };
    const originalCards = filterCatalogCardsBySet(cards, "original");
    const searchedCards = originalCards.filter((card) => card.title.toLowerCase().includes("original"));

    expect(filterCatalogCardsByType(searchedCards, onlyIce).map((card) => card.catalogCardId)).toEqual(["original_ice"]);
  });

  it("builds dynamic catalog set filters from concrete set ids", () => {
    const cards = [
      { catalogCardId: "original", setId: "originalset-v1" },
      { catalogCardId: "proteus_a", setId: "proteus" },
      { catalogCardId: "proteus_b", setId: "proteus" },
      { catalogCardId: "classic", setId: "classic-v1" },
      { catalogCardId: "custom", setId: "android-custom-alpha" },
      { catalogCardId: "test", setId: "testset" }
    ];

    expect(catalogSetFilterOptions(cards)).toEqual([
      { key: "all", label: "Alle Sets", count: 6 },
      { key: "android-custom-alpha", label: "Android: Netrunner", count: 1 },
      { key: "classic-v1", label: "Classic", count: 1 },
      { key: "originalset-v1", label: "Original Version 1", count: 1 },
      { key: "proteus", label: "Proteus", count: 2 },
      { key: "testset", label: "Testkarten", count: 1 }
    ]);
    expect(filterCatalogCardsBySetId(cards, "proteus").map((card) => card.catalogCardId)).toEqual(["proteus_a", "proteus_b"]);
    expect(filterCatalogCardsBySetId(cards, "all")).toEqual(cards);
  });

  it("formats compact and detailed set display labels", () => {
    expect(catalogSetShortLabelForSetId("originalset-v1")).toBe("OV1");
    expect(catalogSetShortLabelForSetId("onr-v1-limited-private-local")).toBe("OV1");
    expect(catalogSetShortLabelForSetId("proteus-v1")).toBe("PRO");
    expect(catalogSetShortLabelForSetId("classic-v1")).toBe("CLS");
    expect(catalogSetShortLabelForSetId("testset-v1")).toBe("TEST");
    expect(catalogSetShortLabelForSetId("custom-private-alpha")).toBe("CPA");
    expect(catalogSetDetailLabel({ setId: "proteus-v1", setName: "Proteus", collectorNumber: "P001" })).toBe("Proteus #P001");
    expect(catalogSetDetailLabel({ setId: "originalset-v1", collectorNumber: "219" })).toBe("Original Version 1 #219");
    expect(catalogSetDetailLabel({ setId: "" })).toBeNull();
  });

  it("filters and summarizes rarity metadata without breaking cards that have no rarity", () => {
    const cards = [
      { catalogCardId: "common", rarity: { code: "common", labelDe: "Common from payload" } },
      { catalogCardId: "rare", rarity: { code: "rare", labelDe: "Rare from payload" } },
      { catalogCardId: "missing" },
      { catalogCardId: "unknown", rarity: { code: "promo", labelDe: "Promo" } }
    ];

    expect(filterCatalogCardsByRarity(cards, "common").map((card) => card.catalogCardId)).toEqual(["common"]);
    expect(filterCatalogCardsByRarity(cards, "rare").map((card) => card.catalogCardId)).toEqual(["rare"]);
    expect(filterCatalogCardsByRarity(cards, "all").map((card) => card.catalogCardId)).toEqual(["common", "rare", "missing", "unknown"]);
    expect(summarizeCatalogRarityFilters(cards)).toEqual({ all: 4, common: 1, uncommon: 0, rare: 1, vital: 0 });
    expect(catalogRarityLabel(cards[0]!)).toBe("Häufig");
    expect(catalogRarityLabel(cards[3]!)).toBe("Promo");
    expect(catalogRarityLabel(cards[2]!)).toBeNull();
  });

  it("filters cards by AI hint inspector coverage", () => {
    const cards = [
      {
        catalogCardId: "new",
        aiInspectorSummary: {
          available: true,
          aiSupportStatus: "ai_supported",
          compiledHintFound: true,
          mechanicalFactsFound: true,
          generatedFactsFound: false,
          hasClassifications: true,
          hasWarnings: false
        }
      },
      {
        catalogCardId: "generated",
        aiInspectorSummary: {
          available: true,
          aiSupportStatus: "ai_supported",
          compiledHintFound: true,
          mechanicalFactsFound: true,
          generatedFactsFound: true,
          hasClassifications: true,
          hasWarnings: true
        }
      },
      {
        catalogCardId: "legacy-only",
        aiInspectorSummary: {
          available: true,
          aiSupportStatus: "ai_supported",
          compiledHintFound: true,
          mechanicalFactsFound: false,
          generatedFactsFound: false,
          hasClassifications: true,
          hasWarnings: false
        }
      },
      { catalogCardId: "blocked", aiInspectorSummary: null }
    ];

    expect(filterCatalogCardsByAiHint(cards, "new_facts").map((card) => card.catalogCardId)).toEqual(["new", "generated"]);
    expect(filterCatalogCardsByAiHint(cards, "generated_facts").map((card) => card.catalogCardId)).toEqual(["generated"]);
    expect(filterCatalogCardsByAiHint(cards, "warnings").map((card) => card.catalogCardId)).toEqual(["generated"]);
    expect(filterCatalogCardsByAiHint(cards, "missing").map((card) => card.catalogCardId)).toEqual(["blocked"]);
    expect(summarizeCatalogAiHintFilters(cards)).toEqual({ all: 4, new_facts: 2, generated_facts: 1, warnings: 1, missing: 1 });
    expect(CATALOG_AI_HINT_FILTERS.map((filter) => filter.key)).toEqual([
      "all",
      "new_facts",
      "generated_facts",
      "warnings",
      "missing",
    ] satisfies CatalogAiHintFilterKey[]);
  });

  it("filters cards by block status", () => {
    const cards = [
      { catalogCardId: "classic", statuses: { blocked: true } },
      { catalogCardId: "original", statuses: { blocked: false } },
      { catalogCardId: "proteus", statuses: { blocked: false } }
    ];

    expect(filterCatalogCardsByBlockStatus(cards, "all").map((card) => card.catalogCardId)).toEqual(["classic", "original", "proteus"]);
    expect(filterCatalogCardsByBlockStatus(cards, "blocked").map((card) => card.catalogCardId)).toEqual(["classic"]);
    expect(filterCatalogCardsByBlockStatus(cards, "not_blocked").map((card) => card.catalogCardId)).toEqual(["original", "proteus"]);
    expect(summarizeCatalogBlockStatusFilters(cards)).toEqual({ all: 3, not_blocked: 2, blocked: 1 });
    expect(CATALOG_BLOCK_STATUS_FILTERS.map((filter) => filter.key)).toEqual([
      "all",
      "not_blocked",
      "blocked"
    ] satisfies CatalogBlockStatusFilterKey[]);
  });
});
