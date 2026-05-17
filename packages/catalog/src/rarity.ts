import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type {
  CatalogRarity,
  CatalogRarityCode,
  CatalogSide,
} from "./catalog-types";

export const CATALOG_RARITY_CODES = [
  "common",
  "uncommon",
  "rare",
  "vital",
] as const satisfies readonly CatalogRarityCode[];

export const CATALOG_RARITY_LABELS: Record<
  CatalogRarityCode,
  { labelDe: string; labelEn: string }
> = {
  common: { labelDe: "Häufig", labelEn: "Common" },
  uncommon: { labelDe: "Ungewöhnlich", labelEn: "Uncommon" },
  rare: { labelDe: "Selten", labelEn: "Rare" },
  vital: { labelDe: "Vital", labelEn: "Vital" },
};

export type CardRaritySpoilerSource = {
  sourceId: string;
  setId: string;
  side?: CatalogSide;
  text: string;
};

export type ProjectCardRaritySourceDefinition = {
  sourceId: string;
  setId: string;
  relativePath: string;
  side?: CatalogSide;
};

export type CardRaritySpoilerEntry = {
  sourceId: string;
  setId: string;
  title: string;
  side: CatalogSide;
  rawValue: string;
  rarity: CatalogRarity;
  lineNumber: number;
};

export type CardRarityUnknownValue = {
  sourceId: string;
  setId: string;
  title: string;
  side: CatalogSide | null;
  rawValue: string;
  lineNumber: number;
};

export type CardRaritySourceReport = {
  sourceId: string;
  setId: string;
  totalEntries: number;
  countsByRarity: Record<CatalogRarityCode, number>;
};

export type CardRarityImportReport = {
  schemaVersion: "card-rarity-import-report-v1";
  totalEntries: number;
  countsByRarity: Record<CatalogRarityCode, number>;
  sources: CardRaritySourceReport[];
  unknownValues: CardRarityUnknownValue[];
};

export const PROJECT_CARD_RARITY_SOURCE_DEFINITIONS = [
  {
    sourceId: "onr-v1-limited-corp-spoiler",
    setId: "onr-v1-limited",
    relativePath: path.join("docs", "source", "Corpspoiler 1.0.txt"),
    side: "corp",
  },
  {
    sourceId: "onr-v1-limited-runner-spoiler",
    setId: "onr-v1-limited",
    relativePath: path.join("docs", "source", "Runnerspoiler 1.0.txt"),
    side: "runner",
  },
  {
    sourceId: "onr-proteus-spoiler",
    setId: "onr-proteus",
    relativePath: path.join("docs", "source", "Proteusspoiler.txt"),
  },
  {
    sourceId: "onr-classic-spoiler",
    setId: "onr-classic",
    relativePath: path.join("docs", "source", "Classicspoiler.txt"),
  },
] as const satisfies readonly ProjectCardRaritySourceDefinition[];

export function normalizeCatalogRarityCode(
  value: string | null | undefined,
): CatalogRarityCode | null {
  const key = (value ?? "").trim().toLowerCase().replace(/[^a-z]/g, "");
  if (key === "c" || key === "common") return "common";
  if (key === "u" || key === "uncommon") return "uncommon";
  if (key === "r" || key === "rare") return "rare";
  if (key === "v" || key === "vital") return "vital";
  return null;
}

export function createCatalogRarity(
  sourceValue: string | null | undefined,
  sourceId: string,
): CatalogRarity | null {
  const code = normalizeCatalogRarityCode(sourceValue);
  if (!code) return null;
  const labels = CATALOG_RARITY_LABELS[code];
  return {
    code,
    labelDe: labels.labelDe,
    labelEn: labels.labelEn,
    sourceValue: (sourceValue ?? "").trim(),
    sourceId,
  };
}

export function parseCardRaritySpoilerSource(
  source: CardRaritySpoilerSource,
): { entries: CardRaritySpoilerEntry[]; unknownValues: CardRarityUnknownValue[] } {
  const entries: CardRaritySpoilerEntry[] = [];
  const unknownValues: CardRarityUnknownValue[] = [];
  const lines = source.text.replace(/\r\n/g, "\n").split("\n");
  let currentSide: CatalogSide | null = source.side ?? null;
  let currentTitle: string | null = null;
  let currentTitleLine = 0;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const inferredSide = inferSideFromSpoilerLine(line);
    if (inferredSide) currentSide = inferredSide;

    const title = extractCardTitle(line);
    if (title) {
      currentTitle = title;
      currentTitleLine = lineNumber;
    }

    const rarityMatch = line.match(/\bRarity:\s*([A-Za-z]+)/i);
    if (!rarityMatch?.[1] || !currentTitle) return;
    const rawValue = rarityMatch[1].trim();
    const rarity = createCatalogRarity(rawValue, source.sourceId);
    if (!rarity || !currentSide) {
      unknownValues.push({
        sourceId: source.sourceId,
        setId: source.setId,
        title: currentTitle,
        side: currentSide,
        rawValue,
        lineNumber,
      });
      currentTitle = null;
      return;
    }

    entries.push({
      sourceId: source.sourceId,
      setId: source.setId,
      title: currentTitle,
      side: currentSide,
      rawValue,
      rarity,
      lineNumber: currentTitleLine || lineNumber,
    });
    currentTitle = null;
  });

  return { entries, unknownValues };
}

export function createCardRarityImportReport(
  sources: readonly CardRaritySpoilerSource[],
): CardRarityImportReport {
  const aggregateCounts = emptyRarityCounts();
  const sourceReports: CardRaritySourceReport[] = [];
  const unknownValues: CardRarityUnknownValue[] = [];

  for (const source of sources) {
    const parsed = parseCardRaritySpoilerSource(source);
    const sourceCounts = emptyRarityCounts();
    for (const entry of parsed.entries) {
      sourceCounts[entry.rarity.code] += 1;
      aggregateCounts[entry.rarity.code] += 1;
    }
    sourceReports.push({
      sourceId: source.sourceId,
      setId: source.setId,
      totalEntries: parsed.entries.length,
      countsByRarity: sourceCounts,
    });
    unknownValues.push(...parsed.unknownValues);
  }

  return {
    schemaVersion: "card-rarity-import-report-v1",
    totalEntries: sourceReports.reduce(
      (total, source) => total + source.totalEntries,
      0,
    ),
    countsByRarity: aggregateCounts,
    sources: sourceReports,
    unknownValues,
  };
}

export function buildCardRarityByTitleSide(
  sources: readonly CardRaritySpoilerSource[],
): Map<string, CatalogRarity> {
  const rarityByTitleSide = new Map<string, CatalogRarity>();
  for (const source of sources) {
    const { entries } = parseCardRaritySpoilerSource(source);
    for (const entry of entries) {
      rarityByTitleSide.set(
        cardRarityTitleSideKey(entry.title, entry.side),
        entry.rarity,
      );
    }
  }
  return rarityByTitleSide;
}

export function readProjectCardRaritySources(
  cwd = process.cwd(),
): CardRaritySpoilerSource[] {
  return PROJECT_CARD_RARITY_SOURCE_DEFINITIONS.flatMap((definition) => {
    const filePath = projectSourcePathCandidates(
      cwd,
      definition.relativePath,
    ).find((candidate) => existsSync(candidate));
    if (!filePath) return [];
    const source = {
      sourceId: definition.sourceId,
      setId: definition.setId,
      text: readFileSync(filePath, "utf8"),
      ...("side" in definition ? { side: definition.side } : {}),
    };
    return [
      source,
    ];
  });
}

export function readProjectCardRarityImportReport(
  cwd = process.cwd(),
): CardRarityImportReport {
  return createCardRarityImportReport(readProjectCardRaritySources(cwd));
}

export function readProjectOriginalSetRarityByTitleSide(
  cwd = process.cwd(),
): Map<string, CatalogRarity> {
  return buildCardRarityByTitleSide(
    readProjectCardRaritySources(cwd).filter(
      (source) => source.setId === "onr-v1-limited",
    ),
  );
}

export function cardRarityTitleSideKey(
  title: string,
  side: CatalogSide,
): string {
  return `${side}:${normalizeCardTitleForRarityKey(title)}`;
}

function inferSideFromSpoilerLine(line: string): CatalogSide | null {
  const normalized = line.trim().toLowerCase();
  if (
    normalized === "corporation cards" ||
    /\((corp|corporation)\)/i.test(line)
  ) {
    return "corp";
  }
  if (normalized === "runner cards" || /\(runner\)/i.test(line)) {
    return "runner";
  }
  return null;
}

function extractCardTitle(line: string): string | null {
  const marker = line.match(/Card Title:|Card\s+Ti\s*tle:/i);
  if (!marker || marker.index === undefined) return null;
  const afterMarker = line.slice(marker.index + marker[0].length);
  const title = afterMarker.split(/Card Type:|Card Title:/i)[0];
  const normalizedTitle = title?.replace(/\s+/g, " ").trim();
  return normalizedTitle || null;
}

function normalizeCardTitleForRarityKey(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/™|\[tm\]|\(tm\)/gi, " tm ")
    .replace(/['’`]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

function emptyRarityCounts(): Record<CatalogRarityCode, number> {
  return {
    common: 0,
    uncommon: 0,
    rare: 0,
    vital: 0,
  };
}
