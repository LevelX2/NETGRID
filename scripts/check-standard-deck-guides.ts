#!/usr/bin/env tsx
import { writeFileSync } from "node:fs";
import process from "node:process";

import {
  buildDeckStrategyProfile,
  DECK_STRATEGY_PROFILE_ANALYSIS_REVISION,
} from "../packages/ai/src/deck-doctrine-strategy";
import { createRuntimeCardsById } from "../packages/catalog/src/index";
import {
  computeStandardDeckGuideAnalysisHash,
  computeStandardDeckGuideAnalysisInputHash,
  resolveStandardDeckGuide,
  type StandardDeckGuideDeckSource,
  type StandardDeckGuideEntry,
  type StandardDeckGuideManifest,
} from "../packages/decks/src/index";

import standardDeckCatalogData from "../data/decks/standard-deck-catalog-1.0.0.json";
import standardDeckGuideData from "../data/decks/standard-deck-guides-2.0.0.json";

type StandardDeckCatalog = {
  catalogId: string;
  decks: Array<StandardDeckGuideDeckSource & { status: string }>;
};

const catalog = standardDeckCatalogData as StandardDeckCatalog;
const manifest = standardDeckGuideData as unknown;
const activeDecks = catalog.decks.filter((deck) => deck.status === "active");
const cardsById = createRuntimeCardsById();
const findings: string[] = [];
const analysisHashUpdates = new Map<string, string>();
const analysisInputHashUpdates = new Map<string, string>();
const analysisMetadataUpdates = new Map<
  string,
  {
    sourceAnalysisHash: string;
    primaryStrategyIds: string[];
    secondaryStrategyIds: string[];
  }
>();
const writeAnalysisHashes = process.argv.includes("--write-analysis-hashes");
const writeAnalysisMetadata = process.argv.includes("--write-analysis");
const writeAnalysisInputHashes = process.argv.includes(
  "--write-analysis-input-hashes",
);
const reviewedAtArgument = process.argv.find((argument) =>
  argument.startsWith("--reviewed-at="),
);
const reviewedAt = reviewedAtArgument?.slice("--reviewed-at=".length);

if (
  Number(writeAnalysisHashes) +
    Number(writeAnalysisMetadata) +
    Number(writeAnalysisInputHashes) >
  1
) {
  throw new Error("Use only one analysis write mode at a time.");
}
if (
  writeAnalysisMetadata &&
  (reviewedAt === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt))
) {
  throw new Error(
    "--write-analysis requires an explicit --reviewed-at=YYYY-MM-DD.",
  );
}

for (const deck of activeDecks) {
  const profile = buildDeckStrategyProfile({
    deckSnapshotId: `standard_${deck.standardDeckId}_${deck.version}`,
    side: deck.side,
    cards: deck.cards,
  });
  const analysisHash = computeStandardDeckGuideAnalysisHash(profile);
  const analysisInputHash = computeStandardDeckGuideAnalysisInputHash({
    deck,
    strategyProfileRevision: DECK_STRATEGY_PROFILE_ANALYSIS_REVISION,
  });
  const resolution = resolveStandardDeckGuide({
    deck,
    manifest,
    currentAnalysisHash: analysisHash,
  });
  const refreshableAnalysisDrift =
    resolution.status === "stale" &&
    resolution.reasons.length === 1 &&
    resolution.reasons[0] === "standard_deck_guide_analysis_stale";
  if (resolution.status !== "available" && !refreshableAnalysisDrift) {
    findings.push(
      `${deck.standardDeckId}: ${resolution.status} (${resolution.reasons.join(", ")})`,
    );
    continue;
  }

  const guide =
    resolution.guide ??
    manifestGuides(manifest).find(
      (entry) => entry.standardDeckId === deck.standardDeckId,
    );
  if (!guide) {
    findings.push(
      `${deck.standardDeckId}: missing guide during analysis refresh`,
    );
    continue;
  }
  const analysisInputHashStale =
    guide.sourceAnalysisInputHash !== analysisInputHash;
  const primaryStrategiesStale = !sameStrings(
    guide.analysis.primaryStrategyIds,
    profile.primaryStrategies,
  );
  const secondaryStrategiesStale = !sameStrings(
    guide.analysis.secondaryStrategyIds,
    profile.secondaryStrategies,
  );
  if (primaryStrategiesStale && !writeAnalysisMetadata) {
    findings.push(`${deck.standardDeckId}: primary strategy list is stale`);
  }
  if (secondaryStrategiesStale && !writeAnalysisMetadata) {
    findings.push(`${deck.standardDeckId}: secondary strategy list is stale`);
  }
  if (
    profile.primaryStrategies.length === 0 &&
    guide.analysis.reviewStatus === "plausible"
  ) {
    findings.push(
      `${deck.standardDeckId}: neutral strategy profile requires an observation status`,
    );
  }
  const englishKeyCards = guide.contentByLocale.en.keyCards;
  for (const [locale, content] of Object.entries(guide.contentByLocale)) {
    if (
      !sameStrings(
        content.keyCards.map((keyCard) => `${keyCard.cardId}:${keyCard.title}`),
        englishKeyCards.map((keyCard) => `${keyCard.cardId}:${keyCard.title}`),
      )
    ) {
      findings.push(
        `${deck.standardDeckId}: ${locale} key cards differ from English`,
      );
    }
    for (const keyCard of content.keyCards) {
      const card = cardsById[keyCard.cardId];
      if (!card) {
        findings.push(
          `${deck.standardDeckId}: unknown ${locale} key card ${keyCard.cardId}`,
        );
      } else if (card.title !== keyCard.title) {
        findings.push(
          `${deck.standardDeckId}: ${locale} key card title for ${keyCard.cardId} is stale`,
        );
      }
    }
  }
  if (refreshableAnalysisDrift) {
    if (writeAnalysisMetadata) {
      analysisMetadataUpdates.set(deck.standardDeckId, {
        sourceAnalysisHash: analysisHash,
        primaryStrategyIds: profile.primaryStrategies,
        secondaryStrategyIds: profile.secondaryStrategies,
      });
      analysisInputHashUpdates.set(deck.standardDeckId, analysisInputHash);
    } else if (writeAnalysisHashes) {
      analysisHashUpdates.set(deck.standardDeckId, analysisHash);
      analysisInputHashUpdates.set(deck.standardDeckId, analysisInputHash);
    } else {
      findings.push(
        `${deck.standardDeckId}: stale (standard_deck_guide_analysis_stale)`,
      );
    }
  } else if (
    writeAnalysisMetadata &&
    (primaryStrategiesStale || secondaryStrategiesStale)
  ) {
    analysisMetadataUpdates.set(deck.standardDeckId, {
      sourceAnalysisHash: analysisHash,
      primaryStrategyIds: profile.primaryStrategies,
      secondaryStrategyIds: profile.secondaryStrategies,
    });
    analysisInputHashUpdates.set(deck.standardDeckId, analysisInputHash);
  }
  if (analysisInputHashStale && resolution.status === "available") {
    if (writeAnalysisInputHashes) {
      analysisInputHashUpdates.set(deck.standardDeckId, analysisInputHash);
    } else if (writeAnalysisHashes || writeAnalysisMetadata) {
      analysisInputHashUpdates.set(deck.standardDeckId, analysisInputHash);
    } else {
      findings.push(`${deck.standardDeckId}: analysis input hash is stale`);
    }
  }
}

const activeIds = new Set(activeDecks.map((deck) => deck.standardDeckId));
for (const guide of manifestGuides(manifest)) {
  if (!activeIds.has(guide.standardDeckId)) {
    findings.push(`${guide.standardDeckId}: orphaned standard deck guide`);
  }
}

if (writeAnalysisInputHashes) {
  const writable = structuredClone(
    standardDeckGuideData,
  ) as StandardDeckGuideManifest;
  for (const guide of writable.guides) {
    const analysisInputHash = analysisInputHashUpdates.get(
      guide.standardDeckId,
    );
    if (analysisInputHash) guide.sourceAnalysisInputHash = analysisInputHash;
  }
  writeFileSync(
    new URL("../data/decks/standard-deck-guides-2.0.0.json", import.meta.url),
    `${JSON.stringify(writable, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Standarddeck-Analyse-Eingabehashes aktualisiert: ${analysisInputHashUpdates.size}/${activeDecks.length} verifizierte Guides.`,
  );
} else if (findings.length === 0 && writeAnalysisMetadata) {
  if (
    analysisMetadataUpdates.size > 0 ||
    standardDeckGuideData.analyzedAt !== reviewedAt
  ) {
    const writable = structuredClone(
      standardDeckGuideData,
    ) as StandardDeckGuideManifest;
    writable.analyzedAt = reviewedAt!;
    for (const guide of writable.guides) {
      const update = analysisMetadataUpdates.get(guide.standardDeckId);
      if (!update) continue;
      guide.sourceAnalysisHash = update.sourceAnalysisHash;
      guide.sourceAnalysisInputHash = analysisInputHashUpdates.get(
        guide.standardDeckId,
      );
      guide.reviewedAt = reviewedAt!;
      guide.analysis.primaryStrategyIds = update.primaryStrategyIds;
      guide.analysis.secondaryStrategyIds = update.secondaryStrategyIds;
    }
    writeFileSync(
      new URL("../data/decks/standard-deck-guides-2.0.0.json", import.meta.url),
      `${JSON.stringify(writable, null, 2)}\n`,
      "utf8",
    );
  }
  console.log(
    `Standarddeck-Analysen aktualisiert: ${analysisMetadataUpdates.size}/${activeDecks.length}.`,
  );
} else if (findings.length === 0 && writeAnalysisHashes) {
  const writable = structuredClone(
    standardDeckGuideData,
  ) as StandardDeckGuideManifest;
  for (const guide of writable.guides) {
    const analysisHash = analysisHashUpdates.get(guide.standardDeckId);
    if (analysisHash) {
      guide.sourceAnalysisHash = analysisHash;
      guide.sourceAnalysisInputHash = analysisInputHashUpdates.get(
        guide.standardDeckId,
      );
    }
  }
  writeFileSync(
    new URL("../data/decks/standard-deck-guides-2.0.0.json", import.meta.url),
    `${JSON.stringify(writable, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `Standarddeck-Analysehashes aktualisiert: ${analysisHashUpdates.size}/${activeDecks.length}.`,
  );
} else if (findings.length > 0) {
  console.error(
    `Standarddeck-Anleitungen benötigen Pflege (${findings.length} Befunde):`,
  );
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(
    `Standarddeck-Anleitungen sind aktuell: ${activeDecks.length}/${activeDecks.length} aktive Decks.`,
  );
}

function manifestGuides(value: unknown): StandardDeckGuideEntry[] {
  if (value === null || typeof value !== "object") return [];
  const guides = (value as Partial<StandardDeckGuideManifest>).guides;
  return Array.isArray(guides) ? guides : [];
}

function sameStrings(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    [...left].sort().every((entry, index) => entry === [...right].sort()[index])
  );
}
