import { describe, expect, it } from "vitest";
import {
  CATALOG_AI_HINT_FILTERS,
  CATALOG_BLOCK_STATUS_FILTERS,
  catalogSetDetailLabel,
  catalogRarityLabel,
  catalogSetFilterOptions,
  catalogSetKeyForCard,
  catalogProductSetKeyForCard,
  catalogSetShortLabelForSetId,
  filterCatalogCardsByBlockStatus,
  filterCatalogCardsByAiHint,
  filterCatalogCardsBySetId,
  filterCatalogCardsByProductSets,
  filterCatalogCardsByRarity,
  filterCatalogCardsBySet,
  filterCatalogCardsByType,
  nextCatalogSelection,
  summarizeCatalogBlockStatusFilters,
  summarizeCatalogAiHintFilters,
  summarizeCatalogRarityFilters,
  summarizeCatalogProductSets,
  summarizeCatalogSetFilters,
  type CatalogAiHintFilterKey,
  type CatalogBlockStatusFilterKey,
  type CatalogTypeFilterState,
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
  program: true,
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
  program: false,
};

describe("catalog UI filtering", () => {
  it("does not select a card when status results are excluded by the active type filters", () => {
    const cards = [
      { catalogCardId: 9155, type: "event", subtypes: [] },
      { catalogCardId: 9156, type: "ice", subtypes: [] },
    ];

    expect(nextCatalogSelection(null, filterCatalogCardsByType(cards, noTypes)))
      .toBeNull();
  });

  it("keeps or picks only cards visible through type filters", () => {
    const cards = [
      { catalogCardId: 9155, type: "event", subtypes: [] },
      { catalogCardId: 9156, type: "ice", subtypes: [] },
    ];
    const onlyIce = { ...noTypes, ice: true };

    const visibleIce = filterCatalogCardsByType(cards, onlyIce);
    expect(nextCatalogSelection(9155, visibleIce)).toBe(9156);
    expect(nextCatalogSelection(9156, visibleIce)).toBe(9156);
    expect(nextCatalogSelection(null, filterCatalogCardsByType(cards, allTypes)))
      .toBe(9155);
  });

  it("separates original cards from local test cards in the deck editor source filter", () => {
    const cards = [
      { catalogCardId: 9157, setId: "onr-v1-limited-private-local" },
      { catalogCardId: 9158, setId: "originalset-v1" },
      { catalogCardId: 9159, setId: "testset-v1" },
      { catalogCardId: 9160, setId: "mvp-0.8-demo" },
      { catalogCardId: 9188, setId: "proteus-v1" },
      { catalogCardId: 9162, setId: "future-private-set" },
    ];

    expect(catalogSetKeyForCard(cards[0]!)).toBe("original");
    expect(catalogSetKeyForCard(cards[1]!)).toBe("original");
    expect(catalogSetKeyForCard(cards[2]!)).toBe("test");
    expect(catalogSetKeyForCard(cards[3]!)).toBe("test");
    expect(catalogSetKeyForCard(cards[4]!)).toBe("other");
    expect(catalogSetKeyForCard(cards[5]!)).toBe("other");
    expect(
      filterCatalogCardsBySet(cards, "original").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9157, 9158]);
    expect(
      filterCatalogCardsBySet(cards, "test").map((card) => card.catalogCardId),
    ).toEqual([9159, 9160]);
    expect(summarizeCatalogSetFilters(cards)).toEqual({
      all: 6,
      original: 2,
      test: 2,
      other: 2,
    });
  });

  it("keeps originalset filtering composable with search and type filters", () => {
    const cards = [
      {
        catalogCardId: 9163,
        title: "Original Ice",
        setId: "originalset-v1",
        type: "ice",
        subtypes: [],
      },
      {
        catalogCardId: 9164,
        title: "Original Event",
        setId: "originalset-v1",
        type: "event",
        subtypes: [],
      },
      {
        catalogCardId: 9165,
        title: "Original Test Ice",
        setId: "testset-v1",
        type: "ice",
        subtypes: [],
      },
      {
        catalogCardId: 9166,
        title: "Original Proteus Ice",
        setId: "proteus-v1",
        type: "ice",
        subtypes: [],
      },
    ];
    const onlyIce = { ...noTypes, ice: true };
    const originalCards = filterCatalogCardsBySet(cards, "original");
    const searchedCards = originalCards.filter((card) =>
      card.title.toLowerCase().includes("original"),
    );

    expect(
      filterCatalogCardsByType(searchedCards, onlyIce).map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9163]);
  });

  it("filters Originalset, Classic and Proteus independently", () => {
    const cards = [
      { catalogCardId: 9187, setId: "originalset-v1" },
      { catalogCardId: 9186, setId: "classic-v1" },
      { catalogCardId: 9188, setId: "proteus-v1" },
      { catalogCardId: 9177, setId: "testset-v1" },
      { catalogCardId: 9181, setId: "future-private-set" },
    ];

    expect(cards.map(catalogProductSetKeyForCard)).toEqual([
      "original",
      "classic",
      "proteus",
      "unsupported",
      "unsupported",
    ]);
    expect(
      filterCatalogCardsByProductSets(cards, {
        original: true,
        classic: false,
        proteus: false,
      }).map((card) => card.catalogCardId),
    ).toEqual([9187]);
    expect(
      filterCatalogCardsByProductSets(cards, {
        original: true,
        classic: true,
        proteus: false,
      }).map((card) => card.catalogCardId),
    ).toEqual([9187, 9186]);
    expect(
      filterCatalogCardsByProductSets(cards, {
        original: true,
        classic: true,
        proteus: true,
      }).map((card) => card.catalogCardId),
    ).toEqual([9187, 9186, 9188]);
    expect(
      filterCatalogCardsByProductSets(cards, {
        original: false,
        classic: false,
        proteus: true,
      }).map((card) => card.catalogCardId),
    ).toEqual([9188]);
    expect(summarizeCatalogProductSets(cards)).toEqual({
      original: 1,
      classic: 1,
      proteus: 1,
      unsupported: 2,
    });
  });

  it("builds dynamic catalog set filters from concrete set ids", () => {
    const cards = [
      { catalogCardId: 9187, setId: "originalset-v1" },
      { catalogCardId: 9173, setId: "proteus" },
      { catalogCardId: 9174, setId: "proteus" },
      { catalogCardId: 9186, setId: "classic-v1" },
      { catalogCardId: 9176, setId: "android-custom-alpha" },
      { catalogCardId: 9177, setId: "testset" },
    ];

    expect(catalogSetFilterOptions(cards)).toEqual([
      { key: "all", label: "Alle Sets", count: 6 },
      { key: "android-custom-alpha", label: "Android: Netrunner", count: 1 },
      { key: "classic-v1", label: "Classic", count: 1 },
      { key: "originalset-v1", label: "Original Version 1", count: 1 },
      { key: "proteus", label: "Proteus", count: 2 },
      { key: "testset", label: "Testkarten", count: 1 },
    ]);
    expect(
      filterCatalogCardsBySetId(cards, "proteus").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9173, 9174]);
    expect(filterCatalogCardsBySetId(cards, "all")).toEqual(cards);
  });

  it("formats compact and detailed set display labels", () => {
    expect(catalogSetShortLabelForSetId("originalset-v1")).toBe("OV1");
    expect(catalogSetShortLabelForSetId("onr-v1-limited-private-local")).toBe(
      "OV1",
    );
    expect(catalogSetShortLabelForSetId("proteus-v1")).toBe("PRO");
    expect(catalogSetShortLabelForSetId("classic-v1")).toBe("CLS");
    expect(catalogSetShortLabelForSetId("testset-v1")).toBe("TEST");
    expect(catalogSetShortLabelForSetId("custom-private-alpha")).toBe("CPA");
    expect(
      catalogSetDetailLabel({
        setId: "proteus-v1",
        setName: "Proteus",
        collectorNumber: "P001",
      }),
    ).toBe("Proteus #P001");
    expect(
      catalogSetDetailLabel({
        setId: "originalset-v1",
        collectorNumber: "219",
      }),
    ).toBe("Original Version 1 #219");
    expect(catalogSetDetailLabel({ setId: "" })).toBeNull();
  });

  it("filters and summarizes rarity metadata without breaking cards that have no rarity", () => {
    const cards = [
      {
        catalogCardId: 9178,
        rarity: { code: "common", labelDe: "Common from payload" },
      },
      {
        catalogCardId: 9179,
        rarity: { code: "rare", labelDe: "Rare from payload" },
      },
      { catalogCardId: 9180 },
      { catalogCardId: 9181, rarity: { code: "promo", labelDe: "Promo" } },
    ];

    expect(
      filterCatalogCardsByRarity(cards, "common").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9178]);
    expect(
      filterCatalogCardsByRarity(cards, "rare").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9179]);
    expect(
      filterCatalogCardsByRarity(cards, "all").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9178, 9179, 9180, 9181]);
    expect(summarizeCatalogRarityFilters(cards)).toEqual({
      all: 4,
      common: 1,
      uncommon: 0,
      rare: 1,
      vital: 0,
    });
    expect(catalogRarityLabel(cards[0]!)).toBe("Häufig");
    expect(catalogRarityLabel(cards[3]!)).toBe("Promo");
    expect(catalogRarityLabel(cards[2]!)).toBeNull();
  });

  it("filters cards by AI hint inspector coverage", () => {
    const cards = [
      {
        catalogCardId: 9182,
        aiInspectorSummary: {
          available: true,
          aiSupportStatus: "ai_supported",
          hintFound: true,
          mechanicalFactsFound: true,
          hasClassifications: true,
          hasWarnings: false,
        },
      },
      {
        catalogCardId: 9183,
        aiInspectorSummary: {
          available: true,
          aiSupportStatus: "ai_supported",
          hintFound: true,
          mechanicalFactsFound: true,
          hasClassifications: true,
          hasWarnings: true,
        },
      },
      {
        catalogCardId: 9184,
        aiInspectorSummary: {
          available: true,
          aiSupportStatus: "ai_supported",
          hintFound: true,
          mechanicalFactsFound: false,
          hasClassifications: true,
          hasWarnings: false,
        },
      },
      { catalogCardId: 9185, aiInspectorSummary: null },
    ];

    expect(
      filterCatalogCardsByAiHint(cards, "new_facts").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9182, 9183]);
    expect(
      filterCatalogCardsByAiHint(cards, "warnings").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9183]);
    expect(
      filterCatalogCardsByAiHint(cards, "missing").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9185]);
    expect(summarizeCatalogAiHintFilters(cards)).toEqual({
      all: 4,
      new_facts: 2,
      warnings: 1,
      missing: 1,
    });
    expect(CATALOG_AI_HINT_FILTERS.map((filter) => filter.key)).toEqual([
      "all",
      "new_facts",
      "warnings",
      "missing",
    ] satisfies CatalogAiHintFilterKey[]);
  });

  it("filters cards by block status", () => {
    const cards = [
      { catalogCardId: 9186, statuses: { blocked: true } },
      { catalogCardId: 9187, statuses: { blocked: false } },
      { catalogCardId: 9188, statuses: { blocked: false } },
    ];

    expect(
      filterCatalogCardsByBlockStatus(cards, "all").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9186, 9187, 9188]);
    expect(
      filterCatalogCardsByBlockStatus(cards, "blocked").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9186]);
    expect(
      filterCatalogCardsByBlockStatus(cards, "not_blocked").map(
        (card) => card.catalogCardId,
      ),
    ).toEqual([9187, 9188]);
    expect(summarizeCatalogBlockStatusFilters(cards)).toEqual({
      all: 3,
      not_blocked: 2,
      blocked: 1,
    });
    expect(CATALOG_BLOCK_STATUS_FILTERS.map((filter) => filter.key)).toEqual([
      "all",
      "not_blocked",
      "blocked",
    ] satisfies CatalogBlockStatusFilterKey[]);
  });
});
