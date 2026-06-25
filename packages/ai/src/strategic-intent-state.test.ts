import { describe, expect, it } from "vitest";
import type { AiDeckStrategyProfile, DeckStrategyScore } from "./deck-doctrine-strategy";
import {
  buildStrategicIntentState,
  type StrategicRoleStatusSnapshot,
} from "./strategic-intent-state";

describe("StrategicIntentState contract", () => {
  it("keeps anchorless Runner decks in NeutralDoctrine without action generation", () => {
    const state = buildStrategicIntentState({
      side: "runner",
      stateVersion: 7,
    });

    expect(state).toMatchObject({
      schemaVersion: "strategic-intent-state-v1",
      side: "runner",
      phase: "recover",
      source: {
        deckStrategyProfile: "missing",
        plannerEffect: "goal_and_plan_input",
        actionGeneration: "none",
        hiddenInfoPolicy: "player_view_only",
      },
      primaryStrategy: {
        strategyId: "runner.neutral",
        family: "neutral",
        completeness: "none",
      },
      targetVector: { kind: "none" },
    });
    expect(state.blockers.map((blocker) => blocker.reason)).toContain(
      "no_strategy_anchor",
    );
  });

  it("models partial Runner pressure with support gaps and reserve blockers", () => {
    const state = buildStrategicIntentState({
      side: "runner",
      stateVersion: 12,
      strategyProfile: profile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 45,
            support: 30,
            final: 39,
            confidence: "medium",
            gaps: ["missing_wall_coverage"],
          }),
        },
      }),
      availableCredits: 2,
      roleStatuses: [
        role("rnd_pressure_anchor", "in_deck_unseen", [
          "role_status:in_deck_unseen",
        ]),
      ],
    });

    expect(state.primaryStrategy).toMatchObject({
      strategyId: "runner.rnd_pressure",
      family: "runner_central_pressure",
      completeness: "partial",
    });
    expect(state.phase).toBe("recover");
    expect(state.targetVector).toMatchObject({ kind: "central", targetId: "rd" });
    expect(state.blockers.map((blocker) => blocker.reason)).toEqual(
      expect.arrayContaining(["support_gap", "reserve_shortfall"]),
    );
    expect(state.reserve).toMatchObject({
      kind: "credits",
      required: 4,
      available: 2,
      satisfied: false,
    });
  });

  it("models complete Corp scoreline intent and commitment continuation", () => {
    const profileInput = profile("corp", {
      primary: ["corp.remote_scoring"],
      secondary: ["corp.ice_tax_glacier"],
      scores: {
        "corp.remote_scoring": score({
          anchor: 80,
          support: 85,
          final: 82,
          confidence: "high",
        }),
        "corp.ice_tax_glacier": score({
          anchor: 45,
          support: 55,
          final: 51,
          confidence: "medium",
        }),
      },
    });
    const activeRoles = [
      role("scoring_remote", "active", ["remote_ready:true"]),
    ];
    const first = buildStrategicIntentState({
      side: "corp",
      stateVersion: 20,
      strategyProfile: profileInput,
      availableCredits: 7,
      roleStatuses: activeRoles,
    });
    const continued = buildStrategicIntentState({
      side: "corp",
      stateVersion: 21,
      strategyProfile: profileInput,
      previousState: first,
      availableCredits: 7,
      roleStatuses: activeRoles,
    });

    expect(first.primaryStrategy).toMatchObject({
      strategyId: "corp.remote_scoring",
      family: "corp_scoreline",
      completeness: "complete",
      confidence: "high",
    });
    expect(first.phase).toBe("convert");
    expect(first.targetVector.kind).toBe("scoreline");
    expect(first.blockers).toEqual([]);
    expect(first.secondaryStrategies.map((line) => line.strategyId)).toEqual([
      "corp.ice_tax_glacier",
    ]);
    expect(continued.transition).toMatchObject({
      status: "continued",
      reason: "same_primary_strategy",
      previousStrategyId: "corp.remote_scoring",
    });
    expect(continued.commitment.decisionsCommitted).toBe(2);
  });
});

function profile(
  side: "runner" | "corp",
  params: {
    primary: string[];
    secondary?: string[];
    scores: Record<string, DeckStrategyScore>;
  },
): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: `${side}-fixture`,
    side,
    cardCount: 10,
    strategyScores: params.scores,
    primaryStrategies: params.primary,
    secondaryStrategies: params.secondary ?? [],
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      compiledHints: "data/ai/ai-card-hints-compiled.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function score(params: {
  anchor: number;
  support: number;
  final: number;
  confidence: "low" | "medium" | "high";
  gaps?: string[];
}): DeckStrategyScore {
  return {
    anchorScore: params.anchor,
    supportScore: params.support,
    finalScore: params.final,
    confidence: params.confidence,
    supportGaps: params.gaps ?? [],
    anchorEvidence: params.anchor > 0
      ? [
          {
            cardId: "fixture-card",
            quantity: 1,
            source: "derivedStrategyAnchor",
            strategyId: "fixture.strategy",
            reason: "test",
          },
        ]
      : [],
    supportEvidence: params.support > 0
      ? [
          {
            cardId: "fixture-support",
            quantity: 1,
            source: "functionSignal",
            signal: "fixture.support",
            reason: "test",
          },
        ]
      : [],
  };
}

function role(
  roleId: string,
  status: StrategicRoleStatusSnapshot["status"],
  evidence: string[],
): StrategicRoleStatusSnapshot {
  return {
    roleId,
    status,
    source: "player_view",
    evidence,
  };
}
