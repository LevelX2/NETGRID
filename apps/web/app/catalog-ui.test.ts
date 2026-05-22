import { describe, expect, it } from "vitest";
import {
  catalogRarityLabel,
  catalogSetKeyForCard,
  filterCatalogCardsByRarity,
  filterCatalogCardsBySet,
  filterCatalogCardsByType,
  nextCatalogSelection,
  summarizeCatalogRarityFilters,
  summarizeCatalogSetFilters,
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
});
