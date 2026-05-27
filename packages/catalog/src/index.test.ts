import { describe, expect, it } from "vitest";
import activeAiHintsData from "../../../data/ai/ai-card-hints-active.json";
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
  validateSnapshot,
} from "./index";

const EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS = [
  "onr_proteus_002_charity-takeover",
  "onr_proteus_009_viral-breeding-ground",
  "onr_proteus_011_brain-wash",
  "onr_proteus_012_bug-zapper",
  "onr_proteus_013_caryatid",
  "onr_proteus_015_colonel-failure",
  "onr_proteus_017_credit-blocks",
  "onr_proteus_020_digiconda",
  "onr_proteus_021_dog-pile",
  "onr_proteus_022_food-fight",
  "onr_proteus_023_galatea",
  "onr_proteus_024_gatekeeper",
  "onr_proteus_025_homing-missile",
  "onr_proteus_026_hunting-pack",
  "onr_proteus_028_lesser-arcana",
  "onr_proteus_030_mastermind",
  "onr_proteus_031_minotaur",
  "onr_proteus_032_misleading-access-menus",
  "onr_proteus_033_mobile-barricade",
  "onr_proteus_034_riddler",
  "onr_proteus_036_sandstorm",
  "onr_proteus_038_snowbank",
  "onr_proteus_039_sphinx-2006",
  "onr_proteus_040_sumo-2008",
  "onr_proteus_041_toughoniumtm-wall",
  "onr_proteus_044_walking-wall",
  "onr_proteus_047_credit-consolidation",
  "onr_proteus_048_data-sifters",
  "onr_proteus_050_manhunt",
  "onr_proteus_052_schlaghund-pointers",
  "onr_proteus_053_underworld-mole",
  "onr_proteus_054_bel-digmo-antibody",
  "onr_proteus_057_doppelganger-antibody",
  "onr_proteus_062_lesley-major",
  "onr_proteus_065_networked-center",
  "onr_proteus_068_pattel-antibody",
  "onr_proteus_070_rasmin-bridger",
  "onr_proteus_072_research-bunker",
  "onr_proteus_075_stereogram-antibody",
  "onr_proteus_077_weapons-depot",
  "onr_proteus_078_armageddon",
  "onr_proteus_079_big-frackin-gun",
  "onr_proteus_080_black-widow",
  "onr_proteus_081_boring-bit",
  "onr_proteus_082_bulldozer",
  "onr_proteus_083_corrosion",
  "onr_proteus_084_crumble",
  "onr_proteus_085_disintegrator",
  "onr_proteus_086_enterprise-inc-shields",
  "onr_proteus_088_fubar",
  "onr_proteus_089_garbage-in",
  "onr_proteus_090_highlighter",
  "onr_proteus_091_lockjaw",
  "onr_proteus_092_morphing-tool",
  "onr_proteus_093_redecorator",
  "onr_proteus_094_scaldan",
  "onr_proteus_095_skeleton-passkeys",
  "onr_proteus_096_skullcap",
  "onr_proteus_097_taxman",
  "onr_proteus_098_vienna-22",
  "onr_proteus_099_viral-pipeline",
  "onr_proteus_100_wrecking-ball",
  "onr_proteus_101_all-hands",
  "onr_proteus_103_cruising-for-netwatch",
  "onr_proteus_104_decoy-signal",
  "onr_proteus_105_demolition-run",
  "onr_proteus_106_disgruntled-ice-technician",
  "onr_proteus_107_drone-for-a-day",
  "onr_proteus_108_faked-hit",
  "onr_proteus_114_on-the-fast-track",
  "onr_proteus_115_personal-touch-the",
  "onr_proteus_117_poisoned-water-supply",
  "onr_proteus_118_prearranged-drop",
  "onr_proteus_120_reconnaissance",
  "onr_proteus_121_remote-detonator",
  "onr_proteus_122_rush-hour",
  "onr_proteus_124_stakeout",
  "onr_proteus_127_weefle-initiation",
  "onr_proteus_130_back-door-to-rivals",
  "onr_proteus_134_cortical-cybermodem",
  "onr_proteus_135_cortical-stimulators",
  "onr_proteus_138_deck-the",
  "onr_proteus_139_eurocorpse-tm-spin-chip",
  "onr_proteus_146_precision-bribery",
  "onr_proteus_148_runner-sensei",
  "onr_proteus_150_streetware-distributor",
  "onr_proteus_151_sunburst-cranial-interface",
] as const;

describe("card set support catalog source", () => {
  it("loads exactly the active card/support files", () => {
    const sets = loadCardSets();
    expect(sets.map((entry) => entry.set.setId)).toEqual([
      "testset",
      "originalset-v1",
      "proteus",
      "classic",
    ]);
    expect(TESTSET_CARD_IDS).toHaveLength(38);
    expect(ORIGINALSET_V1_CARD_IDS).toHaveLength(374);
    expect(PROTEUS_CARD_IDS).toHaveLength(154);
    expect(CLASSIC_CARD_IDS).toHaveLength(52);
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
    expect(Object.keys(runtimeGateByCardId).sort()).toEqual(
      runtimeIdsFromCards,
    );

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

  it("keeps active AI support, active hints and the approval scenario aligned", () => {
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
    const hintsById = new Map(
      activeAiHintsData.cards.map((hint) => [hint.cardId, hint]),
    );
    const activeAiApprovedIdSet = new Set(activeAiApprovedCardIds);
    const hintCardIds = activeAiHintsData.cards.map((hint) => hint.cardId);
    const scenarioCardIds = activeAiSupportScenario?.coversCards ?? [];
    const runtimeIdsWithoutHints = activeRuntimeCardIds
      .filter((cardId) => !hintsById.has(cardId))
      .sort();

    expect(hintsById.size, "active AI hint card ids must be unique").toBe(
      hintCardIds.length,
    );
    expect([...hintsById.keys()].sort()).toEqual(
      activeAiApprovedCardIds.slice().sort(),
    );
    expect([...new Set(scenarioCardIds)].sort()).toEqual(
      activeAiApprovedCardIds.slice().sort(),
    );
    expect(runtimeIdsWithoutHints).toEqual([
      ...EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS,
    ]);

    for (const cardId of activeAiApprovedCardIds) {
      const card = cardsById[cardId];
      const hint = hintsById.get(cardId);
      expect(card, cardId).toBeDefined();
      expect(card?.statuses.ai_supported, cardId).toBe(true);
      expect(hint, cardId).toBeDefined();
      expect(hint?.aiSupportStatus, cardId).toBe("ai_supported");
      expect(hint?.scenarioRefs.length, cardId).toBeGreaterThan(0);
    }

    for (const hint of activeAiHintsData.cards) {
      const card = cardsById[hint.cardId];
      expect(card, hint.cardId).toBeDefined();
      if (hint.aiSupportStatus === "ai_supported")
        expect(activeAiApprovedIdSet.has(hint.cardId), hint.cardId).toBe(true);
      else
        expect(activeAiApprovedIdSet.has(hint.cardId), hint.cardId).toBe(false);
    }
  });

  it("models Proteus conservatively with only released detail slices playable", () => {
    const cardsById = createRuntimeCardsById();
    expect(PROTEUS_VISIBLE_BASELINE_CARD_IDS).toEqual([
      ...EXPECTED_PROTEUS_VISIBLE_BASELINE_CARD_IDS,
    ]);
    for (const cardId of PROTEUS_VISIBLE_BASELINE_CARD_IDS) {
      expect(cardsById[cardId]?.statuses, cardId).toMatchObject({
        human_playable: true,
        deck_legal: false,
        format_legal: false,
        ai_supported: false,
        blocked: false,
      });
    }
    const blockedProteus = Object.values(cardsById).filter(
      (card) =>
        card.catalogCardId.startsWith("onr_proteus_") &&
        !PROTEUS_VISIBLE_BASELINE_CARD_IDS.includes(card.catalogCardId),
    );
    expect(blockedProteus).toHaveLength(67);
    expect(blockedProteus.every((card) => card.statuses.blocked)).toBe(true);
  });

  it("imports Classic as catalog-visible but blocked planning data", () => {
    const classicCards = Object.values(createRuntimeCardsById()).filter((card) =>
      card.catalogCardId.startsWith("onr_classic_"),
    );
    expect(classicCards).toHaveLength(52);
    expect(classicCards.every((card) => card.setId === "classic")).toBe(true);
    expect(classicCards.every((card) => card.statuses.catalog_ready)).toBe(true);
    expect(classicCards.every((card) => card.statuses.blocked)).toBe(true);
    expect(classicCards.every((card) => !card.statuses.human_playable)).toBe(true);
    expect(classicCards.every((card) => !card.statuses.deck_legal)).toBe(true);
    expect(createRuntimeCardsById()["onr_classic_001_data-fort-remapping"]?.rarity?.code).toBe("common");
    expect(createRuntimeCardsById()["onr_classic_052_zetatech-portastation"]?.title).toBe("Zetatech Portastation");
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
