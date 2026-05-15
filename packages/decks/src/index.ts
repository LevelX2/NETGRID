import type { CatalogCard, CatalogStatusKey } from "@netgrid/catalog";

export type DeckSide = "runner" | "corp";

export type DeckCardEntry = {
  cardId: string;
  quantity: number;
};

export type DeckTableLayoutEntry = {
  cardId: string;
  quantity: number;
  order: number;
};

export type DeckTablePileSortMode = "free" | "name" | "type" | "install" | "rez" | "trash" | "cost" | "strength" | "agenda";

export type DeckTablePile = {
  id: string;
  name?: string;
  order: number;
  sortMode?: DeckTablePileSortMode;
  entries: DeckTableLayoutEntry[];
};

export type DeckTableLayout = {
  schemaVersion: "deck-table-layout-v0.1";
  showPileNames: boolean;
  piles: DeckTablePile[];
};

export type EditableDeck = {
  deckId: string;
  deckVersion: string;
  name: string;
  side: DeckSide;
  identityCardId: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
  validationStatus?: "valid" | "invalid" | "needs_revalidation";
  cards: DeckCardEntry[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
  tableLayout?: DeckTableLayout;
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
  version?: string;
  scope?: "private_local" | "test_fixture";
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  rulesBaselineIds: string[];
  allowedCardStatuses: CatalogStatusKey[];
  maxCopiesPerCard: number;
  copyLimit?: {
    defaultLimit: number;
    exceptions?: Array<{
      cardId?: string;
      title?: string;
      canonicalGroup?: string;
      limit: number;
      reason: string;
    }>;
  };
  minimumDeckCards: Record<DeckSide, number>;
  minimumAgendaPoints: { corp: number };
  agenda?: {
    policy: "points_minimum" | "density_range" | "local_profile";
    missingDataPolicy: "block" | "warn";
    minimumAgendaPoints?: { corp: number };
    density?: {
      minAgendaPointsPerCards?: number;
      maxAgendaPointsPerCards?: number;
    };
  };
  requireIdentity: boolean;
  allowedIdentityCards: Record<DeckSide, string[]>;
  identityRules?: Record<
    DeckSide,
    Record<
      string,
      {
        faction: string;
        influenceLimit: number;
        minimumDeckCards?: number;
        allowedFactions?: string[];
      }
    >
  >;
  influence?: {
    enabled: boolean;
    missingDataPolicy: "block" | "warn";
    neutralFactions: string[];
    defaultInfluenceCost: number;
    cardInfluenceCosts?: Record<string, number>;
  };
  formatLegal?: {
    privateLocalOnly: boolean;
    requiresDeckLegal: boolean;
    requiresHumanPlayable: boolean;
  };
  ai?: {
    requireAiSupportedForAiDecks: boolean;
  };
  hiddenInfoPolicy: {
    opponentDecklistPrivateByDefault: boolean;
    publicMetadataFields: string[];
  };
  nonGoals: string[];
};

export type DeckValidationResult = {
  ok: boolean;
  errors: string[];
  errorCodes?: string[];
  warnings: string[];
  totalCards: number;
  agendaPoints: number | null;
  influenceSpent?: number | null;
};

export type DeckPublicMetadata = {
  side: DeckSide;
  identityCardId: string;
  deckName: string;
  cardPoolSnapshotId: string;
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
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
  cardPoolVersion?: string;
  formatProfileId: string;
  formatProfileVersion?: string;
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
      ...(snapshot.cardPoolVersion ? { cardPoolVersion: snapshot.cardPoolVersion } : {}),
      formatProfileId: snapshot.formatProfileId,
      ...(snapshot.formatProfileVersion ? { formatProfileVersion: snapshot.formatProfileVersion } : {}),
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
    ...(deck.cardPoolVersion || context.profile.cardPoolVersion ? { cardPoolVersion: deck.cardPoolVersion ?? context.profile.cardPoolVersion } : {}),
    formatProfileId: deck.formatProfileId,
    ...(deck.formatProfileVersion || context.profile.version ? { formatProfileVersion: deck.formatProfileVersion ?? context.profile.version } : {}),
    rulesBaselineId: options.rulesBaselineId ?? "rules-baseline-mvp-0.4",
    immutable: true,
    cards: normalizeCards(deck.cards),
    validation,
    publicMetadata: {
      side: deck.side,
      identityCardId: deck.identityCardId,
      deckName: deck.name,
      cardPoolSnapshotId: deck.cardPoolSnapshotId,
      ...(deck.cardPoolVersion || context.profile.cardPoolVersion ? { cardPoolVersion: deck.cardPoolVersion ?? context.profile.cardPoolVersion } : {}),
      formatProfileId: deck.formatProfileId,
      ...(deck.formatProfileVersion || context.profile.version ? { formatProfileVersion: deck.formatProfileVersion ?? context.profile.version } : {}),
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
      ...(typeof deck.cardPoolVersion === "string" ? { cardPoolVersion: deck.cardPoolVersion } : {}),
      formatProfileId: typeof deck.formatProfileId === "string" ? deck.formatProfileId : "local-demo-v0.6",
      ...(typeof deck.formatProfileVersion === "string" ? { formatProfileVersion: deck.formatProfileVersion } : {}),
      validationStatus: typeof deck.formatProfileId === "string" ? "needs_revalidation" : "needs_revalidation",
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
  return withErrorCodes({ ok: errors.length === 0, errors, warnings: [], totalCards: 0, agendaPoints: null });
}

function validateDeckLike(
  deck: Pick<EditableDeck, "name" | "side" | "identityCardId" | "cards" | "cardPoolSnapshotId" | "cardPoolVersion" | "formatProfileId" | "formatProfileVersion">,
  context: DeckValidationContext
): DeckValidationResult {
  const errors: string[] = [];
  const errorCodes: string[] = [];
  const warnings: string[] = [];
  const addError = (code: string, message: string) => {
    errorCodes.push(code);
    errors.push(message);
  };
  if (!deck.name.trim()) addError("deck_name_required", "Deck name is required.");
  if (deck.cardPoolSnapshotId !== context.profile.cardPoolSnapshotId) addError("card_pool_mismatch", "Deck card pool does not match format profile.");
  if (context.profile.cardPoolVersion && deck.cardPoolVersion && deck.cardPoolVersion !== context.profile.cardPoolVersion) addError("card_pool_version_mismatch", "Deck card pool version does not match format profile.");
  if (deck.formatProfileId !== context.profile.profileId) addError("format_profile_unsupported", "Deck format profile is not supported.");
  if (context.profile.version && deck.formatProfileVersion && deck.formatProfileVersion !== context.profile.version) addError("format_profile_version_mismatch", "Deck format profile version does not match.");
  const identity = context.cardsById[deck.identityCardId];
  const identityRule = context.profile.identityRules?.[deck.side]?.[deck.identityCardId];
  if (!identity) addError("identity_missing", `Missing identity ${deck.identityCardId}.`);
  else {
    if (identity.side !== deck.side) addError("identity_wrong_side", `Identity ${deck.identityCardId} has wrong side.`);
    if (!identity.statuses.playable || !identity.statuses.deck_legal) addError("identity_not_deck_legal", `Identity ${deck.identityCardId} is not deck legal.`);
    if (context.profile.requireIdentity && !context.profile.allowedIdentityCards[deck.side]?.includes(deck.identityCardId)) {
      addError("identity_not_allowed", `Identity ${deck.identityCardId} is not allowed in this format.`);
    }
    if (context.profile.identityRules?.[deck.side] && !identityRule) {
      addError("identity_rule_missing", `Identity ${deck.identityCardId} is missing format identity rules.`);
    }
  }

  let totalCards = 0;
  let agendaPoints = 0;
  let influenceSpent = 0;
  for (const entry of normalizeCards(deck.cards)) {
    totalCards += entry.quantity;
    const card = context.cardsById[entry.cardId];
    if (!Number.isInteger(entry.quantity) || entry.quantity <= 0) addError("invalid_quantity", `Invalid quantity for ${entry.cardId}.`);
    const copyLimit = copyLimitForEntry(entry, card, context.profile);
    if (entry.quantity > copyLimit) addError("too_many_copies", `Too many copies of ${entry.cardId}; maximum is ${copyLimit}.`);
    if (!card) {
      addError("unknown_card", `Unknown card ${entry.cardId}.`);
      continue;
    }
    if (card.side !== deck.side) addError("wrong_side_card", `Wrong-side card ${entry.cardId}.`);
    const missingStatus = context.profile.allowedCardStatuses.find((status) => !card.statuses[status]);
    if (missingStatus) addError("card_missing_required_status", `Card ${entry.cardId} is not playable and deck legal; missing required status ${missingStatus}.`);
    if (card.statuses.deck_legal && Object.prototype.hasOwnProperty.call(card.statuses, "human_playable") && !card.statuses.human_playable) {
      addError("deck_legal_without_human_playable", `Card ${entry.cardId} is deck legal without human_playable status.`);
    }
    if (context.profile.formatLegal?.requiresDeckLegal && !card.statuses.deck_legal) addError("format_legal_requires_deck_legal", `Card ${entry.cardId} is not deck legal and cannot be format legal.`);
    if (context.profile.formatLegal?.requiresHumanPlayable && !card.statuses.human_playable) addError("format_legal_requires_human_playable", `Card ${entry.cardId} is not human playable and cannot be format legal.`);
    const influence = influenceCostForCard(card, deck.side, identityRule, context.profile);
    if (influence === null) addError("influence_data_missing", `Card ${entry.cardId} is missing influence or faction data for this format.`);
    else influenceSpent += influence * entry.quantity;
    if (card.type === "agenda" && card.numeric.agendaPoints === null && context.profile.agenda?.missingDataPolicy === "block") {
      addError("agenda_points_missing", `Agenda ${entry.cardId} is missing agenda points.`);
    }
    agendaPoints += (card.numeric.agendaPoints ?? 0) * entry.quantity;
  }

  const minimumDeckCards = identityRule?.minimumDeckCards ?? context.profile.minimumDeckCards[deck.side];
  const minimumAgendaPoints = context.profile.agenda?.minimumAgendaPoints?.corp ?? context.profile.minimumAgendaPoints.corp;
  if (totalCards < minimumDeckCards) addError("minimum_deck_size", `Deck has ${totalCards} cards, expected at least ${minimumDeckCards}.`);
  if (deck.side === "corp" && agendaPoints < minimumAgendaPoints) addError("minimum_agenda_points", `Corp deck has ${agendaPoints} agenda points, expected at least ${minimumAgendaPoints}.`);
  const agendaDensity = context.profile.agenda?.density;
  if (deck.side === "corp" && agendaDensity?.minAgendaPointsPerCards && agendaPoints < Math.floor((totalCards / 5) * agendaDensity.minAgendaPointsPerCards)) {
    addError("agenda_density_too_low", "Corp deck agenda density is below the format minimum.");
  }
  if (deck.side === "corp" && agendaDensity?.maxAgendaPointsPerCards && agendaPoints > Math.ceil((totalCards / 5) * agendaDensity.maxAgendaPointsPerCards)) {
    addError("agenda_density_too_high", "Corp deck agenda density is above the format maximum.");
  }
  if (context.profile.influence?.enabled && identityRule && influenceSpent > identityRule.influenceLimit) {
    addError("influence_limit_exceeded", `Deck spends ${influenceSpent} influence, limit is ${identityRule.influenceLimit}.`);
  }
  if (deck.side === "runner" && agendaPoints > 0) warnings.push("Runner deck contains agenda points.");

  return withErrorCodes({
    ok: errors.length === 0,
    errors,
    errorCodes,
    warnings,
    totalCards,
    agendaPoints: deck.side === "corp" ? agendaPoints : null,
    influenceSpent: context.profile.influence?.enabled ? influenceSpent : null
  });
}

function withErrorCodes(result: DeckValidationResult): DeckValidationResult {
  if (!result.errorCodes || result.errorCodes.length === 0) {
    const { errorCodes: _unused, ...withoutCodes } = result;
    return withoutCodes;
  }
  return result;
}

function copyLimitForEntry(entry: DeckCardEntry, card: CatalogCard | undefined, profile: DeckFormatProfile): number {
  const exception = profile.copyLimit?.exceptions?.find((candidate) => candidate.cardId === entry.cardId || (candidate.title && candidate.title === card?.title));
  return exception?.limit ?? profile.copyLimit?.defaultLimit ?? profile.maxCopiesPerCard;
}

function influenceCostForCard(card: CatalogCard, side: DeckSide, identityRule: NonNullable<DeckFormatProfile["identityRules"]>[DeckSide][string] | undefined, profile: DeckFormatProfile): number | null {
  if (!profile.influence?.enabled || card.type === "identity") return 0;
  if (!card.faction) return profile.influence.missingDataPolicy === "block" ? null : 0;
  if (!identityRule) return profile.influence.missingDataPolicy === "block" ? null : 0;
  if (card.faction === identityRule.faction || profile.influence.neutralFactions.includes(card.faction)) return 0;
  if (identityRule.allowedFactions && !identityRule.allowedFactions.includes(card.faction)) return profile.influence.missingDataPolicy === "block" ? null : 0;
  return profile.influence.cardInfluenceCosts?.[card.catalogCardId] ?? profile.influence.defaultInfluenceCost;
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
