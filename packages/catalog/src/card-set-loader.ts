import originalsetCardsData from "../../../data/cards/originalset-v1-cards.json";
import classicCardsData from "../../../data/cards/classic-cards.json";
import proteusCardsData from "../../../data/cards/proteus-cards.json";
import testsetCardsData from "../../../data/cards/testset-cards.json";
import classicSupportData from "../../../data/manifests/classic-card-support.json";
import originalsetSupportData from "../../../data/manifests/originalset-v1-card-support.json";
import proteusSupportData from "../../../data/manifests/proteus-card-support.json";
import testsetSupportData from "../../../data/manifests/testset-card-support.json";
import cardSupportAiSupportedScenarioData from "../../../data/scenarios/card-support-ai-supported-current.json";
import {
  getCardSpecSupportSummary,
  listPublicCardViews,
  listPublicSetViews,
} from "@netgrid/cards/server";
import type {
  ResolvedStrengthDefinition,
  VariableStrengthDefinition,
} from "@netgrid/shared";
import type {
  CatalogCard,
  CatalogCardType,
  CatalogManifestReference,
  CatalogNumericFields,
  CatalogPlayCost,
  CatalogRarity,
  CatalogSide,
  CatalogStatuses,
  CatalogVariableXPlayCost,
} from "./catalog-types";
import type {
  AiApprovalEvidence,
  CardFactEvidence,
  CatalogAiApprovalBatch,
  CatalogGateBatch,
  ReleaseEvidence,
  RuntimeGateEvidence,
} from "./gate-evidence";
import { createCatalogRarity } from "./rarity";

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
  playCost?: CatalogVariableXPlayCost;
  variableStrength?: VariableStrengthDefinition;
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

const LEGACY_CARD_SET_FILES: LoadedCardSet[] = [
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
  {
    set: classicCardsData as CardSetFile,
    support: classicSupportData as CardSupportFile,
  },
];

const CARD_SPEC_AI_SCENARIO_REF =
  "data/scenarios/card-support-ai-supported-current.json#active_card_support_ai_supported";

export type CardSpecSupportEvidence = {
  cardDefinitionId: string;
  validationStatus: "valid";
  runtimeProjectionStatus: "playable_mvp";
  planningProjectionStatus: "available";
  releaseEligibilityStatus: "active" | "ineligible";
};

export type CardSpecSupportErrorCode =
  | "missing_registry_evidence"
  | "mismatched_registry_evidence"
  | "missing_ai_scenario_evidence";

export class CardSpecSupportError extends Error {
  constructor(
    readonly code: CardSpecSupportErrorCode,
    readonly cardDefinitionId: string,
  ) {
    super(`${code}: ${cardDefinitionId}`);
    this.name = "CardSpecSupportError";
  }
}

export function deriveCardSpecSupportEntry(
  cardDefinitionId: string,
  setId: string,
  evidence: CardSpecSupportEvidence | undefined,
  aiScenarioCardIds: ReadonlySet<string>,
): CardSupportEntry {
  if (evidence === undefined)
    throw new CardSpecSupportError(
      "missing_registry_evidence",
      cardDefinitionId,
    );
  if (evidence.cardDefinitionId !== cardDefinitionId)
    throw new CardSpecSupportError(
      "mismatched_registry_evidence",
      cardDefinitionId,
    );
  const imported = true;
  const validated = evidence.validationStatus === "valid";
  const catalogReady = imported && validated;
  const releaseEligible = evidence.releaseEligibilityStatus === "active";
  const scenarioSupported = aiScenarioCardIds.has(cardDefinitionId);
  if (releaseEligible && !scenarioSupported)
    throw new CardSpecSupportError(
      "missing_ai_scenario_evidence",
      cardDefinitionId,
    );
  const implemented = evidence.runtimeProjectionStatus === "playable_mvp";
  const engineSupported = implemented;
  const playable = catalogReady && engineSupported && releaseEligible;
  const humanPlayable = playable;
  const deckLegal = humanPlayable;
  const formatLegal = deckLegal;
  const planningAvailable = evidence.planningProjectionStatus === "available";
  const aiSupported = humanPlayable && planningAvailable && scenarioSupported;
  const coverage = [
    "card_spec_registry",
    ...(engineSupported ? ["runtime_projection"] : []),
    ...(planningAvailable ? ["planning_projection"] : []),
    ...(aiSupported ? ["scenario"] : []),
  ];

  return {
    cardId: cardDefinitionId,
    setId,
    statuses: {
      imported,
      validated,
      catalog_ready: catalogReady,
      implemented,
      engine_supported: engineSupported,
      playable,
      human_playable: humanPlayable,
      ai_supported: aiSupported,
      deck_legal: deckLegal,
      format_legal: formatLegal,
      blocked: !playable,
    },
    support: {
      resolverRef: engineSupported
        ? `card-spec-registry:${cardDefinitionId}`
        : null,
      coverage,
      aiHintRef: null,
      scenarioRefs: aiSupported ? [CARD_SPEC_AI_SCENARIO_REF] : [],
    },
    ...(!playable
      ? {
          blockReasons: [
            !releaseEligible
              ? "publication_not_release_eligible"
              : "runtime_projection_incomplete",
          ],
        }
      : {}),
  };
}

function buildCardSetFiles(): LoadedCardSet[] {
  const activeCardSupportAiScenario =
    cardSupportAiSupportedScenarioData.scenarios.find(
      (scenario) => scenario.id === "active_card_support_ai_supported",
    );
  if (
    cardSupportAiSupportedScenarioData.status !== "ai_supported" ||
    activeCardSupportAiScenario === undefined
  )
    throw new Error("card_spec_ai_support_scenario_missing");
  const activeCardSupportAiScenarioIds = new Set(
    activeCardSupportAiScenario.coversCards,
  );
  if (
    activeCardSupportAiScenarioIds.size !==
    activeCardSupportAiScenario.coversCards.length
  )
    throw new Error("card_spec_ai_support_scenario_duplicate_card");

  const publicSetViews = new Map(
    listPublicSetViews().map((set) => [set.setId, set]),
  );
  const legacySetIds = new Set(
    LEGACY_CARD_SET_FILES.map(({ set }) => set.setId),
  );
  const cardSpecCardsBySet = new Map<string, CardSetCard[]>();
  const cardSpecSupportBySet = new Map<string, CardSupportEntry[]>();
  for (const view of listPublicCardViews()) {
    const printing = view.printings[0];
    if (printing === undefined)
      throw new Error(
        `CardSpec ${view.cardDefinitionId} has no public printing.`,
      );
    if (!publicSetViews.has(printing.setId))
      throw new Error(
        `CardSpec ${view.cardDefinitionId} references missing SetSpec ${printing.setId}.`,
      );
    if (!legacySetIds.has(printing.setId))
      throw new Error(
        `CardSpec ${view.cardDefinitionId} has no catalog set target ${printing.setId}.`,
      );
    const rarity =
      printing.rarity === undefined
        ? null
        : createCatalogRarity(
            printing.rarity,
            `card-spec:${printing.printingId}`,
          );
    if (printing.rarity !== undefined && rarity === null)
      throw new Error(
        `CardSpec ${view.cardDefinitionId} has unsupported rarity ${printing.rarity}.`,
      );
    const cards = cardSpecCardsBySet.get(printing.setId) ?? [];
    cards.push({
      cardId: view.cardDefinitionId,
      setId: printing.setId,
      title: view.title,
      side: view.side,
      type: view.cardType,
      subtypes: [...view.subtypes],
      numeric: {
        cost: view.playCost?.kind === "fixed" ? view.playCost.credits : null,
        installCost: view.numeric.installCost,
        memoryCost: view.numeric.memoryCost,
        strength: view.strength.kind === "fixed" ? view.strength.value : null,
        rezCost: view.numeric.rezCost,
        trashCost: view.numeric.trashCost,
        advancementRequirement: view.numeric.advancementRequirement,
        agendaPoints: view.numeric.agendaPoints,
      },
      ...(view.playCost?.kind === "variable_x"
        ? { playCost: { ...view.playCost } }
        : {}),
      ...(view.strength.kind !== "fixed" &&
      view.strength.kind !== "not_applicable"
        ? { variableStrength: { ...view.strength } }
        : {}),
      text: view.rulesText,
      displayOnlyText: true,
      faction: view.faction,
      ...(printing.collectorNumber !== undefined
        ? { collectorNumber: printing.collectorNumber }
        : {}),
      ...(rarity === null ? {} : { rarity }),
    });
    cardSpecCardsBySet.set(printing.setId, cards);
    const support = cardSpecSupportBySet.get(printing.setId) ?? [];
    support.push(
      deriveCardSpecSupportEntry(
        view.cardDefinitionId,
        printing.setId,
        getCardSpecSupportSummary(view.cardDefinitionId),
        activeCardSupportAiScenarioIds,
      ),
    );
    cardSpecSupportBySet.set(printing.setId, support);
  }

  const cardSetFiles: LoadedCardSet[] = LEGACY_CARD_SET_FILES.map((loaded) => {
    const setView = publicSetViews.get(loaded.set.setId);
    const migratedCards = cardSpecCardsBySet.get(loaded.set.setId) ?? [];
    const migratedSupport = cardSpecSupportBySet.get(loaded.set.setId) ?? [];
    return {
      set: {
        ...loaded.set,
        ...(setView !== undefined ? { setName: setView.name } : {}),
        cards: [...loaded.set.cards, ...migratedCards],
      },
      support: {
        ...loaded.support,
        cards: [...loaded.support.cards, ...migratedSupport],
      },
    };
  });

  const materializedCardSpecIds = new Set(
    cardSetFiles
      .flatMap(({ set }) => set.cards)
      .filter((card) => cardSpecCardsBySet.get(card.setId)?.includes(card))
      .map((card) => card.cardId),
  );
  for (const view of listPublicCardViews())
    if (!materializedCardSpecIds.has(view.cardDefinitionId))
      throw new Error(
        `CardSpec ${view.cardDefinitionId} was not materialized in the catalog.`,
      );
  return cardSetFiles;
}

const CARD_SET_FILES = buildCardSetFiles();

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
        if (
          value !== null &&
          (typeof value !== "number" ||
            !Number.isFinite(value) ||
            !Number.isInteger(value) ||
            value < 0)
        )
          errors.push(
            `${card.cardId}: numeric.${key} must be a non-negative integer or null.`,
          );
      }
      errors.push(...validateSourcePlayCost(card));
      errors.push(...validateSourceStrengthModel(card));
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
    for (const card of cardsById.values()) {
      const supportEntry = supportById.get(card.cardId);
      if (
        supportEntry &&
        isFinalPlayableStatus(normalizeStatuses(supportEntry.statuses))
      ) {
        errors.push(...validatePlayableNumericContract(card));
      }
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
  if (statuses.ai_supported) {
    const cardSpecDerived =
      entry.support.coverage.includes("card_spec_registry") &&
      entry.support.coverage.includes("planning_projection");
    if (
      entry.support.scenarioRefs.length === 0 ||
      (!entry.support.aiHintRef && !cardSpecDerived)
    )
      errors.push(
        `${entry.cardId}: ai_supported needs aiHintRef and scenarioRefs unless it is CardSpec-derived support evidence.`,
      );
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
    .sort((left, right) =>
      left.catalogCardId.localeCompare(right.catalogCardId),
    );
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
    setName: resolveCatalogSetName(card, set),
    collectorNumber:
      card.collectorNumber ?? collectorNumberFromCardId(card.cardId),
    ...(card.rarity ? { rarity: { ...card.rarity } } : {}),
    text: card.text,
    displayOnlyText: card.displayOnlyText,
    numeric: { ...card.numeric },
    playCost: resolvePlayCost(card),
    strengthModel: resolveStrengthModel(card),
    statuses,
    blockReasons: supportEntry?.blockReasons
      ? [...supportEntry.blockReasons]
      : [],
    implementationManifest:
      statuses.engine_supported || statuses.human_playable
        ? manifestReferenceFromSupport(card.setId, supportEntry)
        : null,
  };
}

export function resolveCatalogSetName(
  card: Pick<CardSetCard, "cardId" | "setId" | "setName">,
  set: Pick<CardSetFile, "setName">,
): string {
  return set.setName ?? card.setName ?? card.setId;
}

export function validatePlayableNumericContract(card: CardSetCard): string[] {
  const errors: string[] = [];
  const physicalType: CatalogCardType = card.type.startsWith("hardware-")
    ? "hardware"
    : card.type;
  const allowedFields: Record<
    CatalogCardType,
    readonly (keyof CatalogNumericFields)[]
  > = {
    identity: [],
    event: ["cost"],
    operation: ["cost"],
    program: ["installCost", "memoryCost", "strength"],
    hardware: ["installCost"],
    resource: ["installCost"],
    agenda: ["advancementRequirement", "agendaPoints"],
    asset: ["rezCost", "trashCost"],
    upgrade: ["rezCost", "trashCost"],
    ice: ["rezCost", "strength"],
  };
  const requiredFields: Partial<
    Record<CatalogCardType, readonly (keyof CatalogNumericFields)[]>
  > = {
    program: ["installCost", "memoryCost"],
    hardware: ["installCost"],
    resource: ["installCost"],
    agenda: ["advancementRequirement", "agendaPoints"],
    asset: ["rezCost", "trashCost"],
    upgrade: ["rezCost", "trashCost"],
    ice: ["rezCost"],
  };

  const allowed = new Set(allowedFields[physicalType]);
  for (const key of NUMERIC_KEYS) {
    if (card.numeric[key] !== null && !allowed.has(key)) {
      errors.push(
        `${card.cardId}: ${physicalType} requires numeric.${key} to be explicitly null.`,
      );
    }
  }
  for (const key of requiredFields[physicalType] ?? []) {
    if (card.numeric[key] === null) {
      errors.push(`${card.cardId}: ${physicalType} requires numeric.${key}.`);
    }
  }

  const strengthRelevant =
    physicalType === "ice" ||
    (physicalType === "program" && card.subtypes.includes("icebreaker"));
  const hasFixedStrength = card.numeric.strength !== null;
  const hasVariableStrength = card.variableStrength !== undefined;
  if (strengthRelevant && hasFixedStrength === hasVariableStrength) {
    errors.push(
      `${card.cardId}: strength-relevant ${physicalType} requires exactly one fixed or variable strength model.`,
    );
  }
  if (!strengthRelevant && (hasFixedStrength || hasVariableStrength)) {
    errors.push(
      `${card.cardId}: ${physicalType}/${card.subtypes.join(",")} strength is not applicable and must be explicit null.`,
    );
  }
  return errors;
}

function validateSourceStrengthModel(card: CardSetCard): string[] {
  const strength = card.variableStrength;
  if (!strength) return [];
  if (strength.kind === "paid_x") {
    if (
      !hasExactKeys(strength, ["kind", "minimumStrength", "maximumStrength"]) ||
      !Number.isInteger(strength.minimumStrength) ||
      strength.minimumStrength < 0 ||
      !Number.isInteger(strength.maximumStrength) ||
      strength.maximumStrength < strength.minimumStrength
    ) {
      return [`${card.cardId}: invalid paid-X strength model.`];
    }
    return [];
  }
  if (
    !hasExactKeys(strength, ["kind", "dieSides"]) ||
    !Number.isInteger(strength.dieSides) ||
    strength.dieSides < 2
  ) {
    return [`${card.cardId}: invalid random-die strength model.`];
  }
  return [];
}

function validateSourcePlayCost(card: CardSetCard): string[] {
  const errors: string[] = [];
  const isPlayCard = card.type === "event" || card.type === "operation";
  if (!isPlayCard) {
    if (card.playCost !== undefined) {
      errors.push(
        `${card.cardId}: only events and operations may define playCost.`,
      );
    }
    return errors;
  }
  const hasFixedCost =
    typeof card.numeric.cost === "number" &&
    Number.isInteger(card.numeric.cost) &&
    card.numeric.cost >= 0;
  const playCost = card.playCost;
  const hasVariableCost = playCost !== undefined;
  if (hasFixedCost === hasVariableCost) {
    errors.push(
      `${card.cardId}: event/operation must define exactly one fixed or variable-X play cost.`,
    );
    return errors;
  }
  if (playCost === undefined) return errors;
  if (
    playCost.kind !== "variable_x" ||
    !hasExactKeys(playCost, ["kind", "minimumX", "creditsPerX", "maximumX"]) ||
    !Number.isInteger(playCost.minimumX) ||
    playCost.minimumX < 1 ||
    !Number.isInteger(playCost.creditsPerX) ||
    playCost.creditsPerX <= 0 ||
    playCost.maximumX?.kind !== "context" ||
    !hasExactKeys(playCost.maximumX, ["kind"])
  ) {
    errors.push(`${card.cardId}: invalid variable-X play cost.`);
  }
  if (card.numeric.cost !== null) {
    errors.push(
      `${card.cardId}: variable-X play cost requires numeric.cost null.`,
    );
  }
  return errors;
}

function hasExactKeys(value: object, expectedKeys: readonly string[]): boolean {
  const expected = [...expectedKeys].sort();
  const actualKeys = Object.keys(value).sort();
  return (
    actualKeys.length === expected.length &&
    actualKeys.every((key, index) => key === expected[index])
  );
}

function resolvePlayCost(card: CardSetCard): CatalogPlayCost | null {
  if (card.type !== "event" && card.type !== "operation") return null;
  if (card.playCost) {
    return {
      ...card.playCost,
      maximumX: { ...card.playCost.maximumX },
    };
  }
  if (typeof card.numeric.cost !== "number") {
    throw new Error(`${card.cardId}: unresolved event/operation play cost.`);
  }
  return {
    kind: "fixed",
    credits: card.numeric.cost,
  };
}

function resolveStrengthModel(card: CardSetCard): ResolvedStrengthDefinition {
  if (card.numeric.strength !== null) {
    return { kind: "fixed", value: card.numeric.strength };
  }
  if (card.variableStrength) {
    return { ...card.variableStrength };
  }
  return { kind: "not_applicable" };
}

function isFinalPlayableStatus(statuses: CatalogStatuses): boolean {
  return (
    statuses.engine_supported || statuses.ai_supported || statuses.playable
  );
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

export const runtimeGateByCardId: Readonly<
  Record<string, RuntimeGateEvidence>
> = Object.freeze(
  Object.fromEntries(
    cardSetSupportEntries
      .filter((entry) => entry.statuses.human_playable === true)
      .map((entry) => [
        entry.cardId,
        {
          cardId: entry.cardId,
          engineCardId:
            engineCardIdFromSupport(entry.cardId, entry) ?? entry.cardId,
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

export const releaseEvidenceByCardId: Readonly<
  Record<string, ReleaseEvidence>
> = Object.freeze(
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

export const ACTIVE_CARD_SUPPORT_RUNTIME_GROUPS: readonly CatalogGateBatch[] =
  Object.freeze(
    loadCardSets().map(({ set, support }) => ({
      auditReleaseId: set.setId,
      cardIds: support.cards
        .filter((entry) => entry.statuses.human_playable === true)
        .map((entry) => entry.cardId),
      implementationManifest: manifestReferenceFromSupport(
        set.setId,
        undefined,
      ),
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

export const TESTSET_CARD_IDS = Object.freeze(cardIdsForSet("testset"));
export const ORIGINALSET_V1_CARD_IDS = Object.freeze(
  cardIdsForSet("originalset-v1"),
);
export const PROTEUS_CARD_IDS = Object.freeze(cardIdsForSet("proteus"));
export const CLASSIC_CARD_IDS = Object.freeze(cardIdsForSet("classic"));
export const PROTEUS_VISIBLE_BASELINE_CARD_IDS = Object.freeze(
  (
    CARD_SET_FILES.find(({ set }) => set.setId === "proteus")?.support.cards ??
    []
  )
    .filter((entry) => entry.statuses.human_playable === true)
    .map((entry) => entry.cardId),
);

function cardIdsForSet(setId: string): string[] {
  return (
    CARD_SET_FILES.find(({ set }) => set.setId === setId)?.support.cards ?? []
  ).map((entry) => entry.cardId);
}
