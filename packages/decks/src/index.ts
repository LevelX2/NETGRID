import type { CatalogCard, CatalogStatusKey } from "@netgrid/catalog";

export type DeckSide = "runner" | "corp";

export type DeckCardEntry = {
  cardId: string;
  quantity: number;
};

export type EditableDeck = {
  deckId: string;
  deckVersion: string;
  name: string;
  side: DeckSide;
  identityCardId: string;
  cardPoolSnapshotId: string;
  formatProfileId: string;
  cards: DeckCardEntry[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type DeckTemplate = {
  templateId: string;
  sourceDeckId: string;
  name: string;
  side: DeckSide;
  identityCardId: string;
  editableCopyAllowed: boolean;
  versionedTemplate: boolean;
  cards: DeckCardEntry[];
};

export type DeckFormatProfile = {
  profileId: string;
  name: string;
  cardPoolSnapshotId: string;
  rulesBaselineIds: string[];
  allowedCardStatuses: CatalogStatusKey[];
  maxCopiesPerCard: number;
  minimumDeckCards: Record<DeckSide, number>;
  minimumAgendaPoints: { corp: number };
  requireIdentity: boolean;
  allowedIdentityCards: Record<DeckSide, string[]>;
  hiddenInfoPolicy: {
    opponentDecklistPrivateByDefault: boolean;
    publicMetadataFields: string[];
  };
  nonGoals: string[];
};

export type DeckValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  totalCards: number;
  agendaPoints: number | null;
};

export type DeckPublicMetadata = {
  side: DeckSide;
  identityCardId: string;
  deckName: string;
  cardPoolSnapshotId: string;
  formatProfileId: string;
  deckHash: string;
};

export type DeckSnapshot = {
  deckSnapshotId: string;
  sourceDeckId: string;
  deckVersion: string;
  name: string;
  side: DeckSide;
  identityCardId: string;
  cardPoolSnapshotId: string;
  formatProfileId: string;
  rulesBaselineId: string;
  immutable: boolean;
  cards: DeckCardEntry[];
  validation: DeckValidationResult;
  publicMetadata: DeckPublicMetadata;
  deckHash: string;
};

export type DeckValidationContext = {
  cardsById: Record<string, CatalogCard>;
  profile: DeckFormatProfile;
};

export type DeckImportResult =
  | { ok: true; deck: EditableDeck; warnings: string[] }
  | { ok: false; errors: string[] };

export type EngineDeckDefinition = {
  id: string;
  name: string;
  side: DeckSide;
  identity: string;
  cards: Array<{ id: string; quantity: number }>;
};

export const FORBIDDEN_DECK_PAYLOAD_KEYS = [
  "GameState",
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "tokenHash",
  "fullState",
  "stateSnapshots",
  "undoSnapshots"
];

export function createEditableDeckFromTemplate(template: DeckTemplate, now = new Date().toISOString()): EditableDeck {
  return {
    deckId: `local_${template.sourceDeckId}_${hashText(`${template.templateId}:${now}`).slice(-8)}`,
    deckVersion: "0.6.0-local",
    name: `${template.name} Copy`,
    side: template.side,
    identityCardId: template.identityCardId,
    cardPoolSnapshotId: "card-snapshot-0.5",
    formatProfileId: "local-demo-v0.6",
    cards: normalizeCards(template.cards),
    createdAt: now,
    updatedAt: now
  };
}

export function validateEditableDeck(deck: EditableDeck, context: DeckValidationContext): DeckValidationResult {
  return validateDeckLike(deck, context);
}

export function validateDeckSnapshot(snapshot: DeckSnapshot, context: DeckValidationContext): DeckValidationResult {
  const validation = validateDeckLike(
    {
      name: snapshot.name,
      side: snapshot.side,
      identityCardId: snapshot.identityCardId,
      cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
      formatProfileId: snapshot.formatProfileId,
      cards: snapshot.cards
    },
    context
  );
  if (!snapshot.immutable) validation.errors.push("Deck snapshot must be immutable.");
  const expectedHash = computeDeckHash(snapshot);
  if (snapshot.deckHash !== expectedHash || snapshot.publicMetadata.deckHash !== expectedHash) validation.errors.push("Deck snapshot hash mismatch.");
  return { ...validation, ok: validation.errors.length === 0 };
}

export function createDeckSnapshot(deck: EditableDeck, context: DeckValidationContext, options: { snapshotId?: string; rulesBaselineId?: string } = {}): DeckSnapshot {
  const validation = validateEditableDeck(deck, context);
  const snapshot: DeckSnapshot = {
    deckSnapshotId: options.snapshotId ?? `${deck.deckId}_snapshot_v0_6`,
    sourceDeckId: deck.deckId,
    deckVersion: deck.deckVersion,
    name: deck.name,
    side: deck.side,
    identityCardId: deck.identityCardId,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    formatProfileId: deck.formatProfileId,
    rulesBaselineId: options.rulesBaselineId ?? "rules-baseline-mvp-0.4",
    immutable: true,
    cards: normalizeCards(deck.cards),
    validation,
    publicMetadata: {
      side: deck.side,
      identityCardId: deck.identityCardId,
      deckName: deck.name,
      cardPoolSnapshotId: deck.cardPoolSnapshotId,
      formatProfileId: deck.formatProfileId,
      deckHash: "pending"
    },
    deckHash: "pending"
  };
  const hash = computeDeckHash(snapshot);
  snapshot.deckHash = hash;
  snapshot.publicMetadata.deckHash = hash;
  return snapshot;
}

export function computeDeckHash(snapshot: DeckSnapshot): string {
  const input = structuredClone(snapshot);
  input.cards = normalizeCards(input.cards);
  input.deckHash = "pending";
  input.publicMetadata.deckHash = "pending";
  return fnv1a(stableStringify(input));
}

export function buildEngineDeck(snapshot: DeckSnapshot): EngineDeckDefinition {
  return {
    id: snapshot.deckSnapshotId,
    name: snapshot.name,
    side: snapshot.side,
    identity: snapshot.identityCardId,
    cards: normalizeCards(snapshot.cards).map((entry) => ({ id: entry.cardId, quantity: entry.quantity }))
  };
}

export function exportDeck(deck: EditableDeck): string {
  return `${JSON.stringify({ schemaVersion: "editable-deck-v0.6", deck }, null, 2)}\n`;
}

export function importDeck(text: string, now = new Date().toISOString()): DeckImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["Deck JSON konnte nicht gelesen werden."] };
  }
  const record = parsed as { deck?: Partial<EditableDeck> };
  const deck = record.deck;
  if (!deck || typeof deck !== "object") return { ok: false, errors: ["Deck JSON enthält kein Deck."] };
  if (deck.side !== "runner" && deck.side !== "corp") return { ok: false, errors: ["Deck Side ist ungültig."] };
  if (!deck.name || !deck.identityCardId || !Array.isArray(deck.cards)) return { ok: false, errors: ["Deck Pflichtfelder fehlen."] };
  return {
    ok: true,
    deck: {
      deckId: typeof deck.deckId === "string" ? sanitizeId(deck.deckId) : `local_import_${hashText(text).slice(-8)}`,
      deckVersion: typeof deck.deckVersion === "string" ? deck.deckVersion : "0.6.0-local",
      name: deck.name.slice(0, 80),
      side: deck.side,
      identityCardId: deck.identityCardId,
      cardPoolSnapshotId: typeof deck.cardPoolSnapshotId === "string" ? deck.cardPoolSnapshotId : "card-snapshot-0.5",
      formatProfileId: typeof deck.formatProfileId === "string" ? deck.formatProfileId : "local-demo-v0.6",
      cards: normalizeCards(deck.cards as DeckCardEntry[]),
      createdAt: typeof deck.createdAt === "string" ? deck.createdAt : now,
      updatedAt: now,
      ...(typeof deck.notes === "string" ? { notes: deck.notes.slice(0, 500) } : {})
    },
    warnings: []
  };
}

export function assertDeckPayloadSafe(payload: unknown): DeckValidationResult {
  const serialized = stableStringify(payload);
  const errors = FORBIDDEN_DECK_PAYLOAD_KEYS.filter((key) => serialized.includes(key)).map((key) => `Forbidden payload key ${key}.`);
  return { ok: errors.length === 0, errors, warnings: [], totalCards: 0, agendaPoints: null };
}

function validateDeckLike(deck: Pick<EditableDeck, "name" | "side" | "identityCardId" | "cards" | "cardPoolSnapshotId" | "formatProfileId">, context: DeckValidationContext): DeckValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!deck.name.trim()) errors.push("Deck name is required.");
  if (deck.cardPoolSnapshotId !== context.profile.cardPoolSnapshotId) errors.push("Deck card pool does not match format profile.");
  if (deck.formatProfileId !== context.profile.profileId) errors.push("Deck format profile is not supported.");
  const identity = context.cardsById[deck.identityCardId];
  if (!identity) errors.push(`Missing identity ${deck.identityCardId}.`);
  else {
    if (identity.side !== deck.side) errors.push(`Identity ${deck.identityCardId} has wrong side.`);
    if (!identity.statuses.playable || !identity.statuses.deck_legal) errors.push(`Identity ${deck.identityCardId} is not deck legal.`);
  }

  let totalCards = 0;
  let agendaPoints = 0;
  for (const entry of normalizeCards(deck.cards)) {
    totalCards += entry.quantity;
    const card = context.cardsById[entry.cardId];
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) errors.push(`Invalid quantity for ${entry.cardId}.`);
    if (entry.quantity > context.profile.maxCopiesPerCard) errors.push(`Too many copies of ${entry.cardId}.`);
    if (!card) {
      errors.push(`Unknown card ${entry.cardId}.`);
      continue;
    }
    if (card.side !== deck.side) errors.push(`Wrong-side card ${entry.cardId}.`);
    const missingStatus = context.profile.allowedCardStatuses.find((status) => !card.statuses[status]);
    if (missingStatus) errors.push(`Card ${entry.cardId} is not playable and deck legal; missing required status ${missingStatus}.`);
    agendaPoints += (card.numeric.agendaPoints ?? 0) * entry.quantity;
  }

  if (totalCards < context.profile.minimumDeckCards[deck.side]) errors.push(`Deck has ${totalCards} cards, expected at least ${context.profile.minimumDeckCards[deck.side]}.`);
  if (deck.side === "corp" && agendaPoints < context.profile.minimumAgendaPoints.corp) errors.push(`Corp deck has ${agendaPoints} agenda points, expected at least ${context.profile.minimumAgendaPoints.corp}.`);
  if (deck.side === "runner" && agendaPoints > 0) warnings.push("Runner deck contains agenda points.");

  return { ok: errors.length === 0, errors, warnings, totalCards, agendaPoints: deck.side === "corp" ? agendaPoints : null };
}

function normalizeCards(cards: DeckCardEntry[]): DeckCardEntry[] {
  const byId = new Map<string, number>();
  for (const entry of cards) {
    if (typeof entry.cardId !== "string" || !Number.isFinite(entry.quantity)) continue;
    byId.set(entry.cardId, (byId.get(entry.cardId) ?? 0) + Math.floor(entry.quantity));
  }
  return [...byId.entries()]
    .filter(([, quantity]) => quantity > 0)
    .map(([cardId, quantity]) => ({ cardId, quantity }))
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || `local_${hashText(value).slice(-8)}`;
}

function hashText(value: string): string {
  return fnv1a(value).replace("fnv1a:", "");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
