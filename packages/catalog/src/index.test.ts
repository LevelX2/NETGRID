import { describe, expect, it } from "vitest";
import { listPublicCardViews } from "@netgrid/cards/server";
import cardSupportAiSupportedScenarioData from "../../../data/scenarios/card-support-ai-supported-current.json";
import {
  activeAiApprovedCardIds,
  activeRuntimeCardIds,
  assertCatalogPayloadSafe,
  cardFactsById,
  CLASSIC_CARD_IDS,
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
  validatePlayableNumericContract,
  validateSnapshot,
  cardSetSupportEntries,
} from "./index";

function createActiveCatalogAiSupportEvidence() {
  return cardSetSupportEntries
    .filter((entry) => entry.statuses.ai_supported === true)
    .map((entry) => ({
      cardId: entry.cardId,
      aiSupportStatus: "ai_supported",
      scenarioRefs: entry.support.scenarioRefs,
    }));
}

const EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS = [
  60,
  67,
  69,
  70,
  71,
  73,
  75,
  78,
  79,
  80,
  81,
  82,
  83,
  84,
  86,
  88,
  89,
  90,
  91,
  92,
  94,
  96,
  97,
  98,
  99,
  102,
  105,
  106,
  108,
  110,
  111,
  112,
  115,
  120,
  123,
  126,
  128,
  130,
  133,
  135,
  136,
  137,
  138,
  139,
  140,
  141,
  142,
  143,
  144,
  146,
  147,
  148,
  149,
  150,
  151,
  152,
  153,
  154,
  155,
  156,
  157,
  158,
  159,
  161,
  162,
  163,
  164,
  165,
  166,
  172,
  173,
  175,
  176,
  178,
  179,
  180,
  182,
  185,
  188,
  192,
  193,
  196,
  197,
  204,
  206,
  208,
  209,
] as const;

describe("card set support catalog source", () => {
  it("loads exactly the active card/support files", () => {
    const sets = loadCardSets();
    expect(sets.map((entry) => entry.set.setId)).toEqual([
      "testset",
      "system",
      "originalset-v1",
      "proteus",
      "classic",
    ]);
    expect(TESTSET_CARD_IDS).toHaveLength(36);
    expect(ORIGINALSET_V1_CARD_IDS).toHaveLength(374);
    expect(PROTEUS_CARD_IDS).toHaveLength(154);
    expect(CLASSIC_CARD_IDS).toHaveLength(54);
    expect(validateLoadedCardSets(sets)).toEqual([]);
  });

  it("keeps both previews catalog-only and preserves their editorial block split", () => {
    const cards = createRuntimeCardsById();
    const operation = cards[1];
    const resource = cards[2];

    expect(operation?.statuses).toMatchObject({
      catalog_ready: true,
      engine_supported: false,
      playable: false,
      human_playable: false,
      ai_supported: false,
      deck_legal: false,
      format_legal: false,
      blocked: false,
    });
    expect(operation?.blockReasons).toEqual([]);

    expect(resource?.statuses).toMatchObject({
      catalog_ready: true,
      engine_supported: false,
      playable: false,
      human_playable: false,
      ai_supported: false,
      deck_legal: false,
      format_legal: false,
      blocked: true,
    });
    expect(resource?.blockReasons).toEqual([
      "Intentionally blocked catalog-only test fixture.",
    ]);
  });

  it("keeps card data and support data in one-to-one alignment", () => {
    for (const { set, support } of loadCardSets()) {
      const cardIds = set.cards.map((card) => card.cardId).sort();
      const supportIds = support.cards.map((card) => card.cardId).sort();
      expect(supportIds, set.setId).toEqual(cardIds);
      for (const card of set.cards) {
        expect(card.setId, String(card.cardId)).toBe(set.setId);
        expect(card.displayOnlyText, String(card.cardId)).toBe(true);
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

  it("requires exactly one authoritative source play-cost model", () => {
    const both = structuredClone(loadCardSets());
    const bothCard = both
      .flatMap(({ set }) => set.cards)
      .find((card) => card.cardId === 289);
    expect(bothCard).toBeDefined();
    if (!bothCard) return;
    bothCard.playCost = {
      kind: "variable_x",
      minimumX: 1,
      creditsPerX: 1,
      maximumX: { kind: "context" },
    };
    expect(validateLoadedCardSets(both)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "event/operation must define exactly one fixed or variable-X play cost",
        ),
      ]),
    );

    const missing = structuredClone(loadCardSets());
    const missingCard = missing
      .flatMap(({ set }) => set.cards)
      .find((card) => card.cardId === 511);
    expect(missingCard).toBeDefined();
    if (!missingCard) return;
    delete missingCard.playCost;
    expect(validateLoadedCardSets(missing)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "event/operation must define exactly one fixed or variable-X play cost",
        ),
      ]),
    );

    const nonfinite = structuredClone(loadCardSets());
    const nonfiniteCard = nonfinite
      .flatMap(({ set }) => set.cards)
      .find((card) => card.cardId === 289);
    expect(nonfiniteCard).toBeDefined();
    if (!nonfiniteCard) return;
    nonfiniteCard.numeric.cost = Number.POSITIVE_INFINITY;
    expect(validateLoadedCardSets(nonfinite)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "event/operation must define exactly one fixed or variable-X play cost",
        ),
      ]),
    );
  });

  it("rejects incomplete, contradictory, foreign, or invalid playable numeric fields", () => {
    const cards = loadCardSets().flatMap(({ set }) => set.cards);
    const hardware = structuredClone(
      cards.find((card) => card.cardId === 602),
    );
    const event = structuredClone(
      cards.find((card) => card.cardId === 289),
    );
    const agenda = structuredClone(
      cards.find((card) => card.cardId === 588),
    );
    const variableBreaker = structuredClone(
      cards.find((card) => card.cardId === 214),
    );
    const fixedIce = structuredClone(
      cards.find((card) => card.cardId === 589),
    );
    expect(hardware).toBeDefined();
    expect(event).toBeDefined();
    expect(agenda).toBeDefined();
    expect(variableBreaker).toBeDefined();
    expect(fixedIce).toBeDefined();
    if (!hardware || !event || !agenda || !variableBreaker || !fixedIce) return;

    hardware.numeric.installCost = null;
    expect(validatePlayableNumericContract(hardware)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("hardware requires numeric.installCost"),
      ]),
    );

    event.numeric.installCost = 3;
    expect(validatePlayableNumericContract(event)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "event requires numeric.installCost to be explicitly null",
        ),
      ]),
    );

    agenda.numeric.agendaPoints = -1;
    const loadedSets = structuredClone(loadCardSets());
    const sourceAgenda = loadedSets
      .flatMap(({ set }) => set.cards)
      .find((card) => card.cardId === agenda.cardId);
    expect(sourceAgenda).toBeDefined();
    if (!sourceAgenda) return;
    sourceAgenda.numeric.agendaPoints = -1;
    expect(validateLoadedCardSets(loadedSets)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "numeric.agendaPoints must be a non-negative integer or null",
        ),
      ]),
    );

    delete variableBreaker.variableStrength;
    expect(validatePlayableNumericContract(variableBreaker)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "requires exactly one fixed or variable strength model",
        ),
      ]),
    );

    fixedIce.variableStrength = {
      kind: "paid_x",
      minimumStrength: 0,
      maximumStrength: 5,
    };
    expect(validatePlayableNumericContract(fixedIce)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "requires exactly one fixed or variable strength model",
        ),
      ]),
    );
  });

  it("resolves every playable event and operation to the same exhaustive catalog/shared play-cost contract", () => {
    const cardsById = createRuntimeCardsById();
    const publicCardViewsById = new Map(
      listPublicCardViews().map((view) => [view.cardDefinitionId, view]),
    );
    const variableCostIds: number[] = [];
    let playablePlayCardCount = 0;

    for (const cardId of activeRuntimeCardIds) {
      const card = cardsById[cardId];
      const cardSpecDefinition = publicCardViewsById.get(cardId);
      const definition = cardSpecDefinition && {
        type: cardSpecDefinition.cardType,
        playCost: cardSpecDefinition.playCost,
        ...(cardSpecDefinition.playCost?.kind === "fixed"
          ? { cost: cardSpecDefinition.playCost.credits }
          : {}),
      };
      expect(card, String(cardId)).toBeDefined();
      expect(definition, String(cardId)).toBeDefined();
      if (!card || !definition) continue;

      if (card.type !== "event" && card.type !== "operation") {
        expect(card.playCost, String(cardId)).toBeNull();
        expect(definition.playCost, String(cardId)).toBeNull();
        continue;
      }

      expect(definition.type, String(cardId)).toBe(card.type);
      expect(definition.playCost, String(cardId)).toEqual(card.playCost);
      playablePlayCardCount += 1;
      expect(card.playCost, String(cardId)).not.toBeNull();
      if (!card.playCost) continue;
      if (card.playCost.kind === "fixed") {
        expect(Object.keys(card.playCost).sort(), String(cardId)).toEqual([
          "credits",
          "kind",
        ]);
        expect(Number.isInteger(card.playCost.credits), String(cardId)).toBe(true);
        expect(card.playCost.credits, String(cardId)).toBeGreaterThanOrEqual(0);
        expect(card.numeric.cost, String(cardId)).toBe(card.playCost.credits);
        expect(definition.cost, String(cardId)).toBe(card.playCost.credits);
      } else {
        variableCostIds.push(cardId);
        expect(Object.keys(card.playCost).sort(), String(cardId)).toEqual([
          "creditsPerX",
          "kind",
          "maximumX",
          "minimumX",
        ]);
        expect(card.numeric.cost, String(cardId)).toBeNull();
        expect(definition.cost, String(cardId)).toBeUndefined();
        expect(card.playCost).toEqual({
          kind: "variable_x",
          minimumX: cardId === 511 ? 0 : 1,
          creditsPerX: 1,
          maximumX: { kind: "context" },
        });
      }
    }

    expect(playablePlayCardCount).toBe(129);
    expect(variableCostIds.sort()).toEqual([
      107,
      511,
    ]);
  });

  it("keeps Priority Requisition text visibly optional", () => {
    const priorityRequisition =
      createRuntimeCardsById()[424];
    expect(priorityRequisition?.text).toBe(
      "You may rez a piece of ice, at no cost, when you score Priority Requisition.",
    );
  });

  it("keeps Superior Net Barriers text complete", () => {
    const superiorNetBarriers =
      createRuntimeCardsById()[431];
    expect(superiorNetBarriers?.text).toBe(
      "All walls have +1 strength. When you score Superior Net Barriers, reveal as many walls as you wish. Then, gain [1] for each revealed or rezzed wall.",
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
    expect(Object.values(runtimeGateByCardId).map((proof) => proof.cardId).sort()).toEqual(
      runtimeIdsFromCards,
    );

    for (const cardId of activeRuntimeCardIds) {
      const card = cardsById[cardId];
      expect(card?.statuses.human_playable, String(cardId)).toBe(true);
      expect(cardFactsById[cardId]?.runtimeGate, String(cardId)).toBeDefined();
      expect(card?.implementationManifest?.manifestVersion, String(cardId)).toMatch(
        /-card-support-v1$/,
      );
    }
  });

  it("preserves the active status invariants", () => {
    const cards = Object.values(createRuntimeCardsById());
    for (const card of cards) {
      if (card.statuses.deck_legal)
        expect(card.statuses.human_playable, String(card.catalogCardId)).toBe(true);
      if (card.statuses.format_legal)
        expect(card.statuses.deck_legal, String(card.catalogCardId)).toBe(true);
      if (card.statuses.ai_supported) {
        expect(card.statuses.human_playable, String(card.catalogCardId)).toBe(true);
        expect(card.statuses.deck_legal, String(card.catalogCardId)).toBe(true);
      }
      if (card.statuses.blocked) {
        expect(card.statuses.deck_legal, String(card.catalogCardId)).toBe(false);
        expect(card.statuses.format_legal, String(card.catalogCardId)).toBe(false);
        expect(card.statuses.ai_supported, String(card.catalogCardId)).toBe(false);
      }
    }
  });

  it("keeps active AI support evidence and the approval scenario aligned", () => {
    const activeAiSupportScenario =
      cardSupportAiSupportedScenarioData.scenarios.find(
        (scenario) => scenario.id === "active_card_support_ai_supported",
      );
    expect(
      cardSupportAiSupportedScenarioData.status,
      "card support approval scenario pack status",
    ).toBe("ai_supported");
    expect(activeAiSupportScenario).toBeDefined();

    const cardsById = createRuntimeCardsById();
    const supportEvidenceById = new Map(
      createActiveCatalogAiSupportEvidence().map((hint) => [hint.cardId, hint]),
    );
    const activeAiApprovedIdSet = new Set(activeAiApprovedCardIds);
    const supportEvidenceCardIds = createActiveCatalogAiSupportEvidence().map(
      (entry) => entry.cardId,
    );
    const scenarioCardIds = activeAiSupportScenario?.coversCards ?? [];
    const runtimeIdsWithoutHints = activeRuntimeCardIds
      .filter((cardId) => !supportEvidenceById.has(cardId))
      .sort();

    expect(
      supportEvidenceById.size,
      "active AI support evidence card ids must be unique",
    ).toBe(supportEvidenceCardIds.length);
    expect([...supportEvidenceById.keys()].sort()).toEqual(
      activeAiApprovedCardIds.slice().sort(),
    );
    expect([...new Set(scenarioCardIds)].sort()).toEqual(
      activeAiApprovedCardIds.slice().sort(),
    );
    expect(runtimeIdsWithoutHints).toEqual([]);

    for (const cardId of activeAiApprovedCardIds) {
      const card = cardsById[cardId];
      const evidence = supportEvidenceById.get(cardId);
      expect(card, String(cardId)).toBeDefined();
      expect(card?.statuses.ai_supported, String(cardId)).toBe(true);
      expect(evidence, String(cardId)).toBeDefined();
      expect(evidence?.aiSupportStatus, String(cardId)).toBe("ai_supported");
      expect(evidence?.scenarioRefs.length, String(cardId)).toBeGreaterThan(0);
    }

    for (const evidence of createActiveCatalogAiSupportEvidence()) {
      const card = cardsById[evidence.cardId];
      expect(card, String(evidence.cardId)).toBeDefined();
      if (evidence.aiSupportStatus === "ai_supported")
        expect(
          activeAiApprovedIdSet.has(evidence.cardId),
          String(evidence.cardId),
        ).toBe(true);
      else
        expect(
          activeAiApprovedIdSet.has(evidence.cardId),
          String(evidence.cardId),
        ).toBe(false);
    }
  });

  it("promotes Proteus for Human-vs-Human deck legality and AI support", () => {
    const cardsById = createRuntimeCardsById();
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toHaveLength(154);
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toEqual([...PROTEUS_CARD_IDS]);
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toEqual(
      expect.arrayContaining([...EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS]),
    );
    for (const cardId of PROTEUS_CARD_IDS) {
      expect(cardsById[cardId]?.statuses, String(cardId)).toMatchObject({
        human_playable: true,
        deck_legal: true,
        format_legal: true,
        ai_supported: true,
        blocked: false,
      });
    }
    const activeSupportEvidenceById = new Map(
      createActiveCatalogAiSupportEvidence().map((hint) => [hint.cardId, hint]),
    );
    const aiSupportedProteus = Object.values(cardsById).filter(
      (card) =>
        card.setId === "proteus" &&
        card.statuses.ai_supported,
    );
    expect(aiSupportedProteus).toHaveLength(PROTEUS_CARD_IDS.length);
    for (const cardId of PROTEUS_CARD_IDS) {
      expect(
        activeSupportEvidenceById.get(cardId)?.aiSupportStatus,
        String(cardId),
      ).toBe("ai_supported");
      expect(activeSupportEvidenceById.has(cardId), String(cardId)).toBe(true);
      expect(cardsById[cardId]?.implementationManifest, String(cardId)).toBeDefined();
    }
  });

  it("promotes Classic for Human-vs-Human deck legality and AI support", () => {
    const cardsById = createRuntimeCardsById();
    const classicCards = Object.values(createRuntimeCardsById()).filter(
      (card) => card.setId === "classic",
    );
    expect(CLASSIC_CARD_IDS).toHaveLength(54);
    expect(classicCards).toHaveLength(CLASSIC_CARD_IDS.length);
    expect(classicCards.every((card) => card.setId === "classic")).toBe(true);
    for (const cardId of CLASSIC_CARD_IDS) {
      expect(cardsById[cardId]?.statuses, String(cardId)).toMatchObject({
        catalog_ready: true,
        implemented: true,
        engine_supported: true,
        playable: true,
        human_playable: true,
        deck_legal: true,
        format_legal: true,
        ai_supported: true,
        blocked: false,
      });
    }
    const activeSupportEvidenceById = new Map(
      createActiveCatalogAiSupportEvidence().map((hint) => [hint.cardId, hint]),
    );
    for (const cardId of CLASSIC_CARD_IDS) {
      expect(
        activeSupportEvidenceById.get(cardId)?.aiSupportStatus,
        String(cardId),
      ).toBe("ai_supported");
      expect(activeSupportEvidenceById.has(cardId), String(cardId)).toBe(true);
    }
    expect(cardsById[5]?.rarity?.code).toBe(
      "common",
    );
    expect(cardsById[58]?.title).toBe("Phone Freak");
  });

  it("creates a valid runtime snapshot, index and public payload", () => {
    const snapshot = createRuntimeCardSnapshot();
    const hash = computeSnapshotHash(snapshot);
    const index = createCatalogIndex(snapshot, hash);
    expect(validateSnapshot(snapshot)).toEqual({ ok: true, errors: [] });
    expect(index.filters.sets.sort()).toEqual([
      "classic",
      "originalset-v1",
      "proteus",
      "system",
      "testset",
    ]);
    expect(searchCatalog(index, { status: "ai_supported" })).toHaveLength(
      activeAiApprovedCardIds.length,
    );
    expect(assertCatalogPayloadSafe(index)).toEqual({ ok: true, errors: [] });
    expect(snapshot.cards).toHaveLength(620);
    expect(new Set(snapshot.cards.map((card) => card.catalogCardId)).size).toBe(
      620,
    );
    expect(new Set(snapshot.cards.map((card) => card.printingId)).size).toBe(
      620,
    );
  });

  it("searches title, visible rules text, card type and subtype case-insensitively", () => {
    const snapshot = createRuntimeCardSnapshot();
    const index = createCatalogIndex(snapshot, computeSnapshotHash(snapshot));
    const afreetId = 213;
    const resultIds = (q: string) =>
      searchCatalog(index, { q }).map((card) => card.catalogCardId);

    expect(resultIds("AFREET")).toContain(afreetId);
    expect(resultIds("hosting capacity")).toContain(afreetId);
    expect(resultIds("PROGRAM")).toContain(afreetId);
    expect(resultIds("DAEMON")).toContain(afreetId);
    expect(resultIds("daemon strength afreet")).toContain(afreetId);
    expect(resultIds("Toughonium")).toContain(
      99,
    );
  });

  it("includes the resolved play-cost contract in the deterministic snapshot hash", () => {
    const snapshot = createRuntimeCardSnapshot();
    const changed = structuredClone(snapshot);
    const emergencyRig = changed.cards.find(
      (card) => card.catalogCardId === 107,
    );
    expect(emergencyRig?.playCost?.kind).toBe("variable_x");
    if (emergencyRig?.playCost?.kind !== "variable_x") return;
    emergencyRig.playCost.creditsPerX = 2;

    expect(computeSnapshotHash(changed)).not.toBe(
      computeSnapshotHash(snapshot),
    );
  });

  it("keeps Detroit Police Contract display text aligned to its 12/2 runtime effect", () => {
    const card = createRuntimeCardsById()[410];

    expect(card?.text).toBe(
      "Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.",
    );
    expect(card?.numeric.advancementRequirement).toBe(4);
    expect(card?.numeric.agendaPoints).toBe(1);
    expect(card?.text).not.toContain("4 power counters");
    expect(card?.text).not.toContain("Remove 1 power counter");
  });

  it("keeps Employee Empowerment display text aligned to optional start draw and agenda action", () => {
    const card = createRuntimeCardsById()[411];

    expect(card?.text).toBe(
      "You may choose to draw an additional card at the start of each of your turns. [A]: Draw two cards.",
    );
    expect(card?.numeric.advancementRequirement).toBe(4);
    expect(card?.numeric.agendaPoints).toBe(3);
    expect(card?.text).not.toContain("gain 1 credit");
  });
});
