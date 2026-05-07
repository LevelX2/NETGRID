import snapshotData from "../../../data/card-import/card-snapshot-0.8.json";
import { existsSync, readFileSync, readdirSync } from "node:fs";
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

export const ONR_V1_0_5K_RELEASE_CARD_IDS = [
  "onr_v1_015_codeslinger",
  "onr_v1_052_raffles",
  "onr_v1_054_raptor",
  "onr_v1_070_tinweasel",
  "onr_v1_144_tycho-mem-chip",
  "onr_v1_146_zetatech-mem-chip",
  "onr_v1_203_hostile-takeover",
  "onr_v1_230_cortical-scanner",
  "onr_v1_232_crystal-wall",
  "onr_v1_237_data-wall",
  "onr_v1_238_data-wall-2-0",
  "onr_v1_239_endless-corridor"
] as const;

export const ONR_V1_0_6K_RELEASE_CARD_IDS = [
  "onr_v1_079_bodyweight-synthetic-blood",
  "onr_v1_095_jack-n-joe",
  "onr_v1_097_livewires-contacts",
  "onr_v1_108_score",
  "onr_v1_072_wild-card",
  "onr_v1_145_wutech-mem-chip",
  "onr_v1_220_tycho-extension",
  "onr_v1_281_accounts-receivable",
  "onr_v1_282_annual-reviews",
  "onr_v1_285_closed-accounts",
  "onr_v1_287_datapool-by-zetatech",
  "onr_v1_288_day-shift",
  "onr_v1_290_efficiency-experts",
  "onr_v1_301_punitive-counterstrike",
  "onr_v1_302_scorched-earth",
  "onr_v1_307_urban-renewal",
  "onr_v1_244_filter",
  "onr_v1_245_fire-wall",
  "onr_v1_252_keeper",
  "onr_v1_256_mazer"
] as const;

export const ONR_V1_1_2K_RELEASE_CARD_IDS = [
  "onr_v1_006_black-dahlia",
  "onr_v1_014_codecracker",
  "onr_v1_016_cyfermaster",
  "onr_v1_040_loony-goon",
  "onr_v1_060_shaka",
  "onr_v1_073_wizards-book",
  "onr_v1_253_laser-wire",
  "onr_v1_257_nerve-labyrinth",
  "onr_v1_259_in-the-face",
  "onr_v1_261_quandary",
  "onr_v1_262_razor-wire",
  "onr_v1_263_reinforced-wall",
  "onr_v1_265_rock-is-strong",
  "onr_v1_266_scramble",
  "onr_v1_269_shotgun-wire",
  "onr_v1_270_sleeper",
  "onr_v1_278_wall-of-ice",
  "onr_v1_279_wall-of-static",
  "onr_v1_293_netwatch-credit-voucher",
  "onr_v1_295_night-shift"
] as const;

export const ONR_V1_RUNTIME_RELEASE_CARD_IDS = [...ONR_V1_0_5K_RELEASE_CARD_IDS, ...ONR_V1_0_6K_RELEASE_CARD_IDS, ...ONR_V1_1_2K_RELEASE_CARD_IDS] as const;

const ONR_V1_RUNTIME_RELEASE_CARD_ID_SET = new Set<string>(ONR_V1_RUNTIME_RELEASE_CARD_IDS);
const ONR_V1_0_6K_RELEASE_CARD_ID_SET = new Set<string>(ONR_V1_0_6K_RELEASE_CARD_IDS);
const ONR_V1_1_2K_RELEASE_CARD_ID_SET = new Set<string>(ONR_V1_1_2K_RELEASE_CARD_IDS);

const ONR_V1_0_5K_RELEASE_MANIFEST: CatalogManifestReference = {
  manifestVersion: "card-implementation-manifest-v1.0.5k",
  status: "playable_mvp_v1_0_5k",
  unitTests: ["packages/engine/src/index.test.ts::V1.0.5K Card Release"],
  scenarioTests: ["packages/engine/src/index.test.ts::V1.0.5K Card Release"],
  visibilityTests: ["packages/engine/src/index.test.ts::V1.0.5K Card Release", "apps/server/src/multiplayer.test.ts::private local O:NR V1.0.5K matches"],
  replayTests: ["packages/engine/src/index.test.ts::V1.0.5K Card Release"]
};

const ONR_V1_0_6K_RELEASE_MANIFEST: CatalogManifestReference = {
  manifestVersion: "card-implementation-manifest-v1.0.6k",
  status: "playable_mvp_v1_0_6k",
  unitTests: ["packages/engine/src/index.test.ts::V1.0.6K Card Release"],
  scenarioTests: ["packages/engine/src/index.test.ts::V1.0.6K Card Release"],
  visibilityTests: ["packages/engine/src/index.test.ts::V1.0.6K Card Release", "apps/server/src/multiplayer.test.ts::private local O:NR V1.0.6K matches"],
  replayTests: ["packages/engine/src/index.test.ts::V1.0.6K Card Release"]
};

const ONR_V1_1_2K_RELEASE_MANIFEST: CatalogManifestReference = {
  manifestVersion: "card-implementation-manifest-v1.1.2k",
  status: "playable_mvp_v1_1_2k",
  unitTests: ["packages/engine/src/index.test.ts::V1.1.2K Card Release"],
  scenarioTests: ["packages/engine/src/index.test.ts::V1.1.2K Card Release"],
  visibilityTests: ["packages/engine/src/index.test.ts::V1.1.2K Card Release", "apps/server/src/multiplayer.test.ts::private local O:NR V1.1.2K matches"],
  replayTests: ["packages/engine/src/index.test.ts::V1.1.2K Card Release"]
};

const ONR_V1_0_5K_NUMERIC_OVERRIDES: Partial<Record<string, Partial<CatalogNumericFields>>> = {
  "onr_v1_015_codeslinger": { installCost: 7, memoryCost: 1, strength: 3 },
  "onr_v1_052_raffles": { installCost: 7, memoryCost: 1, strength: 4 },
  "onr_v1_054_raptor": { installCost: 1, memoryCost: 1, strength: 1 },
  "onr_v1_070_tinweasel": { installCost: 5, memoryCost: 1, strength: 3 },
  "onr_v1_144_tycho-mem-chip": { installCost: 5 },
  "onr_v1_146_zetatech-mem-chip": { installCost: 3 },
  "onr_v1_203_hostile-takeover": { advancementRequirement: 3, agendaPoints: 1 },
  "onr_v1_230_cortical-scanner": { rezCost: 7, strength: 3 },
  "onr_v1_232_crystal-wall": { rezCost: 4, strength: 3 },
  "onr_v1_237_data-wall": { rezCost: 1, strength: 0 },
  "onr_v1_238_data-wall-2-0": { rezCost: 2, strength: 1 },
  "onr_v1_239_endless-corridor": { rezCost: 4, strength: 2 }
};

const ONR_V1_0_6K_NUMERIC_OVERRIDES: Partial<Record<string, Partial<CatalogNumericFields>>> = {
  "onr_v1_079_bodyweight-synthetic-blood": { cost: 2, installCost: null },
  "onr_v1_095_jack-n-joe": { cost: 0, installCost: null },
  "onr_v1_097_livewires-contacts": { cost: 0, installCost: null },
  "onr_v1_108_score": { cost: 5, installCost: null },
  "onr_v1_220_tycho-extension": { advancementRequirement: 4, agendaPoints: 4 },
  "onr_v1_281_accounts-receivable": { cost: 5, installCost: null },
  "onr_v1_282_annual-reviews": { cost: 0, installCost: null },
  "onr_v1_285_closed-accounts": { cost: 1, installCost: null },
  "onr_v1_287_datapool-by-zetatech": { cost: 1, installCost: null },
  "onr_v1_288_day-shift": { cost: 0, installCost: null },
  "onr_v1_290_efficiency-experts": { cost: 0, installCost: null },
  "onr_v1_301_punitive-counterstrike": { cost: 0, installCost: null },
  "onr_v1_302_scorched-earth": { cost: 3, installCost: null },
  "onr_v1_307_urban-renewal": { cost: 6, installCost: null },
  "onr_v1_244_filter": { rezCost: 0, strength: 0 },
  "onr_v1_245_fire-wall": { rezCost: 5, strength: 4 },
  "onr_v1_252_keeper": { rezCost: 4, strength: 4 },
  "onr_v1_256_mazer": { rezCost: 5, strength: 5 }
};

const ONR_V1_1_2K_NUMERIC_OVERRIDES: Partial<Record<string, Partial<CatalogNumericFields>>> = {
  "onr_v1_006_black-dahlia": { installCost: 5, memoryCost: 1, strength: 10 },
  "onr_v1_014_codecracker": { installCost: 0, memoryCost: 1, strength: 2 },
  "onr_v1_016_cyfermaster": { installCost: 5, memoryCost: 1, strength: 2 },
  "onr_v1_040_loony-goon": { installCost: 0, memoryCost: 1, strength: 4 },
  "onr_v1_060_shaka": { installCost: 2, memoryCost: 1, strength: 4 },
  "onr_v1_073_wizards-book": { installCost: 2, memoryCost: 1, strength: 5 },
  "onr_v1_253_laser-wire": { rezCost: 4, strength: 2 },
  "onr_v1_257_nerve-labyrinth": { rezCost: 6, strength: 4 },
  "onr_v1_259_in-the-face": { rezCost: 5, strength: 3 },
  "onr_v1_261_quandary": { rezCost: 2, strength: 2 },
  "onr_v1_262_razor-wire": { rezCost: 6, strength: 3 },
  "onr_v1_263_reinforced-wall": { rezCost: 8, strength: 4 },
  "onr_v1_265_rock-is-strong": { rezCost: 6, strength: 5 },
  "onr_v1_266_scramble": { rezCost: 3, strength: 3 },
  "onr_v1_269_shotgun-wire": { rezCost: 8, strength: 5 },
  "onr_v1_270_sleeper": { rezCost: 1, strength: 1 },
  "onr_v1_278_wall-of-ice": { rezCost: 13, strength: 6 },
  "onr_v1_279_wall-of-static": { rezCost: 3, strength: 2 },
  "onr_v1_293_netwatch-credit-voucher": { cost: 0, installCost: null },
  "onr_v1_295_night-shift": { cost: 0, installCost: null }
};

const ONR_V1_0_5K_TEXT_OVERRIDES: Partial<Record<string, string>> = {
  "onr_v1_015_codeslinger": "0 credits: Break sentry subroutine.",
  "onr_v1_052_raffles": "0 credits: Break code gate subroutine.\n2 credits: +1 strength.",
  "onr_v1_054_raptor": "2 credits: Break sentry subroutine.\n1 credit: +1 strength.",
  "onr_v1_070_tinweasel": "0 credits: Break code gate subroutine.",
  "onr_v1_144_tycho-mem-chip": "Provides +3 MU.",
  "onr_v1_146_zetatech-mem-chip": "Provides +2 MU.",
  "onr_v1_203_hostile-takeover": "Gain 5 credits when scored.",
  "onr_v1_230_cortical-scanner": "[Subroutine] End the run.\n[Subroutine] End the run.\n[Subroutine] End the run.",
  "onr_v1_232_crystal-wall": "[Subroutine] End the run.",
  "onr_v1_237_data-wall": "[Subroutine] End the run.",
  "onr_v1_238_data-wall-2-0": "[Subroutine] End the run.",
  "onr_v1_239_endless-corridor": "[Subroutine] End the run.\n[Subroutine] End the run."
};

const ONR_V1_0_6K_TEXT_OVERRIDES: Partial<Record<string, string>> = {
  "onr_v1_079_bodyweight-synthetic-blood": "Draw five cards.",
  "onr_v1_095_jack-n-joe": "Draw three cards.",
  "onr_v1_097_livewires-contacts": "Gain 3.",
  "onr_v1_108_score": "Gain 9.",
  "onr_v1_072_wild-card": "0 credits: Break sentry subroutine.\n3 credits: +1 strength.",
  "onr_v1_145_wutech-mem-chip": "Provides +1 MU.",
  "onr_v1_220_tycho-extension": "No additional Regeltext.",
  "onr_v1_281_accounts-receivable": "Gain 9.",
  "onr_v1_282_annual-reviews": "Draw three cards.",
  "onr_v1_285_closed-accounts": "Play only if Runner is tagged. Runner loses all bits.",
  "onr_v1_287_datapool-by-zetatech": "Play only if Runner is tagged. Give Runner two tags.",
  "onr_v1_288_day-shift": "Draw two cards and gain 1.",
  "onr_v1_290_efficiency-experts": "Gain 3.",
  "onr_v1_301_punitive-counterstrike": "Play only if Runner is tagged. Do 2 meat damage.",
  "onr_v1_302_scorched-earth": "Play only if Runner is tagged. Do 4 meat damage.",
  "onr_v1_307_urban-renewal": "Play only if Runner is tagged. Do 5 meat damage.",
  "onr_v1_244_filter": "[Subroutine] End the run.",
  "onr_v1_245_fire-wall": "[Subroutine] End the run.",
  "onr_v1_252_keeper": "[Subroutine] End the run.",
  "onr_v1_256_mazer": "[Subroutine] End the run."
};

const ONR_V1_1_2K_TEXT_OVERRIDES: Partial<Record<string, string>> = {
  "onr_v1_006_black-dahlia": "2 credits: Break sentry subroutine.\n2 credits: +1 strength.",
  "onr_v1_014_codecracker": "0 credits: Break code gate subroutine.\n1 credit: +1 strength.",
  "onr_v1_016_cyfermaster": "2 credits: Break code gate subroutine.\n1 credit: +1 strength.",
  "onr_v1_040_loony-goon": "1 credit: Break sentry subroutine.\n1 credit: +1 strength.",
  "onr_v1_060_shaka": "1 credit: Break sentry subroutine.\n2 credits: +1 strength.",
  "onr_v1_073_wizards-book": "0 credits: Break code gate subroutine.\n2 credits: +1 strength.",
  "onr_v1_253_laser-wire": "[Subroutine] Do 1 net damage.\n[Subroutine] End the run.",
  "onr_v1_257_nerve-labyrinth": "[Subroutine] Do 2 net damage.\n[Subroutine] End the run.",
  "onr_v1_259_in-the-face": "[Subroutine] End the run.",
  "onr_v1_261_quandary": "[Subroutine] End the run.",
  "onr_v1_262_razor-wire": "[Subroutine] Do 2 net damage.\n[Subroutine] End the run.",
  "onr_v1_263_reinforced-wall": "[Subroutine] End the run.\n[Subroutine] End the run.",
  "onr_v1_265_rock-is-strong": "[Subroutine] End the run.",
  "onr_v1_266_scramble": "[Subroutine] End the run.",
  "onr_v1_269_shotgun-wire": "[Subroutine] Do 2 net damage.\n[Subroutine] End the run.",
  "onr_v1_270_sleeper": "[Subroutine] End the run.",
  "onr_v1_278_wall-of-ice": "[Subroutine] Do 2 net damage.\n[Subroutine] Do 2 net damage.\n[Subroutine] End the run.\n[Subroutine] End the run.",
  "onr_v1_279_wall-of-static": "[Subroutine] End the run.",
  "onr_v1_293_netwatch-credit-voucher": "Play only if Runner is tagged. Give Runner 1 tag and gain 1.",
  "onr_v1_295_night-shift": "Gain 2 and draw one card."
};

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
  const confirmedTextOverrides = readLocalConfirmedTextOverrides();
  const localCardsWithConfirmedText = applyLocalConfirmedTextOverrides(localOnrSnapshot.cards, confirmedTextOverrides);
  const v105kCards = applyOnrV105KReleaseGate(localCardsWithConfirmedText);

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
    cards: [...baseSnapshot.cards, ...v105kCards]
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
    return JSON.parse(stripJsonBom(readFileSync(candidate, "utf8"))) as CardSnapshot;
  }
  return null;
}

function stripJsonBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
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

function applyLocalConfirmedTextOverrides(cards: CatalogCard[], overridesByCollectorNumber: Record<string, string>): CatalogCard[] {
  return cards.map((card) => {
    const cleanText = overridesByCollectorNumber[card.collectorNumber];
    if (!cleanText) return card;
    return { ...card, text: cleanText };
  });
}

function readLocalConfirmedTextOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};
  for (const candidate of localConfirmedTextDirCandidates()) {
    if (!existsSync(candidate)) continue;
    for (const filePath of localConfirmedTextFiles(candidate)) {
      Object.assign(overrides, parseConfirmedTextOverrides(readFileSync(filePath, "utf8")));
    }
  }
  return overrides;
}

function localConfirmedTextDirCandidates(): string[] {
  const relatives = [
    path.join("data", "local", "card-import", "onr-v1-limited", "text-review-galleries"),
    path.join("data", "local", "card-import", "onr-v1-limited", "v105k-control")
  ];
  return relatives.flatMap((relative) =>
    Array.from(
      new Set([
        path.resolve(process.cwd(), relative),
        path.resolve(process.cwd(), "..", relative),
        path.resolve(process.cwd(), "..", "..", relative)
      ])
    )
  );
}

function localConfirmedTextFiles(directory: string): string[] {
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".local.md") && (fileName.includes("confirmed-texts") || fileName.includes("candidates-control")))
    .map((fileName) => path.join(directory, fileName));
}

function parseConfirmedTextOverrides(markdown: string): Record<string, string> {
  const overrides: Record<string, string> = {};
  const headingPattern = /^(#{2,3})\s+(\d{3})\s+-\s+(.+)$/gm;
  const headings = [...markdown.matchAll(headingPattern)].map((match) => ({
    index: match.index ?? 0,
    number: match[2] ?? ""
  }));

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    if (!heading) continue;
    const nextHeading = headings[index + 1];
    const section = markdown.slice(heading.index, nextHeading?.index ?? markdown.length);
    if (section.includes("Mapping-Hinweis")) continue;
    const cleanText = extractConfirmedRulesText(section);
    if (cleanText && heading.number) overrides[heading.number] = cleanText;
  }

  return overrides;
}

function extractConfirmedRulesText(section: string): string | null {
  const fencedRules = section.match(/Regeltext(?: ohne Flavour)?:\s*```text\s*([\s\S]*?)\s*```/);
  if (fencedRules?.[1]) return normalizeConfirmedRulesText(fencedRules[1]);

  const fencedUserText = section.match(/Vom Nutzer bestätigter Text:\s*```text\s*([\s\S]*?)\s*```/);
  if (fencedUserText?.[1]) return normalizeConfirmedRulesText(stripCardMetadataFromConfirmedText(fencedUserText[1]));

  const inline = section.match(/^- Regeltext:\s*(.+)$/m);
  if (inline?.[1]) return normalizeConfirmedRulesText(inline[1]);

  return null;
}

function stripCardMetadataFromConfirmedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Kosten\b/i.test(line))
    .filter((line) => !/^Stärke\b/i.test(line))
    .filter((line) => !/^MU\b/i.test(line))
    .filter((line) => !/^Program\b/i.test(line))
    .filter((line) => !/^Hardware\b/i.test(line))
    .join("\n");
}

function normalizeConfirmedRulesText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function applyOnrV105KReleaseGate(cards: CatalogCard[]): CatalogCard[] {
  return cards.map((card) => (ONR_V1_RUNTIME_RELEASE_CARD_ID_SET.has(card.catalogCardId) ? promoteOnrRuntimeReleaseCard(card) : demoteLocalOnrCard(card)));
}

function promoteOnrRuntimeReleaseCard(card: CatalogCard): CatalogCard {
  const isV112K = ONR_V1_1_2K_RELEASE_CARD_ID_SET.has(card.catalogCardId);
  const isV106K = ONR_V1_0_6K_RELEASE_CARD_ID_SET.has(card.catalogCardId);
  const textOverrides = isV112K ? ONR_V1_1_2K_TEXT_OVERRIDES : isV106K ? ONR_V1_0_6K_TEXT_OVERRIDES : ONR_V1_0_5K_TEXT_OVERRIDES;
  const numericOverrides = isV112K ? ONR_V1_1_2K_NUMERIC_OVERRIDES : isV106K ? ONR_V1_0_6K_NUMERIC_OVERRIDES : ONR_V1_0_5K_NUMERIC_OVERRIDES;
  const manifest = isV112K ? ONR_V1_1_2K_RELEASE_MANIFEST : isV106K ? ONR_V1_0_6K_RELEASE_MANIFEST : ONR_V1_0_5K_RELEASE_MANIFEST;
  return {
    ...card,
    engineCardId: card.catalogCardId,
    subtypes: [...card.subtypes],
    text: textOverrides[card.catalogCardId] ?? card.text,
    numeric: { ...card.numeric, ...(numericOverrides[card.catalogCardId] ?? {}) },
    statuses: {
      ...card.statuses,
      imported: true,
      validated: true,
      catalog_ready: true,
      implemented: true,
      playable: true,
      deck_legal: true,
      blocked: false
    },
    blockReasons: [],
    implementationManifest: cloneManifestReference(manifest)
  };
}

function demoteLocalOnrCard(card: CatalogCard): CatalogCard {
  return {
    ...card,
    engineCardId: null,
    subtypes: [...card.subtypes],
    numeric: { ...card.numeric },
    statuses: {
      ...card.statuses,
      implemented: false,
      playable: false,
      deck_legal: false
    },
    blockReasons: [...card.blockReasons],
    implementationManifest: null
  };
}

function cloneManifestReference(reference: CatalogManifestReference): CatalogManifestReference {
  return {
    ...reference,
    unitTests: [...reference.unitTests],
    scenarioTests: [...reference.scenarioTests],
    visibilityTests: [...reference.visibilityTests],
    replayTests: [...reference.replayTests]
  };
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
