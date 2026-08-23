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
import {
  catalogAiHintReadModelForCardId,
  catalogAiHintSummaryForCardId,
  type AiCardHint as CatalogAiCardHint,
  type CatalogAiHintReadModel,
} from "@netgrid/ai/catalog";
import {
  TEST_CARD_SET_ID,
  testCardsEnabledFromEnvironment,
} from "@netgrid/shared";
import { createRuntimeCardPool } from "../card-pool-runtime";

type CatalogAiInspectorListSummary = {
  available: boolean;
  aiSupportStatus: CatalogAiCardHint["aiSupportStatus"];
  hintFound: boolean;
  mechanicalFactsFound: boolean;
  hasClassifications: boolean;
  hasWarnings: boolean;
};

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
  const aiHintReadModel = catalogAiHintReadModelForCardId(card.catalogCardId);
  return safeCatalogPayload({
    snapshotId: snapshot.snapshotId,
    snapshotHash,
    card: {
      ...card,
      aiHints: aiHintReadModel?.hint ?? null,
      aiInspector: catalogAiInspectorForReadModel(aiHintReadModel),
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
  return createRuntimeCardPool({
    excludedSetIds: testCardsEnabledFromEnvironment(process.env)
      ? []
      : [TEST_CARD_SET_ID],
  });
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
  const summary = catalogAiHintSummaryForCardId(catalogCardId);
  if (!summary) return null;

  return {
    available: true,
    aiSupportStatus: summary.aiSupportStatus,
    hintFound: true,
    mechanicalFactsFound: summary.mechanicalFactsFound,
    hasClassifications: summary.hasClassifications,
    hasWarnings: summary.hasWarnings,
  };
}

function catalogAiInspectorForReadModel(
  readModel: CatalogAiHintReadModel | undefined,
) {
  if (!readModel) return null;
  const cardHint = readModel.hint;
  const needsHumanReview = cardHint.quality?.needsHumanReview === true;
  const strategySupportPairs = (cardHint.strategySupportPairs ?? []).map(
    (pair) => ({
      ...pair,
      sourceField: "strategySupportPairs",
      sourceValue: pair.strategyId,
      triageCategory: "explicit_strategy_support_pair",
    }),
  );

  return {
    schemaVersion: "catalog-ai-hint-inspector-v1",
    source: readModel.provenance,
    supportStatus: {
      aiSupportStatus: cardHint.aiSupportStatus,
      hintFound: true,
      mechanicalFactsFound: hasMechanicalFacts(cardHint),
      warningCount:
        (needsHumanReview ? 1 : 0) + (cardHint.descriptorGaps?.length ?? 0),
    },
    cardHint: {
      aiSupportStatus: cardHint.aiSupportStatus,
      requiredMechanics: cardHint.requiredMechanics ?? [],
      valueHints: cardHint.valueHints ?? {},
      riskTags: cardHint.riskTags ?? [],
      scenarioRefs: cardHint.scenarioRefs ?? [],
      manualNotes: cardHint.manualNotes ?? [],
      strategicNotes: cardHint.strategicNotes ?? [],
    },
    mechanicalFacts: {
      effects: cardHint.effects ?? [],
      conditions: cardHint.conditions ?? [],
      costProfile: cardHint.costProfile ?? null,
      breakerProfile: cardHint.breakerProfile ?? null,
      remoteRole: cardHint.remoteRole ?? null,
      targetProfiles: cardHint.targetProfiles ?? [],
    },
    functionSignals: cardHint.functionSignals ?? [],
    strategyAnchors: cardHint.strategyAnchors ?? [],
    strategySupportPairs,
    lineSupport: {
      values: cardHint.lineSupport ?? [],
      classification: [],
    },
    strategicRole: cardHint.strategicRole ?? [],
    quality: cardHint.quality ?? null,
    legacyRoles: {
      roles: cardHint.roles ?? [],
      planRoles: cardHint.planRoles ?? [],
      rolesClassification: [],
      planRolesClassification: [],
    },
    warnings: {
      categories: needsHumanReview ? ["needs_human_review"] : [],
      descriptorGaps: cardHint.descriptorGaps ?? [],
      legacyStatus: {},
      strategicRoleStatus: {
        values: cardHint.strategicRole ?? [],
        validValues: cardHint.strategicRole ?? [],
        unknownValues: [],
      },
    },
  };
}

function hasMechanicalFacts(hint: CatalogAiCardHint | null): boolean {
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
