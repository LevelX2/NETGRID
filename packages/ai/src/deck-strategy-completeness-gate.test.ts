import { describe, expect, it } from "vitest";
import standardDeckCatalog from "../../../data/decks/standard-deck-catalog-1.0.0.json";
import snapshotData from "../../../data/decks/deck-snapshots-0.8.json";
import strategyGoals from "../../../data/ai/strategy-goals-v1.json";
import type { AiDeckStrategyDeckSnapshot } from "./deck-strategy-snapshot";
import {
  buildDeckStrategyProfile,
  DECK_STRATEGY_METADATA_CONSUMER_CONTRACT,
  type AiDeckStrategyProfile,
  type DeckStrategyScore,
} from "./deck-doctrine-strategy";
import { buildStrategicIntentState } from "./strategic-intent-state";
import {
  STRATEGY_RUNTIME_FAMILY_BY_ID,
  strategicFamilyForStrategyId,
} from "./strategy-runtime-registry";

describe("deck strategy completeness gate", () => {
  const activeDecks = standardDeckCatalog.decks.filter(
    (deck) => deck.status === "active",
  );
  const versionedSnapshots = snapshotData.snapshots as Array<{
    deckSnapshotId: string;
    side: "runner" | "corp";
    cards: Array<{ cardId: string; quantity: number }>;
  }>;

  it("covers all 44 active standard decks deterministically", () => {
    expect(activeDecks).toHaveLength(44);
    const neutralDeckNames: string[] = [];

    for (const deck of activeDecks) {
      const snapshot = standardSnapshot(deck.name);
      const profile = buildDeckStrategyProfile(snapshot);
      expect(profile).toEqual(buildDeckStrategyProfile(snapshot));
      expect(Object.keys(profile.strategyScores).sort()).toEqual(
        strategyGoals.strategyGoals
          .filter((goal) => goal.side === deck.side)
          .map((goal) => goal.strategyId)
          .sort(),
      );
      assertWarningsHaveCardProvenance(profile, snapshot);
      if (profile.primaryStrategies.length === 0) {
        neutralDeckNames.push(deck.name);
      }
      for (const strategyId of profile.primaryStrategies) {
        expect(strategicFamilyForStrategyId(strategyId)).not.toBe("unknown");
        expect(profile.strategyScores[strategyId]?.runtimeStatus).toBe(
          "productive",
        );
      }
    }

    expect(neutralDeckNames).toEqual(["Ghost Circuit"]);
  });

  it("keeps all 21 versioned snapshots deterministic and taxonomy-complete", () => {
    expect(versionedSnapshots).toHaveLength(21);
    for (const snapshot of versionedSnapshots) {
      const profile = buildDeckStrategyProfile(snapshot);
      expect(profile).toEqual(buildDeckStrategyProfile(snapshot));
      expect(Object.keys(profile.strategyScores).sort()).toEqual(
        strategyGoals.strategyGoals
          .filter((goal) => goal.side === snapshot.side)
          .map((goal) => goal.strategyId)
          .sort(),
      );
      assertWarningsHaveCardProvenance(profile, snapshot);
    }
  });

  it("gives every taxonomy id a classified non-recover runtime contract", () => {
    const taxonomyIds = strategyGoals.strategyGoals
      .map((goal) => goal.strategyId)
      .sort();
    expect(Object.keys(STRATEGY_RUNTIME_FAMILY_BY_ID).sort()).toEqual(
      taxonomyIds,
    );

    for (const goal of strategyGoals.strategyGoals) {
      const state = buildStrategicIntentState({
        side: goal.side as "runner" | "corp",
        stateVersion: 1,
        strategyProfile: singleStrategyProfile(
          goal.side as "runner" | "corp",
          goal.strategyId,
        ),
        availableCredits: 10,
      });

      expect(state.primaryStrategy.strategyId).toBe(goal.strategyId);
      expect(state.primaryStrategy.family).not.toBe("unknown");
      expect(state.targetVector.evidence.join("|")).not.toMatch(/unknown/);
      expect(state.phase).not.toBe("recover");
      expect(
        state.blockers.some((blocker) => blocker.severity === "hard"),
      ).toBe(false);
    }
  });

  it("keeps every derived public metadata group assigned to a consumer", () => {
    expect(
      Object.values(DECK_STRATEGY_METADATA_CONSUMER_CONTRACT).every(
        (entry) => entry.consumers.length > 0,
      ),
    ).toBe(true);
    expect(
      Object.values(DECK_STRATEGY_METADATA_CONSUMER_CONTRACT).every(
        (entry) =>
          entry.mode === "productive_and_diagnostic" ||
          entry.mode === "diagnostic_only",
      ),
    ).toBe(true);
  });
});

function standardSnapshot(name: string): AiDeckStrategyDeckSnapshot {
  const deck = standardDeckCatalog.decks.find(
    (candidate) => candidate.name === name,
  );
  if (!deck) throw new Error(`Missing standard deck ${name}`);
  return {
    deckSnapshotId: `standard_${deck.standardDeckId}_${deck.version}`,
    side: deck.side as "runner" | "corp",
    cards: deck.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function singleStrategyProfile(
  side: "runner" | "corp",
  strategyId: string,
): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: `liveness-${strategyId}`,
    side,
    cardCount: 1,
    strategyScores: { [strategyId]: productiveScore(strategyId) },
    primaryStrategies: [strategyId],
    secondaryStrategies: [],
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      activeHints: "data/ai/ai-card-hints-active.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function productiveScore(strategyId: string): DeckStrategyScore {
  return {
    anchorScore: 70,
    supportScore: 80,
    finalScore: 75,
    confidence: "high",
    runtimeStatus: "productive",
    runtimeBlockers: [],
    supportGaps: [],
    anchorEvidence: [
      {
        cardId: "fixture-anchor",
        quantity: 1,
        source: "derivedStrategyAnchor",
        strategyId,
        reason: "liveness_gate",
      },
    ],
    supportEvidence: [],
  };
}

function assertWarningsHaveCardProvenance(
  profile: AiDeckStrategyProfile,
  snapshot: AiDeckStrategyDeckSnapshot,
): void {
  const cardIds = new Set(snapshot.cards.map((card) => card.cardId));
  for (const warning of profile.warnings) {
    expect(warning.split(":").some((token) => cardIds.has(token))).toBe(true);
  }
}
