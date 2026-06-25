export type CatalogTypeFilterKey = "ice" | "agenda" | "icebreaker" | "asset" | "upgrade" | "operation" | "event" | "hardware" | "resource" | "program";

export type CatalogTypeFilterState = Record<CatalogTypeFilterKey, boolean>;
export type CatalogSetFilterKey = "all" | "original" | "test" | "other";
export type CatalogRarityFilterKey = "all" | "common" | "uncommon" | "rare" | "vital";
export type CatalogAiHintFilterKey = "all" | "new_facts" | "generated_facts" | "warnings" | "missing";
export type CatalogBlockStatusFilterKey = "all" | "not_blocked" | "blocked";
export type CatalogStatusKey = "imported" | "validated" | "catalog_ready" | "implemented" | "engine_supported" | "playable" | "human_playable" | "ai_supported" | "deck_legal" | "format_legal" | "blocked";

export type CatalogStatuses = Record<CatalogStatusKey, boolean>;

export type CatalogCardForTypeFilter = {
  catalogCardId: string;
  type: string;
  subtypes: string[];
};

export type CatalogCardForSetFilter = {
  catalogCardId: string;
  setId: string;
};

export type CatalogCardForSetDisplay = {
  setId?: string | null;
  setName?: string | null;
  collectorNumber?: string | null;
};

export type CatalogSetIdFilterOption = {
  key: string;
  label: string;
  count: number;
};

export type CatalogCardForRarityFilter = {
  catalogCardId: string;
  rarity?: {
    code?: string;
    labelDe?: string;
  } | null;
};

export type CatalogAiInspectorSummary = {
  available: boolean;
  aiSupportStatus: string;
  compiledHintFound: boolean;
  mechanicalFactsFound: boolean;
  generatedFactsFound: boolean;
  hasClassifications: boolean;
  hasWarnings: boolean;
};

export type CatalogCardForAiHintFilter = {
  catalogCardId: string;
  aiInspectorSummary?: CatalogAiInspectorSummary | null;
};

export type CatalogCardForBlockStatusFilter = {
  catalogCardId: string;
  statuses: {
    blocked: boolean;
  };
};

export type CatalogCardForStatusSummary = {
  type: string;
  statuses: CatalogStatuses;
};

export const CATALOG_STATUS_LABELS: Record<CatalogStatusKey, string> = {
  imported: "Importiert",
  validated: "Geprüft",
  catalog_ready: "Im Katalog",
  implemented: "Implementiert",
  engine_supported: "Engine",
  playable: "Runtime spielbar",
  human_playable: "Für Menschen spielbar",
  ai_supported: "KI geeignet",
  deck_legal: "Deckbau erlaubt",
  format_legal: "Im lokalen Format",
  blocked: "Blockiert"
};

export const PRIMARY_CATALOG_STATUS_KEYS: CatalogStatusKey[] = ["human_playable", "deck_legal", "format_legal", "ai_supported", "blocked"];

export const TECHNICAL_CATALOG_STATUS_KEYS: CatalogStatusKey[] = ["imported", "validated", "catalog_ready", "implemented", "engine_supported", "playable"];

export const CATALOG_STATUS_FILTER_KEYS: CatalogStatusKey[] = [...PRIMARY_CATALOG_STATUS_KEYS, ...TECHNICAL_CATALOG_STATUS_KEYS];

export const CATALOG_RARITY_FILTERS: Array<{ key: CatalogRarityFilterKey; label: string }> = [
  { key: "all", label: "Alle Raritäten" },
  { key: "common", label: "Häufig" },
  { key: "uncommon", label: "Ungewöhnlich" },
  { key: "rare", label: "Selten" },
  { key: "vital", label: "Vital" }
];

export const CATALOG_AI_HINT_FILTERS: Array<{ key: CatalogAiHintFilterKey; label: string }> = [
  { key: "all", label: "Alle KI-Hinweise" },
  { key: "new_facts", label: "Neu versorgt" },
  { key: "generated_facts", label: "Generierte Facts" },
  { key: "warnings", label: "Warnings" },
  { key: "missing", label: "Ohne KI-Hinweise" }
];

export const CATALOG_BLOCK_STATUS_FILTERS: Array<{ key: CatalogBlockStatusFilterKey; label: string }> = [
  { key: "all", label: "Alle Blockstatus" },
  { key: "not_blocked", label: "Nicht blockiert" },
  { key: "blocked", label: "Blockiert" }
];

const CATALOG_RARITY_LABELS_DE: Record<Exclude<CatalogRarityFilterKey, "all">, string> = {
  common: "Häufig",
  uncommon: "Ungewöhnlich",
  rare: "Selten",
  vital: "Vital"
};

const ORIGINAL_SET_PREFIXES = ["onr-", "originalset-"];
const TEST_SET_PREFIXES = ["mvp-", "testset-", "v"];
const CATALOG_SET_LABELS: Record<string, string> = {
  "originalset-v1": "Original Version 1",
  "onr-v1-limited-private-local": "Original Version 1",
  proteus: "Proteus",
  "proteus-v1": "Proteus",
  classic: "Classic",
  "classic-v1": "Classic",
  testset: "Testkarten",
  "testset-v1": "Testkarten"
};

export function catalogTypeKeysForCard(card: Pick<CatalogCardForTypeFilter, "type" | "subtypes">): CatalogTypeFilterKey[] {
  const type = card.type.toLowerCase();
  if (type === "program" && card.subtypes.some((subtype) => subtype.toLowerCase() === "icebreaker")) return ["icebreaker"];
  if (type.startsWith("hardware-")) return ["hardware"];
  switch (type) {
    case "ice":
      return ["ice"];
    case "agenda":
      return ["agenda"];
    case "asset":
      return ["asset"];
    case "upgrade":
      return ["upgrade"];
    case "operation":
      return ["operation"];
    case "event":
      return ["event"];
    case "hardware":
      return ["hardware"];
    case "resource":
      return ["resource"];
    case "program":
      return ["program"];
    default:
      return [];
  }
}

export function catalogCardMatchesTypeFilters(card: CatalogCardForTypeFilter, filters: CatalogTypeFilterState): boolean {
  const keys = catalogTypeKeysForCard(card);
  if (keys.length === 0) return Object.values(filters).every(Boolean);
  return keys.some((key) => filters[key]);
}

export function filterCatalogCardsByType<T extends CatalogCardForTypeFilter>(cards: T[], filters: CatalogTypeFilterState): T[] {
  return cards.filter((card) => catalogCardMatchesTypeFilters(card, filters));
}

export function nextCatalogSelection<T extends CatalogCardForTypeFilter>(current: string | null, cards: T[], filters: CatalogTypeFilterState): string | null {
  const filteredCards = filterCatalogCardsByType(cards, filters);
  if (current && filteredCards.some((card) => card.catalogCardId === current)) return current;
  return filteredCards[0]?.catalogCardId ?? null;
}

export function summarizeCatalogTypeFilters(cards: CatalogCardForTypeFilter[]): Partial<Record<CatalogTypeFilterKey, number>> {
  const counts: Partial<Record<CatalogTypeFilterKey, number>> = {};
  for (const card of cards) {
    for (const key of catalogTypeKeysForCard(card)) {
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

export function isCatalogVisibleCard(card: Pick<CatalogCardForStatusSummary, "type">): boolean {
  return card.type !== "identity";
}

export function summarizeCatalogStatuses(cards: CatalogCardForStatusSummary[]): Partial<Record<CatalogStatusKey, number>> {
  const counts: Partial<Record<CatalogStatusKey, number>> = {};
  for (const card of cards) {
    for (const key of CATALOG_STATUS_FILTER_KEYS) {
      if (card.statuses[key]) counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return counts;
}

export function catalogSetKeyForCard(card: CatalogCardForSetFilter): Exclude<CatalogSetFilterKey, "all"> {
  const setId = card.setId.toLowerCase();
  if (ORIGINAL_SET_PREFIXES.some((prefix) => setId.startsWith(prefix))) return "original";
  if (TEST_SET_PREFIXES.some((prefix) => setId.startsWith(prefix))) return "test";
  return "other";
}

export function catalogCardMatchesSetFilter(card: CatalogCardForSetFilter, filter: CatalogSetFilterKey): boolean {
  return filter === "all" || catalogSetKeyForCard(card) === filter;
}

export function filterCatalogCardsBySet<T extends CatalogCardForSetFilter>(cards: T[], filter: CatalogSetFilterKey): T[] {
  return cards.filter((card) => catalogCardMatchesSetFilter(card, filter));
}

export function summarizeCatalogSetFilters(cards: CatalogCardForSetFilter[]): Record<CatalogSetFilterKey, number> {
  const counts: Record<CatalogSetFilterKey, number> = { all: cards.length, original: 0, test: 0, other: 0 };
  for (const card of cards) {
    counts[catalogSetKeyForCard(card)] += 1;
  }
  return counts;
}

export function catalogSetLabelForSetId(setId: string): string {
  const normalizedSetId = setId.trim().toLowerCase();
  if (!normalizedSetId) return "Ohne Set";
  if (CATALOG_SET_LABELS[normalizedSetId]) return CATALOG_SET_LABELS[normalizedSetId];
  if (normalizedSetId.startsWith("originalset-") || normalizedSetId.startsWith("onr-v1")) return "Original Version 1";
  if (normalizedSetId.startsWith("proteus")) return "Proteus";
  if (normalizedSetId.startsWith("classic")) return "Classic";
  if (normalizedSetId.startsWith("testset-") || normalizedSetId.startsWith("mvp-")) return "Testkarten";
  if (normalizedSetId.includes("android") || normalizedSetId.includes("netrunner")) return "Android: Netrunner";
  return setId
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function catalogSetShortLabelForSetId(setId: string | null | undefined): string | null {
  const normalizedSetId = setId?.trim().toLowerCase() ?? "";
  if (!normalizedSetId) return null;
  if (normalizedSetId.startsWith("originalset-") || normalizedSetId.startsWith("onr-v1")) return "OV1";
  if (normalizedSetId.startsWith("proteus")) return "PRO";
  if (normalizedSetId.startsWith("classic")) return "CLS";
  if (normalizedSetId.startsWith("testset-") || normalizedSetId.startsWith("mvp-")) return "TEST";
  const compact = normalizedSetId
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  return compact.slice(0, 4) || normalizedSetId.slice(0, 4).toUpperCase();
}

export function catalogSetDetailLabel(card: CatalogCardForSetDisplay): string | null {
  const setId = card.setId?.trim();
  if (!setId) return null;
  const setName = card.setName?.trim() || catalogSetLabelForSetId(setId);
  const collectorNumber = card.collectorNumber?.trim();
  return collectorNumber ? `${setName} #${collectorNumber}` : setName;
}

export function catalogSetFilterOptions(cards: CatalogCardForSetFilter[]): CatalogSetIdFilterOption[] {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const key = card.setId || "";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const options = [...counts.entries()]
    .map(([key, count]) => ({ key, label: catalogSetLabelForSetId(key), count }))
    .sort((left, right) => left.label.localeCompare(right.label, "de") || left.key.localeCompare(right.key, "de"));
  return [{ key: "all", label: "Alle Sets", count: cards.length }, ...options];
}

export function filterCatalogCardsBySetId<T extends CatalogCardForSetFilter>(cards: T[], setId: string): T[] {
  return setId === "all" ? cards : cards.filter((card) => card.setId === setId);
}

export function catalogRarityLabel(card: CatalogCardForRarityFilter): string | null {
  const code = card.rarity?.code;
  if (isCatalogRarityCode(code)) return CATALOG_RARITY_LABELS_DE[code];
  return card.rarity?.labelDe ?? null;
}

export function catalogCardMatchesRarityFilter(card: CatalogCardForRarityFilter, filter: CatalogRarityFilterKey): boolean {
  return filter === "all" || card.rarity?.code === filter;
}

export function filterCatalogCardsByRarity<T extends CatalogCardForRarityFilter>(cards: T[], filter: CatalogRarityFilterKey): T[] {
  return cards.filter((card) => catalogCardMatchesRarityFilter(card, filter));
}

export function summarizeCatalogRarityFilters(cards: CatalogCardForRarityFilter[]): Record<CatalogRarityFilterKey, number> {
  const counts: Record<CatalogRarityFilterKey, number> = { all: cards.length, common: 0, uncommon: 0, rare: 0, vital: 0 };
  for (const card of cards) {
    const code = card.rarity?.code;
    if (isCatalogRarityCode(code)) counts[code] += 1;
  }
  return counts;
}

export function catalogCardMatchesAiHintFilter(card: CatalogCardForAiHintFilter, filter: CatalogAiHintFilterKey): boolean {
  const summary = card.aiInspectorSummary;
  switch (filter) {
    case "all":
      return true;
    case "new_facts":
      return Boolean(summary?.mechanicalFactsFound);
    case "generated_facts":
      return Boolean(summary?.generatedFactsFound);
    case "warnings":
      return Boolean(summary?.hasWarnings);
    case "missing":
      return !summary?.available;
  }
}

export function filterCatalogCardsByAiHint<T extends CatalogCardForAiHintFilter>(cards: T[], filter: CatalogAiHintFilterKey): T[] {
  return cards.filter((card) => catalogCardMatchesAiHintFilter(card, filter));
}

export function summarizeCatalogAiHintFilters(cards: CatalogCardForAiHintFilter[]): Record<CatalogAiHintFilterKey, number> {
  const counts: Record<CatalogAiHintFilterKey, number> = { all: cards.length, new_facts: 0, generated_facts: 0, warnings: 0, missing: 0 };
  for (const card of cards) {
    if (catalogCardMatchesAiHintFilter(card, "new_facts")) counts.new_facts += 1;
    if (catalogCardMatchesAiHintFilter(card, "generated_facts")) counts.generated_facts += 1;
    if (catalogCardMatchesAiHintFilter(card, "warnings")) counts.warnings += 1;
    if (catalogCardMatchesAiHintFilter(card, "missing")) counts.missing += 1;
  }
  return counts;
}

export function catalogCardMatchesBlockStatusFilter(card: CatalogCardForBlockStatusFilter, filter: CatalogBlockStatusFilterKey): boolean {
  switch (filter) {
    case "all":
      return true;
    case "not_blocked":
      return !card.statuses.blocked;
    case "blocked":
      return card.statuses.blocked;
  }
}

export function filterCatalogCardsByBlockStatus<T extends CatalogCardForBlockStatusFilter>(cards: T[], filter: CatalogBlockStatusFilterKey): T[] {
  return cards.filter((card) => catalogCardMatchesBlockStatusFilter(card, filter));
}

export function summarizeCatalogBlockStatusFilters(cards: CatalogCardForBlockStatusFilter[]): Record<CatalogBlockStatusFilterKey, number> {
  const counts: Record<CatalogBlockStatusFilterKey, number> = { all: cards.length, not_blocked: 0, blocked: 0 };
  for (const card of cards) {
    counts[card.statuses.blocked ? "blocked" : "not_blocked"] += 1;
  }
  return counts;
}

function isCatalogRarityCode(value: string | undefined): value is Exclude<CatalogRarityFilterKey, "all"> {
  return value === "common" || value === "uncommon" || value === "rare" || value === "vital";
}
