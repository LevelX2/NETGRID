#!/usr/bin/env tsx
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
  if (resolution.status !== "available") {
    findings.push(
      `${deck.standardDeckId}: ${resolution.status} (${resolution.reasons.join(", ")})`,
    );
    continue;
  }

  const guide = resolution.guide!;
  if (!sameStrings(guide.analysis.primaryStrategyIds, profile.primaryStrategies)) {
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
}

const activeIds = new Set(activeDecks.map((deck) => deck.standardDeckId));
for (const guide of manifestGuides(manifest)) {
  if (!activeIds.has(guide.standardDeckId)) {
    findings.push(`${guide.standardDeckId}: orphaned standard deck guide`);
  }
}

if (findings.length > 0) {
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
