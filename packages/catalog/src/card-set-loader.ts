import originalsetCardsData from "../../../data/cards/originalset-v1-cards.json";
import proteusCardsData from "../../../data/cards/proteus-cards.json";
import testsetCardsData from "../../../data/cards/testset-cards.json";
import originalsetSupportData from "../../../data/manifests/originalset-v1-card-support.json";
import proteusSupportData from "../../../data/manifests/proteus-card-support.json";
import testsetSupportData from "../../../data/manifests/testset-card-support.json";
import type {
  CatalogCard,
  CatalogCardType,
  CatalogManifestReference,
  CatalogNumericFields,
  CatalogRarity,
  CatalogSide,
  CatalogStatuses,
} from "./catalog-types";
import type {
  AiApprovalEvidence,
  CardFactEvidence,
  CatalogAiApprovalBatch,
  CatalogGateBatch,
  ReleaseEvidence,
  RuntimeGateEvidence,
} from "./gate-evidence";

export type CardSetSchemaVersion = "card-set-v1";
export type CardSupportSchemaVersion = "card-support-v1";

export type CardSetCard = {
  cardId: string;
  setId: string;
  title: string;
  side: CatalogSide;
  type: CatalogCardType;
  subtypes: string[];
  numeric: CatalogNumericFields;
  text: string;
  displayOnlyText: boolean;
  faction?: string;
  setName?: string;
  collectorNumber?: string;
  rarity?: CatalogRarity;
};

export type CardSetFile = {
  schemaVersion: CardSetSchemaVersion;
  setId: string;
  setName?: string;
  cards: CardSetCard[];
};

export type CardSupportEntry = {
  cardId: string;
  setId: string;
  statuses: Partial<CatalogStatuses>;
  support: {
    resolverRef: string | null;
    coverage: string[];
    aiHintRef: string | null;
    scenarioRefs: string[];
  };
  blockReasons?: string[];
};

export type CardSupportFile = {
  schemaVersion: CardSupportSchemaVersion;
  setId: string;
  cards: CardSupportEntry[];
};

export type LoadedCardSet = {
  set: CardSetFile;
  support: CardSupportFile;
};

const CARD_SET_FILES: LoadedCardSet[] = [
  {
    set: testsetCardsData as CardSetFile,
    support: testsetSupportData as CardSupportFile,
  },
  {
    set: originalsetCardsData as CardSetFile,
    support: originalsetSupportData as CardSupportFile,
  },
  {
    set: proteusCardsData as CardSetFile,
    support: proteusSupportData as CardSupportFile,
  },
];

const STATUS_KEYS = [
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
] as const;

const NUMERIC_KEYS = [
  "cost",
  "installCost",
  "memoryCost",
  "strength",
  "rezCost",
  "trashCost",
  "advancementRequirement",
  "agendaPoints",
] as const;

const SUPPORT_PAYLOAD_FORBIDDEN_PATTERNS = [
  /"sessionToken"\s*:/i,
  /"reconnectToken"\s*:/i,
  /"joinToken"\s*:/i,
  /"tokenHash"\s*:/i,
  /"fullState"\s*:/i,
  /"cardInstances"\s*:/i,
  /"privatePayload"\s*:/i,
  /"stateSnapshots"\s*:/i,
  /"undoSnapshots"\s*:/i,
  /decklist/i,
  /\b[A-Za-z]:\\/,
  /%APPDATA%/i,
  /data[\\/]local/i,
] as const;

export function loadCardSets(): readonly LoadedCardSet[] {
  const errors = validateLoadedCardSets(CARD_SET_FILES);
  if (errors.length > 0) {
    throw new Error(`Invalid card set data:\n${errors.join("\n")}`);
  }
  return CARD_SET_FILES;
}

export function validateLoadedCardSets(
  loadedSets: readonly LoadedCardSet[],
): string[] {
  const errors: string[] = [];
  const seenCardIds = new Set<string>();

  for (const loaded of loadedSets) {
    if (loaded.set.schemaVersion !== "card-set-v1")
      errors.push(`${loaded.set.setId}: card set schema must be card-set-v1.`);
    if (loaded.support.schemaVersion !== "card-support-v1")
      errors.push(
        `${loaded.support.setId}: support schema must be card-support-v1.`,
      );
    if (loaded.set.setId !== loaded.support.setId)
      errors.push(
        `${loaded.set.setId}: card set/support setId mismatch ${loaded.support.setId}.`,
      );

    const cardsById = new Map<string, CardSetCard>();
    const supportById = new Map<string, CardSupportEntry>();

    for (const card of loaded.set.cards) {
      if (card.setId !== loaded.set.setId)
        errors.push(`${card.cardId}: card setId must be ${loaded.set.setId}.`);
      if (seenCardIds.has(card.cardId))
        errors.push(`${card.cardId}: duplicate cardId across active sets.`);
      seenCardIds.add(card.cardId);
      if (cardsById.has(card.cardId))
        errors.push(`${card.cardId}: duplicate cardId inside card set.`);
      cardsById.set(card.cardId, card);
      for (const key of NUMERIC_KEYS) {
        if (!(key in card.numeric))
          errors.push(`${card.cardId}: numeric.${key} is missing.`);
        const value = card.numeric[key];
        if (value !== null && typeof value !== "number")
          errors.push(`${card.cardId}: numeric.${key} must be number or null.`);
      }
    }

    for (const entry of loaded.support.cards) {
      if (entry.setId !== loaded.support.setId)
        errors.push(
          `${entry.cardId}: support setId must be ${loaded.support.setId}.`,
        );
      if (supportById.has(entry.cardId))
        errors.push(`${entry.cardId}: duplicate support entry.`);
      supportById.set(entry.cardId, entry);
      if (!cardsById.has(entry.cardId))
        errors.push(`${entry.cardId}: support entry has no card data.`);
      errors.push(...validateSupportEntry(entry));
    }

    for (const cardId of cardsById.keys()) {
      if (!supportById.has(cardId))
        errors.push(`${cardId}: card has no support entry.`);
    }
  }

  return errors;
}

function validateSupportEntry(entry: CardSupportEntry): string[] {
  const errors: string[] = [];
  const statuses = normalizeStatuses(entry.statuses);
  if (statuses.deck_legal && !statuses.human_playable)
    errors.push(`${entry.cardId}: deck_legal requires human_playable.`);
  if (statuses.format_legal && !statuses.deck_legal)
    errors.push(`${entry.cardId}: format_legal requires deck_legal.`);
  if (statuses.ai_supported && !statuses.human_playable)
    errors.push(`${entry.cardId}: ai_supported requires human_playable.`);
  if (statuses.blocked) {
    if (statuses.deck_legal || statuses.format_legal || statuses.ai_supported)
      errors.push(
        `${entry.cardId}: blocked cards cannot be deck_legal, format_legal or ai_supported.`,
      );
    if (!entry.blockReasons || entry.blockReasons.length === 0)
      errors.push(`${entry.cardId}: blocked card needs blockReasons.`);
  }
  if (
    statuses.ai_supported &&
    (!entry.support.aiHintRef || entry.support.scenarioRefs.length === 0)
  ) {
    errors.push(`${entry.cardId}: ai_supported needs aiHintRef and scenarioRefs.`);
  }
  const serialized = JSON.stringify(entry);
  for (const pattern of SUPPORT_PAYLOAD_FORBIDDEN_PATTERNS) {
    if (pattern.test(serialized))
      errors.push(
        `${entry.cardId}: support payload contains forbidden pattern ${pattern.source}.`,
      );
  }
  return errors;
}

export function createRuntimeCardsFromCardSets(): CatalogCard[] {
  return loadCardSets()
    .flatMap(({ set, support }) => {
      const supportById = new Map(
        support.cards.map((entry) => [entry.cardId, entry]),
      );
      return set.cards.map((card) =>
        toCatalogCard(card, set, supportById.get(card.cardId)),
      );
    })
    .sort((left, right) => left.catalogCardId.localeCompare(right.catalogCardId));
}

function toCatalogCard(
  card: CardSetCard,
  set: CardSetFile,
  supportEntry: CardSupportEntry | undefined,
): CatalogCard {
  const statuses = normalizeStatuses(supportEntry?.statuses ?? {});
  const engineCardId = engineCardIdFromSupport(card.cardId, supportEntry);
  return {
    catalogCardId: card.cardId,
    sourceCardId: card.cardId,
    engineCardId,
    title: card.title,
    side: card.side,
    type: card.type,
    subtypes: [...card.subtypes],
    faction: card.faction ?? `${card.setId}_neutral`,
    setId: card.setId,
    setName: card.setName ?? set.setName ?? card.setId,
    collectorNumber: card.collectorNumber ?? collectorNumberFromCardId(card.cardId),
    ...(card.rarity ? { rarity: { ...card.rarity } } : {}),
    text: card.text,
    displayOnlyText: card.displayOnlyText,
    numeric: { ...card.numeric },
    statuses,
    blockReasons: supportEntry?.blockReasons ? [...supportEntry.blockReasons] : [],
    implementationManifest:
      statuses.engine_supported || statuses.human_playable
        ? manifestReferenceFromSupport(card.setId, supportEntry)
        : null,
  };
}

function engineCardIdFromSupport(
  fallbackCardId: string,
  supportEntry: CardSupportEntry | undefined,
): string | null {
  const resolverRef = supportEntry?.support.resolverRef;
  if (!resolverRef) return null;
  return resolverRef.startsWith("engine:")
    ? resolverRef.slice("engine:".length)
    : fallbackCardId;
}

function manifestReferenceFromSupport(
  setId: string,
  supportEntry: CardSupportEntry | undefined,
): CatalogManifestReference {
  const coverage = new Set(supportEntry?.support.coverage ?? []);
  return {
    manifestVersion: `${setId}-card-support-v1`,
    status: "active_card_support",
    unitTests: coverage.has("unit_test") ? [`${setId}:unit_test`] : [],
    scenarioTests: coverage.has("scenario") ? [`${setId}:scenario`] : [],
    visibilityTests: coverage.has("visibility") ? [`${setId}:visibility`] : [],
    replayTests: coverage.has("replay_statehash")
      ? [`${setId}:replay_statehash`]
      : [],
  };
}

function collectorNumberFromCardId(cardId: string): string {
  return cardId.match(/_(\d{3})_/)?.[1] ?? cardId;
}

function normalizeStatuses(
  statuses: Partial<CatalogStatuses>,
): CatalogStatuses {
  return Object.fromEntries(
    STATUS_KEYS.map((key) => [key, Boolean(statuses[key])]),
  ) as CatalogStatuses;
}

export const cardSetSupportEntries = Object.freeze(
  loadCardSets().flatMap(({ support }) => support.cards),
);

export const activeRuntimeCardIds = Object.freeze(
  cardSetSupportEntries
    .filter((entry) => entry.statuses.human_playable === true)
    .map((entry) => entry.cardId),
);

export const activeAiApprovedCardIds = Object.freeze(
  cardSetSupportEntries
    .filter((entry) => entry.statuses.ai_supported === true)
    .map((entry) => entry.cardId),
);

export const activeCardFactIds = Object.freeze([
  ...new Set([...activeRuntimeCardIds, ...activeAiApprovedCardIds]),
]);

export const runtimeGateByCardId: Readonly<Record<string, RuntimeGateEvidence>> =
  Object.freeze(
    Object.fromEntries(
      cardSetSupportEntries
        .filter((entry) => entry.statuses.human_playable === true)
        .map((entry) => [
          entry.cardId,
          {
            cardId: entry.cardId,
            engineCardId: engineCardIdFromSupport(entry.cardId, entry) ?? entry.cardId,
            runtimeStatus: "human_playable" as const,
            deckLegal: entry.statuses.deck_legal === true,
            formatLegal: entry.statuses.format_legal === true,
          },
        ]),
    ),
  );

export const aiApprovalByCardId: Readonly<Record<string, AiApprovalEvidence>> =
  Object.freeze(
    Object.fromEntries(
      cardSetSupportEntries
        .filter((entry) => entry.statuses.ai_supported === true)
        .map((entry) => [
          entry.cardId,
          {
            cardId: entry.cardId,
            approvalStatus: "ai_supported" as const,
            scenarioGate: true as const,
          },
        ]),
    ),
  );

export const releaseEvidenceByCardId: Readonly<Record<string, ReleaseEvidence>> =
  Object.freeze(
    Object.fromEntries(
      cardSetSupportEntries
        .filter((entry) => entry.statuses.human_playable === true)
        .map((entry) => [
          entry.cardId,
          {
            cardId: entry.cardId,
            auditReleaseId: entry.setId,
            implementationManifest: manifestReferenceFromSupport(
              entry.setId,
              entry,
            ),
            textOverrides: {},
            numericOverrides: {},
          },
        ]),
    ),
  );

export const cardFactsById: Readonly<Record<string, CardFactEvidence>> =
  Object.freeze(
    Object.fromEntries(
      activeCardFactIds.map((cardId) => {
        const fact: CardFactEvidence = { cardId };
        const runtimeGate = runtimeGateByCardId[cardId];
        const aiApproval = aiApprovalByCardId[cardId];
        const releaseEvidence = releaseEvidenceByCardId[cardId];
        if (runtimeGate) fact.runtimeGate = runtimeGate;
        if (aiApproval) fact.aiApproval = aiApproval;
        if (releaseEvidence) fact.releaseEvidence = releaseEvidence;
        return [cardId, fact];
      }),
    ),
  );

export const ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS: readonly CatalogGateBatch[] = Object.freeze(
  loadCardSets().map(({ set, support }) => ({
    auditReleaseId: set.setId,
    cardIds: support.cards
      .filter((entry) => entry.statuses.human_playable === true)
      .map((entry) => entry.cardId),
    implementationManifest: manifestReferenceFromSupport(set.setId, undefined),
    textOverrides: {},
    numericOverrides: {},
  })),
);

export const ACTIVE_CARD_SUPPORT_AI_GROUPS: readonly CatalogAiApprovalBatch[] =
  Object.freeze([
    {
      approvalId: "active-card-support",
      cardIds: activeAiApprovedCardIds,
    },
  ]);

export const TESTSET_CARD_IDS = Object.freeze(
  testsetSupportData.cards.map((entry) => entry.cardId),
);
export const ORIGINALSET_V1_CARD_IDS = Object.freeze(
  originalsetSupportData.cards.map((entry) => entry.cardId),
);
export const PROTEUS_CARD_IDS = Object.freeze(
  proteusSupportData.cards.map((entry) => entry.cardId),
);
export const PROTEUS_VISIBLE_BASELINE_CARD_IDS = Object.freeze(
  proteusSupportData.cards
    .filter((entry) => entry.statuses.human_playable === true)
    .map((entry) => entry.cardId),
);
