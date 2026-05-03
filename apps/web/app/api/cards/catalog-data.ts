import snapshotData from "../../../../../data/card-import/card-snapshot-0.8.json";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  assertCatalogPayloadSafe,
  computeSnapshotHash,
  createCatalogIndex,
  getCatalogCard,
  searchCatalog,
  validateSnapshot,
  type CardSnapshot,
  type CatalogCardType,
  type CatalogQuery,
  type CatalogSide,
  type CatalogStatusKey
} from "@netrunner/catalog";

const snapshot = createRuntimeSnapshot();
const snapshotHash = computeSnapshotHash(snapshot);
const catalogIndex = createCatalogIndex(snapshot, snapshotHash);
const validation = validateSnapshot(snapshot);

export function catalogListResponse(searchParams: URLSearchParams) {
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
  if (!validation.ok) return safeCatalogError(500, "catalog_invalid", "Katalogdaten sind ungültig.");
  const card = getCatalogCard(snapshot, catalogCardId);
  if (!card) return safeCatalogError(404, "catalog_card_not_found", "Karte wurde im Katalog nicht gefunden.");
  return safeCatalogPayload({ snapshotId: snapshot.snapshotId, snapshotHash, card });
}

export function catalogStatusSummaryResponse() {
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
  return value === "imported" || value === "validated" || value === "catalog_ready" || value === "implemented" || value === "playable" || value === "deck_legal" || value === "blocked";
}

function createRuntimeSnapshot(): CardSnapshot {
  const baseSnapshot = snapshotData as CardSnapshot;
  const localOnrSnapshot = readLocalOnrSnapshot();
  if (!localOnrSnapshot) return baseSnapshot;

  return {
    ...baseSnapshot,
    snapshotId: `${baseSnapshot.snapshotId}+${localOnrSnapshot.snapshotId}`,
    status: `${baseSnapshot.status}+private_local_onr_v1_overlay`,
    copyrightNote: `${baseSnapshot.copyrightNote} Private lokale O:NR-v1-Katalogdaten werden nur als Anzeige-Overlay geladen und bleiben nicht decklegal.`,
    normalization: {
      ...baseSnapshot.normalization,
      textPolicy: `${baseSnapshot.normalization.textPolicy} Lokale O:NR-v1-Texte bleiben Anzeigeinformation und sind kein Regelparser.`,
      assetPolicy: `${baseSnapshot.normalization.assetPolicy} Lokale O:NR-v1-Bilder werden nur aus data/local-assets gelesen.`
    },
    cards: [...baseSnapshot.cards, ...localOnrSnapshot.cards]
  };
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
