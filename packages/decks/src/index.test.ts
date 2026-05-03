import { describe, expect, it } from "vitest";
import snapshotData from "../../../data/card-import/card-snapshot-0.5.json";
import profilesData from "../../../data/decks/deck-format-profiles-0.6.json";
import templatesData from "../../../data/decks/deck-templates-0.6.json";
import snapshotsData from "../../../data/decks/deck-snapshots-0.6.json";
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
  type DeckTemplate
} from "./index";
import type { CatalogCard } from "@netrunner/catalog";

const cardsById = Object.fromEntries((snapshotData.cards as CatalogCard[]).map((card) => [card.catalogCardId, card]));
const profile = profilesData.profiles[0] as DeckFormatProfile;
const templates = templatesData.templates as DeckTemplate[];
const snapshots = snapshotsData.snapshots as DeckSnapshot[];
const context = { cardsById, profile };

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
});
