import { describe, expect, it } from "vitest";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type { AiDeckStrategyProfile, DeckStrategyScore } from "./deck-doctrine-strategy";
import { buildCorpStrategicIntentProfile } from "./corp-strategic-intent";
import { buildStrategicIntentState } from "./strategic-intent-state";

describe("CorpStrategicIntentProfile", () => {
  it("keeps non-Corp projection input neutral and low confidence", () => {
    const profile = buildCorpStrategicIntentProfile({
      strategyProfile: strategyProfile("runner", {
        primary: ["runner.rnd_pressure"],
        scores: {
          "runner.rnd_pressure": score({
            anchor: 70,
            support: 60,
            final: 66,
            runtimeStatus: "productive",
            confidence: "high",
          }),
        },
      }),
    });

    expect(profile).toMatchObject({
      schemaVersion: "corp-strategic-intent-profile-v1",
      side: "corp",
      primaryWinIntent: "corp.unknown",
      confidence: "low",
    });
    expect(profile.riskProfile).toEqual(
      expect.arrayContaining([
        "corp.low_confidence_strategy_projection",
        "corp.no_productive_anchor",
      ]),
    );
    expect(profile.evidence).toContain("projection_input_side:not_corp");
  });

  it("projects complete remote scoring into a productive Corp scoreline", () => {
    const strategy = strategyProfile("corp", {
      primary: ["corp.remote_scoring"],
      secondary: ["corp.ice_tax_glacier"],
      scores: {
        "corp.remote_scoring": score({
          anchor: 85,
          support: 80,
          final: 82,
          runtimeStatus: "productive",
          confidence: "high",
        }),
        "corp.ice_tax_glacier": score({
          anchor: 50,
          support: 70,
          final: 60,
          runtimeStatus: "productive",
          confidence: "medium",
        }),
      },
    });
    const deckCapabilities = corpCapabilities();
    const strategicIntentState = buildStrategicIntentState({
      side: "corp",
      stateVersion: 12,
      strategyProfile: strategy,
      deckCapabilities,
      availableCredits: 8,
      roleStatuses: [
        {
          roleId: "scoring_remote",
          status: "active",
          source: "player_view",
          evidence: ["remote_ready:true"],
        },
      ],
    });

    const profile = buildCorpStrategicIntentProfile({
      strategyProfile: strategy,
      deckCapabilities,
      strategicIntentState,
    });

    expect(profile.primaryWinIntent).toBe("corp.score_agendas");
    expect(profile.scorePlan).toContain("corp.remote_scoreline");
    expect(profile.defensePlan).toEqual(
      expect.arrayContaining(["corp.ice_tax_glacier", "corp.remote_protect"]),
    );
    expect(profile.confidence).toBe("high");
    expect(profile.source).toMatchObject({
      deckStrategyProfile: "ai_internal_strategy_profile",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "runtime_projection",
    });
    expect(profile.evidence).toEqual(
      expect.arrayContaining([
        "strategic_state_primary:corp.remote_scoring",
        "strategic_state_phase:convert",
      ]),
    );
  });

  it("keeps blocked tag-trace-punish out of the punish plan", () => {
    const profile = buildCorpStrategicIntentProfile({
      strategyProfile: strategyProfile("corp", {
        primary: [],
        scores: {
          "corp.tag_trace_punish": score({
            anchor: 65,
            support: 20,
            final: 41,
            runtimeStatus: "blocked",
            blockers: ["payoff_without_enablers"],
            confidence: "medium",
          }),
          "corp.economy_rez_reserve": score({
            anchor: 0,
            support: 70,
            final: 42,
            runtimeStatus: "supporting",
            blockers: ["supporting_only:corp.economy_rez_reserve"],
            confidence: "medium",
          }),
        },
        corpProfile: {
          punishProfile: {
            tagSources: 0,
            tagPayoff: 2,
            damagePayoff: 0,
            traceDensity: 0,
          },
          economyProfile: {
            operationEconomy: 1,
            assetEconomy: 0,
            rezSupport: 1,
            recurring: 0,
            finite: 0,
          },
        },
      }),
    });

    expect(profile.punishPlan).not.toContain("corp.tag_trace_punish");
    expect(profile.rejectedIntents).toEqual(
      expect.arrayContaining([
        "corp.tag_trace_punish_blocked",
        "corp.economy_rez_reserve_support_only",
      ]),
    );
    expect(profile.riskProfile).toContain("corp.no_productive_anchor");
  });
});

function strategyProfile(
  side: "runner" | "corp",
  params: {
    primary: string[];
    secondary?: string[];
    scores: Record<string, DeckStrategyScore>;
    corpProfile?: Partial<AiDeckStrategyProfile["corpProfile"]>;
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
    ...(side === "corp"
      ? {
          corpProfile: {
            iceProfile: {
              etr: 0,
              trace: 0,
              tag: 0,
              damage: 0,
              programTrash: "unknown",
              futureEncounter: 0,
              taxRunCost: 0,
            },
            scoreProfile: {
              scoreAcceleration: 0,
              agendaInstallAdvanceScoreSupport: 0,
              remoteScoringProtection: 0,
              stealTax: 0,
            },
            economyProfile: {
              operationEconomy: 0,
              assetEconomy: 0,
              rezSupport: 0,
              recurring: 0,
              finite: 0,
            },
            punishProfile: {
              tagSources: 0,
              tagPayoff: 0,
              damagePayoff: 0,
              traceDensity: 0,
            },
            remoteProfile: {
              scoringProtection: 0,
              ambush: 0,
              assetEconomy: 0,
              regionCityGridUpgradeSupport: "unknown",
            },
            ...params.corpProfile,
          },
        }
      : {}),
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
  runtimeStatus: DeckStrategyScore["runtimeStatus"];
  confidence: DeckStrategyScore["confidence"];
  blockers?: string[];
}): DeckStrategyScore {
  return {
    anchorScore: params.anchor,
    supportScore: params.support,
    finalScore: params.final,
    confidence: params.confidence,
    supportGaps: [],
    ...(params.runtimeStatus ? { runtimeStatus: params.runtimeStatus } : {}),
    ...(params.blockers ? { runtimeBlockers: params.blockers } : {}),
    anchorEvidence: params.anchor > 0
      ? [
          {
            cardId: "fixture-anchor",
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

function corpCapabilities(): DeckCapabilityProfile {
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "corp",
    corp: {
      scorePlanProfile: {
        agendaToolsKnown: 3,
        advanceToolsKnown: 1,
        scoreSupportToolsKnown: 2,
        evidence: ["score_support:true"],
      },
      rezReserveProfile: {
        iceKnownInDeck: 5,
        rezEconomyToolsKnown: 2,
        evidence: ["rez_support:true"],
      },
      economyBankTools: [],
      iceTaxProfile: {
        barrierIceKnown: 2,
        codeGateIceKnown: 1,
        sentryIceKnown: 1,
        taxingIceKnown: 2,
        evidence: ["ice_tax:true"],
      },
      remotePlanProfile: {
        remoteProtectionToolsKnown: 3,
        remoteEconomyToolsKnown: 0,
        ambushToolsKnown: 0,
        evidence: ["remote_protection:true"],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: ["test"],
  };
}
