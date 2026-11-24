import { describe, expect, it } from "vitest";
import { createRuntimeCardsById } from "@netgrid/catalog";
import catalog from "../../../data/decks/standard-deck-catalog-1.0.0.json";
import curation from "../../../data/decks/standard-deck-curation-2026-07-18.json";

describe("Express Shutdown standard deck", () => {
  it("preserves the approved 45-card flatline core, 21 agenda points and standard classification", () => {
    const deck = catalog.decks.find(
      (entry) => entry.standardDeckId === "standard_corp_express_shutdown",
    );
    expect(deck).toMatchObject({
      name: "Express Shutdown",
      version: "1.0.0",
      status: "active",
      side: "corp",
      formatProfileId: "netgrid_private_local_proteus_playtest_v1",
    });
    expect(deck?.cards).toEqual([
      {
        cardId: 62,
        quantity: 3,
      },
      {
        cardId: 408,
        quantity: 3,
      },
      {
        cardId: 424,
        quantity: 1,
      },
      {
        cardId: 514,
        quantity: 3,
      },
      {
        cardId: 513,
        quantity: 3,
      },
      {
        cardId: 496,
        quantity: 3,
      },
      {
        cardId: 518,
        quantity: 2,
      },
      {
        cardId: 552,
        quantity: 3,
      },
      {
        cardId: 557,
        quantity: 3,
      },
      {
        cardId: 502,
        quantity: 3,
      },
      {
        cardId: 507,
        quantity: 3,
      },
      {
        cardId: 493,
        quantity: 3,
      },
      {
        cardId: 473,
        quantity: 3,
      },
      {
        cardId: 491,
        quantity: 3,
      },
      {
        cardId: 90,
        quantity: 3,
      },
      {
        cardId: 96,
        quantity: 3,
      },
    ]);
    expect(deck!.cards.reduce((sum, card) => sum + card.quantity, 0)).toBe(45);
    const cards = createRuntimeCardsById();
    expect(
      deck!.cards.reduce(
        (sum, card) =>
          sum + card.quantity * (cards[card.cardId]?.numeric.agendaPoints ?? 0),
        0,
      ),
    ).toBe(21);
    for (const card of deck!.cards)
      expect(cards[card.cardId], String(card.cardId)).toBeDefined();
    expect(
      curation.localDeckLibrary.entries.find(
        (entry) => entry.standardDeckId === deck!.standardDeckId,
      ),
    ).toMatchObject({ classification: "standard", name: "Express Shutdown" });
  });
});
