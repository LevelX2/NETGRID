import type {
  CardDefinitionNumericFields,
  PlayCostDefinition,
  ResolvedStrengthDefinition,
  VariableXPlayCostDefinition,
} from "@netgrid/shared";

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

export type CatalogRarityCode = "common" | "uncommon" | "rare" | "vital";

export type CatalogRarity = {
  code: CatalogRarityCode;
  labelDe: string;
  labelEn: string;
  sourceValue: string;
  sourceId: string;
};

export type CatalogNumericFields = CardDefinitionNumericFields;

export type CatalogPlayCost = PlayCostDefinition;
export type CatalogVariableXPlayCost = VariableXPlayCostDefinition;

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
  printingId: string;
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
  rarity?: CatalogRarity;
  numeric: CatalogNumericFields;
  playCost: CatalogPlayCost | null;
  strengthModel: ResolvedStrengthDefinition;
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
  | "catalogCardId"
  | "printingId"
  | "title"
  | "side"
  | "type"
  | "subtypes"
  | "faction"
  | "setId"
  | "rarity"
  | "statuses"
  | "blockReasons"
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
