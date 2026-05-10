import {
  CATALOG_STATUS_KEYS,
  assertCatalogPayloadSafe,
  getCatalogCard,
  searchCatalog,
  type CatalogCardType,
  type CatalogQuery,
  type CatalogSide,
  type CatalogStatusKey
} from "@netgrid/catalog";
import aiCardHintsData from "../../../../../data/ai/ai-card-hints-1.3.1.json";
import kingOfTheRoadAiHintsData from "../../../../../data/ai/ai-card-hints-king-of-the-road-ai-approval.json";
import deckLegalBatchAAiHintsData from "../../../../../data/ai/ai-card-hints-deck-legal-batch-a.json";
import deckLegalV161V170AiHintsData from "../../../../../data/ai/ai-card-hints-deck-legal-v161-v170.json";
import deckLegalV171V181Open64AiHintsData from "../../../../../data/ai/ai-card-hints-deck-legal-v171-v181-open64.json";
import deckLegalLegacyOpen64AiHintsData from "../../../../../data/ai/ai-card-hints-deck-legal-legacy-open64.json";
import runtimeSupplementAiHintsData from "../../../../../data/ai/ai-card-hints-runtime-supplement.json";
import corpTagSliceAiHintsData from "../../../../../data/ai/ai-card-hints-corp-tag-approval-slice.json";
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

const AI_HINTS_BY_CARD_ID = new Map(
  (
    [
      ...(aiCardHintsData.cards as CatalogAiHint[]),
      ...(kingOfTheRoadAiHintsData.cards as CatalogAiHint[]),
      ...(runtimeSupplementAiHintsData.cards as CatalogAiHint[]),
      ...(deckLegalBatchAAiHintsData.cards as CatalogAiHint[]),
      ...(deckLegalV161V170AiHintsData.cards as CatalogAiHint[]),
      ...(deckLegalV171V181Open64AiHintsData.cards as CatalogAiHint[]),
      ...(deckLegalLegacyOpen64AiHintsData.cards as CatalogAiHint[]),
      ...(corpTagSliceAiHintsData.cards as CatalogAiHint[])
    ]
  ).map((hint) => [hint.cardId, hint])
);

export function catalogListResponse(searchParams: URLSearchParams) {
  const { snapshot, snapshotHash, catalogIndex, validation } = createCatalogRuntime();
  if (!validation.ok) return safeCatalogError(500, "catalog_invalid", "Katalogdaten sind ungültig.");
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
    cards: searchCatalog(snapshot, query),
    filters: catalogIndex.filters,
    summary: catalogIndex.statusSummary
  });
}

export function catalogDetailResponse(catalogCardId: string) {
  const { snapshot, snapshotHash, validation } = createCatalogRuntime();
  if (!validation.ok) return safeCatalogError(500, "catalog_invalid", "Katalogdaten sind ungültig.");
  const card = getCatalogCard(snapshot, catalogCardId);
  if (!card) return safeCatalogError(404, "catalog_card_not_found", "Karte wurde im Katalog nicht gefunden.");
  return safeCatalogPayload({ snapshotId: snapshot.snapshotId, snapshotHash, card: { ...card, aiHints: AI_HINTS_BY_CARD_ID.get(card.catalogCardId) ?? null } });
}

export function catalogStatusSummaryResponse() {
  const { snapshot, snapshotHash, catalogIndex, validation } = createCatalogRuntime();
  if (!validation.ok) return safeCatalogError(500, "catalog_invalid", "Katalogdaten sind ungültig.");
  return safeCatalogPayload({
    snapshotId: snapshot.snapshotId,
    snapshotHash,
    summary: catalogIndex.statusSummary,
    filters: catalogIndex.filters
  });
}

function safeCatalogPayload(payload: unknown) {
  const safety = assertCatalogPayloadSafe(payload);
  if (!safety.ok) return safeCatalogError(500, "catalog_payload_unsafe", "Katalogantwort wurde aus Sicherheitsgründen blockiert.");
  return { status: 200, body: payload };
}

function safeCatalogError(status: number, code: string, message: string) {
  return { status, body: { error: { code, message } } };
}

function isSide(value: string | null): value is CatalogSide {
  return value === "runner" || value === "corp";
}

function isType(value: string | null): value is CatalogCardType {
  return value === "identity" || value === "event" || value === "program" || value === "hardware" || value === "resource" || value === "agenda" || value === "operation" || value === "asset" || value === "upgrade" || value === "ice";
}

function isStatus(value: string | null): value is CatalogStatusKey {
  return Boolean(value && (CATALOG_STATUS_KEYS as readonly string[]).includes(value));
}

function createCatalogRuntime() {
  return createRuntimeCardPool();
}
