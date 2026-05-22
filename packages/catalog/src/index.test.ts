import { describe, expect, it } from "vitest";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
import {
  activeAiApprovedCardIds,
  activeRuntimeCardIds,
  assertCatalogPayloadSafe,
  cardFactsById,
  computeSnapshotHash,
  createCatalogIndex,
  createRuntimeCardsById,
  createRuntimeCardSnapshot,
  loadCardSets,
  ORIGINALSET_V1_CARD_IDS,
  PROTEUS_CARD_IDS,
  PROTEUS_VISIBLE_BASELINE_CARD_IDS,
  runtimeGateByCardId,
  searchCatalog,
  TESTSET_CARD_IDS,
  validateLoadedCardSets,
  validateSnapshot,
} from "./index";

describe("card set support catalog source", () => {
  it("loads exactly the active card/support files", () => {
    const sets = loadCardSets();
    expect(sets.map((entry) => entry.set.setId)).toEqual([
      "testset",
      "originalset-v1",
      "proteus",
    ]);
    expect(TESTSET_CARD_IDS).toHaveLength(38);
    expect(ORIGINALSET_V1_CARD_IDS).toHaveLength(374);
    expect(PROTEUS_CARD_IDS).toHaveLength(154);
    expect(validateLoadedCardSets(sets)).toEqual([]);
  });

  it("keeps card data and support data in one-to-one alignment", () => {
    for (const { set, support } of loadCardSets()) {
      const cardIds = set.cards.map((card) => card.cardId).sort();
      const supportIds = support.cards.map((card) => card.cardId).sort();
      expect(supportIds, set.setId).toEqual(cardIds);
      for (const card of set.cards) {
        expect(card.setId, card.cardId).toBe(set.setId);
        expect(card.displayOnlyText, card.cardId).toBe(true);
        expect(Object.keys(card.numeric).sort()).toEqual([
          "advancementRequirement",
          "agendaPoints",
          "cost",
          "installCost",
          "memoryCost",
          "rezCost",
          "strength",
          "trashCost",
        ]);
      }
    }
  });

  it("keeps Priority Requisition text visibly optional", () => {
    const priorityRequisition =
      createRuntimeCardsById()["onr_v1_212_priority-requisition"];
    expect(priorityRequisition?.text).toBe(
      "You may rez a piece of ice, at no cost, when you score Priority Requisition.",
    );
  });

  it("keeps Superior Net Barriers text complete", () => {
    const superiorNetBarriers =
      createRuntimeCardsById()["onr_v1_219_superior-net-barriers"];
    expect(superiorNetBarriers?.text).toBe(
      "All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain 1 for each revealed or rezzed wall.",
    );
  });

  it("derives runtime and AI support from active support entries", () => {
    const cardsById = createRuntimeCardsById();
    const runtimeIdsFromCards = Object.values(cardsById)
      .filter((card) => card.statuses.human_playable)
      .map((card) => card.catalogCardId)
      .sort();
    const aiIdsFromCards = Object.values(cardsById)
      .filter((card) => card.statuses.ai_supported)
      .map((card) => card.catalogCardId)
      .sort();

    expect(activeRuntimeCardIds.slice().sort()).toEqual(runtimeIdsFromCards);
    expect(activeAiApprovedCardIds.slice().sort()).toEqual(aiIdsFromCards);
    expect(Object.keys(runtimeGateByCardId).sort()).toEqual(runtimeIdsFromCards);

    for (const cardId of activeRuntimeCardIds) {
      const card = cardsById[cardId];
      expect(card?.statuses.human_playable, cardId).toBe(true);
      expect(cardFactsById[cardId]?.runtimeGate, cardId).toBeDefined();
      expect(card?.implementationManifest?.manifestVersion, cardId).toMatch(
        /-card-support-v1$/,
      );
    }
  });

  it("preserves the active status invariants", () => {
    const cards = Object.values(createRuntimeCardsById());
    for (const card of cards) {
      if (card.statuses.deck_legal)
        expect(card.statuses.human_playable, card.catalogCardId).toBe(true);
      if (card.statuses.format_legal)
        expect(card.statuses.deck_legal, card.catalogCardId).toBe(true);
      if (card.statuses.ai_supported) {
        expect(card.statuses.human_playable, card.catalogCardId).toBe(true);
        expect(card.statuses.deck_legal, card.catalogCardId).toBe(true);
      }
      if (card.statuses.blocked) {
        expect(card.statuses.deck_legal, card.catalogCardId).toBe(false);
        expect(card.statuses.format_legal, card.catalogCardId).toBe(false);
        expect(card.statuses.ai_supported, card.catalogCardId).toBe(false);
      }
    }
  });

  it("keeps all ai_supported cards linked to active hints and scenarios", () => {
    const hintsById = new Map(
      activeAiHintsData.cards.map((hint) => [hint.cardId, hint]),
    );
    for (const cardId of activeAiApprovedCardIds) {
      const hint = hintsById.get(cardId);
      expect(hint, cardId).toBeDefined();
      expect(hint?.aiSupportStatus, cardId).toBe("ai_supported");
      expect(hint?.scenarioRefs.length, cardId).toBeGreaterThan(0);
    }
  });

  it("models Proteus conservatively with only the visible baseline playable", () => {
    const cardsById = createRuntimeCardsById();
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toEqual([
      "onr_proteus_041_toughoniumtm-wall",
    ]);
    const baseline = cardsById["onr_proteus_041_toughoniumtm-wall"];
    expect(baseline?.statuses).toMatchObject({
      human_playable: true,
      deck_legal: false,
      format_legal: false,
      ai_supported: false,
      blocked: false,
    });
    const blockedProteus = Object.values(cardsById).filter(
      (card) =>
        card.catalogCardId.startsWith("onr_proteus_") &&
        card.catalogCardId !== "onr_proteus_041_toughoniumtm-wall",
    );
    expect(blockedProteus).toHaveLength(153);
    expect(blockedProteus.every((card) => card.statuses.blocked)).toBe(true);
  });

  it("creates a valid runtime snapshot, index and public payload", () => {
    const snapshot = createRuntimeCardSnapshot();
    const hash = computeSnapshotHash(snapshot);
    const index = createCatalogIndex(snapshot, hash);
    expect(validateSnapshot(snapshot)).toEqual({ ok: true, errors: [] });
    expect(index.filters.sets.sort()).toEqual([
      "originalset-v1",
      "proteus",
      "testset",
    ]);
    expect(searchCatalog(snapshot, { status: "ai_supported" })).toHaveLength(
      activeAiApprovedCardIds.length,
    );
    expect(assertCatalogPayloadSafe(index)).toEqual({ ok: true, errors: [] });
  });

  it("keeps Detroit Police Contract display text aligned to its 12/2 runtime effect", () => {
    const card = createRuntimeCardsById()["onr_v1_198_detroit-police-contract"];

    expect(card?.text).toBe(
      "Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.",
    );
    expect(card?.numeric.advancementRequirement).toBe(4);
    expect(card?.numeric.agendaPoints).toBe(1);
    expect(card?.text).not.toContain("4 power counters");
    expect(card?.text).not.toContain("Remove 1 power counter");
  });

  it("keeps Employee Empowerment display text aligned to optional start draw and agenda action", () => {
    const card = createRuntimeCardsById()["onr_v1_199_employee-empowerment"];

    expect(card?.text).toBe(
      "You may choose to draw an additional card at the start of each of your turns. [A]: Draw two cards.",
    );
    expect(card?.numeric.advancementRequirement).toBe(4);
    expect(card?.numeric.agendaPoints).toBe(3);
    expect(card?.text).not.toContain("gain 1 credit");
  });
});
