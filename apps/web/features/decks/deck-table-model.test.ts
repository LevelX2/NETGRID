import { describe, expect, it } from "vitest";

import {
  deckTableNumericSortValue,
  deckTableSortKeysForSide,
  deckTableSortRequiresDetails,
  normalizeDeckTableLayout,
  type DeckTableSortKey,
  type EditableDeck,
} from "./deck-table-model";

const ICE = [
  ["filter", "Filter", 0, 0],
  ["data-wall", "Data Wall", 1, 0],
  ["sleeper", "Sleeper", 1, 1],
  ["data-wall-2", "Data Wall 2.0", 2, 1],
  ["quandary", "Quandary", 2, 2],
  ["wall-of-static", "Wall of Static", 3, 2],
  ["asp", "Asp", 4, 4],
  ["keeper", "Keeper", 4, 4],
] as const;

const cardLookup = new Map(
  ICE.map(([cardId, title]) => [
    cardId,
    { side: "corp" as const, title, type: "ice", subtypes: [] },
  ]),
);
const detailsById = Object.fromEntries(
  ICE.map(([cardId, , rezCost, strength]) => [
    cardId,
    { type: "ice", numeric: { rezCost, strength } },
  ]),
);

function deck(sortMode: DeckTableSortKey): EditableDeck {
  const alphabeticalIds = [...ICE]
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([cardId]) => cardId);
  return {
    deckId: "sort-test",
    deckVersion: "test",
    name: "Sort test",
    side: "corp",
    identityCardId: "identity",
    cardPoolSnapshotId: "snapshot",
    formatProfileId: "profile",
    cards: alphabeticalIds.map((cardId) => ({ cardId, quantity: 1 })),
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-07-19T00:00:00.000Z",
    tableLayout: {
      schemaVersion: "deck-table-layout-v0.1",
      showPileNames: true,
      piles: [
        {
          id: "ice",
          name: "ICE",
          order: 0,
          sortMode,
          entries: alphabeticalIds.map((cardId, order) => ({
            cardId,
            quantity: 1,
            order,
          })),
        },
      ],
    },
  };
}

function sortedIds(
  sortMode: DeckTableSortKey,
  details = detailsById,
): string[] {
  return normalizeDeckTableLayout(
    deck(sortMode),
    cardLookup,
    details,
  ).piles[0]!.entries.map((entry) => entry.cardId);
}

describe("deck table numeric sorting", () => {
  it("sorts ICE by rez cost with deterministic title tie-breaks", () => {
    expect(sortedIds("rez")).toEqual([
      "filter",
      "data-wall",
      "sleeper",
      "data-wall-2",
      "quandary",
      "wall-of-static",
      "asp",
      "keeper",
    ]);
  });

  it("sorts ICE by strength with deterministic title tie-breaks", () => {
    expect(sortedIds("strength")).toEqual([
      "data-wall",
      "filter",
      "data-wall-2",
      "sleeper",
      "quandary",
      "wall-of-static",
      "asp",
      "keeper",
    ]);
  });

  it("reapplies the chosen numeric sort when late details arrive", () => {
    expect(sortedIds("rez", {})).toEqual([
      "asp",
      "data-wall",
      "data-wall-2",
      "filter",
      "keeper",
      "quandary",
      "sleeper",
      "wall-of-static",
    ]);
    expect(sortedIds("rez")).toEqual([
      "filter",
      "data-wall",
      "sleeper",
      "data-wall-2",
      "quandary",
      "wall-of-static",
      "asp",
      "keeper",
    ]);
  });

  it("offers side-appropriate numeric sort fields", () => {
    expect(deckTableSortKeysForSide("corp")).toEqual([
      "name",
      "type",
      "rez",
      "trash",
      "cost",
      "strength",
      "agenda",
    ]);
    expect(deckTableSortKeysForSide("runner")).toEqual([
      "name",
      "type",
      "install",
      "cost",
      "strength",
    ]);
  });

  it("marks numeric sorts as detail-dependent and exposes their active value", () => {
    expect(deckTableSortRequiresDetails("name")).toBe(false);
    expect(deckTableSortRequiresDetails("rez")).toBe(true);
    expect(deckTableNumericSortValue("rez", detailsById.filter)).toBe(0);
    expect(deckTableNumericSortValue("install", detailsById.filter)).toBeNull();
  });

  it("normalizes a misleading Corp install sort to name", () => {
    const layout = normalizeDeckTableLayout(
      deck("install"),
      cardLookup,
      detailsById,
    );
    expect(layout.piles[0]!.sortMode).toBe("name");
  });
});
