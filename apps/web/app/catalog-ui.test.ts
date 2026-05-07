import { describe, expect, it } from "vitest";
import { catalogSetKeyForCard, filterCatalogCardsBySet, nextCatalogSelection, summarizeCatalogSetFilters, type CatalogTypeFilterState } from "./catalog-ui";

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
      { catalogCardId: "demo", setId: "mvp-0.8-demo" },
      { catalogCardId: "future", setId: "future-private-set" }
    ];

    expect(catalogSetKeyForCard(cards[0]!)).toBe("original");
    expect(catalogSetKeyForCard(cards[1]!)).toBe("test");
    expect(catalogSetKeyForCard(cards[2]!)).toBe("other");
    expect(filterCatalogCardsBySet(cards, "original").map((card) => card.catalogCardId)).toEqual(["onr"]);
    expect(filterCatalogCardsBySet(cards, "test").map((card) => card.catalogCardId)).toEqual(["demo"]);
    expect(summarizeCatalogSetFilters(cards)).toEqual({ all: 3, original: 1, test: 1, other: 1 });
  });
});
