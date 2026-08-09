import { describe, expect, it } from "vitest";
import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
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
    expect(CLASSIC_CARD_IDS).toHaveLength(54);
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

  it("requires exactly one authoritative source play-cost model", () => {
    const both = structuredClone(loadCardSets());
    const bothCard = both
      .flatMap(({ set }) => set.cards)
      .find((card) => card.cardId === "onr_v1_077_anonymous-tip");
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
      .find((card) => card.cardId === "onr_v1_299_power-grid-overload");
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
      .find((card) => card.cardId === "onr_v1_077_anonymous-tip");
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
      cards.find((card) => card.cardId === "simple_setup_hardware"),
    );
    const event = structuredClone(
      cards.find((card) => card.cardId === "onr_v1_077_anonymous-tip"),
    );
    const agenda = structuredClone(
      cards.find((card) => card.cardId === "simple_agenda"),
    );
    const variableBreaker = structuredClone(
      cards.find((card) => card.cardId === "onr_v1_002_ai-boon"),
    );
    const fixedIce = structuredClone(
      cards.find((card) => card.cardId === "simple_barrier_ice"),
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
    const variableCostIds: string[] = [];
    let playablePlayCardCount = 0;

    for (const cardId of activeRuntimeCardIds) {
      const card = cardsById[cardId];
      const legacyDefinition = CARD_DEFINITIONS_BY_ID[cardId];
      const cardSpecDefinition = publicCardViewsById.get(cardId);
      const definition =
        cardSpecDefinition === undefined
          ? legacyDefinition
          : {
              type: cardSpecDefinition.cardType,
              playCost: cardSpecDefinition.playCost,
              ...(cardSpecDefinition.playCost?.kind === "fixed"
                ? { cost: cardSpecDefinition.playCost.credits }
                : {}),
            };
      expect(card, cardId).toBeDefined();
      expect(definition, cardId).toBeDefined();
      if (!card || !definition) continue;

      if (card.type !== "event" && card.type !== "operation") {
        expect(card.playCost, cardId).toBeNull();
        expect(definition.playCost, cardId).toBeNull();
        continue;
      }

      expect(definition.type, cardId).toBe(card.type);
      expect(definition.playCost, cardId).toEqual(card.playCost);
      playablePlayCardCount += 1;
      expect(card.playCost, cardId).not.toBeNull();
      if (!card.playCost) continue;
      if (card.playCost.kind === "fixed") {
        expect(Object.keys(card.playCost).sort(), cardId).toEqual([
          "credits",
          "kind",
        ]);
        expect(Number.isInteger(card.playCost.credits), cardId).toBe(true);
        expect(card.playCost.credits, cardId).toBeGreaterThanOrEqual(0);
        expect(card.numeric.cost, cardId).toBe(card.playCost.credits);
        expect(definition.cost, cardId).toBe(card.playCost.credits);
      } else {
        variableCostIds.push(cardId);
        expect(Object.keys(card.playCost).sort(), cardId).toEqual([
          "creditsPerX",
          "kind",
          "maximumX",
          "minimumX",
        ]);
        expect(card.numeric.cost, cardId).toBeNull();
        expect(definition.cost, cardId).toBeUndefined();
        expect(card.playCost).toEqual({
          kind: "variable_x",
          minimumX: 1,
          creditsPerX: 1,
          maximumX: { kind: "context" },
        });
      }
    }

    expect(playablePlayCardCount).toBe(129);
    expect(variableCostIds.sort()).toEqual([
      "onr_proteus_049_emergency-rig",
      "onr_v1_299_power-grid-overload",
    ]);
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
      expect(card, cardId).toBeDefined();
      expect(card?.statuses.ai_supported, cardId).toBe(true);
      expect(evidence, cardId).toBeDefined();
      expect(evidence?.aiSupportStatus, cardId).toBe("ai_supported");
      expect(evidence?.scenarioRefs.length, cardId).toBeGreaterThan(0);
    }

    for (const evidence of createActiveCatalogAiSupportEvidence()) {
      const card = cardsById[evidence.cardId];
      expect(card, evidence.cardId).toBeDefined();
      if (evidence.aiSupportStatus === "ai_supported")
        expect(
          activeAiApprovedIdSet.has(evidence.cardId),
          evidence.cardId,
        ).toBe(true);
      else
        expect(
          activeAiApprovedIdSet.has(evidence.cardId),
          evidence.cardId,
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
      expect(cardsById[cardId]?.statuses, cardId).toMatchObject({
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
        card.catalogCardId.startsWith("onr_proteus_") &&
        card.statuses.ai_supported,
    );
    expect(aiSupportedProteus).toHaveLength(PROTEUS_CARD_IDS.length);
    for (const cardId of PROTEUS_CARD_IDS) {
      expect(
        activeSupportEvidenceById.get(cardId)?.aiSupportStatus,
        cardId,
      ).toBe("ai_supported");
      expect(activeSupportEvidenceById.has(cardId), cardId).toBe(true);
      expect(cardsById[cardId]?.implementationManifest, cardId).toBeDefined();
    }
  });

  it("promotes Classic for Human-vs-Human deck legality and AI support", () => {
    const cardsById = createRuntimeCardsById();
    const classicCards = Object.values(createRuntimeCardsById()).filter(
      (card) => card.catalogCardId.startsWith("onr_classic_"),
    );
    expect(CLASSIC_CARD_IDS).toHaveLength(54);
    expect(classicCards).toHaveLength(CLASSIC_CARD_IDS.length);
    expect(classicCards.every((card) => card.setId === "classic")).toBe(true);
    for (const cardId of CLASSIC_CARD_IDS) {
      expect(cardsById[cardId]?.statuses, cardId).toMatchObject({
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
        cardId,
      ).toBe("ai_supported");
      expect(activeSupportEvidenceById.has(cardId), cardId).toBe(true);
    }
    expect(cardsById["onr_classic_001_data-fort-remapping"]?.rarity?.code).toBe(
      "common",
    );
    expect(cardsById["onr_classic_054_phone-freak"]?.title).toBe("Phone Freak");
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

  it("includes the resolved play-cost contract in the deterministic snapshot hash", () => {
    const snapshot = createRuntimeCardSnapshot();
    const changed = structuredClone(snapshot);
    const emergencyRig = changed.cards.find(
      (card) => card.catalogCardId === "onr_proteus_049_emergency-rig",
    );
    expect(emergencyRig?.playCost?.kind).toBe("variable_x");
    if (emergencyRig?.playCost?.kind !== "variable_x") return;
    emergencyRig.playCost.creditsPerX = 2;

    expect(computeSnapshotHash(changed)).not.toBe(
      computeSnapshotHash(snapshot),
    );
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
