import { describe, expect, it } from "vitest";
import snapshotData from "../../../data/card-import/card-snapshot-0.5.json";
import snapshotData08 from "../../../data/card-import/card-snapshot-0.8.json";
import profilesData from "../../../data/decks/deck-format-profiles-0.6.json";
import profilesData08 from "../../../data/decks/deck-format-profiles-0.8.json";
import profilesData130 from "../../../data/decks/deck-format-profiles-1.3.0.json";
import templatesData from "../../../data/decks/deck-templates-0.6.json";
import snapshotsData from "../../../data/decks/deck-snapshots-0.6.json";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import {
  buildEngineDeck,
  computeDeckHash,
  createDeckSnapshot,
  createEditableDeckFromTemplate,
  exportDeck,
  importDeck,
  validateDeckSnapshot,
  validateEditableDeck,
  type DeckFormatProfile,
  type DeckSnapshot,
  type DeckTemplate,
  type EditableDeck
} from "./index";
import { createRuntimeCardsById, type CatalogCard } from "@netgrid/catalog";

const cardsById = Object.fromEntries((snapshotData.cards as unknown as CatalogCard[]).map((card) => [card.catalogCardId, card]));
const profile = profilesData.profiles[0] as DeckFormatProfile;
const templates = templatesData.templates as DeckTemplate[];
const snapshots = snapshotsData.snapshots as DeckSnapshot[];
const context = { cardsById, profile };
const cardsById08 = Object.fromEntries((snapshotData08.cards as unknown as CatalogCard[]).map((card) => [card.catalogCardId, card]));
const profile08 = (profilesData08.profiles as DeckFormatProfile[]).find((candidate) => candidate.profileId === "local-demo-v0.8")!;
const profile130 = (profilesData130.profiles as DeckFormatProfile[]).find((candidate) => candidate.profileId === "netgrid_private_local_v1")!;
const snapshots08 = snapshotsData08.snapshots as DeckSnapshot[];
const context08 = { cardsById: cardsById08, profile: profile08 };

describe("deck validation and snapshots", () => {
  it("validates every frozen V0.6 deck snapshot", () => {
    expect(snapshots).toHaveLength(4);
    for (const snapshot of snapshots) {
      expect(validateDeckSnapshot(snapshot, context).ok, snapshot.deckSnapshotId).toBe(true);
      expect(computeDeckHash(snapshot)).toBe(snapshot.deckHash);
      expect(snapshot.publicMetadata).not.toHaveProperty("cards");
    }
  });

  it("creates editable local decks from templates", () => {
    const deck = createEditableDeckFromTemplate(templates[0]!, "2026-05-03T12:00:00.000Z");
    expect(deck.deckId).toMatch(/^local_/);
    expect(validateEditableDeck(deck, context).ok).toBe(true);
  });

  it("blocks import-only cards in playable decks", () => {
    const deck = createEditableDeckFromTemplate(templates.find((template) => template.side === "runner")!, "2026-05-03T12:00:00.000Z");
    deck.cards.push({ cardId: "catalog_preview_resource_001", quantity: 1 });
    const validation = validateEditableDeck(deck, context);
    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("not playable");
  });

  it("exports and imports local decks without changing validation", () => {
    const deck = createEditableDeckFromTemplate(templates[0]!, "2026-05-03T12:00:00.000Z");
    const imported = importDeck(exportDeck(deck), "2026-05-03T12:01:00.000Z");
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error("import failed");
    expect(validateEditableDeck(imported.deck, context).ok).toBe(true);
  });

  it("builds engine decks only from validated snapshots", () => {
    const snapshot = snapshots.find((candidate) => candidate.side === "corp")!;
    expect(validateDeckSnapshot(snapshot, context).ok).toBe(true);
    expect(buildEngineDeck(snapshot)).toEqual({
      id: snapshot.deckSnapshotId,
      name: snapshot.name,
      side: snapshot.side,
      identity: snapshot.identityCardId,
      cards: snapshot.cards.map((entry) => ({ id: entry.cardId, quantity: entry.quantity }))
    });
  });

  it("creates stable snapshots from equivalent deck content", () => {
    const deck = createEditableDeckFromTemplate(templates[0]!, "2026-05-03T12:00:00.000Z");
    const reversed = { ...deck, cards: deck.cards.slice().reverse() };
    const first = createDeckSnapshot(deck, context);
    const second = createDeckSnapshot(reversed, context);
    expect(first.deckHash).toBe(second.deckHash);
  });

  it("validates V0.8 starter snapshots and keeps public metadata decklist-free", () => {
    const runner = snapshots08.find((candidate) => candidate.deckSnapshotId === "demo_runner_008_snapshot_v0_8")!;
    const corp = snapshots08.find((candidate) => candidate.deckSnapshotId === "demo_corp_008_snapshot_v0_8")!;

    expect(validateDeckSnapshot(runner, context08).ok).toBe(true);
    expect(validateDeckSnapshot(corp, context08).ok).toBe(true);
    expect(computeDeckHash(runner)).toBe(runner.deckHash);
    expect(computeDeckHash(corp)).toBe(corp.deckHash);
    expect(corp.validation.agendaPoints).toBe(7);
    expect(runner.publicMetadata).not.toHaveProperty("cards");
    expect(corp.publicMetadata).not.toHaveProperty("cards");
    expect(buildEngineDeck(runner).id).toBe("demo_runner_008_snapshot_v0_8");
    expect(buildEngineDeck(corp).cards.some((entry) => entry.id === "v08_project_agenda")).toBe(true);
  });

  it("validates V1.2.3 O:NR human-playable snapshots through the runtime release gate", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById["onr_v1_021_dwarf"]) return;
    const contextV123 = { cardsById: runtimeCardsById, profile: profile08 };
    const runner = snapshots08.find((candidate) => candidate.deckSnapshotId === "demo_runner_123_snapshot_v1_2_3")!;
    const corp = snapshots08.find((candidate) => candidate.deckSnapshotId === "demo_corp_123_snapshot_v1_2_3")!;

    expect(validateDeckSnapshot(runner, contextV123)).toMatchObject({ ok: true, errors: [] });
    expect(validateDeckSnapshot(corp, contextV123)).toMatchObject({ ok: true, errors: [] });
    expect(computeDeckHash(runner)).toBe("fnv1a:f57f1d98");
    expect(computeDeckHash(corp)).toBe("fnv1a:03efc0db");
    expect(corp.validation.agendaPoints).toBe(7);
    expect(runner.cards.map((entry) => entry.cardId)).toEqual([
      "onr_v1_021_dwarf",
      "onr_v1_039_krash",
      "onr_v1_066_snowball",
      "onr_v1_074_worm",
      "onr_v1_081_custodial-position",
      "onr_v1_085_executive-wiretaps",
      "onr_v1_101_mit-west-tier"
    ]);
    for (const entry of [...runner.cards, ...corp.cards]) {
      const card = runtimeCardsById[entry.cardId];
      if (entry.cardId.startsWith("onr_v1_")) expect(card?.statuses.human_playable, entry.cardId).toBe(true);
    }
  });

  it("validates V1.3.0 private local format snapshots with versioned format metadata", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById["onr_v1_021_dwarf"]) return;
    const contextV130 = { cardsById: runtimeCardsById, profile: profile130 };
    const runner = snapshots08.find((candidate) => candidate.deckSnapshotId === "demo_runner_130_snapshot_v1_3_0")!;
    const corp = snapshots08.find((candidate) => candidate.deckSnapshotId === "demo_corp_130_snapshot_v1_3_0")!;

    expect(profile130.version).toBe("1.3.0");
    expect(profile130.scope).toBe("private_local");
    expect(validateDeckSnapshot(runner, contextV130)).toMatchObject({ ok: true, errors: [] });
    expect(validateDeckSnapshot(corp, contextV130)).toMatchObject({ ok: true, errors: [] });
    expect(computeDeckHash(runner)).toBe("fnv1a:1f64d517");
    expect(computeDeckHash(corp)).toBe("fnv1a:551ee643");
    expect(runner.formatProfileId).toBe("netgrid_private_local_v1");
    expect(runner.formatProfileVersion).toBe("1.3.0");
    expect(runner.cardPoolVersion).toBe("private-local-onr-v1");
    expect(corp.validation.agendaPoints).toBe(7);
    expect(corp.validation.influenceSpent).toBe(0);
    expect(runner.publicMetadata).not.toHaveProperty("cards");
    expect(corp.publicMetadata.formatProfileVersion).toBe("1.3.0");
  });

  it("keeps V1.3.0 format legality restrictive and reports concrete safe error codes", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById["onr_v1_018_dogcatcher"]) return;
    const contextV130 = { cardsById: runtimeCardsById, profile: profile130 };
    const runner = snapshots08.find((candidate) => candidate.deckSnapshotId === "demo_runner_130_snapshot_v1_3_0")!;

    const blockedCard = validateDeckSnapshot(
      {
        ...runner,
        cards: [...runner.cards, { cardId: "onr_v1_018_dogcatcher", quantity: 1 }],
        deckHash: computeDeckHash({ ...runner, cards: [...runner.cards, { cardId: "onr_v1_018_dogcatcher", quantity: 1 }] })
      },
      contextV130
    );
    expect(blockedCard.ok).toBe(false);
    expect(blockedCard.errorCodes).toContain("card_missing_required_status");
    expect(blockedCard.errorCodes).toContain("format_legal_requires_deck_legal");
    expect(blockedCard.errors.join(" ")).toContain("onr_v1_018_dogcatcher");

    const tooManyCopies: EditableDeck = {
      deckId: "local_v130_too_many_copies",
      deckVersion: "1.3.0-local",
      name: "Too Many Copies",
      side: "runner",
      identityCardId: "runner_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      cardPoolVersion: "private-local-onr-v1",
      formatProfileId: "netgrid_private_local_v1",
      formatProfileVersion: "1.3.0",
      cards: [{ cardId: "onr_v1_021_dwarf", quantity: 4 }],
      createdAt: "2026-05-08T12:00:00.000Z",
      updatedAt: "2026-05-08T12:00:00.000Z"
    };
    expect(validateEditableDeck(tooManyCopies, contextV130).errorCodes).toContain("too_many_copies");

    const influenceProfile: DeckFormatProfile = {
      ...profile130,
      identityRules: {
        ...profile130.identityRules!,
        runner: {
          runner_identity_001: {
            faction: "neutral_demo",
            minimumDeckCards: 12,
            allowedFactions: ["neutral_demo", "onr1996_neutral"],
            influenceLimit: 0
          }
        }
      },
      influence: {
        ...profile130.influence!,
        neutralFactions: ["neutral_demo"],
        defaultInfluenceCost: 1
      }
    };
    const influenceValidation = validateEditableDeck(
      {
        ...tooManyCopies,
        deckId: "local_v130_influence_limit",
        cards: [
          { cardId: "onr_v1_021_dwarf", quantity: 2 },
          { cardId: "onr_v1_039_krash", quantity: 2 },
          { cardId: "onr_v1_066_snowball", quantity: 2 },
          { cardId: "onr_v1_074_worm", quantity: 2 },
          { cardId: "onr_v1_081_custodial-position", quantity: 1 },
          { cardId: "onr_v1_085_executive-wiretaps", quantity: 1 },
          { cardId: "onr_v1_101_mit-west-tier", quantity: 2 }
        ]
      },
      { cardsById: runtimeCardsById, profile: influenceProfile }
    );
    expect(influenceValidation.errorCodes).toContain("influence_limit_exceeded");
    expect(influenceValidation.errors.join(" ")).not.toMatch(/decklist|cardInstances|sessionToken/i);
  });

  it("marks imported legacy local decks as needing revalidation without granting new legality", () => {
    const exported = JSON.stringify({
      deck: {
        deckId: "legacy_local_deck",
        deckVersion: "0.8.0-local",
        name: "Legacy",
        side: "runner",
        identityCardId: "runner_identity_001",
        cards: [{ cardId: "onr_v1_021_dwarf", quantity: 1 }],
        createdAt: "2026-05-08T12:00:00.000Z",
        updatedAt: "2026-05-08T12:00:00.000Z"
      }
    });
    const imported = importDeck(exported, "2026-05-08T12:01:00.000Z");
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error("import failed");
    expect(imported.deck.validationStatus).toBe("needs_revalidation");
    expect(imported.deck.formatProfileId).toBe("local-demo-v0.6");
  });

  it("validates V1.1.2K O:NR decks through the runtime release gate when the local overlay is present", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById["onr_v1_015_codeslinger"]) return;

    const contextV105K = { cardsById: runtimeCardsById, profile: profile08 };
    const now = "2026-05-05T12:00:00.000Z";
    const runnerDeck: EditableDeck = {
      deckId: "local_onr_runner_v105k_validation",
      deckVersion: "1.1.2k-local-onr",
      name: "O:NR V1.1.2K Runner Validation",
      side: "runner",
      identityCardId: "runner_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: "onr_v1_015_codeslinger", quantity: 2 },
        { cardId: "onr_v1_052_raffles", quantity: 2 },
        { cardId: "onr_v1_054_raptor", quantity: 2 },
        { cardId: "onr_v1_070_tinweasel", quantity: 2 },
        { cardId: "onr_v1_144_tycho-mem-chip", quantity: 1 },
        { cardId: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
        { cardId: "onr_v1_079_bodyweight-synthetic-blood", quantity: 1 },
        { cardId: "onr_v1_095_jack-n-joe", quantity: 1 },
        { cardId: "onr_v1_097_livewires-contacts", quantity: 1 },
        { cardId: "onr_v1_108_score", quantity: 1 },
        { cardId: "onr_v1_072_wild-card", quantity: 1 },
        { cardId: "onr_v1_145_wutech-mem-chip", quantity: 1 },
        { cardId: "onr_v1_006_black-dahlia", quantity: 1 },
        { cardId: "onr_v1_014_codecracker", quantity: 1 },
        { cardId: "onr_v1_016_cyfermaster", quantity: 1 },
        { cardId: "onr_v1_040_loony-goon", quantity: 1 },
        { cardId: "onr_v1_060_shaka", quantity: 1 },
        { cardId: "onr_v1_073_wizards-book", quantity: 1 },
        { cardId: "simple_economy_event", quantity: 2 }
      ],
      createdAt: now,
      updatedAt: now
    };
    const corpDeck: EditableDeck = {
      deckId: "local_onr_corp_v105k_validation",
      deckVersion: "1.1.2k-local-onr",
      name: "O:NR V1.1.2K Corp Validation",
      side: "corp",
      identityCardId: "corp_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: "onr_v1_203_hostile-takeover", quantity: 3 },
        { cardId: "simple_agenda", quantity: 3 },
        { cardId: "onr_v1_230_cortical-scanner", quantity: 2 },
        { cardId: "onr_v1_232_crystal-wall", quantity: 2 },
        { cardId: "onr_v1_237_data-wall", quantity: 2 },
        { cardId: "onr_v1_238_data-wall-2-0", quantity: 2 },
        { cardId: "onr_v1_239_endless-corridor", quantity: 2 },
        { cardId: "onr_v1_220_tycho-extension", quantity: 2 },
        { cardId: "onr_v1_281_accounts-receivable", quantity: 1 },
        { cardId: "onr_v1_282_annual-reviews", quantity: 1 },
        { cardId: "onr_v1_285_closed-accounts", quantity: 1 },
        { cardId: "onr_v1_287_datapool-by-zetatech", quantity: 1 },
        { cardId: "onr_v1_288_day-shift", quantity: 1 },
        { cardId: "onr_v1_290_efficiency-experts", quantity: 1 },
        { cardId: "onr_v1_301_punitive-counterstrike", quantity: 1 },
        { cardId: "onr_v1_302_scorched-earth", quantity: 1 },
        { cardId: "onr_v1_307_urban-renewal", quantity: 1 },
        { cardId: "onr_v1_244_filter", quantity: 1 },
        { cardId: "onr_v1_245_fire-wall", quantity: 1 },
        { cardId: "onr_v1_252_keeper", quantity: 1 },
        { cardId: "onr_v1_256_mazer", quantity: 1 },
        { cardId: "onr_v1_253_laser-wire", quantity: 1 },
        { cardId: "onr_v1_257_nerve-labyrinth", quantity: 1 },
        { cardId: "onr_v1_259_in-the-face", quantity: 1 },
        { cardId: "onr_v1_261_quandary", quantity: 1 },
        { cardId: "onr_v1_262_razor-wire", quantity: 1 },
        { cardId: "onr_v1_263_reinforced-wall", quantity: 1 },
        { cardId: "onr_v1_265_rock-is-strong", quantity: 1 },
        { cardId: "onr_v1_266_scramble", quantity: 1 },
        { cardId: "onr_v1_269_shotgun-wire", quantity: 1 },
        { cardId: "onr_v1_270_sleeper", quantity: 1 },
        { cardId: "onr_v1_278_wall-of-ice", quantity: 1 },
        { cardId: "onr_v1_279_wall-of-static", quantity: 1 },
        { cardId: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
        { cardId: "onr_v1_295_night-shift", quantity: 1 },
        { cardId: "simple_economy_operation", quantity: 2 }
      ],
      createdAt: now,
      updatedAt: now
    };

    expect(validateEditableDeck(runnerDeck, contextV105K).errors).toEqual([]);
    expect(validateEditableDeck(runnerDeck, contextV105K).ok).toBe(true);
    expect(validateEditableDeck(corpDeck, contextV105K).errors).toEqual([]);
    expect(validateEditableDeck(corpDeck, contextV105K).ok).toBe(true);

    const oldOnrDeck: EditableDeck = {
      ...runnerDeck,
      deckId: "local_onr_runner_v105k_blocked_old_card",
      cards: [...runnerDeck.cards, { cardId: "onr_v1_018_dogcatcher", quantity: 1 }]
    };
    const blocked = validateEditableDeck(oldOnrDeck, contextV105K);
    expect(blocked.ok).toBe(false);
    expect(blocked.errors.join(" ")).toContain("onr_v1_018_dogcatcher");
  });
});
