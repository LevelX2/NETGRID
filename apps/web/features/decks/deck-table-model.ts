import type { DeckPublicMetadata, Side } from "@netgrid/shared";

type CatalogCardSummary = {
  side: Side;
  title: string;
  type: string;
  subtypes: string[];
};

type CatalogCardDetail = {
  type: string;
  numeric: Record<string, number | null | undefined>;
};

function deckBuilderCardGroup(card: CatalogCardSummary | null): string {
  if (!card) return "Unbekannt";
  if (card.side === "runner") {
    if (card.type === "program" && card.subtypes.some((subtype) => subtype.toLowerCase() === "icebreaker")) return "Icebrecher";
    if (card.type === "program") return "Programm";
    if (card.type === "resource") return "Ressource";
    if (card.type === "hardware") return "Hardware";
    if (card.type === "event") return "Prep";
  }
  if (card.type === "ice") return "ICE";
  if (card.type === "agenda") return "Agenda";
  if (card.type === "asset") return "Asset";
  if (card.type === "upgrade") return "Upgrade";
  if (card.type === "operation") return "Operation";
  return card.type || "Karte";
}

export type DeckCardEntry = {
  cardId: string;
  quantity: number;
};

export type EditableDeck = {
  deckId: string;
  deckVersion: string;
  name: string;
  side: Side;
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

export type DeckEditorMode = "list" | "table";

export type DeckTableSortKey = "name" | "type" | "install" | "rez" | "trash" | "cost" | "strength" | "agenda";
export type DeckTablePileSortMode = "free" | DeckTableSortKey;
export type DeckTableArrangeMode = "type" | "install-piles" | DeckTableSortKey;

export type DeckTableLayoutEntry = {
  cardId: string;
  quantity: number;
  order: number;
};

export type DeckTablePile = {
  id: string;
  name?: string;
  order: number;
  sortMode: DeckTablePileSortMode;
  entries: DeckTableLayoutEntry[];
};

export type DeckTableLayout = {
  schemaVersion: "deck-table-layout-v0.1";
  showPileNames: boolean;
  piles: DeckTablePile[];
};

export type DeckTableSelectionEntry = {
  pileId: string;
  cardId: string;
  order: number;
};

export const DECK_TABLE_CARD_WIDTH_DEFAULT = 94;
export const DECK_TABLE_CARD_WIDTH_MIN = 72;
export const DECK_TABLE_CARD_WIDTH_MAX = 190;
export const DECK_TABLE_CARD_WIDTH_STEP = 2;
export const DECK_TABLE_OVERLAP_DEFAULT = 64;
export const DECK_TABLE_OVERLAP_MIN = 0;
export const DECK_TABLE_OVERLAP_MAX = 82;
export const DECK_TABLE_OVERLAP_STEP = 2;
export const DECK_TABLE_LIBRARY_WIDTH_DEFAULT = 250;
export const DECK_TABLE_LIBRARY_WIDTH_MIN = 160;
export const DECK_TABLE_LIBRARY_WIDTH_MAX = 760;
export const DECK_TABLE_LIBRARY_WIDTH_STEP = 10;
export const DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT = 92;
export const DECK_TABLE_LIBRARY_CARD_WIDTH_MIN = 58;
export const DECK_TABLE_LIBRARY_CARD_WIDTH_MAX = 190;
export const DECK_TABLE_LIBRARY_CARD_WIDTH_STEP = 2;
export const DECK_TABLE_LIBRARY_OVERLAP_DEFAULT = 0;
export const DECK_TABLE_LIBRARY_OVERLAP_MIN = 0;
export const DECK_TABLE_LIBRARY_OVERLAP_MAX = 72;
export const DECK_TABLE_LIBRARY_OVERLAP_STEP = 2;

export type DeckTableViewSettings = {
  cardWidth: number;
  overlapPercent: number;
  libraryWidth: number;
  libraryCardWidth: number;
  libraryOverlapPercent: number;
};

export function normalizeSteppedNumber(value: unknown, fallback: number, min: number, max: number, step: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const clamped = Math.max(min, Math.min(max, numeric));
  return Math.max(min, Math.min(max, Math.round(clamped / step) * step));
}

export function normalizeDeckTableViewSettings(value: unknown): DeckTableViewSettings {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    cardWidth: normalizeSteppedNumber(candidate.cardWidth, DECK_TABLE_CARD_WIDTH_DEFAULT, DECK_TABLE_CARD_WIDTH_MIN, DECK_TABLE_CARD_WIDTH_MAX, DECK_TABLE_CARD_WIDTH_STEP),
    overlapPercent: normalizeSteppedNumber(candidate.overlapPercent, DECK_TABLE_OVERLAP_DEFAULT, DECK_TABLE_OVERLAP_MIN, DECK_TABLE_OVERLAP_MAX, DECK_TABLE_OVERLAP_STEP),
    libraryWidth: normalizeSteppedNumber(candidate.libraryWidth, DECK_TABLE_LIBRARY_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_WIDTH_MIN, DECK_TABLE_LIBRARY_WIDTH_MAX, DECK_TABLE_LIBRARY_WIDTH_STEP),
    libraryCardWidth: normalizeSteppedNumber(candidate.libraryCardWidth, DECK_TABLE_LIBRARY_CARD_WIDTH_DEFAULT, DECK_TABLE_LIBRARY_CARD_WIDTH_MIN, DECK_TABLE_LIBRARY_CARD_WIDTH_MAX, DECK_TABLE_LIBRARY_CARD_WIDTH_STEP),
    libraryOverlapPercent: normalizeSteppedNumber(candidate.libraryOverlapPercent, DECK_TABLE_LIBRARY_OVERLAP_DEFAULT, DECK_TABLE_LIBRARY_OVERLAP_MIN, DECK_TABLE_LIBRARY_OVERLAP_MAX, DECK_TABLE_LIBRARY_OVERLAP_STEP)
  };
}

export function parseDeckTableViewSettings(raw: string | null): DeckTableViewSettings {
  if (!raw) return normalizeDeckTableViewSettings(null);
  try {
    return normalizeDeckTableViewSettings(JSON.parse(raw));
  } catch {
    return normalizeDeckTableViewSettings(null);
  }
}

export function deckFingerprint(deck: EditableDeck): string {
  return JSON.stringify({
    name: deck.name,
    side: deck.side,
    identityCardId: deck.identityCardId,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    formatProfileId: deck.formatProfileId,
    notes: deck.notes ?? "",
    tableLayout: deck.tableLayout ?? null,
    cards: [...deck.cards].sort((left, right) => left.cardId.localeCompare(right.cardId))
  });
}

export function deckStrategyProfileFingerprint(deck: EditableDeck): string {
  return JSON.stringify({
    deckId: deck.deckId,
    name: deck.name,
    side: deck.side,
    identityCardId: deck.identityCardId,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion ?? "",
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion ?? "",
    cards: [...deck.cards]
      .map((entry) => ({ cardId: entry.cardId, quantity: Math.max(0, Math.floor(entry.quantity)) }))
      .filter((entry) => entry.quantity > 0)
      .sort((left, right) => left.cardId.localeCompare(right.cardId))
  });
}

export const DEFAULT_DECK_TABLE_PILE_COUNT = 8;
export const MIN_DECK_TABLE_PILE_COUNT = 1;
export const MAX_DECK_TABLE_PILE_COUNT = 20;
export const DECK_TABLE_MAX_COPIES_PER_CARD = 3;

export function defaultDeckTablePileName(side: Side, index: number): string {
  const runnerNames = ["Eisbrecher", "Programme", "Ressourcen", "Hardware", "Events", "Support", "Tempo", "Offen"];
  const corpNames = ["ICE", "Agendas", "Assets", "Operationen", "Upgrades", "Ökonomie", "Schutz", "Offen"];
  return (side === "runner" ? runnerNames : corpNames)[index] ?? `Stapel ${index + 1}`;
}

function defaultDeckTablePileIndexForCard(card: CatalogCardSummary | undefined): number {
  if (!card) return 0;
  const type = card.type.toLowerCase();
  const subtypes = card.subtypes.map((subtype) => subtype.toLowerCase());
  if (card.side === "runner") {
    if (type === "program" && subtypes.includes("icebreaker")) return 0;
    if (type === "program") return 1;
    if (type === "resource") return 2;
    if (type === "hardware") return 3;
    if (type === "event") return 4;
    return 7;
  }
  if (type === "ice") return 0;
  if (type === "agenda") return 1;
  if (type === "asset") return 2;
  if (type === "operation") return 3;
  if (type === "upgrade") return 4;
  return 7;
}

export function normalizeDeckTablePileSortMode(value: unknown): DeckTablePileSortMode {
  return value === "name" || value === "type" || value === "install" || value === "rez" || value === "trash" || value === "cost" || value === "strength" || value === "agenda" ? value : "free";
}

export function normalizeDeckTableLayout(deck: EditableDeck, cardLookup?: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail> = {}): DeckTableLayout {
  const desired = new Map<string, number>();
  for (const entry of deck.cards) {
    if (!entry.cardId || !Number.isFinite(entry.quantity)) continue;
    desired.set(entry.cardId, (desired.get(entry.cardId) ?? 0) + Math.max(0, Math.floor(entry.quantity)));
  }
  const sourcePiles = [...(deck.tableLayout?.piles ?? [])]
    .filter((pile) => pile && typeof pile.id === "string")
    .sort((left, right) => left.order - right.order);
  const pileCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, deck.tableLayout?.piles.length ?? DEFAULT_DECK_TABLE_PILE_COUNT));
  const normalizedPiles: DeckTablePile[] = Array.from({ length: pileCount }, (_, index) => {
    const source = sourcePiles[index];
    return {
      id: source?.id || `pile-${index + 1}`,
      name: typeof source?.name === "string" ? source.name.slice(0, 40) : defaultDeckTablePileName(deck.side, index),
      order: index,
      sortMode: normalizeDeckTablePileSortMode(source?.sortMode),
      entries: []
    };
  });
  const remaining = new Map(desired);
  for (let pileIndex = 0; pileIndex < normalizedPiles.length; pileIndex += 1) {
    const source = sourcePiles[pileIndex];
    if (!source) continue;
    const entries = [...(source.entries ?? [])].sort((left, right) => left.order - right.order);
    for (const entry of entries) {
      const available = remaining.get(entry.cardId) ?? 0;
      if (available <= 0) continue;
      const quantity = Math.min(available, Math.max(0, Math.floor(entry.quantity)));
      if (quantity <= 0) continue;
      for (let copy = 0; copy < quantity; copy += 1) {
        normalizedPiles[pileIndex]!.entries.push({ cardId: entry.cardId, quantity: 1, order: normalizedPiles[pileIndex]!.entries.length });
      }
      remaining.set(entry.cardId, available - quantity);
    }
  }
  for (const [cardId, quantity] of remaining) {
    if (quantity <= 0) continue;
    const pileIndex = Math.min(normalizedPiles.length - 1, Math.max(0, defaultDeckTablePileIndexForCard(cardLookup?.get(cardId))));
    const fallbackPile = normalizedPiles[pileIndex]!;
    for (let copy = 0; copy < quantity; copy += 1) {
      fallbackPile.entries.push({ cardId, quantity: 1, order: fallbackPile.entries.length });
    }
  }
  return {
    schemaVersion: "deck-table-layout-v0.1",
    showPileNames: deck.tableLayout?.showPileNames ?? false,
    piles: normalizedPiles.map((pile) => applyDeckTablePileSort(pile, cardLookup ?? new Map<string, CatalogCardSummary>(), detailsById))
  };
}

export function deckCardsFromTableLayout(layout: DeckTableLayout): DeckCardEntry[] {
  const byCard = new Map<string, number>();
  for (const pile of layout.piles) {
    for (const entry of pile.entries) {
      byCard.set(entry.cardId, (byCard.get(entry.cardId) ?? 0) + Math.max(0, Math.floor(entry.quantity)));
    }
  }
  return [...byCard.entries()]
    .map(([cardId, quantity]) => ({ cardId, quantity }))
    .filter((entry) => entry.quantity > 0)
    .sort((left, right) => left.cardId.localeCompare(right.cardId));
}

export function deckTableCardTotal(layout: DeckTableLayout, cardId: string): number {
  return layout.piles.reduce((sum, pile) => sum + pile.entries.filter((entry) => entry.cardId === cardId).reduce((pileSum, entry) => pileSum + entry.quantity, 0), 0);
}

export function reorderDeckTableEntries(entries: DeckTableLayoutEntry[]): DeckTableLayoutEntry[] {
  return entries.map((entry, order) => ({ ...entry, order }));
}

export function insertDeckTableEntry(entries: DeckTableLayoutEntry[], entry: DeckTableLayoutEntry, targetOrder?: number): DeckTableLayoutEntry[] {
  const orderedEntries = [...entries].sort((left, right) => left.order - right.order);
  if (targetOrder === undefined) return reorderDeckTableEntries([...orderedEntries, { ...entry, order: orderedEntries.length }]);
  const targetIndex = orderedEntries.findIndex((candidate) => candidate.order === targetOrder);
  if (targetIndex < 0) return reorderDeckTableEntries([...orderedEntries, { ...entry, order: orderedEntries.length }]);
  return reorderDeckTableEntries([...orderedEntries.slice(0, targetIndex), { ...entry, order: targetIndex }, ...orderedEntries.slice(targetIndex)]);
}

export function insertDeckTableEntries(entries: DeckTableLayoutEntry[], insertedEntries: DeckTableLayoutEntry[], targetOrder?: number): DeckTableLayoutEntry[] {
  const orderedEntries = [...entries].sort((left, right) => left.order - right.order);
  const normalizedInserted = insertedEntries.map((entry, offset) => ({ ...entry, order: offset }));
  if (targetOrder === undefined) return reorderDeckTableEntries([...orderedEntries, ...normalizedInserted]);
  const targetIndex = orderedEntries.findIndex((candidate) => candidate.order === targetOrder);
  if (targetIndex < 0) return reorderDeckTableEntries([...orderedEntries, ...normalizedInserted]);
  return reorderDeckTableEntries([...orderedEntries.slice(0, targetIndex), ...normalizedInserted, ...orderedEntries.slice(targetIndex)]);
}

export function deckTableSelectionKey(pileId: string, cardId: string, order: number): string {
  return `${pileId}::${order}::${cardId}`;
}

export function deckTableSortLabel(sortBy: DeckTableSortKey): string {
  switch (sortBy) {
    case "type":
      return "Typ";
    case "install":
      return "Installkosten";
    case "rez":
      return "Rez-Kosten";
    case "trash":
      return "Trashkosten";
    case "cost":
      return "Kosten";
    case "strength":
      return "Stärke";
    case "agenda":
      return "Agenda-Punkte";
    default:
      return "Name";
  }
}

function deckTableNumericKey(sortBy: DeckTableSortKey): string | null {
  if (sortBy === "install") return "installCost";
  if (sortBy === "rez") return "rezCost";
  if (sortBy === "trash") return "trashCost";
  if (sortBy === "cost") return "cost";
  if (sortBy === "strength") return "strength";
  if (sortBy === "agenda") return "agendaPoints";
  return null;
}

function sortDeckTableEntries(entries: DeckTableLayoutEntry[], cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>, sortBy: DeckTableSortKey): DeckTableLayoutEntry[] {
  const numericValue = (entry: DeckTableLayoutEntry, key: string): number => {
    const value = detailsById[entry.cardId]?.numeric[key];
    return value === null || value === undefined ? Number.POSITIVE_INFINITY : value;
  };
  const titleValue = (entry: DeckTableLayoutEntry): string => cardLookup.get(entry.cardId)?.title ?? entry.cardId;
  const typeValue = (entry: DeckTableLayoutEntry): string => deckBuilderCardGroup(cardLookup.get(entry.cardId) ?? null);
  const numericKey = deckTableNumericKey(sortBy);
  return reorderDeckTableEntries(
    [...entries].sort((left, right) => {
      if (numericKey) return numericValue(left, numericKey) - numericValue(right, numericKey) || typeValue(left).localeCompare(typeValue(right)) || titleValue(left).localeCompare(titleValue(right));
      if (sortBy === "type") return typeValue(left).localeCompare(typeValue(right)) || titleValue(left).localeCompare(titleValue(right));
      return titleValue(left).localeCompare(titleValue(right));
    })
  );
}

export function deckTablePileSortModeLabel(sortMode: DeckTablePileSortMode): string {
  return sortMode === "free" ? "Frei" : deckTableSortLabel(sortMode);
}

export function applyDeckTablePileSort(pile: DeckTablePile, cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>): DeckTablePile {
  if (pile.sortMode === "free") return { ...pile, entries: reorderDeckTableEntries(pile.entries) };
  return { ...pile, entries: sortDeckTableEntries(pile.entries, cardLookup, detailsById, pile.sortMode) };
}

function deckTableEntryNumericValue(entry: DeckTableLayoutEntry, detailsById: Record<string, CatalogCardDetail>, key: string): number | null {
  const value = detailsById[entry.cardId]?.numeric[key];
  return value === null || value === undefined ? null : value;
}

function deckTableEntryBuildCost(entry: DeckTableLayoutEntry, detailsById: Record<string, CatalogCardDetail>): number | null {
  const detail = detailsById[entry.cardId];
  if (!detail) return null;
  if (detail.type === "agenda") return detail.numeric.advancementRequirement ?? null;
  return detail.numeric.installCost ?? detail.numeric.rezCost ?? detail.numeric.cost ?? null;
}

function deckTableBuildCostGroupName(key: string, entries: DeckTableLayoutEntry[], cardLookup: Map<string, CatalogCardSummary>): string {
  if (key === "overflow") return "Weitere Kosten";
  if (key === "none") return "Keine Kartenkosten";
  const hasAgenda = entries.some((entry) => cardLookup.get(entry.cardId)?.type === "agenda");
  const hasNonAgenda = entries.some((entry) => cardLookup.get(entry.cardId)?.type !== "agenda");
  if (hasAgenda && !hasNonAgenda) return `Benötigt ${key}`;
  if (hasAgenda && hasNonAgenda) return `Kosten/Benötigt ${key}`;
  return `Kosten ${key}`;
}

function deckTableTypeGroupOrder(side: Side, label: string): number {
  const labels = side === "corp" ? ["ICE", "Agenda", "Asset", "Operation", "Upgrade"] : ["Prep", "Hardware", "Ressource", "Programm", "Icebrecher"];
  const index = labels.indexOf(label);
  return index >= 0 ? index : labels.length;
}

export function distributeDeckTableByType(layout: DeckTableLayout, side: Side, cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>): DeckTableLayout {
  const allEntries = sortDeckTableEntries(layout.piles.flatMap((pile) => pile.entries), cardLookup, detailsById, "name");
  const grouped = new Map<string, DeckTableLayoutEntry[]>();
  for (const entry of allEntries) {
    const label = deckBuilderCardGroup(cardLookup.get(entry.cardId) ?? null);
    grouped.set(label, [...(grouped.get(label) ?? []), entry]);
  }
  const groups = [...grouped.entries()].sort((left, right) => deckTableTypeGroupOrder(side, left[0]) - deckTableTypeGroupOrder(side, right[0]) || left[0].localeCompare(right[0]));
  const groupCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, groups.length || 1));
  return {
    ...layout,
    piles: Array.from({ length: groupCount }, (_, index) => {
      const [label, entries] = groups[index] ?? [defaultDeckTablePileName(side, index), []];
      const sourcePile = layout.piles[index];
      return {
        id: sourcePile?.id ?? `pile-${index + 1}`,
        name: label,
        order: index,
        sortMode: "name",
        entries: reorderDeckTableEntries(entries)
      };
    })
  };
}

export function distributeDeckTableByInstallCost(layout: DeckTableLayout, side: Side, cardLookup: Map<string, CatalogCardSummary>, detailsById: Record<string, CatalogCardDetail>): DeckTableLayout {
  const allEntries = sortDeckTableEntries(layout.piles.flatMap((pile) => pile.entries), cardLookup, detailsById, "name").sort((left, right) => {
    const leftValue = deckTableEntryBuildCost(left, detailsById);
    const rightValue = deckTableEntryBuildCost(right, detailsById);
    const normalizedLeft = leftValue === null ? Number.POSITIVE_INFINITY : leftValue;
    const normalizedRight = rightValue === null ? Number.POSITIVE_INFINITY : rightValue;
    const leftType = deckBuilderCardGroup(cardLookup.get(left.cardId) ?? null);
    const rightType = deckBuilderCardGroup(cardLookup.get(right.cardId) ?? null);
    return normalizedLeft - normalizedRight || leftType.localeCompare(rightType) || (cardLookup.get(left.cardId)?.title ?? left.cardId).localeCompare(cardLookup.get(right.cardId)?.title ?? right.cardId);
  });
  const grouped = new Map<string, DeckTableLayoutEntry[]>();
  for (const entry of allEntries) {
    const value = deckTableEntryBuildCost(entry, detailsById);
    const key = value === null ? "none" : String(value);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }
  const groups = [...grouped.entries()].sort((left, right) => {
    const leftValue = left[0] === "none" ? Number.POSITIVE_INFINITY : Number(left[0]);
    const rightValue = right[0] === "none" ? Number.POSITIVE_INFINITY : Number(right[0]);
    return leftValue - rightValue;
  });
  const visibleGroups =
    groups.length > MAX_DECK_TABLE_PILE_COUNT
      ? [...groups.slice(0, MAX_DECK_TABLE_PILE_COUNT - 1), ["overflow", groups.slice(MAX_DECK_TABLE_PILE_COUNT - 1).flatMap(([, entries]) => entries)] as [string, DeckTableLayoutEntry[]]]
      : groups;
  const groupCount = Math.min(MAX_DECK_TABLE_PILE_COUNT, Math.max(MIN_DECK_TABLE_PILE_COUNT, visibleGroups.length || 1));
  return {
    ...layout,
    piles: Array.from({ length: groupCount }, (_, index) => {
      const [key, entries] = visibleGroups[index] ?? [String(index), []];
      const sourcePile = layout.piles[index];
      const name = deckTableBuildCostGroupName(key, entries, cardLookup);
      return {
        id: sourcePile?.id ?? `pile-${index + 1}`,
        name: entries.length > 0 ? name : defaultDeckTablePileName(side, index),
        order: index,
        sortMode: "name",
        entries: reorderDeckTableEntries(entries)
      };
    })
  };
}

export function deckMetadataFromEditable(deck: EditableDeck | null): DeckPublicMetadata | undefined {
  if (!deck) return undefined;
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    ...(deck.cardPoolVersion ? { cardPoolVersion: deck.cardPoolVersion } : {}),
    formatProfileId: deck.formatProfileId,
    ...(deck.formatProfileVersion ? { formatProfileVersion: deck.formatProfileVersion } : {}),
    deckHash: "wird beim Start geprüft"
  };
}
