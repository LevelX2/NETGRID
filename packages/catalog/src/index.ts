import { createRuntimeCardsFromCardSets } from "./card-set-loader";
import { CATALOG_RARITY_CODES, CATALOG_RARITY_LABELS } from "./rarity";
import type {
  CardSnapshot,
  CatalogCard,
  CatalogCardSummary,
  CatalogIndex,
  CatalogQuery,
  CatalogRarity,
  CatalogStatusKey,
  CatalogStatuses,
  CatalogValidationResult,
} from "./catalog-types";

export type {
  AiApprovalEvidence,
  CardFactEvidence,
  CatalogAiApprovalBatch,
  CatalogGateBatch,
  ReleaseEvidence,
  RuntimeGateEvidence,
} from "./gate-evidence";
export type {
  CardSnapshot,
  CatalogCard,
  CatalogCardSummary,
  CatalogCardType,
  CatalogIndex,
  CatalogManifestReference,
  CatalogNumericFields,
  CatalogPlayCost,
  CatalogQuery,
  CatalogRarity,
  CatalogRarityCode,
  CatalogSide,
  CatalogStatusKey,
  CatalogStatuses,
  CatalogVariableXPlayCost,
  CatalogValidationResult,
} from "./catalog-types";
export type RuntimeCardPool = {
  snapshot: CardSnapshot;
  snapshotHash: string;
  catalogIndex: CatalogIndex;
  validation: CatalogValidationResult;
  cardsById: Record<string, CatalogCard>;
};

export const CATALOG_STATUS_KEYS: CatalogStatusKey[] = [
  "imported",
  "validated",
  "catalog_ready",
  "implemented",
  "engine_supported",
  "playable",
  "human_playable",
  "ai_supported",
  "deck_legal",
  "format_legal",
  "blocked",
];

export const FORBIDDEN_CATALOG_PAYLOAD_KEYS = [
  "GameState",
  "cardInstances",
  "privatePayload",
  "sessionToken",
  "reconnectToken",
  "joinToken",
  "fullState",
  "stateSnapshots",
  "undoSnapshots",
] as const;

export * from "./ai-support-readiness";
export * from "./card-set-loader";
export * from "./rarity";

export function normalizeSnapshot(snapshot: CardSnapshot): CardSnapshot {
  return {
    ...snapshot,
    cards: snapshot.cards
      .map((card) => ({
        ...card,
        ...cloneRarityField(card.rarity),
        subtypes: [...card.subtypes],
        blockReasons: [...card.blockReasons],
        statuses: { ...card.statuses },
        numeric: { ...card.numeric },
        playCost: clonePlayCost(card.playCost),
        strengthModel: { ...card.strengthModel },
        implementationManifest: card.implementationManifest
          ? {
              ...card.implementationManifest,
              unitTests: [...card.implementationManifest.unitTests],
              scenarioTests: [...card.implementationManifest.scenarioTests],
              visibilityTests: [...card.implementationManifest.visibilityTests],
              replayTests: [...card.implementationManifest.replayTests],
            }
          : null,
      }))
      .sort((a, b) => a.catalogCardId.localeCompare(b.catalogCardId)),
  };
}

export function validateSnapshot(
  snapshot: CardSnapshot,
): CatalogValidationResult {
  const errors: string[] = [];
  if (snapshot.schemaVersion !== "card-snapshot-v0.5")
    errors.push("Snapshot schemaVersion must be card-snapshot-v0.5.");
  const seen = new Set<string>();
  const seenPrintingIds = new Set<string>();
  for (const card of snapshot.cards) {
    if (!card.catalogCardId) errors.push("Card is missing catalogCardId.");
    if (seen.has(card.catalogCardId))
      errors.push(`Duplicate catalogCardId ${card.catalogCardId}.`);
    seen.add(card.catalogCardId);
    if (!card.printingId)
      errors.push(`Card ${card.catalogCardId} is missing printingId.`);
    if (seenPrintingIds.has(card.printingId))
      errors.push(`Duplicate printingId ${card.printingId}.`);
    seenPrintingIds.add(card.printingId);
    if (!card.title)
      errors.push(`Card ${card.catalogCardId} is missing title.`);
    if (card.side !== "runner" && card.side !== "corp")
      errors.push(`Card ${card.catalogCardId} has invalid side.`);
    if (!card.type) errors.push(`Card ${card.catalogCardId} is missing type.`);
    errors.push(...validateResolvedPlayCost(card));
    if (!card.displayOnlyText)
      errors.push(`Card ${card.catalogCardId} text must be display-only.`);
    if (card.rarity) {
      if (!CATALOG_RARITY_CODES.includes(card.rarity.code))
        errors.push(`Card ${card.catalogCardId} has invalid rarity code.`);
      const labels = CATALOG_RARITY_LABELS[card.rarity.code];
      if (
        labels &&
        (card.rarity.labelDe !== labels.labelDe ||
          card.rarity.labelEn !== labels.labelEn)
      ) {
        errors.push(
          `Card ${card.catalogCardId} has inconsistent rarity labels.`,
        );
      }
      if (!card.rarity.sourceValue || !card.rarity.sourceId)
        errors.push(`Card ${card.catalogCardId} has incomplete rarity source.`);
    }
    if (!card.statuses.catalog_ready && card.statuses.deck_legal)
      errors.push(
        `Card ${card.catalogCardId} is deck_legal but not catalog_ready.`,
      );
    if (card.statuses.catalog_ready && !card.statuses.validated)
      errors.push(
        `Card ${card.catalogCardId} is catalog_ready without validated.`,
      );
    if (card.statuses.playable && !card.statuses.implemented)
      errors.push(
        `Card ${card.catalogCardId} is playable without implemented.`,
      );
    if (card.statuses.engine_supported && !card.statuses.implemented)
      errors.push(
        `Card ${card.catalogCardId} is engine_supported without implemented.`,
      );
    if (
      card.statuses.human_playable &&
      (!card.statuses.engine_supported || !card.statuses.playable)
    )
      errors.push(
        `Card ${card.catalogCardId} is human_playable without engine_supported/playable.`,
      );
    if (card.statuses.ai_supported && !card.statuses.human_playable)
      errors.push(
        `Card ${card.catalogCardId} is ai_supported without human_playable.`,
      );
    if (card.statuses.deck_legal && !card.statuses.playable)
      errors.push(`Card ${card.catalogCardId} is deck_legal without playable.`);
    if (
      card.statuses.deck_legal &&
      Object.prototype.hasOwnProperty.call(card.statuses, "human_playable") &&
      !card.statuses.human_playable
    )
      errors.push(
        `Card ${card.catalogCardId} is deck_legal without human_playable.`,
      );
    if (card.statuses.format_legal && !card.statuses.deck_legal)
      errors.push(
        `Card ${card.catalogCardId} is format_legal without deck_legal.`,
      );
    if (card.statuses.blocked && card.blockReasons.length === 0)
      errors.push(`Card ${card.catalogCardId} is blocked without reason.`);
    if (!card.statuses.implemented && card.engineCardId)
      errors.push(
        `Card ${card.catalogCardId} has engineCardId without implemented.`,
      );
  }
  return { ok: errors.length === 0, errors };
}

export function computeSnapshotHash(snapshot: CardSnapshot): string {
  return fnv1a(stableStringify(normalizeSnapshot(snapshot)));
}

export function createCatalogIndex(
  snapshot: CardSnapshot,
  snapshotHash: string,
): CatalogIndex {
  const normalized = normalizeSnapshot(snapshot);
  const summaries = normalized.cards.map(toCatalogSummary);
  return {
    schemaVersion: "catalog-index-v0.5",
    id: "catalog-index-0.5",
    snapshotId: normalized.snapshotId,
    snapshotHash,
    status: normalized.status,
    cards: summaries,
    byId: Object.fromEntries(
      summaries.map((card, index) => [card.catalogCardId, index]),
    ),
    filters: {
      sides: unique(summaries.map((card) => card.side)),
      types: unique(summaries.map((card) => card.type)),
      factions: unique(summaries.map((card) => card.faction)),
      sets: unique(summaries.map((card) => card.setId)),
      statuses: statusKeysForCards(normalized.cards),
    },
    searchIndex: Object.fromEntries(
      normalized.cards.map((card) => [
        card.catalogCardId,
        searchableText(card),
      ]),
    ),
    statusSummary: summarizeStatuses(normalized.cards),
  };
}

export function toCatalogSummary(card: CatalogCard): CatalogCardSummary {
  return {
    catalogCardId: card.catalogCardId,
    printingId: card.printingId,
    title: card.title,
    side: card.side,
    type: card.type,
    subtypes: card.subtypes,
    faction: card.faction,
    setId: card.setId,
    ...cloneRarityField(card.rarity),
    statuses: card.statuses,
    blockReasons: card.blockReasons,
  };
}

export function getCatalogCard(
  snapshot: CardSnapshot,
  catalogCardId: string,
): CatalogCard | undefined {
  return normalizeSnapshot(snapshot).cards.find(
    (card) => card.catalogCardId === catalogCardId,
  );
}

export function searchCatalog(
  snapshot: CardSnapshot,
  query: CatalogQuery = {},
): CatalogCardSummary[] {
  const index = createCatalogIndex(snapshot, computeSnapshotHash(snapshot));
  const searchNeedle = normalizeSearch(query.q ?? "");
  return normalizeSnapshot(snapshot)
    .cards.filter((card) => {
      if (query.side && query.side !== "all" && card.side !== query.side)
        return false;
      if (query.type && query.type !== "all" && card.type !== query.type)
        return false;
      if (
        query.status &&
        query.status !== "all" &&
        !card.statuses[query.status]
      )
        return false;
      if (
        searchNeedle &&
        !(index.searchIndex[card.catalogCardId] ?? "").includes(searchNeedle)
      )
        return false;
      return true;
    })
    .sort(compareCatalogCards)
    .map(toCatalogSummary);
}

export function summarizeStatuses(
  cards: Array<{ statuses: CatalogStatuses }>,
): Partial<Record<CatalogStatusKey, number>> {
  const summary: Partial<Record<CatalogStatusKey, number>> = {};
  for (const card of cards) {
    for (const key of CATALOG_STATUS_KEYS) {
      if (card.statuses[key]) summary[key] = (summary[key] ?? 0) + 1;
    }
  }
  return summary;
}

function statusKeysForCards(cards: CatalogCard[]): CatalogStatusKey[] {
  return CATALOG_STATUS_KEYS.filter((key) =>
    cards.some((card) =>
      Object.prototype.hasOwnProperty.call(card.statuses, key),
    ),
  );
}

export function assertCatalogPayloadSafe(
  payload: unknown,
): CatalogValidationResult {
  const serialized = JSON.stringify(payload);
  const errors = FORBIDDEN_CATALOG_PAYLOAD_KEYS.filter((key) =>
    serialized.includes(key),
  ).map((key) => `Catalog payload contains forbidden key ${key}.`);
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
    cardsById: Object.fromEntries(
      snapshot.cards.map((card) => [card.catalogCardId, card]),
    ),
  };
}

export function createRuntimeCardSnapshot(): CardSnapshot {
  return {
    schemaVersion: "card-snapshot-v0.5",
    snapshotId: "card-set-support-current",
    status: "active_card_set_support",
    createdAt: "2026-05-17T00:00:00.000+02:00",
    sourceRegistryId: "card-spec-card-set-support-current",
    copyrightNote:
      "Aktive NETGRID-Karten- und Supportdaten stammen ausschließlich aus validierten CardSpec-, SetSpec-, Registry- und Evidence-Projektionen. Kartentexte bleiben Anzeigeinformation und sind kein Regelparser.",
    normalization: {
      algorithm: "card-spec-card-set-support-v1",
      sortOrder: ["setId", "cardId"],
      textPolicy: "display_only; card text is not parser input",
      assetPolicy: "no active artwork, frame, logo or card-back dependency",
    },
    cards: createRuntimeCardsFromCardSets(),
  };
}

export function createRuntimeCardsById(): Record<string, CatalogCard> {
  const snapshot = createRuntimeCardSnapshot();
  return Object.fromEntries(
    snapshot.cards.map((card) => [card.catalogCardId, card]),
  );
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
  return normalizeSearch(
    [
      card.title,
      card.side,
      card.type,
      card.faction,
      card.setId,
      ...card.subtypes,
      ...raritySearchTerms(card.rarity),
      card.text,
    ].join(" "),
  );
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase("de-DE").normalize("NFKC").trim();
}

function unique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function raritySearchTerms(rarity: CatalogRarity | undefined): string[] {
  if (!rarity) return [];
  return [rarity.code, rarity.labelDe, rarity.labelEn, rarity.sourceValue];
}

function cloneRarityField(rarity: CatalogRarity | null | undefined): {
  rarity?: CatalogRarity;
} {
  return rarity ? { rarity: { ...rarity } } : {};
}

function clonePlayCost(
  playCost: CatalogCard["playCost"],
): CatalogCard["playCost"] {
  if (playCost === null) return null;
  if (playCost.kind === "fixed") return { ...playCost };
  return {
    ...playCost,
    maximumX: { ...playCost.maximumX },
  };
}

function validateResolvedPlayCost(card: CatalogCard): string[] {
  const errors: string[] = [];
  const isPlayCard = card.type === "event" || card.type === "operation";
  if (!isPlayCard) {
    if (card.playCost !== null) {
      errors.push(
        `Card ${card.catalogCardId} is not an event or operation but has a play cost.`,
      );
    }
    return errors;
  }
  if (card.playCost === null) {
    errors.push(`Card ${card.catalogCardId} is missing its play cost.`);
    return errors;
  }
  if (card.playCost.kind === "fixed") {
    if (
      !hasExactKeys(card.playCost, ["kind", "credits"]) ||
      !Number.isInteger(card.playCost.credits) ||
      card.playCost.credits < 0
    ) {
      errors.push(`Card ${card.catalogCardId} has an invalid fixed play cost.`);
    }
    if (card.numeric.cost !== card.playCost.credits) {
      errors.push(
        `Card ${card.catalogCardId} fixed play cost must equal numeric.cost.`,
      );
    }
    return errors;
  }
  if (card.playCost.kind !== "variable_x") {
    errors.push(`Card ${card.catalogCardId} has an unknown play cost kind.`);
    return errors;
  }
  if (
    !hasExactKeys(card.playCost, [
      "kind",
      "minimumX",
      "creditsPerX",
      "maximumX",
    ]) ||
    !Number.isInteger(card.playCost.minimumX) ||
    card.playCost.minimumX < 1 ||
    !Number.isInteger(card.playCost.creditsPerX) ||
    card.playCost.creditsPerX <= 0 ||
    card.playCost.maximumX?.kind !== "context" ||
    !hasExactKeys(card.playCost.maximumX, ["kind"])
  ) {
    errors.push(
      `Card ${card.catalogCardId} has an invalid variable-X play cost.`,
    );
  }
  if (card.numeric.cost !== null) {
    errors.push(
      `Card ${card.catalogCardId} variable-X play cost requires numeric.cost null.`,
    );
  }
  return errors;
}

function hasExactKeys(value: object, expectedKeys: readonly string[]): boolean {
  const expected = [...expectedKeys].sort();
  const actual = Object.keys(value).sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
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
