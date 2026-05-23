export type CatalogTypeFilterKey = "ice" | "agenda" | "icebreaker" | "asset" | "upgrade" | "operation" | "event" | "hardware" | "resource" | "program";

export type CatalogTypeFilterState = Record<CatalogTypeFilterKey, boolean>;
export type CatalogSetFilterKey = "all" | "original" | "test" | "other";
export type CatalogRarityFilterKey = "all" | "common" | "uncommon" | "rare" | "vital";

export type CatalogCardForTypeFilter = {
  catalogCardId: string;
  type: string;
  subtypes: string[];
};

export type CatalogCardForSetFilter = {
  catalogCardId: string;
  setId: string;
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

export const CATALOG_RARITY_FILTERS: Array<{ key: CatalogRarityFilterKey; label: string }> = [
  { key: "all", label: "Alle Raritäten" },
  { key: "common", label: "Häufig" },
  { key: "uncommon", label: "Ungewöhnlich" },
  { key: "rare", label: "Selten" },
  { key: "vital", label: "Vital" }
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

function isCatalogRarityCode(value: string | undefined): value is Exclude<CatalogRarityFilterKey, "all"> {
  return value === "common" || value === "uncommon" || value === "rare" || value === "vital";
}
