import snapshotData from "../../../data/card-import/card-snapshot-0.8.json";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type CatalogSide = "runner" | "corp";

export type CatalogCardType =
  | "identity"
  | "event"
  | "program"
  | "hardware"
  | "resource"
  | "agenda"
  | "operation"
  | "asset"
  | "upgrade"
  | "ice";

export type CatalogStatusKey = "imported" | "validated" | "catalog_ready" | "implemented" | "playable" | "deck_legal" | "blocked";

export type CatalogStatuses = Record<CatalogStatusKey, boolean>;

export type CatalogNumericFields = {
  cost: number | null;
  installCost: number | null;
  memoryCost: number | null;
  strength: number | null;
  rezCost: number | null;
  trashCost: number | null;
  advancementRequirement: number | null;
  agendaPoints: number | null;
};

export type CatalogManifestReference = {
  manifestVersion: string;
  status: string;
  unitTests: string[];
  scenarioTests: string[];
  visibilityTests: string[];
  replayTests: string[];
};

export type CatalogCard = {
  catalogCardId: string;
  sourceCardId: string;
  engineCardId: string | null;
  title: string;
  side: CatalogSide;
  type: CatalogCardType;
  subtypes: string[];
  faction: string;
  setId: string;
  setName: string;
  collectorNumber: string;
  text: string;
  displayOnlyText: boolean;
  numeric: CatalogNumericFields;
  statuses: CatalogStatuses;
  blockReasons: string[];
  implementationManifest: CatalogManifestReference | null;
};

export type CardSnapshot = {
  schemaVersion: "card-snapshot-v0.5";
  snapshotId: string;
  status: string;
  createdAt: string;
  sourceRegistryId: string;
  copyrightNote: string;
  normalization: {
    algorithm: string;
    sortOrder: string[];
    textPolicy: string;
    assetPolicy: string;
  };
  cards: CatalogCard[];
};

export type CatalogCardSummary = Pick<
  CatalogCard,
  "catalogCardId" | "title" | "side" | "type" | "subtypes" | "faction" | "setId" | "statuses" | "blockReasons"
>;

export type CatalogIndex = {
  schemaVersion: "catalog-index-v0.5";
  id: string;
  snapshotId: string;
  snapshotHash: string;
  status: string;
  cards: CatalogCardSummary[];
  byId: Record<string, number>;
  filters: {
    sides: CatalogSide[];
    types: CatalogCardType[];
    factions: string[];
    sets: string[];
    statuses: CatalogStatusKey[];
  };
  searchIndex: Record<string, string>;
  statusSummary: Partial<Record<CatalogStatusKey, number>>;
};

export type CatalogQuery = {
  q?: string;
  side?: CatalogSide | "all";
  type?: CatalogCardType | "all";
  status?: CatalogStatusKey | "all";
};

export type CatalogValidationResult = {
  ok: boolean;
  errors: string[];
};

export type RuntimeCardPool = {
  snapshot: CardSnapshot;
  snapshotHash: string;
  catalogIndex: CatalogIndex;
  validation: CatalogValidationResult;
  cardsById: Record<string, CatalogCard>;
};

export const CATALOG_STATUS_KEYS: CatalogStatusKey[] = ["imported", "validated", "catalog_ready", "implemented", "playable", "deck_legal", "blocked"];

export const FORBIDDEN_CATALOG_PAYLOAD_KEYS = [
  "GameState",
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "fullState",
  "stateSnapshots",
  "undoSnapshots"
] as const;

export function normalizeSnapshot(snapshot: CardSnapshot): CardSnapshot {
  return {
    ...snapshot,
    cards: snapshot.cards
      .map((card) => ({
        ...card,
        subtypes: [...card.subtypes],
        blockReasons: [...card.blockReasons],
        statuses: { ...card.statuses },
        numeric: { ...card.numeric },
        implementationManifest: card.implementationManifest
          ? {
              ...card.implementationManifest,
              unitTests: [...card.implementationManifest.unitTests],
              scenarioTests: [...card.implementationManifest.scenarioTests],
              visibilityTests: [...card.implementationManifest.visibilityTests],
              replayTests: [...card.implementationManifest.replayTests]
            }
          : null
      }))
      .sort((a, b) => a.catalogCardId.localeCompare(b.catalogCardId))
  };
}

export function validateSnapshot(snapshot: CardSnapshot): CatalogValidationResult {
  const errors: string[] = [];
  if (snapshot.schemaVersion !== "card-snapshot-v0.5") errors.push("Snapshot schemaVersion must be card-snapshot-v0.5.");
  const seen = new Set<string>();
  for (const card of snapshot.cards) {
    if (!card.catalogCardId) errors.push("Card is missing catalogCardId.");
    if (seen.has(card.catalogCardId)) errors.push(`Duplicate catalogCardId ${card.catalogCardId}.`);
    seen.add(card.catalogCardId);
    if (!card.title) errors.push(`Card ${card.catalogCardId} is missing title.`);
    if (card.side !== "runner" && card.side !== "corp") errors.push(`Card ${card.catalogCardId} has invalid side.`);
    if (!card.type) errors.push(`Card ${card.catalogCardId} is missing type.`);
    if (!card.displayOnlyText) errors.push(`Card ${card.catalogCardId} text must be display-only.`);
    if (!card.statuses.catalog_ready && card.statuses.deck_legal) errors.push(`Card ${card.catalogCardId} is deck_legal but not catalog_ready.`);
    if (card.statuses.catalog_ready && !card.statuses.validated) errors.push(`Card ${card.catalogCardId} is catalog_ready without validated.`);
    if (card.statuses.playable && !card.statuses.implemented) errors.push(`Card ${card.catalogCardId} is playable without implemented.`);
    if (card.statuses.deck_legal && !card.statuses.playable) errors.push(`Card ${card.catalogCardId} is deck_legal without playable.`);
    if (card.statuses.blocked && card.blockReasons.length === 0) errors.push(`Card ${card.catalogCardId} is blocked without reason.`);
    if (!card.statuses.implemented && card.engineCardId) errors.push(`Card ${card.catalogCardId} has engineCardId without implemented.`);
  }
  return { ok: errors.length === 0, errors };
}

export function computeSnapshotHash(snapshot: CardSnapshot): string {
  return fnv1a(stableStringify(normalizeSnapshot(snapshot)));
}

export function createCatalogIndex(snapshot: CardSnapshot, snapshotHash: string): CatalogIndex {
  const normalized = normalizeSnapshot(snapshot);
  const summaries = normalized.cards.map(toCatalogSummary);
  return {
    schemaVersion: "catalog-index-v0.5",
    id: "catalog-index-0.5",
    snapshotId: normalized.snapshotId,
    snapshotHash,
    status: normalized.status,
    cards: summaries,
    byId: Object.fromEntries(summaries.map((card, index) => [card.catalogCardId, index])),
    filters: {
      sides: unique(summaries.map((card) => card.side)),
      types: unique(summaries.map((card) => card.type)),
      factions: unique(summaries.map((card) => card.faction)),
      sets: unique(summaries.map((card) => card.setId)),
      statuses: CATALOG_STATUS_KEYS
    },
    searchIndex: Object.fromEntries(normalized.cards.map((card) => [card.catalogCardId, searchableText(card)])),
    statusSummary: summarizeStatuses(normalized.cards)
  };
}

export function toCatalogSummary(card: CatalogCard): CatalogCardSummary {
  return {
    catalogCardId: card.catalogCardId,
    title: card.title,
    side: card.side,
    type: card.type,
    subtypes: card.subtypes,
    faction: card.faction,
    setId: card.setId,
    statuses: card.statuses,
    blockReasons: card.blockReasons
  };
}

export function getCatalogCard(snapshot: CardSnapshot, catalogCardId: string): CatalogCard | undefined {
  return normalizeSnapshot(snapshot).cards.find((card) => card.catalogCardId === catalogCardId);
}

export function searchCatalog(snapshot: CardSnapshot, query: CatalogQuery = {}): CatalogCardSummary[] {
  const index = createCatalogIndex(snapshot, computeSnapshotHash(snapshot));
  const searchNeedle = normalizeSearch(query.q ?? "");
  return normalizeSnapshot(snapshot)
    .cards.filter((card) => {
      if (query.side && query.side !== "all" && card.side !== query.side) return false;
      if (query.type && query.type !== "all" && card.type !== query.type) return false;
      if (query.status && query.status !== "all" && !card.statuses[query.status]) return false;
      if (searchNeedle && !(index.searchIndex[card.catalogCardId] ?? "").includes(searchNeedle)) return false;
      return true;
    })
    .sort(compareCatalogCards)
    .map(toCatalogSummary);
}

export function summarizeStatuses(cards: CatalogCard[]): Partial<Record<CatalogStatusKey, number>> {
  const summary: Partial<Record<CatalogStatusKey, number>> = {};
  for (const card of cards) {
    for (const key of CATALOG_STATUS_KEYS) {
      if (card.statuses[key]) summary[key] = (summary[key] ?? 0) + 1;
    }
  }
  return summary;
}

export function assertCatalogPayloadSafe(payload: unknown): CatalogValidationResult {
  const serialized = JSON.stringify(payload);
  const errors = FORBIDDEN_CATALOG_PAYLOAD_KEYS.filter((key) => serialized.includes(key)).map((key) => `Catalog payload contains forbidden key ${key}.`);
  return { ok: errors.length === 0, errors };
}

export function createRuntimeCardPool(): RuntimeCardPool {
  const snapshot = createRuntimeCardSnapshot();
  const snapshotHash = computeSnapshotHash(snapshot);
  return {
    snapshot,
    snapshotHash,
    catalogIndex: createCatalogIndex(snapshot, snapshotHash),
    validation: validateSnapshot(snapshot),
    cardsById: Object.fromEntries(snapshot.cards.map((card) => [card.catalogCardId, card]))
  };
}

export function createRuntimeCardSnapshot(): CardSnapshot {
  const baseSnapshot = snapshotData as CardSnapshot;
  const localOnrSnapshot = readLocalOnrSnapshot();
  if (!localOnrSnapshot) return baseSnapshot;

  return {
    ...baseSnapshot,
    snapshotId: `${baseSnapshot.snapshotId}+${localOnrSnapshot.snapshotId}`,
    status: `${baseSnapshot.status}+private_local_onr_v1_overlay`,
    copyrightNote: `${baseSnapshot.copyrightNote} Private lokale O:NR-v1-Katalogdaten werden nur aus dem lokalen Import-Overlay geladen; deck-legale Karten müssen zusätzlich in der Engine implementiert sein.`,
    normalization: {
      ...baseSnapshot.normalization,
      textPolicy: `${baseSnapshot.normalization.textPolicy} Lokale O:NR-v1-Texte bleiben Anzeigeinformation und sind kein Regelparser.`,
      assetPolicy: `${baseSnapshot.normalization.assetPolicy} Lokale O:NR-v1-Bilder werden nur aus data/local-assets gelesen.`
    },
    cards: [...baseSnapshot.cards, ...localOnrSnapshot.cards]
  };
}

export function createRuntimeCardsById(): Record<string, CatalogCard> {
  const snapshot = createRuntimeCardSnapshot();
  return Object.fromEntries(snapshot.cards.map((card) => [card.catalogCardId, card]));
}

function compareCatalogCards(left: CatalogCard, right: CatalogCard): number {
  return (
    left.side.localeCompare(right.side) ||
    left.type.localeCompare(right.type) ||
    left.title.localeCompare(right.title) ||
    left.catalogCardId.localeCompare(right.catalogCardId)
  );
}

function searchableText(card: CatalogCard): string {
  return normalizeSearch([card.title, card.side, card.type, card.faction, card.setId, ...card.subtypes, card.text].join(" "));
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase("de-DE").normalize("NFKC").trim();
}

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function readLocalOnrSnapshot(): CardSnapshot | null {
  for (const candidate of localSnapshotCandidates()) {
    if (!existsSync(candidate)) continue;
    return JSON.parse(readFileSync(candidate, "utf8")) as CardSnapshot;
  }
  return null;
}

function localSnapshotCandidates(): string[] {
  const relative = path.join("data", "local", "card-import", "onr-v1-limited", "card-snapshot-onr-v1-limited.local.json");
  return Array.from(
    new Set([
      path.resolve(process.cwd(), relative),
      path.resolve(process.cwd(), "..", relative),
      path.resolve(process.cwd(), "..", "..", relative)
    ])
  );
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
