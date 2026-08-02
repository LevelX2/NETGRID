#!/usr/bin/env tsx
import { buildDeckStrategyProfile } from "../packages/ai/src/deck-doctrine-strategy";
import { createRuntimeCardsById } from "../packages/catalog/src/index";
import standardDeckCatalogData from "../data/decks/standard-deck-catalog-1.0.0.json";

const cardsById = createRuntimeCardsById();
const activeDecks = standardDeckCatalogData.decks.filter(
  (deck) => deck.status === "active",
);

const analysis = activeDecks.map((deck) => {
  const profile = buildDeckStrategyProfile({
    deckSnapshotId: `standard_${deck.standardDeckId}_${deck.version}`,
    side: deck.side as "runner" | "corp",
    cards: deck.cards,
  });
  const prominentStrategyIds = [
    ...profile.primaryStrategies,
    ...profile.secondaryStrategies,
  ];
  const keyCardCandidates = new Map<
    string,
    { cardId: string; title: string; quantity: number; reasons: string[] }
  >();
  for (const strategyId of prominentStrategyIds) {
    const score = profile.strategyScores[strategyId];
    if (!score) continue;
    for (const evidence of score.anchorEvidence) {
      const current = keyCardCandidates.get(evidence.cardId) ?? {
        cardId: evidence.cardId,
        title: cardsById[evidence.cardId]?.title ?? evidence.cardId,
        quantity: evidence.quantity,
        reasons: [],
      };
      current.reasons.push(`${strategyId}: ${evidence.reason}`);
      keyCardCandidates.set(evidence.cardId, current);
    }
  }
  return {
    standardDeckId: deck.standardDeckId,
    name: deck.name,
    side: deck.side,
    primaryStrategies: profile.primaryStrategies,
    secondaryStrategies: profile.secondaryStrategies,
    prominentScores: Object.fromEntries(
      prominentStrategyIds.map((strategyId) => [
        strategyId,
        profile.strategyScores[strategyId],
      ]),
    ),
    keyCardCandidates: [...keyCardCandidates.values()].slice(0, 8),
    warnings: profile.warnings,
  };
});

console.log(JSON.stringify({ analyzedAt: "2026-08-02", analysis }, null, 2));
