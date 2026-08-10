#!/usr/bin/env tsx
import { writeFileSync } from "node:fs";
import process from "node:process";

import { buildDeckStrategyProfile } from "../packages/ai/src/deck-doctrine-strategy";
import { createRuntimeCardsById } from "../packages/catalog/src/index";
import {
  computeStandardDeckGuideAnalysisHash,
  resolveStandardDeckGuide,
  type StandardDeckGuideDeckSource,
  type StandardDeckGuideEntry,
  type StandardDeckGuideManifest,
} from "../packages/decks/src/index";

import standardDeckCatalogData from "../data/decks/standard-deck-catalog-1.0.0.json";
import standardDeckGuideData from "../data/decks/standard-deck-guides-1.0.0.json";

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
const writeAnalysisHashes = process.argv.includes("--write-analysis-hashes");

for (const deck of activeDecks) {
  const profile = buildDeckStrategyProfile({
    deckSnapshotId: `standard_${deck.standardDeckId}_${deck.version}`,
    side: deck.side,
    cards: deck.cards,
  });
  const analysisHash = computeStandardDeckGuideAnalysisHash(profile);
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
  if (
    !sameStrings(guide.analysis.primaryStrategyIds, profile.primaryStrategies)
  ) {
    findings.push(`${deck.standardDeckId}: primary strategy list is stale`);
  }
  if (
    !sameStrings(
      guide.analysis.secondaryStrategyIds,
      profile.secondaryStrategies,
    )
  ) {
    findings.push(`${deck.standardDeckId}: secondary strategy list is stale`);
  }
  for (const keyCard of guide.content.keyCards) {
    const card = cardsById[keyCard.cardId];
    if (!card) {
      findings.push(
        `${deck.standardDeckId}: unknown key card ${keyCard.cardId}`,
      );
    } else if (card.title !== keyCard.title) {
      findings.push(
        `${deck.standardDeckId}: key card title for ${keyCard.cardId} is stale`,
      );
    }
  }
  if (refreshableAnalysisDrift) {
    if (writeAnalysisHashes) {
      analysisHashUpdates.set(deck.standardDeckId, analysisHash);
    } else {
      findings.push(
        `${deck.standardDeckId}: stale (standard_deck_guide_analysis_stale)`,
      );
    }
  }
}

const activeIds = new Set(activeDecks.map((deck) => deck.standardDeckId));
for (const guide of manifestGuides(manifest)) {
  if (!activeIds.has(guide.standardDeckId)) {
    findings.push(`${guide.standardDeckId}: orphaned standard deck guide`);
  }
}

if (findings.length === 0 && writeAnalysisHashes) {
  const writable = structuredClone(
    standardDeckGuideData,
  ) as StandardDeckGuideManifest;
  for (const guide of writable.guides) {
    const analysisHash = analysisHashUpdates.get(guide.standardDeckId);
    if (analysisHash) guide.sourceAnalysisHash = analysisHash;
  }
  writeFileSync(
    new URL("../data/decks/standard-deck-guides-1.0.0.json", import.meta.url),
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
