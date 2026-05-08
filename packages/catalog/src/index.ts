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

export type CatalogStatusKey =
  | "imported"
  | "validated"
  | "catalog_ready"
  | "implemented"
  | "engine_supported"
  | "playable"
  | "human_playable"
  | "ai_supported"
  | "deck_legal"
  | "format_legal"
  | "blocked";

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

export type SourceRegistryV2 = {
  schemaVersion: "card-source-registry-v1.3.1";
  registryId: string;
  createdAt: string;
  sources: CardSourceEntryV2[];
};

export type CardSourceEntryV2 = {
  sourceId: string;
  sourceType: "project_file" | "local_private_file" | "manual_review" | "external_snapshot";
  scope: "versioned_project" | "private_local" | "reference_only";
  pathOrReference: string;
  provenance: string;
  usageDecision: "allowed_project_data" | "private_display_only" | "reference_only" | "blocked";
  reviewStatus: "unreviewed" | "reviewed" | "blocked";
  notes?: string;
};

export type CardPipelineReviewStatus = "unreviewed" | "reviewed" | "blocked";

export type PipelineCard = {
  catalogCardId: string;
  sourceCardId: string;
  engineCardId: string | null;
  title: string;
  side: CatalogSide;
  type: CatalogCardType;
  subtypes: string[];
  faction: string;
  text: string;
  displayOnlyText: boolean;
  numeric: CatalogNumericFields;
  statuses: CatalogStatuses;
  requiredMechanics: string[];
  resolverRef: string | null;
  abilityRefs: string[];
  aiHintsRef: string | null;
  review: {
    cardData: CardPipelineReviewStatus;
    mechanics: CardPipelineReviewStatus;
    resolver: CardPipelineReviewStatus;
    aiHints: CardPipelineReviewStatus;
  };
};

export type CardPipelineSnapshot = {
  schemaVersion: "card-pipeline-snapshot-v1.3.1";
  snapshotId: string;
  pipelineVersion: "1.3.1";
  sourceRegistryId: string;
  createdAt: string;
  normalization: {
    sortOrder: string[];
    textPolicy: "display_only";
    rulesPolicy: "resolver_refs_only";
    assetPolicy: "private_display_separate";
  };
  cards: PipelineCard[];
  hash: string;
};

export type PipelineDiffCategory =
  | "added_card"
  | "removed_card"
  | "text_changed"
  | "numeric_changed"
  | "status_changed"
  | "required_mechanics_changed"
  | "resolver_ref_changed"
  | "ability_refs_changed"
  | "ai_hints_changed"
  | "asset_reference_changed"
  | "review_status_changed";

export type PipelineDiffSeverity = "info" | "review_required" | "blocking";

export type PipelineDiffEntry = {
  category: PipelineDiffCategory;
  severity: PipelineDiffSeverity;
  cardId: string;
  summary: string;
};

export type PipelineDiffReport = {
  schemaVersion: "card-pipeline-diff-v1.3.1";
  fromSnapshotId: string;
  toSnapshotId: string;
  fromHash: string;
  toHash: string;
  entries: PipelineDiffEntry[];
};

export type PipelineRollbackReport = {
  schemaVersion: "card-pipeline-rollback-v1.3.1";
  fromSnapshotId: string;
  toSnapshotId: string;
  fromHash: string;
  toHash: string;
  matchSnapshotsUntouched: true;
  replayStateHashUntouched: true;
  privateAssetsUntouched: true;
  summary: string;
};

export type AiCardHintsV2 = {
  schemaVersion: "ai-card-hints-v1.3.1";
  hintsId: string;
  derivedFromSnapshotId: string;
  cards: AiCardHintV2[];
};

export type AiCardHintV2 = {
  cardId: string;
  side: CatalogSide;
  cardType: CatalogCardType;
  roles: string[];
  planRoles: string[];
  requiredMechanics: string[];
  valueHints: Record<string, number>;
  riskTags: string[];
  aiSupportStatus: "none" | "hinted_only" | "scenario_ready" | "ai_supported";
  scenarioRefs: string[];
};

export type CardPipelineReport = {
  schemaVersion: "card-pipeline-report-v1.3.1";
  reportId: string;
  snapshotId: string;
  snapshotHash: string;
  pipelineVersion: "1.3.1";
  statusSummary: Partial<Record<CatalogStatusKey, number>>;
  blockedCards: Array<{ cardId: string; reasons: string[] }>;
  missingMechanics: string[];
  missingResolvers: string[];
  missingTests: string[];
  missingAiHints: string[];
  noScopeAssertions: {
    noCardTextParser: true;
    noAutomaticPlayability: true;
    noNewCardRelease: true;
    noNewMechanics: true;
    noOfficialAssets: true;
    noPublicPlatformFeatures: true;
  };
};

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
  "blocked"
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
  "undoSnapshots"
] as const;

export const FORBIDDEN_PIPELINE_PAYLOAD_PATTERNS = [
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
  /data[\\/]local/i
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

export const ONR_V1_2_3_RELEASE_CARD_IDS = [
  "onr_v1_021_dwarf",
  "onr_v1_039_krash",
  "onr_v1_066_snowball",
  "onr_v1_074_worm",
  "onr_v1_081_custodial-position",
  "onr_v1_085_executive-wiretaps",
  "onr_v1_101_mit-west-tier",
  "onr_v1_243_fetch-4-0-1",
  "onr_v1_249_hunter",
  "onr_v1_297_overtime-incentives",
  "onr_v1_306_trojan-horse"
] as const;

export const ONR_V1_RUNTIME_RELEASE_CARD_IDS = [...ONR_V1_0_5K_RELEASE_CARD_IDS, ...ONR_V1_0_6K_RELEASE_CARD_IDS, ...ONR_V1_1_2K_RELEASE_CARD_IDS, ...ONR_V1_2_3_RELEASE_CARD_IDS] as const;

export const KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS = [
  "onr_v1_006_black-dahlia",
  "onr_v1_016_cyfermaster",
  "onr_v1_040_loony-goon",
  "onr_v1_052_raffles",
  "onr_v1_054_raptor",
  "onr_v1_060_shaka",
  "onr_v1_070_tinweasel",
  "onr_v1_072_wild-card",
  "onr_v1_073_wizards-book",
  "onr_v1_079_bodyweight-synthetic-blood",
  "onr_v1_095_jack-n-joe",
  "onr_v1_097_livewires-contacts",
  "onr_v1_108_score",
  "onr_v1_145_wutech-mem-chip"
] as const;

export const DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS = [
  "onr_v1_014_codecracker",
  "onr_v1_015_codeslinger",
  "onr_v1_021_dwarf",
  "onr_v1_039_krash",
  "onr_v1_066_snowball",
  "onr_v1_074_worm",
  "onr_v1_144_tycho-mem-chip",
  "onr_v1_146_zetatech-mem-chip"
] as const;

export const DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS = [
  "simple_tag_ice",
  "onr_v1_287_datapool-by-zetatech",
  "onr_v1_293_netwatch-credit-voucher",
  "onr_v1_243_fetch-4-0-1",
  "onr_v1_249_hunter",
  "onr_v1_306_trojan-horse"
] as const;

const ONR_V1_RUNTIME_RELEASE_CARD_ID_SET = new Set<string>(ONR_V1_RUNTIME_RELEASE_CARD_IDS);
const DECK_LEGAL_AI_APPROVED_CARD_ID_SET = new Set<string>([
  ...KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS,
  ...DECK_LEGAL_AI_APPROVAL_BATCH_A_CARD_IDS,
  ...DECK_LEGAL_AI_APPROVAL_CORP_TAG_SLICE_CARD_IDS
]);
const ONR_V1_0_6K_RELEASE_CARD_ID_SET = new Set<string>(ONR_V1_0_6K_RELEASE_CARD_IDS);
const ONR_V1_1_2K_RELEASE_CARD_ID_SET = new Set<string>(ONR_V1_1_2K_RELEASE_CARD_IDS);
const ONR_V1_2_3_RELEASE_CARD_ID_SET = new Set<string>(ONR_V1_2_3_RELEASE_CARD_IDS);

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

const ONR_V1_2_3_RELEASE_MANIFEST: CatalogManifestReference = {
  manifestVersion: "card-implementation-manifest-v1.2.3",
  status: "human_playable_v1_2_3",
  unitTests: ["packages/engine/src/index.test.ts::V1.2.3 Mechanic Unlock Card Release 1"],
  scenarioTests: ["data/scenarios/v123-card-release-smoke.json"],
  visibilityTests: ["packages/engine/src/index.test.ts::V1.2.3 Mechanic Unlock Card Release 1", "apps/server/src/multiplayer.test.ts::V1.2.3 card release matchstart"],
  replayTests: ["packages/engine/src/index.test.ts::V1.2.3 Mechanic Unlock Card Release 1"]
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

const ONR_V1_2_3_NUMERIC_OVERRIDES: Partial<Record<string, Partial<CatalogNumericFields>>> = {
  "onr_v1_021_dwarf": { installCost: 3, memoryCost: 1, strength: 1 },
  "onr_v1_039_krash": { installCost: 3, memoryCost: 1, strength: 2 },
  "onr_v1_066_snowball": { installCost: 3, memoryCost: 1, strength: 1 },
  "onr_v1_074_worm": { installCost: 2, memoryCost: 1, strength: 1 },
  "onr_v1_081_custodial-position": { cost: 0, installCost: null },
  "onr_v1_085_executive-wiretaps": { cost: 0, installCost: null },
  "onr_v1_101_mit-west-tier": { cost: 0, installCost: null },
  "onr_v1_243_fetch-4-0-1": { rezCost: 0, strength: 3 },
  "onr_v1_249_hunter": { rezCost: 2, strength: 5 },
  "onr_v1_297_overtime-incentives": { cost: 0, installCost: null },
  "onr_v1_306_trojan-horse": { cost: 2, installCost: null }
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

const ONR_V1_2_3_TEXT_OVERRIDES: Partial<Record<string, string>> = {
  "onr_v1_021_dwarf": "1 credit: Break wall subroutine.\n1 credit: +1 strength.",
  "onr_v1_039_krash": "2 credits: Break ice subroutine.\n2 credits: +1 strength.",
  "onr_v1_066_snowball": "1 credit: Break sentry subroutine.\n1 credit: +1 strength.",
  "onr_v1_074_worm": "0 credits: Break wall subroutine.\n3 credits: +1 strength.",
  "onr_v1_081_custodial-position": "Make a run on R&D. If successful, access two additional cards from R&D.",
  "onr_v1_085_executive-wiretaps": "Make a run on HQ. If successful, access two additional cards from HQ.",
  "onr_v1_101_mit-west-tier": "Shuffle your grip, heap and stack together, draw five cards, then remove MIT West Tier from the game.",
  "onr_v1_243_fetch-4-0-1": "[Subroutine] Trace 3 - If trace is successful, give Runner a tag.",
  "onr_v1_249_hunter": "[Subroutine] Trace 5 - If trace is successful, give Runner a tag.",
  "onr_v1_297_overtime-incentives": "Gain two actions.",
  "onr_v1_306_trojan-horse": "Play only if Runner stole any agendas during his or her last turn. Give Runner a tag."
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
    if (card.statuses.engine_supported && !card.statuses.implemented) errors.push(`Card ${card.catalogCardId} is engine_supported without implemented.`);
    if (card.statuses.human_playable && (!card.statuses.engine_supported || !card.statuses.playable)) errors.push(`Card ${card.catalogCardId} is human_playable without engine_supported/playable.`);
    if (card.statuses.ai_supported && !card.statuses.human_playable) errors.push(`Card ${card.catalogCardId} is ai_supported without human_playable.`);
    if (card.statuses.deck_legal && !card.statuses.playable) errors.push(`Card ${card.catalogCardId} is deck_legal without playable.`);
    if (card.statuses.deck_legal && Object.prototype.hasOwnProperty.call(card.statuses, "human_playable") && !card.statuses.human_playable) errors.push(`Card ${card.catalogCardId} is deck_legal without human_playable.`);
    if (card.statuses.format_legal && !card.statuses.deck_legal) errors.push(`Card ${card.catalogCardId} is format_legal without deck_legal.`);
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
      statuses: statusKeysForCards(normalized.cards)
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

export function summarizeStatuses(cards: Array<{ statuses: CatalogStatuses }>): Partial<Record<CatalogStatusKey, number>> {
  const summary: Partial<Record<CatalogStatusKey, number>> = {};
  for (const card of cards) {
    for (const key of CATALOG_STATUS_KEYS) {
      if (card.statuses[key]) summary[key] = (summary[key] ?? 0) + 1;
    }
  }
  return summary;
}

function statusKeysForCards(cards: CatalogCard[]): CatalogStatusKey[] {
  return CATALOG_STATUS_KEYS.filter((key) => cards.some((card) => Object.prototype.hasOwnProperty.call(card.statuses, key)));
}

export function assertCatalogPayloadSafe(payload: unknown): CatalogValidationResult {
  const serialized = JSON.stringify(payload);
  const errors = FORBIDDEN_CATALOG_PAYLOAD_KEYS.filter((key) => serialized.includes(key)).map((key) => `Catalog payload contains forbidden key ${key}.`);
  return { ok: errors.length === 0, errors };
}

export function createSourceRegistryV2(createdAt = "2026-05-08T00:00:00.000+02:00"): SourceRegistryV2 {
  return {
    schemaVersion: "card-source-registry-v1.3.1",
    registryId: "source-registry-1.3.1",
    createdAt,
    sources: [
      {
        sourceId: "v131-versioned-card-snapshot-0.8",
        sourceType: "project_file",
        scope: "versioned_project",
        pathOrReference: "data/card-import/card-snapshot-0.8.json",
        provenance: "Versioned NETGRID demo and catalog snapshot carried forward from V0.8.",
        usageDecision: "allowed_project_data",
        reviewStatus: "reviewed",
        notes: "Snapshot text remains display-only and cannot grant playability."
      },
      {
        sourceId: "v131-card-implementation-manifests",
        sourceType: "manual_review",
        scope: "versioned_project",
        pathOrReference: "data/manifests/card-implementation-manifest*.json",
        provenance: "Manual release gate manifests through V1.2.3.",
        usageDecision: "allowed_project_data",
        reviewStatus: "reviewed",
        notes: "Resolvers, mechanics and tests are reviewed gate evidence only."
      },
      {
        sourceId: "v131-ai-card-role-manifest-0.9",
        sourceType: "manual_review",
        scope: "versioned_project",
        pathOrReference: "data/ai/card-role-manifest-0.9.json",
        provenance: "Manual AI role data from the V0.9 AI quality gate.",
        usageDecision: "allowed_project_data",
        reviewStatus: "reviewed",
        notes: "Roles and AI hints do not set ai_supported."
      },
      {
        sourceId: "v131-private-local-onr-v1-overlay",
        sourceType: "local_private_file",
        scope: "private_local",
        pathOrReference: "private-local-onr-v1-overlay",
        provenance: "Optional private local card import overlay available only on the operator machine.",
        usageDecision: "private_display_only",
        reviewStatus: "reviewed",
        notes: "The registry stores a logical reference only; private local paths and assets are not versioned."
      }
    ]
  };
}

export function validateSourceRegistryV2(registry: SourceRegistryV2): CatalogValidationResult {
  const errors: string[] = [];
  if (registry.schemaVersion !== "card-source-registry-v1.3.1") errors.push("Source registry schemaVersion must be card-source-registry-v1.3.1.");
  if (!registry.registryId) errors.push("Source registry is missing registryId.");
  const seen = new Set<string>();
  for (const source of registry.sources) {
    if (!source.sourceId) errors.push("Source entry is missing sourceId.");
    if (seen.has(source.sourceId)) errors.push(`Duplicate sourceId ${source.sourceId}.`);
    seen.add(source.sourceId);
    if (!source.pathOrReference) errors.push(`Source ${source.sourceId} is missing pathOrReference.`);
    if (source.scope === "private_local" && /[A-Za-z]:\\|data[\\/]local|%APPDATA%/i.test(source.pathOrReference)) {
      errors.push(`Source ${source.sourceId} exposes a private local path.`);
    }
    if (source.usageDecision === "allowed_project_data" && source.scope !== "versioned_project") {
      errors.push(`Source ${source.sourceId} grants project data use outside versioned_project scope.`);
    }
    if (source.reviewStatus === "blocked" && source.usageDecision !== "blocked") {
      errors.push(`Source ${source.sourceId} is blocked without blocked usageDecision.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function createCardPipelineSnapshot(
  cardSnapshot: CardSnapshot,
  options: {
    snapshotId?: string;
    sourceRegistryId?: string;
    createdAt?: string;
    aiHints?: AiCardHintsV2;
  } = {}
): CardPipelineSnapshot {
  const cards = normalizeSnapshot(cardSnapshot).cards.map((card) => toPipelineCard(card, options.aiHints));
  const snapshotWithoutHash = {
    schemaVersion: "card-pipeline-snapshot-v1.3.1" as const,
    snapshotId: options.snapshotId ?? "card-pipeline-snapshot-1.3.1",
    pipelineVersion: "1.3.1" as const,
    sourceRegistryId: options.sourceRegistryId ?? "source-registry-1.3.1",
    createdAt: options.createdAt ?? "2026-05-08T00:00:00.000+02:00",
    normalization: {
      sortOrder: ["catalogCardId"],
      textPolicy: "display_only" as const,
      rulesPolicy: "resolver_refs_only" as const,
      assetPolicy: "private_display_separate" as const
    },
    cards,
    hash: "pending"
  };
  const hash = computeCardPipelineSnapshotHash(snapshotWithoutHash);
  return { ...snapshotWithoutHash, hash };
}

export function computeCardPipelineSnapshotHash(snapshot: CardPipelineSnapshot): string {
  const normalized = normalizeCardPipelineSnapshot(snapshot);
  const withoutHash = { ...normalized, hash: "pending" };
  return fnv1a(stableStringify(withoutHash));
}

export function normalizeCardPipelineSnapshot(snapshot: CardPipelineSnapshot): CardPipelineSnapshot {
  return {
    ...snapshot,
    normalization: {
      sortOrder: [...snapshot.normalization.sortOrder],
      textPolicy: snapshot.normalization.textPolicy,
      rulesPolicy: snapshot.normalization.rulesPolicy,
      assetPolicy: snapshot.normalization.assetPolicy
    },
    cards: snapshot.cards
      .map((card) => ({
        ...card,
        subtypes: [...card.subtypes].sort((left, right) => left.localeCompare(right)),
        numeric: { ...card.numeric },
        statuses: normalizeStatuses(card.statuses),
        requiredMechanics: [...card.requiredMechanics].sort((left, right) => left.localeCompare(right)),
        abilityRefs: [...card.abilityRefs].sort((left, right) => left.localeCompare(right)),
        review: { ...card.review }
      }))
      .sort((left, right) => left.catalogCardId.localeCompare(right.catalogCardId))
  };
}

export function validateCardPipelineSnapshot(snapshot: CardPipelineSnapshot, aiHints?: AiCardHintsV2): CatalogValidationResult {
  const errors: string[] = [];
  if (snapshot.schemaVersion !== "card-pipeline-snapshot-v1.3.1") errors.push("Pipeline snapshot schemaVersion must be card-pipeline-snapshot-v1.3.1.");
  if (snapshot.pipelineVersion !== "1.3.1") errors.push("Pipeline snapshot pipelineVersion must be 1.3.1.");
  if (snapshot.hash !== computeCardPipelineSnapshotHash(snapshot)) errors.push("Pipeline snapshot hash mismatch.");
  if (snapshot.normalization.textPolicy !== "display_only") errors.push("Pipeline snapshot textPolicy must be display_only.");
  if (snapshot.normalization.rulesPolicy !== "resolver_refs_only") errors.push("Pipeline snapshot rulesPolicy must be resolver_refs_only.");
  const seen = new Set<string>();
  const hintById = new Map((aiHints?.cards ?? []).map((hint) => [hint.cardId, hint]));
  for (const card of snapshot.cards) {
    if (seen.has(card.catalogCardId)) errors.push(`Duplicate pipeline card ${card.catalogCardId}.`);
    seen.add(card.catalogCardId);
    if (!card.displayOnlyText) errors.push(`Card ${card.catalogCardId} text must be display-only.`);
    if (!card.statuses.imported && card.statuses.catalog_ready) errors.push(`Card ${card.catalogCardId} is catalog_ready without imported.`);
    if (card.statuses.catalog_ready && !card.statuses.validated) errors.push(`Card ${card.catalogCardId} is catalog_ready without validated.`);
    if (card.statuses.implemented && !card.statuses.imported) errors.push(`Card ${card.catalogCardId} is implemented without imported.`);
    if (card.statuses.engine_supported && (!card.statuses.implemented || !card.resolverRef || card.abilityRefs.length === 0)) {
      errors.push(`Card ${card.catalogCardId} is engine_supported without reviewed resolver/ability refs.`);
    }
    if (card.statuses.human_playable && (!card.statuses.engine_supported || card.requiredMechanics.length === 0 || card.review.mechanics !== "reviewed")) {
      errors.push(`Card ${card.catalogCardId} is human_playable without reviewed mechanics.`);
    }
    if (card.statuses.deck_legal && !card.statuses.human_playable) errors.push(`Card ${card.catalogCardId} is deck_legal without human_playable.`);
    if (card.statuses.format_legal && !card.statuses.deck_legal) errors.push(`Card ${card.catalogCardId} is format_legal without deck_legal.`);
    const hint = hintById.get(card.catalogCardId);
    if (card.statuses.ai_supported && (!card.statuses.human_playable || !hint || hint.aiSupportStatus !== "ai_supported" || hint.scenarioRefs.length === 0)) {
      errors.push(`Card ${card.catalogCardId} is ai_supported without AI hint and scenario gate.`);
    }
    if (!card.statuses.engine_supported && card.resolverRef) errors.push(`Card ${card.catalogCardId} has resolverRef without engine_supported.`);
    if (!card.statuses.engine_supported && card.abilityRefs.length > 0) errors.push(`Card ${card.catalogCardId} has abilityRefs without engine_supported.`);
  }
  return { ok: errors.length === 0, errors };
}

export function createAiCardHintsV2(
  snapshot: CardPipelineSnapshot,
  roleCards: Array<{ cardId: string; side: CatalogSide; roles: string[]; riskTags?: string[] }>,
  options: { hintsId?: string } = {}
): AiCardHintsV2 {
  const cardsById = new Map(snapshot.cards.map((card) => [card.catalogCardId, card]));
  return {
    schemaVersion: "ai-card-hints-v1.3.1",
    hintsId: options.hintsId ?? "ai-card-hints-1.3.1",
    derivedFromSnapshotId: snapshot.snapshotId,
    cards: roleCards
      .map((roleCard): AiCardHintV2 | null => {
        const card = cardsById.get(roleCard.cardId);
        if (!card) return null;
        return {
          cardId: roleCard.cardId,
          side: roleCard.side,
          cardType: card.type,
          roles: [...roleCard.roles].sort((left, right) => left.localeCompare(right)),
          planRoles: planRolesFor(roleCard.roles, card),
          requiredMechanics: [...card.requiredMechanics].sort((left, right) => left.localeCompare(right)),
          valueHints: valueHintsFor(roleCard.roles, card),
          riskTags: [...(roleCard.riskTags ?? [])].sort((left, right) => left.localeCompare(right)),
          aiSupportStatus: card.statuses.ai_supported ? ("ai_supported" as const) : ("hinted_only" as const),
          scenarioRefs: card.statuses.ai_supported ? ["packages/ai/src/index.test.ts::MVP 0.9 stronger AI"] : []
        };
      })
      .filter((card): card is AiCardHintV2 => card !== null)
      .sort((left, right) => left.cardId.localeCompare(right.cardId))
  };
}

export function validateAiCardHintsV2(hints: AiCardHintsV2, snapshot: CardPipelineSnapshot): CatalogValidationResult {
  const errors: string[] = [];
  if (hints.schemaVersion !== "ai-card-hints-v1.3.1") errors.push("AI hints schemaVersion must be ai-card-hints-v1.3.1.");
  if (hints.derivedFromSnapshotId !== snapshot.snapshotId) errors.push("AI hints derivedFromSnapshotId does not match pipeline snapshot.");
  const cardsById = new Map(snapshot.cards.map((card) => [card.catalogCardId, card]));
  const seen = new Set<string>();
  for (const hint of hints.cards) {
    if (seen.has(hint.cardId)) errors.push(`Duplicate AI hint ${hint.cardId}.`);
    seen.add(hint.cardId);
    const card = cardsById.get(hint.cardId);
    if (!card) {
      errors.push(`AI hint ${hint.cardId} does not reference a snapshot card.`);
      continue;
    }
    if (hint.side !== card.side) errors.push(`AI hint ${hint.cardId} has wrong side.`);
    if (hint.cardType !== card.type) errors.push(`AI hint ${hint.cardId} has wrong cardType.`);
    if (hint.roles.length === 0) errors.push(`AI hint ${hint.cardId} is missing roles.`);
    if (hint.planRoles.length === 0) errors.push(`AI hint ${hint.cardId} is missing planRoles.`);
    if (Object.values(hint.valueHints).some((value) => !Number.isFinite(value) || value < -10 || value > 10)) {
      errors.push(`AI hint ${hint.cardId} has valueHints outside the -10..10 range.`);
    }
    if (hint.aiSupportStatus === "ai_supported" && (!card.statuses.ai_supported || hint.scenarioRefs.length === 0)) {
      errors.push(`AI hint ${hint.cardId} grants ai_supported without card support and scenarios.`);
    }
    if (hint.aiSupportStatus !== "ai_supported" && card.statuses.ai_supported) {
      errors.push(`AI hint ${hint.cardId} does not preserve existing ai_supported status.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function diffCardPipelineSnapshots(from: CardPipelineSnapshot, to: CardPipelineSnapshot): PipelineDiffReport {
  const fromCards = new Map(from.cards.map((card) => [card.catalogCardId, card]));
  const toCards = new Map(to.cards.map((card) => [card.catalogCardId, card]));
  const entries: PipelineDiffEntry[] = [];
  for (const cardId of [...new Set([...fromCards.keys(), ...toCards.keys()])].sort((left, right) => left.localeCompare(right))) {
    const before = fromCards.get(cardId);
    const after = toCards.get(cardId);
    if (!before && after) {
      entries.push({ category: "added_card", severity: "review_required", cardId, summary: `Card ${cardId} added to pipeline snapshot.` });
      continue;
    }
    if (before && !after) {
      entries.push({ category: "removed_card", severity: "blocking", cardId, summary: `Card ${cardId} removed from pipeline snapshot.` });
      continue;
    }
    if (!before || !after) continue;
    pushDiff(entries, "text_changed", before.text, after.text, cardId, "Card display text changed.", "review_required");
    pushDiff(entries, "numeric_changed", before.numeric, after.numeric, cardId, "Numeric card fields changed.", "review_required");
    pushDiff(entries, "status_changed", before.statuses, after.statuses, cardId, "Card support statuses changed.", statusDiffSeverity(before, after));
    pushDiff(entries, "required_mechanics_changed", before.requiredMechanics, after.requiredMechanics, cardId, "Required mechanics changed.", "blocking");
    pushDiff(entries, "resolver_ref_changed", before.resolverRef, after.resolverRef, cardId, "Resolver reference changed.", "blocking");
    pushDiff(entries, "ability_refs_changed", before.abilityRefs, after.abilityRefs, cardId, "Ability references changed.", "blocking");
    pushDiff(entries, "ai_hints_changed", before.aiHintsRef, after.aiHintsRef, cardId, "AI hint reference changed.", "review_required");
    pushDiff(entries, "review_status_changed", before.review, after.review, cardId, "Review status changed.", "review_required");
  }
  return {
    schemaVersion: "card-pipeline-diff-v1.3.1",
    fromSnapshotId: from.snapshotId,
    toSnapshotId: to.snapshotId,
    fromHash: from.hash,
    toHash: to.hash,
    entries
  };
}

export function createPipelineRollbackReport(from: CardPipelineSnapshot, to: CardPipelineSnapshot): PipelineRollbackReport {
  return {
    schemaVersion: "card-pipeline-rollback-v1.3.1",
    fromSnapshotId: from.snapshotId,
    toSnapshotId: to.snapshotId,
    fromHash: from.hash,
    toHash: to.hash,
    matchSnapshotsUntouched: true,
    replayStateHashUntouched: true,
    privateAssetsUntouched: true,
    summary: `Rollback switches active card pipeline data from ${from.snapshotId} to ${to.snapshotId}; match snapshots, replay StateHash data and private assets are not rewritten.`
  };
}

export function createCardPipelineReport(snapshot: CardPipelineSnapshot, hints: AiCardHintsV2): CardPipelineReport {
  const validation = validateCardPipelineSnapshot(snapshot, hints);
  const hinted = new Set(hints.cards.map((hint) => hint.cardId));
  return {
    schemaVersion: "card-pipeline-report-v1.3.1",
    reportId: "card-pipeline-report-1.3.1",
    snapshotId: snapshot.snapshotId,
    snapshotHash: snapshot.hash,
    pipelineVersion: "1.3.1",
    statusSummary: summarizeStatuses(snapshot.cards),
    blockedCards: snapshot.cards
      .filter((card) => card.statuses.blocked || validation.errors.some((error) => error.includes(card.catalogCardId)))
      .map((card) => ({
        cardId: card.catalogCardId,
        reasons: [
          ...("blockReasons" in card ? [] : []),
          ...validation.errors.filter((error) => error.includes(card.catalogCardId))
        ]
      })),
    missingMechanics: snapshot.cards.filter((card) => card.statuses.human_playable && card.requiredMechanics.length === 0).map((card) => card.catalogCardId),
    missingResolvers: snapshot.cards.filter((card) => card.statuses.engine_supported && (!card.resolverRef || card.abilityRefs.length === 0)).map((card) => card.catalogCardId),
    missingTests: snapshot.cards
      .filter((card) => card.statuses.human_playable && card.review.cardData !== "reviewed")
      .map((card) => card.catalogCardId),
    missingAiHints: snapshot.cards.filter((card) => card.statuses.ai_supported && !hinted.has(card.catalogCardId)).map((card) => card.catalogCardId),
    noScopeAssertions: {
      noCardTextParser: true,
      noAutomaticPlayability: true,
      noNewCardRelease: true,
      noNewMechanics: true,
      noOfficialAssets: true,
      noPublicPlatformFeatures: true
    }
  };
}

export function assertPipelinePayloadSafe(payload: unknown): CatalogValidationResult {
  const serialized = stableStringify(payload);
  const errors = FORBIDDEN_PIPELINE_PAYLOAD_PATTERNS.filter((pattern) => pattern.test(serialized)).map((pattern) => `Pipeline payload contains forbidden pattern ${pattern.source}.`);
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
  const baseSnapshot = snapshotData as unknown as CardSnapshot;
  const localOnrSnapshot = readLocalOnrSnapshot();
  const baseCards = applyRuntimeBaseStatusModel(baseSnapshot.cards);
  if (!localOnrSnapshot) return { ...baseSnapshot, cards: baseCards };
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
    cards: [...baseCards, ...v105kCards]
  };
}

export function createRuntimeCardsById(): Record<string, CatalogCard> {
  const snapshot = createRuntimeCardSnapshot();
  return Object.fromEntries(snapshot.cards.map((card) => [card.catalogCardId, card]));
}

function toPipelineCard(card: CatalogCard, aiHints?: AiCardHintsV2): PipelineCard {
  const statuses = normalizeStatuses(card.statuses);
  statuses.engine_supported = statuses.engine_supported || Boolean(statuses.implemented && statuses.playable);
  statuses.human_playable = statuses.human_playable || Boolean(statuses.engine_supported && statuses.playable && statuses.deck_legal);
  statuses.format_legal = statuses.format_legal || Boolean(statuses.human_playable && statuses.deck_legal);
  const requiredMechanics = statuses.implemented ? requiredMechanicsForCard(card) : [];
  const engineSupported = statuses.engine_supported;
  const aiHint = aiHints?.cards.find((hint) => hint.cardId === card.catalogCardId);
  return {
    catalogCardId: card.catalogCardId,
    sourceCardId: card.sourceCardId,
    engineCardId: card.engineCardId,
    title: card.title,
    side: card.side,
    type: card.type,
    subtypes: [...card.subtypes].sort((left, right) => left.localeCompare(right)),
    faction: card.faction,
    text: card.text,
    displayOnlyText: card.displayOnlyText,
    numeric: { ...card.numeric },
    statuses,
    requiredMechanics,
    resolverRef: engineSupported && card.engineCardId ? `engine:${card.engineCardId}` : null,
    abilityRefs: engineSupported && card.engineCardId ? abilityRefsForCard(card) : [],
    aiHintsRef: aiHint ? `ai-hints-v1.3.1:${aiHint.cardId}` : null,
    review: {
      cardData: card.statuses.validated ? "reviewed" : "unreviewed",
      mechanics: requiredMechanics.length > 0 || !statuses.human_playable ? "reviewed" : "blocked",
      resolver: !engineSupported || card.engineCardId ? "reviewed" : "blocked",
      aiHints: statuses.ai_supported ? (aiHint ? "reviewed" : "blocked") : aiHint ? "reviewed" : "unreviewed"
    }
  };
}

function normalizeStatuses(statuses: Partial<Record<CatalogStatusKey, boolean>>): CatalogStatuses {
  return Object.fromEntries(CATALOG_STATUS_KEYS.map((key) => [key, Boolean(statuses[key])])) as CatalogStatuses;
}

function requiredMechanicsForCard(card: CatalogCard): string[] {
  const mechanics = new Set<string>();
  if (card.type === "identity") mechanics.add("identity_setup");
  if (card.type === "event") mechanics.add("play_event");
  if (card.type === "operation") mechanics.add("play_operation");
  if (card.type === "program") {
    mechanics.add("install_program");
    mechanics.add("memory");
  }
  if (card.type === "hardware") mechanics.add("install_hardware");
  if (card.type === "resource") mechanics.add("install_resource");
  if (card.type === "agenda") {
    mechanics.add("install_remote");
    mechanics.add("advance");
    mechanics.add("score");
    mechanics.add("steal");
  }
  if (card.type === "asset" || card.type === "upgrade") {
    mechanics.add("install_remote");
    mechanics.add("rez_card");
    mechanics.add("trash_on_access");
  }
  if (card.type === "ice") {
    mechanics.add("install_ice");
    mechanics.add("rez_ice");
    mechanics.add("encounter_ice");
  }
  for (const subtype of card.subtypes) {
    const normalized = subtype.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (normalized) mechanics.add(`subtype_${normalized}`);
  }
  if (card.numeric.agendaPoints !== null) mechanics.add("agenda_points");
  if (card.numeric.advancementRequirement !== null) mechanics.add("advancement_requirement");
  if (card.numeric.trashCost !== null) mechanics.add("trash_cost");
  return [...mechanics].sort((left, right) => left.localeCompare(right));
}

function abilityRefsForCard(card: CatalogCard): string[] {
  if (!card.engineCardId) return [];
  const refs = [`${card.engineCardId}:resolver_contract`];
  if (card.type === "ice") refs.push(`${card.engineCardId}:subroutine_contract`);
  if (card.type === "program") refs.push(`${card.engineCardId}:ability_contract`);
  if (card.type === "agenda") refs.push(`${card.engineCardId}:score_steal_contract`);
  return refs.sort((left, right) => left.localeCompare(right));
}

function planRolesFor(roles: string[], card: PipelineCard): string[] {
  const planRoles = new Set<string>();
  for (const role of roles) {
    if (role.includes("economy")) planRoles.add(card.side === "corp" ? "recover_economy" : "recover_economy");
    if (role.includes("draw")) planRoles.add(card.side === "runner" ? "draw_for_answers" : "recover_economy");
    if (role.includes("run_pressure")) planRoles.add("pressure_rnd");
    if (role.includes("breaker")) planRoles.add("build_rig");
    if (role.includes("agenda") || role.includes("score_plan")) planRoles.add(card.side === "corp" ? "score_next_turn" : "contest_remote");
    if (role.includes("ice")) planRoles.add(card.side === "corp" ? "protect_rnd" : "safe_probe_run");
    if (role.includes("asset")) planRoles.add(card.side === "corp" ? "bait_runner" : "trash_asset");
  }
  if (planRoles.size === 0) planRoles.add(card.side === "corp" ? "recover_economy" : "safe_probe_run");
  return [...planRoles].sort((left, right) => left.localeCompare(right));
}

function valueHintsFor(roles: string[], card: PipelineCard): Record<string, number> {
  const values: Record<string, number> = {};
  if (roles.some((role) => role.includes("economy"))) values.economy = 3;
  if (roles.some((role) => role.includes("draw"))) values.cardFlow = 2;
  if (roles.some((role) => role.includes("run") || role.includes("breaker"))) values.runPressure = 2;
  if (roles.some((role) => role.includes("agenda") || role.includes("score"))) values.scoring = card.side === "corp" ? 4 : 3;
  if (roles.some((role) => role.includes("ice"))) values.defense = 3;
  if (Object.keys(values).length === 0) values.utility = 1;
  return values;
}

function pushDiff(
  entries: PipelineDiffEntry[],
  category: PipelineDiffCategory,
  before: unknown,
  after: unknown,
  cardId: string,
  summary: string,
  severity: PipelineDiffSeverity
): void {
  if (stableStringify(before) === stableStringify(after)) return;
  entries.push({ category, severity, cardId, summary });
}

function statusDiffSeverity(before: PipelineCard, after: PipelineCard): PipelineDiffSeverity {
  const promoted =
    (!before.statuses.human_playable && after.statuses.human_playable) ||
    (!before.statuses.deck_legal && after.statuses.deck_legal) ||
    (!before.statuses.format_legal && after.statuses.format_legal) ||
    (!before.statuses.ai_supported && after.statuses.ai_supported);
  return promoted ? "blocking" : "review_required";
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

function applyRuntimeBaseStatusModel(cards: CatalogCard[]): CatalogCard[] {
  return cards.map((card) => {
    const engineSupported = Boolean(card.statuses.implemented && card.statuses.playable);
    const humanPlayable = Boolean(engineSupported && card.statuses.deck_legal);
    return {
      ...card,
      subtypes: [...card.subtypes],
      numeric: { ...card.numeric },
      statuses: {
        ...card.statuses,
        engine_supported: card.statuses.engine_supported ?? engineSupported,
        human_playable: card.statuses.human_playable ?? humanPlayable,
        ai_supported: card.statuses.ai_supported ?? humanPlayable,
        format_legal: card.statuses.format_legal ?? humanPlayable
      }
    };
  });
}

function promoteOnrRuntimeReleaseCard(card: CatalogCard): CatalogCard {
  const isV123 = ONR_V1_2_3_RELEASE_CARD_ID_SET.has(card.catalogCardId);
  const isV112K = ONR_V1_1_2K_RELEASE_CARD_ID_SET.has(card.catalogCardId);
  const isV106K = ONR_V1_0_6K_RELEASE_CARD_ID_SET.has(card.catalogCardId);
  const textOverrides = isV123 ? ONR_V1_2_3_TEXT_OVERRIDES : isV112K ? ONR_V1_1_2K_TEXT_OVERRIDES : isV106K ? ONR_V1_0_6K_TEXT_OVERRIDES : ONR_V1_0_5K_TEXT_OVERRIDES;
  const numericOverrides = isV123 ? ONR_V1_2_3_NUMERIC_OVERRIDES : isV112K ? ONR_V1_1_2K_NUMERIC_OVERRIDES : isV106K ? ONR_V1_0_6K_NUMERIC_OVERRIDES : ONR_V1_0_5K_NUMERIC_OVERRIDES;
  const manifest = isV123 ? ONR_V1_2_3_RELEASE_MANIFEST : isV112K ? ONR_V1_1_2K_RELEASE_MANIFEST : isV106K ? ONR_V1_0_6K_RELEASE_MANIFEST : ONR_V1_0_5K_RELEASE_MANIFEST;
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
      engine_supported: true,
      playable: true,
      human_playable: true,
      ai_supported: DECK_LEGAL_AI_APPROVED_CARD_ID_SET.has(card.catalogCardId),
      deck_legal: true,
      format_legal: true,
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
      engine_supported: false,
      playable: false,
      human_playable: false,
      ai_supported: false,
      deck_legal: false,
      format_legal: false
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
