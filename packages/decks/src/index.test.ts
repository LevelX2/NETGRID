import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import snapshotData from "../../../data/card-import/card-snapshot-0.5.json";
import snapshotData08 from "../../../data/card-import/card-snapshot-0.8.json";
import profilesData from "../../../data/decks/deck-format-profiles-0.6.json";
import profilesData08 from "../../../data/decks/deck-format-profiles-0.8.json";
import profilesData130 from "../../../data/decks/deck-format-profiles-1.3.0.json";
import classicPlaytestDecksData from "../../../data/decks/classic-playtest-decks-2026-07-01.json";
import standardDeckCatalogData from "../../../data/decks/standard-deck-catalog-1.0.0.json";
import standardDeckCurationData from "../../../data/decks/standard-deck-curation-2026-07-18.json";
import templatesData from "../../../data/decks/deck-templates-0.6.json";
import snapshotsData from "../../../data/decks/deck-snapshots-0.6.json";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import classicEditableDecksData from "../../../docs/derived/classic-high-share-editable-decks-2026-07-01.json";
import {
  buildEngineDeck,
  computeDeckHash,
  createDeckSnapshot,
  createEditableDeckFromTemplate,
  DeckCardIdentifierError,
  exportDeck,
  importDeck,
  validateDeckSnapshot,
  validateEditableDeck,
  type DeckFormatProfile,
  type DeckSnapshot,
  type DeckTemplate,
  type EditableDeck,
} from "./index";
import { createRuntimeCardsById, type CatalogCard } from "@netgrid/catalog";

const cardsById = Object.fromEntries(
  (snapshotData.cards as unknown as CatalogCard[]).map((card) => [
    card.catalogCardId,
    card,
  ]),
);
const profile = profilesData.profiles[0] as DeckFormatProfile;
const templates = templatesData.templates as DeckTemplate[];
const snapshots = snapshotsData.snapshots as DeckSnapshot[];
const context = { cardsById, profile };
const cardsById08 = Object.fromEntries(
  (snapshotData08.cards as unknown as CatalogCard[]).map((card) => [
    card.catalogCardId,
    card,
  ]),
);
const profile08 = (profilesData08.profiles as DeckFormatProfile[]).find(
  (candidate) => candidate.profileId === "local-demo-v0.8",
)!;
const profile130 = (profilesData130.profiles as DeckFormatProfile[]).find(
  (candidate) => candidate.profileId === "netgrid_private_local_v1",
)!;
const profileProteus = (profilesData130.profiles as DeckFormatProfile[]).find(
  (candidate) =>
    candidate.profileId === "netgrid_private_local_proteus_playtest_v1",
)!;
const profileClassic = (profilesData130.profiles as DeckFormatProfile[]).find(
  (candidate) =>
    candidate.profileId === "netgrid_private_local_classic_playtest_v1",
)!;
const profileClassicProteus = (
  profilesData130.profiles as DeckFormatProfile[]
).find(
  (candidate) =>
    candidate.profileId === "netgrid_private_local_classic_proteus_playtest_v1",
)!;
const snapshots08 = snapshotsData08.snapshots as DeckSnapshot[];
const context08 = { cardsById: cardsById08, profile: profile08 };

type ClassicPlaytestSourceDeck = {
  side: "runner" | "corp";
  totalCards: number;
  classicCards: number;
  originalsetCards: number;
  agendaPoints?: number;
  legalities: { appMatchstartLegal: boolean; aiSupported: boolean };
  cards: Array<{ id: number; quantity: number }>;
};

type ClassicEditableDeckEntry = {
  classicCards: number;
  originalsetCards: number;
  classicShare: number;
  deck: EditableDeck;
};

type StandardDeckCatalogEntry = {
  standardDeckId: string;
  version: string;
  status: "active";
  name: string;
  side: "runner" | "corp";
  identityCardId: number;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  cards: Array<{ cardId: number; quantity: number }>;
  source: {
    kind: "curated_local_deck";
    sourceDeckId: string;
    sourceDeckVersion: string;
  };
};

describe("deck validation and snapshots", () => {
  it("keeps the curated standard-deck catalog unique, complete, and match-valid", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const profiles = [
      ...(profilesData08.profiles as DeckFormatProfile[]),
      ...(profilesData130.profiles as DeckFormatProfile[]),
    ];
    const entries = standardDeckCatalogData.decks as StandardDeckCatalogEntry[];
    const localCuration = standardDeckCurationData.localDeckLibrary;
    const projectCuration = standardDeckCurationData.projectSnapshots;

    expect(entries).toHaveLength(57);
    expect(new Set(entries.map((entry) => entry.standardDeckId)).size).toBe(
      entries.length,
    );
    expect(localCuration.counts).toEqual({
      standard: 57,
      internal_ai: 2,
      retire: 1,
      test_fixture: 10,
    });
    expect(projectCuration.counts).toEqual({
      test_fixture: 10,
      internal_ai: 11,
    });
    expect(
      localCuration.entries.filter(
        (entry) => entry.classification === "standard",
      ),
    ).toHaveLength(entries.length);
    expect(
      projectCuration.entries.every(
        (entry) => entry.classification !== "standard",
      ),
    ).toBe(true);

    for (const entry of entries) {
      const profile = profiles.find(
        (candidate) => candidate.profileId === entry.formatProfileId,
      );
      expect(
        profile,
        `missing profile for ${entry.standardDeckId}`,
      ).toBeDefined();
      const deck: EditableDeck = {
        deckId: entry.standardDeckId,
        deckVersion: entry.version,
        name: entry.name,
        side: entry.side,
        identityCardId: entry.identityCardId,
        cardPoolSnapshotId: entry.cardPoolSnapshotId,
        ...(entry.cardPoolVersion
          ? { cardPoolVersion: entry.cardPoolVersion }
          : {}),
        formatProfileId: entry.formatProfileId,
        ...(entry.formatProfileVersion
          ? { formatProfileVersion: entry.formatProfileVersion }
          : {}),
        cards: entry.cards,
        createdAt: "2026-07-18T00:00:00.000Z",
        updatedAt: "2026-07-18T00:00:00.000Z",
      };
      const validation = validateEditableDeck(deck, {
        cardsById: runtimeCardsById,
        profile: profile!,
      });
      expect(
        validation.errors,
        `${entry.standardDeckId}: ${validation.errors.join(" | ")}`,
      ).toEqual([]);
      expect(validation.ok).toBe(true);
      if (entry.side === "corp") {
        expect(profile!.agenda?.policy).toBe("official_size_range");
      }
    }
  });

  it("keeps Counter Shell on its exact 45-card and 20-point list", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const entry = (
      standardDeckCatalogData.decks as StandardDeckCatalogEntry[]
    ).find(
      (candidate) => candidate.standardDeckId === "standard_corp_counter_shell",
    );

    expect(entry).toMatchObject({
      version: "1.3.0",
      name: "Counter Shell",
      side: "corp",
      cardPoolVersion: "private-local-onr-v1-plus-proteus-playtest",
      formatProfileId: "netgrid_private_local_proteus_playtest_v1",
    });
    expect(entry?.cards).toEqual([
      { cardId: 426, quantity: 2 },
      { cardId: 66, quantity: 2 },
      { cardId: 65, quantity: 1 },
      { cardId: 411, quantity: 3 },
      { cardId: 417, quantity: 1 },
      { cardId: 503, quantity: 1 },
      { cardId: 517, quantity: 3 },
      { cardId: 559, quantity: 3 },
      { cardId: 560, quantity: 3 },
      { cardId: 558, quantity: 2 },
      { cardId: 540, quantity: 1 },
      { cardId: 524, quantity: 1 },
      { cardId: 120, quantity: 1 },
      { cardId: 502, quantity: 3 },
      { cardId: 507, quantity: 2 },
      { cardId: 493, quantity: 3 },
      { cardId: 96, quantity: 2 },
      { cardId: 90, quantity: 2 },
      { cardId: 473, quantity: 1 },
      { cardId: 75, quantity: 3 },
      { cardId: 457, quantity: 3 },
      { cardId: 491, quantity: 1 },
      { cardId: 475, quantity: 1 },
    ]);
    expect(entry?.cards.reduce((total, card) => total + card.quantity, 0)).toBe(
      45,
    );
    expect(
      entry?.cards.reduce(
        (total, card) =>
          total +
          card.quantity *
            (runtimeCardsById[card.cardId]?.numeric.agendaPoints ?? 0),
        0,
      ),
    ).toBe(20);
  });

  it("keeps Lucidrine Lockdown on its exact 45-card and 21-point counter list", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const entry = (
      standardDeckCatalogData.decks as StandardDeckCatalogEntry[]
    ).find(
      (candidate) =>
        candidate.standardDeckId === "standard_corp_lucidrine_lockdown",
    );

    expect(entry).toMatchObject({
      version: "1.5.0",
      name: "Lucidrine Lockdown",
      side: "corp",
      cardPoolVersion: "private-local-onr-v1-plus-proteus-playtest",
      formatProfileId: "netgrid_private_local_proteus_playtest_v1",
    });
    expect(entry?.cards).toEqual([
      { cardId: 62, quantity: 3 },
      { cardId: 424, quantity: 1 },
      { cardId: 408, quantity: 3 },
      { cardId: 559, quantity: 3 },
      { cardId: 509, quantity: 1 },
      { cardId: 504, quantity: 2 },
      { cardId: 516, quantity: 2 },
      { cardId: 578, quantity: 3 },
      { cardId: 502, quantity: 3 },
      { cardId: 507, quantity: 3 },
      { cardId: 493, quantity: 3 },
      { cardId: 97, quantity: 3 },
      { cardId: 90, quantity: 3 },
      { cardId: 96, quantity: 3 },
      { cardId: 473, quantity: 3 },
      { cardId: 75, quantity: 3 },
      { cardId: 457, quantity: 3 },
    ]);
    expect(entry?.cards.reduce((total, card) => total + card.quantity, 0)).toBe(
      45,
    );
    expect(
      entry?.cards.reduce(
        (total, card) =>
          total +
          card.quantity *
            (runtimeCardsById[card.cardId]?.numeric.agendaPoints ?? 0),
        0,
      ),
    ).toBe(21);
  });

  it("keeps Ghost Circuit v2 on its exact Originalset stealth recon list", () => {
    const entry = (
      standardDeckCatalogData.decks as StandardDeckCatalogEntry[]
    ).find(
      (candidate) =>
        candidate.standardDeckId === "standard_runner_ghost_circuit",
    );

    expect(entry).toMatchObject({
      version: "2.0.0",
      name: "Ghost Circuit",
      side: "runner",
      cardPoolVersion: "private-local-onr-v1",
    });
    expect(entry?.cards).toEqual([
      { cardId: 223, quantity: 1 },
      { cardId: 226, quantity: 1 },
      { cardId: 228, quantity: 1 },
      { cardId: 233, quantity: 1 },
      { cardId: 242, quantity: 1 },
      { cardId: 247, quantity: 2 },
      { cardId: 252, quantity: 1 },
      { cardId: 266, quantity: 1 },
      { cardId: 271, quantity: 2 },
      { cardId: 275, quantity: 1 },
      { cardId: 277, quantity: 2 },
      { cardId: 283, quantity: 2 },
      { cardId: 291, quantity: 1 },
      { cardId: 303, quantity: 1 },
      {
        cardId: 304,
        quantity: 2,
      },
      { cardId: 306, quantity: 2 },
      { cardId: 307, quantity: 3 },
      { cardId: 309, quantity: 3 },
      { cardId: 320, quantity: 3 },
      { cardId: 324, quantity: 1 },
      { cardId: 326, quantity: 2 },
      { cardId: 341, quantity: 2 },
      { cardId: 351, quantity: 2 },
      { cardId: 356, quantity: 2 },
      { cardId: 361, quantity: 1 },
      { cardId: 373, quantity: 2 },
      { cardId: 390, quantity: 2 },
    ]);
    expect(entry?.cards.reduce((total, card) => total + card.quantity, 0)).toBe(
      45,
    );
  });

  it("validates every frozen V0.6 deck snapshot", () => {
    expect(snapshots).toHaveLength(4);
    for (const snapshot of snapshots) {
      expect(
        validateDeckSnapshot(snapshot, context).ok,
        snapshot.deckSnapshotId,
      ).toBe(true);
      expect(computeDeckHash(snapshot)).toBe(snapshot.deckHash);
      expect(snapshot.publicMetadata).not.toHaveProperty("cards");
    }
  });

  it("creates editable local decks from templates", () => {
    const deck = createEditableDeckFromTemplate(
      templates[0]!,
      "2026-05-03T12:00:00.000Z",
    );
    expect(deck.deckId).toMatch(/^local_/);
    expect(validateEditableDeck(deck, context).ok).toBe(true);
  });

  it("blocks import-only cards in playable decks", () => {
    const deck = createEditableDeckFromTemplate(
      templates.find((template) => template.side === "runner")!,
      "2026-05-03T12:00:00.000Z",
    );
    deck.cards.push({ cardId: 2, quantity: 1 });
    const validation = validateEditableDeck(deck, context);
    expect(validation.ok).toBe(false);
    expect(validation.errors.join(" ")).toContain("not playable");
  });

  it("exports and imports local decks without changing validation", () => {
    const deck = createEditableDeckFromTemplate(
      templates[0]!,
      "2026-05-03T12:00:00.000Z",
    );
    const imported = importDeck(exportDeck(deck), "2026-05-03T12:01:00.000Z");
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error("import failed");
    expect(validateEditableDeck(imported.deck, context).ok).toBe(true);
  });

  it("rejects string card IDs before normalizing an otherwise valid deck", () => {
    const deck = createEditableDeckFromTemplate(
      templates[0]!,
      "2026-05-03T12:00:00.000Z",
    );
    expect(validateEditableDeck(deck, context).ok).toBe(true);
    const invalidDeck = {
      ...deck,
      cards: [
        ...deck.cards,
        { cardId: String(deck.cards[0]!.cardId), quantity: 1 },
      ],
    };
    expect(() =>
      validateEditableDeck(invalidDeck as unknown as EditableDeck, context),
    ).toThrow(DeckCardIdentifierError);
  });

  it("builds engine decks only from validated snapshots", () => {
    const snapshot = snapshots.find((candidate) => candidate.side === "corp")!;
    expect(validateDeckSnapshot(snapshot, context).ok).toBe(true);
    expect(buildEngineDeck(snapshot)).toEqual({
      id: snapshot.deckSnapshotId,
      name: snapshot.name,
      side: snapshot.side,
      identity: snapshot.identityCardId,
      cards: snapshot.cards.map((entry) => ({
        id: entry.cardId,
        quantity: entry.quantity,
      })),
    });
  });

  it("creates stable snapshots from equivalent deck content", () => {
    const deck = createEditableDeckFromTemplate(
      templates[0]!,
      "2026-05-03T12:00:00.000Z",
    );
    const reversed = { ...deck, cards: deck.cards.slice().reverse() };
    const first = createDeckSnapshot(deck, context);
    const second = createDeckSnapshot(reversed, context);
    expect(first.deckHash).toBe(second.deckHash);
  });

  it("validates V0.8 starter snapshots and keeps public metadata decklist-free", () => {
    const runner = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "demo_runner_008_snapshot_v0_8",
    )!;
    const corp = snapshots08.find(
      (candidate) => candidate.deckSnapshotId === "demo_corp_008_snapshot_v0_8",
    )!;

    expect(validateDeckSnapshot(runner, context08).ok).toBe(true);
    expect(validateDeckSnapshot(corp, context08).ok).toBe(true);
    expect(computeDeckHash(runner)).toBe(runner.deckHash);
    expect(computeDeckHash(corp)).toBe(corp.deckHash);
    expect(corp.validation.agendaPoints).toBe(7);
    expect(runner.publicMetadata).not.toHaveProperty("cards");
    expect(corp.publicMetadata).not.toHaveProperty("cards");
    expect(buildEngineDeck(runner).id).toBe("demo_runner_008_snapshot_v0_8");
    expect(
      buildEngineDeck(corp).cards.some(
        (entry) => entry.id === 617,
      ),
    ).toBe(true);
  });

  it("validates V1.2.3 O:NR human-playable snapshots through the runtime release gate", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById[233]) return;
    const contextV123 = { cardsById: runtimeCardsById, profile: profile08 };
    const runner = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "demo_runner_123_snapshot_v1_2_3",
    )!;
    const corp = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "demo_corp_123_snapshot_v1_2_3",
    )!;

    expect(validateDeckSnapshot(runner, contextV123)).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(validateDeckSnapshot(corp, contextV123)).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(computeDeckHash(runner)).toBe("fnv1a:6ce0beca");
    expect(computeDeckHash(corp)).toBe("fnv1a:38f53ef0");
    expect(corp.validation.agendaPoints).toBe(7);
    expect(runner.cards.map((entry) => entry.cardId)).toEqual([
      233,
      251,
      278,
      286,
      293,
      297,
      313,
    ]);
    for (const entry of [...runner.cards, ...corp.cards]) {
      const card = runtimeCardsById[entry.cardId];
      if (card?.setId === "originalset-v1")
        expect(card?.statuses.human_playable, String(entry.cardId)).toBe(true);
    }
  });

  it("validates V1.3.0 private local format snapshots with versioned format metadata", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById[233]) return;
    const contextV130 = { cardsById: runtimeCardsById, profile: profile130 };
    const runner = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "demo_runner_130_snapshot_v1_3_0",
    )!;
    const corp = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "demo_corp_130_snapshot_v1_3_0",
    )!;

    expect(profile130.version).toBe("1.3.0");
    expect(profile130.scope).toBe("private_local");
    expect(validateDeckSnapshot(runner, contextV130)).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(
      validateDeckSnapshot(corp, {
        cardsById: runtimeCardsById,
        profile: profile08,
      }),
    ).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(computeDeckHash(runner)).toBe("fnv1a:58c6c28f");
    expect(computeDeckHash(corp)).toBe("fnv1a:a704f37a");
    expect(runner.formatProfileId).toBe("netgrid_private_local_v1");
    expect(runner.formatProfileVersion).toBe("1.3.0");
    expect(runner.cardPoolVersion).toBe("private-local-onr-v1");
    expect(corp.validation.agendaPoints).toBe(7);
    expect(corp.validation.influenceSpent).toBeNull();
    expect(runner.publicMetadata).not.toHaveProperty("cards");
    expect(corp.publicMetadata.formatProfileId).toBe("local-demo-v0.8");
    expect(corp.publicMetadata.formatProfileVersion).toBeUndefined();
  });

  it("validates Proteus playtest snapshots through deck legality and AI support", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById[59]) return;
    const contextProteus = {
      cardsById: runtimeCardsById,
      profile: profileProteus,
    };
    const proteusSnapshots = snapshots08.filter((candidate) =>
      candidate.deckSnapshotId.startsWith("proteus_"),
    );

    expect(profileProteus.allowedCardStatuses).toEqual([
      "playable",
      "human_playable",
      "deck_legal",
    ]);
    expect(profileProteus.formatLegal).toMatchObject({
      requiresDeckLegal: true,
      requiresHumanPlayable: true,
    });
    expect(
      Object.values(runtimeCardsById)
        .filter((card) => card.setId === "proteus")
        .every(
          (card) =>
            card.statuses.human_playable === true &&
            card.statuses.deck_legal === true &&
            card.statuses.format_legal === true &&
            card.statuses.ai_supported === true,
        ),
    ).toBe(true);
    expect(proteusSnapshots).toHaveLength(4);
    for (const snapshot of proteusSnapshots) {
      expect(
        validateDeckSnapshot(
          snapshot,
          snapshot.side === "corp"
            ? { cardsById: runtimeCardsById, profile: profile08 }
            : contextProteus,
        ),
      ).toMatchObject({
        ok: true,
        errors: [],
      });
      expect(
        snapshot.cards.reduce((sum, entry) => sum + entry.quantity, 0),
      ).toBeGreaterThanOrEqual(45);
      expect(snapshot.publicMetadata).not.toHaveProperty("cards");
    }

    const allProteusDeck = createDeckSnapshot(
      {
        deckId: "all_proteus_runner_probe",
        deckVersion: "test",
        name: "All Proteus Runner Probe",
        side: "runner",
        identityCardId: 587,
        cardPoolSnapshotId: profileProteus.cardPoolSnapshotId,
        cardPoolVersion: profileProteus.cardPoolVersion!,
        formatProfileId: profileProteus.profileId,
        formatProfileVersion: profileProteus.version!,
        cards: Object.values(runtimeCardsById)
          .filter(
            (card) =>
              card.setId === "proteus" &&
              card.side === "runner",
          )
          .slice(0, 45)
          .map((card) => ({ cardId: card.catalogCardId, quantity: 1 })),
        createdAt: "2026-05-25T00:00:00.000Z",
        updatedAt: "2026-05-25T00:00:00.000Z",
      },
      contextProteus,
      { snapshotId: "all_proteus_runner_probe_snapshot" },
    );
    expect(allProteusDeck.validation).toMatchObject({ ok: true, errors: [] });
    expect(
      allProteusDeck.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);
  });

  it("loads additive Classic format profiles for Classic AI play", () => {
    const classicRunnerIdentityRules =
      profileClassic.identityRules?.runner[587];
    const classicProteusCorpIdentityRules =
      profileClassicProteus.identityRules?.corp[3];

    expect(profileClassic.cardPoolVersion).toBe(
      "private-local-onr-v1-plus-classic-playtest",
    );
    expect(classicRunnerIdentityRules).toBeDefined();
    expect(classicRunnerIdentityRules?.allowedFactions).toEqual([
      "neutral_demo",
      "onr1996_neutral",
      "onr_classic",
    ]);
    expect(profileClassicProteus.cardPoolVersion).toBe(
      "private-local-onr-v1-plus-classic-proteus-playtest",
    );
    expect(classicProteusCorpIdentityRules).toBeDefined();
    expect(classicProteusCorpIdentityRules?.allowedFactions).toEqual([
      "neutral_demo",
      "onr1996_neutral",
      "onr_classic",
      "onr_proteus",
    ]);
    expect(profileClassic.allowedIdentityCards.runner).toEqual([
      587,
    ]);
    expect(profileClassicProteus.allowedIdentityCards.corp).toEqual([
      3,
    ]);
    expect(profileClassic.minimumDeckCards).toEqual({ runner: 45, corp: 45 });
    expect(profileClassic.ai?.requireAiSupportedForAiDecks).toBe(true);
  });

  it("validates the versioned King of the Road Runner AI snapshot from the local deck shape", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById[218]) return;
    const contextV130 = { cardsById: runtimeCardsById, profile: profile130 };
    const snapshot = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "king_of_the_road_runner_ai_snapshot_v1",
    )!;

    expect(snapshot.sourceDeckId).toBe("local_runner_adb10896");
    expect(snapshot.name).toBe("King of the Road");
    expect(snapshot.side).toBe("runner");
    expect(snapshot.formatProfileId).toBe("netgrid_private_local_v1");
    expect(snapshot.formatProfileVersion).toBe("1.3.0");
    expect(snapshot.cardPoolVersion).toBe("private-local-onr-v1");
    expect(validateDeckSnapshot(snapshot, contextV130)).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(computeDeckHash(snapshot)).toBe("fnv1a:8325ac5b");
    expect(snapshot.cards).toHaveLength(14);
    expect(snapshot.cards.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(
      19,
    );
    expect(snapshot.publicMetadata).not.toHaveProperty("cards");
    expect(JSON.stringify(snapshot.publicMetadata)).not.toMatch(
      /onr_v1_|cardInstances|privatePayload|sessionToken|joinToken|tokenHash/i,
    );
    expect(
      snapshot.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);

    const localPath = `${process.env.APPDATA ?? ""}\\NetGrid\\Decks\\local_runner_adb10896.json`;
    if (process.env.APPDATA && existsSync(localPath)) {
      const localDeck = JSON.parse(readFileSync(localPath, "utf8")) as {
        deck: EditableDeck;
      };
      const localCards = localDeck.deck.cards
        .slice()
        .sort((left, right) => left.cardId - right.cardId);
      if (localCards.length === snapshot.cards.length) {
        expect(snapshot.cards).toEqual(localCards);
        expect(snapshot.name).toBe(localDeck.deck.name);
      }
    }
  });

  it("validates the O:NR origins AI snapshots and variant snapshots for both sides", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById[415]) return;
    const contextV130 = { cardsById: runtimeCardsById, profile: profile130 };
    const runner = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "onr_origin_runner_ai_snapshot_v1",
    )!;
    const corp = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "onr_origin_corp_ai_snapshot_v1",
    )!;
    const runnerVariant = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId ===
        "onr_origin_runner_ai_event_pressure_snapshot_v1",
    )!;
    const corpVariant = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "onr_origin_corp_ai_tag_ops_snapshot_v1",
    )!;

    expect(runner.name).toBe("Runner Origins AI - Probe Pressure");
    expect(corp.name).toBe("Corp Origins AI - Tax & Punish");
    expect(runnerVariant.name).toBe("Runner Origins AI - Event Pressure");
    expect(corpVariant.name).toBe("Corp Origins AI - Tag Ops Control");
    expect(validateDeckSnapshot(runner, contextV130)).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(
      validateDeckSnapshot(corp, {
        cardsById: runtimeCardsById,
        profile: profile08,
      }),
    ).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(validateDeckSnapshot(runnerVariant, contextV130)).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(
      validateDeckSnapshot(corpVariant, {
        cardsById: runtimeCardsById,
        profile: profile08,
      }),
    ).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(computeDeckHash(runner)).toBe("fnv1a:0037ec1a");
    expect(computeDeckHash(corp)).toBe("fnv1a:5fb92fd3");
    expect(computeDeckHash(runnerVariant)).toBe("fnv1a:27979ffc");
    expect(computeDeckHash(corpVariant)).toBe("fnv1a:2777b868");
    expect(runner.cards.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(
      20,
    );
    expect(
      runnerVariant.cards.reduce((sum, entry) => sum + entry.quantity, 0),
    ).toBe(21);
    expect(corp.validation.agendaPoints).toBeGreaterThanOrEqual(7);
    expect(corpVariant.validation.agendaPoints).toBeGreaterThanOrEqual(7);
    expect(
      runner.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);
    expect(
      corp.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);
    expect(
      runnerVariant.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);
    expect(
      corpVariant.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);
  });

  it("validates the Classic AI snapshots for both sides", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const contextClassic = {
      cardsById: runtimeCardsById,
      profile: profileClassic,
    };
    const runner = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "classic_runner_ai_snapshot_v1",
    )!;
    const corp = snapshots08.find(
      (candidate) => candidate.deckSnapshotId === "classic_corp_ai_snapshot_v1",
    )!;

    expect(runner.name).toBe("Classic Runner AI - Toolbox Pressure");
    expect(corp.name).toBe("Classic Corp AI - Agenda Tax Control");
    expect(validateDeckSnapshot(runner, contextClassic)).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(
      validateDeckSnapshot(corp, {
        cardsById: runtimeCardsById,
        profile: profile08,
      }),
    ).toMatchObject({
      ok: true,
      errors: [],
    });
    expect(computeDeckHash(runner)).toBe("fnv1a:a057d19d");
    expect(computeDeckHash(corp)).toBe("fnv1a:bf186b7c");
    expect(runner.cards.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(
      45,
    );
    expect(corp.cards.reduce((sum, entry) => sum + entry.quantity, 0)).toBe(45);
    expect(corp.validation.agendaPoints).toBeGreaterThanOrEqual(7);
    expect(
      runner.cards.every((entry) => runtimeCardsById[entry.cardId]?.setId === "classic"),
    ).toBe(true);
    expect(
      corp.cards.every((entry) => runtimeCardsById[entry.cardId]?.setId === "classic"),
    ).toBe(true);
    expect(
      runner.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);
    expect(
      corp.cards.every(
        (entry) =>
          runtimeCardsById[entry.cardId]?.statuses.ai_supported === true,
      ),
    ).toBe(true);
  });

  it("keeps Classic mechanic fixtures separate from normal Corp agenda legality", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const contextClassic = {
      cardsById: runtimeCardsById,
      profile: profileClassic,
    };
    const sourceDecks =
      classicPlaytestDecksData.decks as ClassicPlaytestSourceDeck[];
    const editableDecks =
      classicEditableDecksData.decks as ClassicEditableDeckEntry[];

    expect(sourceDecks).toHaveLength(4);
    expect(editableDecks).toHaveLength(4);
    expect(
      editableDecks.filter((entry) => entry.deck.side === "runner"),
    ).toHaveLength(2);
    expect(
      editableDecks.filter((entry) => entry.deck.side === "corp"),
    ).toHaveLength(2);

    for (const sourceDeck of sourceDecks) {
      const totalCards = sourceDeck.cards.reduce(
        (sum, entry) => sum + entry.quantity,
        0,
      );
      const agendaPoints = sourceDeck.cards.reduce(
        (sum, entry) =>
          sum +
          (runtimeCardsById[entry.id]?.numeric.agendaPoints ?? 0) *
            entry.quantity,
        0,
      );
      expect(totalCards).toBe(45);
      expect(sourceDeck.totalCards).toBe(totalCards);
      expect(sourceDeck.classicCards).toBe(45);
      expect(sourceDeck.originalsetCards).toBe(0);
      expect(sourceDeck.legalities.appMatchstartLegal).toBe(
        sourceDeck.side === "runner",
      );
      expect(sourceDeck.legalities.aiSupported).toBe(true);
      for (const entry of sourceDeck.cards) {
        expect(entry.quantity).toBeLessThanOrEqual(3);
        expect(runtimeCardsById[entry.id]?.setId === "classic").toBe(true);
        expect(runtimeCardsById[entry.id]?.side).toBe(sourceDeck.side);
        expect(runtimeCardsById[entry.id]?.statuses.ai_supported).toBe(true);
      }
      if (sourceDeck.side === "corp") {
        expect(sourceDeck.agendaPoints).toBe(agendaPoints);
        expect(agendaPoints).toBeGreaterThanOrEqual(7);
      }
    }

    for (const entry of editableDecks) {
      const validation = validateEditableDeck(entry.deck, contextClassic);
      if (entry.deck.side === "corp") {
        expect(validation.ok).toBe(false);
        expect(validation.errorCodes).toContain("agenda_points_too_low");
      } else expect(validation).toMatchObject({ ok: true, errors: [] });
      expect(validation.totalCards).toBe(45);
      expect(entry.classicCards).toBe(45);
      expect(entry.originalsetCards).toBe(0);
      expect(entry.classicShare).toBe(1);
      expect(entry.deck.cardPoolVersion).toBe(
        "private-local-onr-v1-plus-classic-playtest",
      );
      expect(entry.deck.formatProfileId).toBe(
        "netgrid_private_local_classic_playtest_v1",
      );
      expect(
        entry.deck.cards.every((card) =>
          runtimeCardsById[card.cardId]?.setId === "classic",
        ),
      ).toBe(true);
    }
  });

  it("keeps V1.3.0 format legality restrictive and reports concrete safe error codes", () => {
    const runtimeCardsById = createRuntimeCardsById();
    const baseBlockedCard = runtimeCardsById[232];
    if (!baseBlockedCard) return;
    const blockedCardId = 920;
    const contextV130 = {
      cardsById: {
        ...runtimeCardsById,
        [blockedCardId]: {
          ...baseBlockedCard,
          catalogCardId: blockedCardId,
          engineCardId: blockedCardId,
          statuses: {
            ...baseBlockedCard.statuses,
            human_playable: false,
            deck_legal: false,
            format_legal: false,
          },
        },
      },
      profile: profile130,
    };
    const runner = snapshots08.find(
      (candidate) =>
        candidate.deckSnapshotId === "demo_runner_130_snapshot_v1_3_0",
    )!;

    const blockedCard = validateDeckSnapshot(
      {
        ...runner,
        cards: [...runner.cards, { cardId: blockedCardId, quantity: 1 }],
        deckHash: computeDeckHash({
          ...runner,
          cards: [...runner.cards, { cardId: blockedCardId, quantity: 1 }],
        }),
      },
      contextV130,
    );
    expect(blockedCard.ok).toBe(false);
    expect(blockedCard.errorCodes).toContain("card_missing_required_status");
    expect(blockedCard.errorCodes).toContain(
      "format_legal_requires_deck_legal",
    );
    expect(blockedCard.errors.join(" ")).toContain(blockedCardId);

    const tooManyCopies: EditableDeck = {
      deckId: "local_v130_too_many_copies",
      deckVersion: "1.3.0-local",
      name: "Too Many Copies",
      side: "runner",
      identityCardId: 587,
      cardPoolSnapshotId: "card-snapshot-0.8",
      cardPoolVersion: "private-local-onr-v1",
      formatProfileId: "netgrid_private_local_v1",
      formatProfileVersion: "1.3.0",
      cards: [{ cardId: 233, quantity: 4 }],
      createdAt: "2026-05-08T12:00:00.000Z",
      updatedAt: "2026-05-08T12:00:00.000Z",
    };
    expect(
      validateEditableDeck(tooManyCopies, contextV130).errorCodes,
    ).toContain("too_many_copies");

    const influenceProfile: DeckFormatProfile = {
      ...profile130,
      identityRules: {
        ...profile130.identityRules!,
        runner: {
          587: {
            faction: "neutral_demo",
            minimumDeckCards: 12,
            allowedFactions: ["neutral_demo", "onr1996_neutral"],
            influenceLimit: 0,
          },
        },
      },
      influence: {
        ...profile130.influence!,
        neutralFactions: ["neutral_demo"],
        defaultInfluenceCost: 1,
      },
    };
    const influenceValidation = validateEditableDeck(
      {
        ...tooManyCopies,
        deckId: "local_v130_influence_limit",
        cards: [
          { cardId: 233, quantity: 2 },
          { cardId: 251, quantity: 2 },
          { cardId: 278, quantity: 2 },
          { cardId: 286, quantity: 2 },
          { cardId: 293, quantity: 1 },
          { cardId: 297, quantity: 1 },
          { cardId: 313, quantity: 2 },
        ],
      },
      { cardsById: runtimeCardsById, profile: influenceProfile },
    );
    expect(influenceValidation.errorCodes).toContain(
      "influence_limit_exceeded",
    );
    expect(influenceValidation.errors.join(" ")).not.toMatch(
      /decklist|cardInstances|sessionToken/i,
    );
  });

  it("marks imported legacy local decks as needing revalidation without granting new legality", () => {
    const exported = JSON.stringify({
      deck: {
        deckId: "legacy_local_deck",
        deckVersion: "0.8.0-local",
        name: "Legacy",
        side: "runner",
        identityCardId: 587,
        cards: [{ cardId: 233, quantity: 1 }],
        createdAt: "2026-05-08T12:00:00.000Z",
        updatedAt: "2026-05-08T12:00:00.000Z",
      },
    });
    const imported = importDeck(exported, "2026-05-08T12:01:00.000Z");
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error("import failed");
    expect(imported.deck.validationStatus).toBe("needs_revalidation");
    expect(imported.deck.formatProfileId).toBe("local-demo-v0.6");
  });

  it("validates V1.1.2K O:NR decks through the runtime release gate when the local overlay is present", () => {
    const runtimeCardsById = createRuntimeCardsById();
    if (!runtimeCardsById[227]) return;

    const contextV105K = { cardsById: runtimeCardsById, profile: profile08 };
    const now = "2026-05-05T12:00:00.000Z";
    const runnerDeck: EditableDeck = {
      deckId: "local_onr_runner_v105k_validation",
      deckVersion: "1.1.2k-local-onr",
      name: "O:NR V1.1.2K Runner Validation",
      side: "runner",
      identityCardId: 587,
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: 227, quantity: 2 },
        { cardId: 264, quantity: 2 },
        { cardId: 266, quantity: 2 },
        { cardId: 282, quantity: 2 },
        { cardId: 356, quantity: 1 },
        { cardId: 358, quantity: 1 },
        { cardId: 291, quantity: 1 },
        { cardId: 307, quantity: 1 },
        { cardId: 309, quantity: 1 },
        { cardId: 320, quantity: 1 },
        { cardId: 284, quantity: 1 },
        { cardId: 357, quantity: 1 },
        { cardId: 218, quantity: 1 },
        { cardId: 226, quantity: 1 },
        { cardId: 228, quantity: 1 },
        { cardId: 252, quantity: 1 },
        { cardId: 272, quantity: 1 },
        { cardId: 285, quantity: 1 },
        { cardId: 595, quantity: 2 },
      ],
      createdAt: now,
      updatedAt: now,
    };
    const corpDeck: EditableDeck = {
      deckId: "local_onr_corp_v105k_validation",
      deckVersion: "1.1.2k-local-onr",
      name: "O:NR V1.1.2K Corp Validation",
      side: "corp",
      identityCardId: 3,
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: 415, quantity: 3 },
        { cardId: 588, quantity: 3 },
        { cardId: 442, quantity: 2 },
        { cardId: 444, quantity: 2 },
        { cardId: 449, quantity: 2 },
        { cardId: 450, quantity: 2 },
        { cardId: 451, quantity: 2 },
        { cardId: 432, quantity: 2 },
        { cardId: 493, quantity: 1 },
        { cardId: 494, quantity: 1 },
        { cardId: 497, quantity: 1 },
        { cardId: 499, quantity: 1 },
        { cardId: 500, quantity: 1 },
        { cardId: 502, quantity: 1 },
        { cardId: 513, quantity: 1 },
        { cardId: 514, quantity: 1 },
        { cardId: 519, quantity: 1 },
        { cardId: 456, quantity: 1 },
        { cardId: 457, quantity: 1 },
        { cardId: 464, quantity: 1 },
        { cardId: 468, quantity: 1 },
        { cardId: 465, quantity: 1 },
        { cardId: 469, quantity: 1 },
        { cardId: 471, quantity: 1 },
        { cardId: 473, quantity: 1 },
        { cardId: 474, quantity: 1 },
        { cardId: 475, quantity: 1 },
        { cardId: 477, quantity: 1 },
        { cardId: 478, quantity: 1 },
        { cardId: 481, quantity: 1 },
        { cardId: 482, quantity: 1 },
        { cardId: 490, quantity: 1 },
        { cardId: 491, quantity: 1 },
        { cardId: 505, quantity: 1 },
        { cardId: 507, quantity: 1 },
        { cardId: 596, quantity: 2 },
      ],
      createdAt: now,
      updatedAt: now,
    };

    expect(validateEditableDeck(runnerDeck, contextV105K).errors).toEqual([]);
    expect(validateEditableDeck(runnerDeck, contextV105K).ok).toBe(true);
    expect(validateEditableDeck(corpDeck, contextV105K).errors).toEqual([]);
    expect(validateEditableDeck(corpDeck, contextV105K).ok).toBe(true);

    const oldOnrDeck: EditableDeck = {
      ...runnerDeck,
      deckId: "local_onr_runner_v105k_blocked_old_card",
      cards: [
        ...runnerDeck.cards,
        { cardId: 920, quantity: 1 },
      ],
    };
    const baseBlockedCard = contextV105K.cardsById[232];
    expect(baseBlockedCard).toBeDefined();
    if (!baseBlockedCard) throw new Error("Missing base blocked card");
    const blocked = validateEditableDeck(oldOnrDeck, {
      ...contextV105K,
      cardsById: {
        ...contextV105K.cardsById,
        920: {
          ...baseBlockedCard,
          catalogCardId: 920,
          engineCardId: 920,
          statuses: {
            ...baseBlockedCard.statuses,
            human_playable: false,
            deck_legal: false,
            format_legal: false,
          },
        },
      },
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.errors.join(" ")).toContain(920);
  });
});
