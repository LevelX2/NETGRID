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
        cardId: "onr_proteus_004_fetal-ai",
        quantity: 3,
      },
      {
        cardId: "onr_v1_196_corporate-war",
        quantity: 3,
      },
      {
        cardId: "onr_v1_212_priority-requisition",
        quantity: 1,
      },
      {
        cardId: "onr_v1_302_scorched-earth",
        quantity: 3,
      },
      {
        cardId: "onr_v1_301_punitive-counterstrike",
        quantity: 3,
      },
      {
        cardId: "onr_v1_284_chance-observation",
        quantity: 3,
      },
      {
        cardId: "onr_v1_306_trojan-horse",
        quantity: 2,
      },
      {
        cardId: "onr_v1_340_setup",
        quantity: 3,
      },
      {
        cardId: "onr_v1_345_trap",
        quantity: 3,
      },
      {
        cardId: "onr_v1_290_efficiency-experts",
        quantity: 3,
      },
      {
        cardId: "onr_v1_295_night-shift",
        quantity: 3,
      },
      {
        cardId: "onr_v1_281_accounts-receivable",
        quantity: 3,
      },
      {
        cardId: "onr_v1_261_quandary",
        quantity: 3,
      },
      {
        cardId: "onr_v1_279_wall-of-static",
        quantity: 3,
      },
      {
        cardId: "onr_proteus_032_misleading-access-menus",
        quantity: 3,
      },
      {
        cardId: "onr_proteus_038_snowbank",
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
      expect(cards[card.cardId], card.cardId).toBeDefined();
    expect(
      curation.localDeckLibrary.entries.find(
        (entry) => entry.standardDeckId === deck!.standardDeckId,
      ),
    ).toMatchObject({ classification: "standard", name: "Express Shutdown" });
  });
});
