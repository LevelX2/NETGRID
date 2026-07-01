import {
  CATALOG_STATUS_KEYS,
  assertCatalogPayloadSafe,
  getCatalogCard,
  searchCatalog,
  type CatalogCardType,
  type CatalogQuery,
  type CatalogSide,
  type CatalogStatusKey,
} from "@netgrid/catalog";
import activeAiHintsData from "../../../../../data/ai/ai-card-hints-active.json";
import compiledAiHintsData from "../../../../../data/ai/ai-card-hints-compiled.json";
import aiHintInspectorIndexData from "../../../../../data/ai/ai-hint-inspector-index.json";
import { createRuntimeCardPool } from "../card-pool-runtime";

type CatalogAiHint = {
  cardId: string;
  roles: string[];
  planRoles: string[];
  requiredMechanics: string[];
  valueHints: Record<string, number>;
  riskTags: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  scenarioRefs: string[];
};

type CatalogCompiledAiHint = CatalogAiHint & {
  effects?: Array<Record<string, unknown>>;
  conditions?: Array<Record<string, unknown>>;
  costProfile?: Record<string, unknown>;
  breakerProfile?: Record<string, unknown>;
  remoteRole?: Record<string, unknown>;
  targetProfiles?: Array<Record<string, unknown>>;
  lineSupport?: string[];
  strategicRole?: string[];
  strategySupportPairs?: CatalogStrategySupportPair[];
  quality?: Record<string, unknown>;
  manualNotes?: string[];
  strategicNotes?: string[];
};

type AiInspectorClassification = {
  value: string;
  category: string;
  triageCategory: string;
  mapsTo: string[];
  rationale: string;
};

type CatalogStrategySupportPair = {
  strategyId: string;
  role?: string;
  roleDetail?: string;
  confidence?: string;
  evidence?: string[];
  sourceField?: string;
  sourceValue?: string;
  triageCategory?: string;
  rationale?: string;
};

type AiInspectorIndexEntry = {
  cardId: string;
  supportStatus: {
    aiSupportStatus: CatalogAiHint["aiSupportStatus"];
    compiledHintFound: boolean;
    mechanicalFactsFound: boolean;
    generatedFactsFound: boolean;
    overlayFields: string[];
    legacyFallbackOnly: boolean;
    warningCount: number;
  };
  derivedFunctionSignals: string[];
  derivedStrategyAnchors: string[];
  reviewedStrategySupportPairs: CatalogStrategySupportPair[];
  lineSupportClassification: AiInspectorClassification[];
  rolesClassification: AiInspectorClassification[];
  planRolesClassification: AiInspectorClassification[];
  warningCategories: string[];
  descriptorGaps: Array<Record<string, unknown>>;
  legacyStatus: Record<string, unknown>;
  strategicRoleStatus: Record<string, unknown>;
};

type CatalogAiInspectorListSummary = {
  available: boolean;
  aiSupportStatus: CatalogAiHint["aiSupportStatus"];
  compiledHintFound: boolean;
  mechanicalFactsFound: boolean;
  generatedFactsFound: boolean;
  hasClassifications: boolean;
  hasWarnings: boolean;
};

const AI_HINTS_BY_CARD_ID = new Map(
  (activeAiHintsData.cards as CatalogAiHint[]).map((hint) => [
    hint.cardId,
    hint,
  ]),
);
const COMPILED_AI_HINTS_BY_CARD_ID = new Map(
  (compiledAiHintsData.cards as CatalogCompiledAiHint[]).map((hint) => [
    hint.cardId,
    hint,
  ]),
);
const AI_HINT_INSPECTOR_BY_CARD_ID = new Map(
  (aiHintInspectorIndexData.cards as AiInspectorIndexEntry[]).map((entry) => [
    entry.cardId,
    entry,
  ]),
);

export function catalogListResponse(searchParams: URLSearchParams) {
  const { snapshot, snapshotHash, catalogIndex, validation } =
    createCatalogRuntime();
  if (!validation.ok)
    return safeCatalogError(
      500,
      "catalog_invalid",
      "Katalogdaten sind ungültig.",
    );
  const query: CatalogQuery = {};
  const q = searchParams.get("q");
  const side = searchParams.get("side");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  if (q) query.q = q;
  if (isSide(side) || side === "all") query.side = side;
  if (isType(type) || type === "all") query.type = type;
  if (isStatus(status) || status === "all") query.status = status;

  return safeCatalogPayload({
    snapshotId: snapshot.snapshotId,
    snapshotHash,
    cards: searchCatalog(snapshot, query).map(catalogSummaryWithAiInspector),
    filters: catalogIndex.filters,
    summary: catalogIndex.statusSummary,
  });
}

export function catalogDetailResponse(catalogCardId: string) {
  const { snapshot, snapshotHash, validation } = createCatalogRuntime();
  if (!validation.ok)
    return safeCatalogError(
      500,
      "catalog_invalid",
      "Katalogdaten sind ungültig.",
    );
  const card = getCatalogCard(snapshot, catalogCardId);
  if (!card)
    return safeCatalogError(
      404,
      "catalog_card_not_found",
      "Karte wurde im Katalog nicht gefunden.",
    );
  return safeCatalogPayload({
    snapshotId: snapshot.snapshotId,
    snapshotHash,
    card: {
      ...card,
      aiHints: AI_HINTS_BY_CARD_ID.get(card.catalogCardId) ?? null,
      aiInspector: catalogAiInspectorForCard(card.catalogCardId),
    },
  });
}

export function catalogStatusSummaryResponse() {
  const { snapshot, snapshotHash, catalogIndex, validation } =
    createCatalogRuntime();
  if (!validation.ok)
    return safeCatalogError(
      500,
      "catalog_invalid",
      "Katalogdaten sind ungültig.",
    );
  return safeCatalogPayload({
    snapshotId: snapshot.snapshotId,
    snapshotHash,
    summary: catalogIndex.statusSummary,
    filters: catalogIndex.filters,
  });
}

function safeCatalogPayload(payload: unknown) {
  const safety = assertCatalogPayloadSafe(payload);
  if (!safety.ok)
    return safeCatalogError(
      500,
      "catalog_payload_unsafe",
      "Katalogantwort wurde aus Sicherheitsgründen blockiert.",
    );
  return { status: 200, body: payload };
}

function safeCatalogError(status: number, code: string, message: string) {
  return { status, body: { error: { code, message } } };
}

function isSide(value: string | null): value is CatalogSide {
  return value === "runner" || value === "corp";
}

function isType(value: string | null): value is CatalogCardType {
  return (
    value === "identity" ||
    value === "event" ||
    value === "program" ||
    value === "hardware" ||
    value === "resource" ||
    value === "agenda" ||
    value === "operation" ||
    value === "asset" ||
    value === "upgrade" ||
    value === "ice"
  );
}

function isStatus(value: string | null): value is CatalogStatusKey {
  return Boolean(
    value && (CATALOG_STATUS_KEYS as readonly string[]).includes(value),
  );
}

function createCatalogRuntime() {
  return createRuntimeCardPool();
}

function catalogSummaryWithAiInspector<T extends { catalogCardId: string }>(
  card: T,
) {
  return {
    ...card,
    aiInspectorSummary: catalogAiInspectorSummaryForCard(card.catalogCardId),
  };
}

function catalogAiInspectorSummaryForCard(
  catalogCardId: string,
): CatalogAiInspectorListSummary | null {
  const activeHint = AI_HINTS_BY_CARD_ID.get(catalogCardId) ?? null;
  const compiledHint = COMPILED_AI_HINTS_BY_CARD_ID.get(catalogCardId) ?? null;
  const inspector = AI_HINT_INSPECTOR_BY_CARD_ID.get(catalogCardId) ?? null;
  if (!activeHint && !compiledHint && !inspector) return null;

  const supportStatus = inspector?.supportStatus ?? {
    aiSupportStatus:
      compiledHint?.aiSupportStatus ?? activeHint?.aiSupportStatus ?? "none",
    compiledHintFound: Boolean(compiledHint),
    mechanicalFactsFound: hasMechanicalFacts(compiledHint),
    generatedFactsFound: false,
    overlayFields: [],
    legacyFallbackOnly: false,
    warningCount: compiledHint ? 0 : 1,
  };
  const classificationCount =
    (inspector?.lineSupportClassification.length ?? 0) +
    (inspector?.rolesClassification.length ?? 0) +
    (inspector?.planRolesClassification.length ?? 0) +
    (inspector?.reviewedStrategySupportPairs.length ?? 0);
  const warningCount =
    (inspector?.warningCategories.length ?? 0) +
    (inspector?.descriptorGaps.length ?? 0);

  return {
    available: Boolean(inspector),
    aiSupportStatus: supportStatus.aiSupportStatus,
    compiledHintFound: supportStatus.compiledHintFound,
    mechanicalFactsFound: supportStatus.mechanicalFactsFound,
    generatedFactsFound: supportStatus.generatedFactsFound,
    hasClassifications: classificationCount > 0,
    hasWarnings: supportStatus.warningCount > 0 || warningCount > 0,
  };
}

function catalogAiInspectorForCard(catalogCardId: string) {
  const activeHint = AI_HINTS_BY_CARD_ID.get(catalogCardId) ?? null;
  const compiledHint = COMPILED_AI_HINTS_BY_CARD_ID.get(catalogCardId) ?? null;
  const inspector = AI_HINT_INSPECTOR_BY_CARD_ID.get(catalogCardId) ?? null;
  if (!activeHint && !compiledHint && !inspector) return null;

  const supportStatus = inspector?.supportStatus ?? {
    aiSupportStatus:
      compiledHint?.aiSupportStatus ?? activeHint?.aiSupportStatus ?? "none",
    compiledHintFound: Boolean(compiledHint),
    mechanicalFactsFound: hasMechanicalFacts(compiledHint),
    generatedFactsFound: false,
    overlayFields: [],
    legacyFallbackOnly: false,
    warningCount: compiledHint ? 0 : 1,
  };

  return {
    schemaVersion: aiHintInspectorIndexData.schemaVersion,
    source: aiHintInspectorIndexData.source,
    supportStatus,
    compiledHint: compiledHint
      ? {
          aiSupportStatus: compiledHint.aiSupportStatus,
          requiredMechanics: compiledHint.requiredMechanics ?? [],
          valueHints: compiledHint.valueHints ?? {},
          riskTags: compiledHint.riskTags ?? [],
          scenarioRefs: compiledHint.scenarioRefs ?? [],
          manualNotes: compiledHint.manualNotes ?? [],
          strategicNotes: compiledHint.strategicNotes ?? [],
        }
      : null,
    mechanicalFacts: compiledHint
      ? {
          effects: compiledHint.effects ?? [],
          conditions: compiledHint.conditions ?? [],
          costProfile: compiledHint.costProfile ?? null,
          breakerProfile: compiledHint.breakerProfile ?? null,
          remoteRole: compiledHint.remoteRole ?? null,
          targetProfiles: compiledHint.targetProfiles ?? [],
        }
      : null,
    functionSignals: inspector?.derivedFunctionSignals ?? [],
    strategyAnchors: inspector?.derivedStrategyAnchors ?? [],
    strategySupportPairs:
      inspector?.reviewedStrategySupportPairs ??
      compiledHint?.strategySupportPairs ??
      [],
    lineSupport: {
      values: compiledHint?.lineSupport ?? [],
      classification: inspector?.lineSupportClassification ?? [],
    },
    strategicRole: compiledHint?.strategicRole ?? [],
    quality: compiledHint?.quality ?? null,
    legacyRoles: {
      roles: compiledHint?.roles ?? activeHint?.roles ?? [],
      planRoles: compiledHint?.planRoles ?? activeHint?.planRoles ?? [],
      rolesClassification: inspector?.rolesClassification ?? [],
      planRolesClassification: inspector?.planRolesClassification ?? [],
    },
    warnings: {
      categories:
        inspector?.warningCategories ??
        (compiledHint ? [] : ["missing_compiled_hint"]),
      descriptorGaps: inspector?.descriptorGaps ?? [],
      legacyStatus: inspector?.legacyStatus ?? {},
      strategicRoleStatus: inspector?.strategicRoleStatus ?? {},
    },
  };
}

function hasMechanicalFacts(hint: CatalogCompiledAiHint | null): boolean {
  if (!hint) return false;
  return Boolean(
    hint.effects?.length ||
    hint.conditions?.length ||
    hint.targetProfiles?.length ||
    (hint.costProfile && Object.keys(hint.costProfile).length > 0) ||
    (hint.breakerProfile && Object.keys(hint.breakerProfile).length > 0) ||
    (hint.remoteRole && Object.keys(hint.remoteRole).length > 0),
  );
}
