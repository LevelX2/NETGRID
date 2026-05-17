import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type {
  CardSnapshot,
  CatalogCard,
  CatalogCardType,
  CatalogNumericFields,
  CatalogRarity,
  CatalogRarityCode,
  CatalogSide,
  CatalogStatuses,
} from "./catalog-types";

export const PROTEUS_SOURCE_ID = "onr-proteus-spoiler";
export const PROTEUS_SET_ID = "onr-proteus";
export const PROTEUS_SET_NAME = "O:NR Proteus";
export const PROTEUS_CARD_BASIS_SNAPSHOT_ID =
  "proteus-card-basis-2026-05-17";
export const PROTEUS_SOURCE_REGISTRY_ID =
  "source-registry-proteus-2026-05-17";
export const PROTEUS_EXPECTED_TOTAL = 154;
export const PROTEUS_RARITY_CODES = [
  "common",
  "uncommon",
  "rare",
  "vital",
] as const satisfies readonly CatalogRarityCode[];
export const PROTEUS_RARITY_LABELS: Record<
  CatalogRarityCode,
  { labelDe: string; labelEn: string }
> = {
  common: { labelDe: "Häufig", labelEn: "Common" },
  uncommon: { labelDe: "Ungewöhnlich", labelEn: "Uncommon" },
  rare: { labelDe: "Selten", labelEn: "Rare" },
  vital: { labelDe: "Vital", labelEn: "Vital" },
};

export type ProteusParsedCard = {
  sourceIndex: number;
  sourceLine: number;
  title: string;
  side: CatalogSide;
  type: CatalogCardType;
  subtypes: string[];
  text: string;
  rarity: CatalogRarityCode;
  numeric: CatalogNumericFields;
  rawType: string;
  rawNumericValue: string;
};

export type ProteusNonNormalizableField = {
  sourceIndex: number;
  title: string;
  field: keyof CatalogNumericFields;
  rawValue: string;
  note: string;
};

export type ProteusSpoilerParseResult = {
  cards: CatalogCard[];
  parsedCards: ProteusParsedCard[];
  nonNormalizableFields: ProteusNonNormalizableField[];
  unknownTypeValues: Array<{ sourceIndex: number; title: string; rawType: string }>;
  unknownRarityValues: Array<{ sourceIndex: number; title: string; rawValue: string }>;
};

export type ProteusSpoilerImportReport = {
  schemaVersion: "proteus-spoiler-import-report-v1";
  sourceId: typeof PROTEUS_SOURCE_ID;
  sourcePath: "docs/source/Proteusspoiler.txt";
  snapshotId: typeof PROTEUS_CARD_BASIS_SNAPSHOT_ID;
  totalCards: number;
  expectedTotalCards: typeof PROTEUS_EXPECTED_TOTAL;
  sideCounts: Record<CatalogSide, number>;
  typeCounts: Partial<Record<CatalogCardType, number>>;
  rarityCounts: Record<CatalogRarityCode, number>;
  sourceHeaderNotes: string[];
  nonNormalizableFields: ProteusNonNormalizableField[];
  unknownTypeValues: Array<{ sourceIndex: number; title: string; rawType: string }>;
  unknownRarityValues: Array<{ sourceIndex: number; title: string; rawValue: string }>;
  noScopeAssertions: {
    noRuntimeResolvers: true;
    noAutomaticPlayability: true;
    noDeckLegality: true;
    noAiSupport: true;
    noOfficialAssets: true;
  };
};

type MutableCardDraft = {
  sourceIndex: number;
  sourceLine: number;
  title: string;
  side: CatalogSide;
  rawType: string;
  textLines: string[];
};

export function readProjectProteusSpoilerSource(cwd = process.cwd()): string {
  const filePath = projectSourcePathCandidates(
    cwd,
    path.join("docs", "source", "Proteusspoiler.txt"),
  ).find((candidate) => existsSync(candidate));
  if (!filePath) throw new Error("Proteusspoiler.txt not found.");
  return readFileSync(filePath, "utf8");
}

export function createProteusCardBasisSnapshot(
  sourceText = readProjectProteusSpoilerSource(),
): CardSnapshot {
  return {
    schemaVersion: "card-snapshot-v0.5",
    snapshotId: PROTEUS_CARD_BASIS_SNAPSHOT_ID,
    status: "proteus_imported_blocked_planning_only",
    createdAt: "2026-05-17T00:00:00.000+02:00",
    sourceRegistryId: PROTEUS_SOURCE_REGISTRY_ID,
    copyrightNote:
      "Proteus-Spoilerdaten sind versionierte Planungs- und Reviewdaten. Sie erzeugen keine Spielbarkeit, Decklegalität, Runtime-Resolver, KI-Freigabe oder Assetfreigabe.",
    normalization: {
      algorithm: "proteus-spoiler-parser-v1",
      sortOrder: ["sourceIndex"],
      textPolicy:
        "display_only_spoiler_text; card text is not a rules parser or resolver contract",
      assetPolicy:
        "no official Proteus artwork, frames, logos, backs, or public asset dependencies",
    },
    cards: parseProteusSpoilerSource(sourceText).cards,
  };
}

export function createProteusSpoilerImportReport(
  sourceText = readProjectProteusSpoilerSource(),
): ProteusSpoilerImportReport {
  const result = parseProteusSpoilerSource(sourceText);
  return {
    schemaVersion: "proteus-spoiler-import-report-v1",
    sourceId: PROTEUS_SOURCE_ID,
    sourcePath: "docs/source/Proteusspoiler.txt",
    snapshotId: PROTEUS_CARD_BASIS_SNAPSHOT_ID,
    totalCards: result.cards.length,
    expectedTotalCards: PROTEUS_EXPECTED_TOTAL,
    sideCounts: countBy(result.parsedCards, (card) => card.side, {
      corp: 0,
      runner: 0,
    }),
    typeCounts: countBy(result.parsedCards, (card) => card.type, {}),
    rarityCounts: countBy(result.parsedCards, (card) => card.rarity, {
      common: 0,
      uncommon: 0,
      rare: 0,
      vital: 0,
    }),
    sourceHeaderNotes: createProteusSourceHeaderNotes(result.parsedCards),
    nonNormalizableFields: result.nonNormalizableFields,
    unknownTypeValues: result.unknownTypeValues,
    unknownRarityValues: result.unknownRarityValues,
    noScopeAssertions: {
      noRuntimeResolvers: true,
      noAutomaticPlayability: true,
      noDeckLegality: true,
      noAiSupport: true,
      noOfficialAssets: true,
    },
  };
}

export function parseProteusSpoilerSource(
  sourceText: string,
): ProteusSpoilerParseResult {
  const drafts: MutableCardDraft[] = [];
  const lines = sourceText.replace(/\r\n/g, "\n").split("\n");
  let currentSide: CatalogSide | null = null;
  let current: MutableCardDraft | null = null;

  const finishCurrent = () => {
    if (current) drafts.push(current);
    current = null;
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const inferredSide = inferSide(line);
    if (inferredSide) currentSide = inferredSide;

    const header = parseCardHeader(line);
    if (header) {
      finishCurrent();
      if (!currentSide) {
        throw new Error(`Card ${header.title} has no side context.`);
      }
      current = {
        sourceIndex: drafts.length + 1,
        sourceLine: lineNumber,
        title: header.title,
        side: currentSide,
        rawType: header.rawType,
        textLines: [],
      };
      return;
    }

    if (!current) return;
    const text = parseCardTextLine(line);
    if (text !== null) {
      current.textLines.push(text);
      return;
    }
    const numericMarker = parseNumericMarker(line);
    if (numericMarker) {
      current.textLines.push(`__NUMERIC__${numericMarker.kind}:${numericMarker.value}`);
      finishCurrent();
      return;
    }
    if (line.trim() && !line.match(/^\d+$/)) current.textLines.push(line.trim());
  });
  finishCurrent();

  const nonNormalizableFields: ProteusNonNormalizableField[] = [];
  const unknownTypeValues: ProteusSpoilerParseResult["unknownTypeValues"] = [];
  const unknownRarityValues: ProteusSpoilerParseResult["unknownRarityValues"] = [];
  const parsedCards: ProteusParsedCard[] = [];
  const cards = drafts.map((draft) => {
    const typeInfo = parseProteusType(draft.rawType);
    if (!typeInfo) {
      unknownTypeValues.push({
        sourceIndex: draft.sourceIndex,
        title: draft.title,
        rawType: draft.rawType,
      });
    }
    const numericLine = draft.textLines.find((line) =>
      line.startsWith("__NUMERIC__"),
    );
    const numeric = parseProteusNumericFields(
      numericLine ?? "",
      typeInfo?.type ?? "event",
      draft,
      nonNormalizableFields,
    );
    const rarityRaw = extractRarity(numericLine ?? "");
    const rarity = createProteusCatalogRarity(rarityRaw);
    if (!rarity) {
      unknownRarityValues.push({
        sourceIndex: draft.sourceIndex,
        title: draft.title,
        rawValue: rarityRaw ?? "",
      });
    }
    const text = normalizeTextLines(
      draft.textLines.filter((line) => !line.startsWith("__NUMERIC__")),
    );
    const catalogCard: CatalogCard = {
      catalogCardId: proteusCatalogCardId(draft.sourceIndex, draft.title),
      sourceCardId: `${PROTEUS_SOURCE_ID}:P${String(draft.sourceIndex).padStart(3, "0")}`,
      engineCardId: null,
      title: draft.title,
      side: draft.side,
      type: typeInfo?.type ?? "event",
      subtypes: typeInfo?.subtypes ?? [],
      faction: "onr_proteus",
      setId: PROTEUS_SET_ID,
      setName: PROTEUS_SET_NAME,
      collectorNumber: `P${String(draft.sourceIndex).padStart(3, "0")}`,
      text,
      displayOnlyText: true,
      ...(rarity ? { rarity } : {}),
      numeric,
      statuses: proteusBlockedStatuses(),
      blockReasons: [
        "Proteus planning import only: no runtime resolver, release gate, deck legality, or AI support.",
      ],
      implementationManifest: null,
    };
    parsedCards.push({
      sourceIndex: draft.sourceIndex,
      sourceLine: draft.sourceLine,
      title: draft.title,
      side: draft.side,
      type: catalogCard.type,
      subtypes: catalogCard.subtypes,
      text,
      rarity: rarity?.code ?? "common",
      numeric,
      rawType: draft.rawType,
      rawNumericValue: numericLine?.replace("__NUMERIC__", "") ?? "",
    });
    return catalogCard;
  });

  return {
    cards,
    parsedCards,
    nonNormalizableFields,
    unknownTypeValues,
    unknownRarityValues,
  };
}

function parseCardHeader(
  line: string,
): { title: string; rawType: string } | null {
  const marker = line.match(/Card Title:\s*/i);
  const typeMarker = line.match(/\bCard\s+Type:\s*/i);
  if (!marker || marker.index === undefined || !typeMarker?.index) return null;
  const title = line
    .slice(marker.index + marker[0].length, typeMarker.index)
    .replace(/\s+/g, " ")
    .trim();
  const rawType = line
    .slice(typeMarker.index + typeMarker[0].length)
    .replace(/\s+/g, " ")
    .trim();
  return title && rawType ? { title, rawType } : null;
}

function parseCardTextLine(line: string): string | null {
  const marker = line.match(/Card Text:\s*/i);
  if (!marker || marker.index === undefined) return null;
  return line.slice(marker.index + marker[0].length).trim();
}

function parseNumericMarker(
  line: string,
): { kind: "agenda" | "cost_strength" | "cost_trash" | "cost"; value: string } | null {
  const trimmed = line.trim();
  const patterns = [
    { kind: "agenda" as const, regex: /^Diff\.\/Agenda:\s*(.+)$/i },
    { kind: "cost_strength" as const, regex: /^Cost\/Strength:\s*(.+)$/i },
    { kind: "cost_trash" as const, regex: /^Cost\/Trash:\s*(.+)$/i },
    { kind: "cost" as const, regex: /^Cost:\s*(.+)$/i },
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern.regex);
    if (match?.[1]) return { kind: pattern.kind, value: match[1] };
  }
  return null;
}

function parseProteusType(
  rawType: string,
): { type: CatalogCardType; subtypes: string[] } | null {
  const parts = rawType
    .split("-")
    .map((part) => part.trim())
    .filter(Boolean);
  const primary = parts[0]?.toLowerCase().replace(/\s+/g, " ");
  const type = proteusPrimaryType(primary ?? "");
  if (!type) return null;
  const subtypes = parts
    .slice(1)
    .flatMap((part) => {
      const memoryMatch = part.match(/^(\d+)\s*MU$/i);
      return memoryMatch ? [] : [normalizeSubtype(part)];
    })
    .filter((subtype) => subtype.length > 0);
  if (primary === "node") subtypes.unshift("node");
  return { type, subtypes: uniqueStrings(subtypes) };
}

function parseProteusNumericFields(
  numericLine: string,
  type: CatalogCardType,
  draft: MutableCardDraft,
  nonNormalizableFields: ProteusNonNormalizableField[],
): CatalogNumericFields {
  const numeric = emptyNumericFields();
  const raw = numericLine.replace("__NUMERIC__", "");
  const separatorIndex = raw.indexOf(":");
  const kind = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : "";
  const value = separatorIndex >= 0 ? raw.slice(separatorIndex + 1) : "";
  const beforeArtist = (value.split(/\bArtist:/i)[0] ?? "").trim();
  const pair = splitNumericPair(beforeArtist);

  if (kind === "agenda") {
    numeric.advancementRequirement = parseNumericToken(
      pair[0],
      "advancementRequirement",
      draft,
      nonNormalizableFields,
    );
    numeric.agendaPoints = parseNumericToken(
      pair[1],
      "agendaPoints",
      draft,
      nonNormalizableFields,
    );
  } else if (kind === "cost_strength") {
    if (type === "ice") {
      numeric.rezCost = parseNumericToken(
        pair[0],
        "rezCost",
        draft,
        nonNormalizableFields,
      );
    } else {
      numeric.installCost = parseNumericToken(
        pair[0],
        "installCost",
        draft,
        nonNormalizableFields,
      );
      numeric.memoryCost = parseMemoryCost(draft.rawType);
    }
    numeric.strength = parseNumericToken(
      pair[1],
      "strength",
      draft,
      nonNormalizableFields,
    );
  } else if (kind === "cost_trash") {
    numeric.rezCost = parseNumericToken(
      pair[0],
      "rezCost",
      draft,
      nonNormalizableFields,
    );
    numeric.trashCost = parseNumericToken(
      pair[1],
      "trashCost",
      draft,
      nonNormalizableFields,
    );
  } else if (kind === "cost") {
    const cost = parseNumericToken(
      beforeArtist,
      type === "operation" || type === "event" ? "cost" : "installCost",
      draft,
      nonNormalizableFields,
    );
    if (type === "operation" || type === "event") numeric.cost = cost;
    else numeric.installCost = cost;
  }
  return numeric;
}

function splitNumericPair(value: string): [string, string] {
  const match = value.match(/^\s*([^/]+?)\s*\/\s*(.+?)\s*$/);
  return [match?.[1]?.trim() ?? value.trim(), match?.[2]?.trim() ?? ""];
}

function parseNumericToken(
  token: string | undefined,
  field: keyof CatalogNumericFields,
  draft: MutableCardDraft,
  nonNormalizableFields: ProteusNonNormalizableField[],
): number | null {
  const rawValue = (token ?? "")
    .replace(/\bT\b/gi, "")
    .replace(/\[[^\]]+\]/g, "")
    .trim();
  if (!rawValue || /^n\/?a$/i.test(rawValue)) return null;
  if (/^x$/i.test(rawValue)) {
    nonNormalizableFields.push({
      sourceIndex: draft.sourceIndex,
      title: draft.title,
      field,
      rawValue,
      note: "Variable numeric value; resolver contract must define runtime value.",
    });
    return null;
  }
  const match = rawValue.match(/^-?\d+$/);
  if (match) return Number(rawValue);
  nonNormalizableFields.push({
    sourceIndex: draft.sourceIndex,
    title: draft.title,
    field,
    rawValue,
    note: "Unparsed numeric source value; requires manual review.",
  });
  return null;
}

function parseMemoryCost(rawType: string): number | null {
  const match = rawType.match(/(\d+)\s*MU/i);
  return match?.[1] ? Number(match[1]) : null;
}

function extractRarity(numericLine: string): string | null {
  const match = numericLine.match(/\bRarity:\s*([A-Za-z]+)/i);
  return match?.[1]?.trim() ?? null;
}

function proteusPrimaryType(primary: string): CatalogCardType | null {
  if (primary === "agenda") return "agenda";
  if (primary === "ice") return "ice";
  if (primary === "operation") return "operation";
  if (primary === "node") return "asset";
  if (primary === "upgrade") return "upgrade";
  if (primary === "program") return "program";
  if (primary === "prep") return "event";
  if (primary === "resource") return "resource";
  if (primary === "hardware") return "hardware";
  return null;
}

function inferSide(line: string): CatalogSide | null {
  const normalized = line.trim().toLowerCase();
  if (normalized === "corporation cards") return "corp";
  if (normalized === "runner cards") return "runner";
  return null;
}

function normalizeTextLines(lines: string[]): string {
  return lines
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function normalizeSubtype(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/™|\[tm\]|\(tm\)/gi, " tm ")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function proteusCatalogCardId(sourceIndex: number, title: string): string {
  return `onr_proteus_${String(sourceIndex).padStart(3, "0")}_${slugTitle(title)}`;
}

function slugTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/™|\[tm\]|\(tm\)/gi, " tm ")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function proteusBlockedStatuses(): CatalogStatuses {
  return {
    imported: true,
    validated: true,
    catalog_ready: true,
    implemented: false,
    engine_supported: false,
    playable: false,
    human_playable: false,
    ai_supported: false,
    deck_legal: false,
    format_legal: false,
    blocked: true,
  };
}

function emptyNumericFields(): CatalogNumericFields {
  return {
    cost: null,
    installCost: null,
    memoryCost: null,
    strength: null,
    rezCost: null,
    trashCost: null,
    advancementRequirement: null,
    agendaPoints: null,
  };
}

function countBy<T, K extends string>(
  entries: readonly T[],
  keyFor: (entry: T) => K,
  seed: Record<K, number> | Partial<Record<K, number>>,
): Record<K, number> {
  const counts = { ...seed } as Record<K, number>;
  for (const entry of entries) {
    const key = keyFor(entry);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function createProteusSourceHeaderNotes(
  cards: readonly ProteusParsedCard[],
): string[] {
  const typeCounts = countBy(cards, (card) => card.type, {});
  const notes: string[] = [];
  if ((typeCounts.event ?? 0) !== 26 || (typeCounts.hardware ?? 0) !== 7) {
    notes.push(
      "Source header states 26 Prep and 7 Hardware, while card rows parse as 27 Prep/Event and 6 Hardware. Runner total remains 77.",
    );
  }
  if (((typeCounts.resource ?? 0) + (typeCounts.hardware ?? 0)) !== 28) {
    notes.push(
      "Source header states 28 Hardware/Resources rows, while card rows parse as 27 Hardware/Resources.",
    );
  }
  return notes;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function projectSourcePathCandidates(cwd: string, relativePath: string): string[] {
  return Array.from(
    new Set([
      path.resolve(cwd, relativePath),
      path.resolve(cwd, "..", relativePath),
      path.resolve(cwd, "..", "..", relativePath),
    ]),
  );
}

export function proteusRarityCodes(): readonly CatalogRarityCode[] {
  return PROTEUS_RARITY_CODES;
}

function createProteusCatalogRarity(
  sourceValue: string | null | undefined,
): CatalogRarity | null {
  const code = normalizeProteusRarityCode(sourceValue);
  if (!code) return null;
  const labels = PROTEUS_RARITY_LABELS[code];
  return {
    code,
    labelDe: labels.labelDe,
    labelEn: labels.labelEn,
    sourceValue: (sourceValue ?? "").trim(),
    sourceId: PROTEUS_SOURCE_ID,
  };
}

function normalizeProteusRarityCode(
  value: string | null | undefined,
): CatalogRarityCode | null {
  const key = (value ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (key === "c" || key === "common") return "common";
  if (key === "u" || key === "uncommon") return "uncommon";
  if (key === "r" || key === "rare") return "rare";
  if (key === "v" || key === "vital") return "vital";
  return null;
}
