import { describe, expect, it } from "vitest";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type {
  AiDeckStrategyProfile,
  DeckStrategyScore,
} from "./deck-doctrine-strategy";
import {
  buildRemoteDoctrineProfile,
  redactedRemoteDoctrineFacts,
} from "./remote-doctrine-profile";
import type { StrategicIntentState } from "./strategic-intent-state";

describe("remote doctrine profile", () => {
  it("keeps pure fast advance opportunistic and without a background build budget", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.fast_advance"),
      deckCapabilities: capabilities(),
      strategicIntentState: strategicState(
        "corp.fast_advance",
        "corp_fast_advance",
      ),
    });

    expect(profile).toMatchObject({
      dependency: "opportunistic",
      purposes: ["scoreline"],
      protectionTarget: "none",
      buildTiming: "on_demand",
      investmentBudget: {
        maxTargetRemotes: 1,
        maxIceBeforePayload: 0,
        backgroundActionsPerTurn: 0,
        targetRecoveryTurns: 0,
      },
    });
  });

  it("derives a bounded score-window remote for rush", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.rush_score"),
      deckCapabilities: capabilities(),
      strategicIntentState: strategicState("corp.rush_score", "corp_scoreline"),
    });

    expect(profile).toMatchObject({
      dependency: "supporting",
      protectionTarget: "score_window",
      buildTiming: "payload_first",
      investmentBudget: { maxIceBeforePayload: 2, targetRecoveryTurns: 1 },
    });
  });

  it("derives a primary taxing remote for remote scoring", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.remote_scoring"),
      deckCapabilities: capabilities({ remoteProtectionToolsKnown: 2 }),
      strategicIntentState: strategicState(
        "corp.remote_scoring",
        "corp_scoreline",
      ),
    });

    expect(profile).toMatchObject({
      dependency: "primary",
      purposes: ["scoreline"],
      protectionTarget: "taxing",
      buildTiming: "prebuild",
      investmentBudget: { maxTargetRemotes: 1, targetRecoveryTurns: 2 },
    });
  });

  it("derives the strongest protection target for a confident glacier line", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.ice_tax_glacier"),
      deckCapabilities: capabilities({ taxingIceKnown: 6 }),
      strategicIntentState: strategicState(
        "corp.ice_tax_glacier",
        "corp_ice_tax",
      ),
    });

    expect(profile).toMatchObject({
      dependency: "primary",
      protectionTarget: "glacier",
      buildTiming: "prebuild",
      investmentBudget: { maxIceBeforePayload: 4, targetRecoveryTurns: 3 },
    });
  });

  it("keeps asset economy separate from a scoring remote", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.asset_economy"),
      deckCapabilities: capabilities({ remoteEconomyToolsKnown: 3 }),
      strategicIntentState: strategicState(
        "corp.asset_economy",
        "corp_asset_economy",
      ),
    });

    expect(profile).toMatchObject({
      dependency: "supporting",
      purposes: ["asset_economy"],
      protectionTarget: "light",
      buildTiming: "payload_first",
    });
    expect(profile.purposes).not.toContain("scoreline");
  });

  it("keeps an ambush remote deliberately light and contestable", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.ambush_bluff"),
      deckCapabilities: capabilities({ ambushToolsKnown: 3 }),
      strategicIntentState: strategicState("corp.ambush_bluff", "corp_ambush"),
    });

    expect(profile).toMatchObject({
      dependency: "primary",
      purposes: ["ambush_bluff"],
      protectionTarget: "light",
      investmentBudget: { maxTargetRemotes: 2, maxIceBeforePayload: 1 },
    });
  });

  it("represents a fast-advance remote-scoring hybrid as a mixed bounded line", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.fast_advance", [
        "corp.remote_scoring",
      ]),
      deckCapabilities: capabilities({ remoteProtectionToolsKnown: 2 }),
      strategicIntentState: strategicState(
        "corp.fast_advance",
        "corp_fast_advance",
      ),
    });

    expect(profile).toMatchObject({
      dependency: "supporting",
      purposes: expect.arrayContaining(["mixed", "scoreline"]),
      protectionTarget: "score_window",
      buildTiming: "prebuild",
    });
  });

  it("clamps a low-confidence glacier projection to a conservative remote", () => {
    const strategy = strategyProfile("corp.ice_tax_glacier");
    strategy.warnings = ["incomplete_snapshot"];
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategy,
      deckCapabilities: capabilities({ taxingIceKnown: 6 }),
      strategicIntentState: strategicState(
        "corp.ice_tax_glacier",
        "corp_ice_tax",
      ),
    });

    expect(profile).toMatchObject({
      confidence: "low",
      dependency: "supporting",
      protectionTarget: "score_window",
      investmentBudget: {
        maxTargetRemotes: 1,
        maxIceBeforePayload: 2,
        backgroundActionsPerTurn: 1,
        targetRecoveryTurns: 1,
      },
    });
    expect(profile.evidence).toContain(
      "remote_doctrine_low_confidence_clamp:true",
    );
  });

  it("returns only bounded redacted doctrine facts", () => {
    const profile = buildRemoteDoctrineProfile({
      strategyProfile: strategyProfile("corp.remote_scoring"),
      deckCapabilities: capabilities({ remoteProtectionToolsKnown: 2 }),
      strategicIntentState: strategicState(
        "corp.remote_scoring",
        "corp_scoreline",
      ),
    });

    expect(redactedRemoteDoctrineFacts(profile)).toEqual(
      expect.arrayContaining([
        "remote_doctrine_dependency:primary",
        "remote_doctrine_protection:taxing",
        "remote_doctrine_target_recovery_turns:2",
      ]),
    );
    expect(JSON.stringify(profile)).not.toContain("deck-fixture");
  });
});

function strategyProfile(
  primaryStrategy: string,
  secondaryStrategies: string[] = [],
): AiDeckStrategyProfile {
  const strategyIds = [primaryStrategy, ...secondaryStrategies];
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: "deck-fixture",
    side: "corp",
    cardCount: 45,
    strategyScores: Object.fromEntries(
      strategyIds.map((strategyId) => [strategyId, strategyScore()]),
    ),
    primaryStrategies: [primaryStrategy],
    secondaryStrategies,
    functionSignalCounts: {},
    legacySignalCounts: {},
    warnings: [],
    source: {
      mode: "ai_internal_strategy_profile",
      strategyGoals: "data/ai/strategy-goals-v1.json",
      activeHints: "data/ai/ai-card-hints-active.json",
      inspectorIndex: "data/ai/ai-hint-inspector-index.json",
      plannerEffect: "strategic_intent_input",
    },
  };
}

function strategyScore(): DeckStrategyScore {
  return {
    anchorScore: 70,
    supportScore: 30,
    finalScore: 85,
    anchorEvidence: [],
    supportEvidence: [],
    supportGaps: [],
    confidence: "high",
    runtimeStatus: "productive",
    runtimeBlockers: [],
  };
}

function capabilities(
  overrides: Partial<{
    remoteProtectionToolsKnown: number;
    remoteEconomyToolsKnown: number;
    ambushToolsKnown: number;
    taxingIceKnown: number;
  }> = {},
): DeckCapabilityProfile {
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "corp",
    corp: {
      scorePlanProfile: {
        agendaToolsKnown: 1,
        advanceToolsKnown: 1,
        scoreSupportToolsKnown: overrides.remoteProtectionToolsKnown ?? 0,
        evidence: [],
      },
      rezReserveProfile: {
        iceKnownInDeck: 12,
        rezEconomyToolsKnown: 2,
        evidence: [],
      },
      economyBankTools: [],
      iceTaxProfile: {
        barrierIceKnown: 4,
        codeGateIceKnown: 4,
        sentryIceKnown: 4,
        taxingIceKnown: overrides.taxingIceKnown ?? 0,
        evidence: [],
      },
      remotePlanProfile: {
        remoteProtectionToolsKnown: overrides.remoteProtectionToolsKnown ?? 0,
        remoteEconomyToolsKnown: overrides.remoteEconomyToolsKnown ?? 0,
        ambushToolsKnown: overrides.ambushToolsKnown ?? 0,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "medium",
    evidence: [],
  };
}

function strategicState(
  strategyId: string,
  family: StrategicIntentState["primaryStrategy"]["family"],
): StrategicIntentState {
  return {
    schemaVersion: "strategic-intent-state-v1",
    side: "corp",
    stateVersion: 12,
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      plannerEffect: "goal_and_plan_input",
      actionGeneration: "none",
      hiddenInfoPolicy: "player_view_only",
    },
    primaryStrategy: {
      strategyId,
      family,
      confidence: "high",
      completeness: "complete",
      score: { anchor: 70, support: 30, final: 85 },
      supportGaps: [],
      evidence: [],
    },
    secondaryStrategies: [],
    phase: "enable",
    roleStatuses: [],
    targetVector: { kind: "scoreline", evidence: [] },
    reserve: {
      kind: "credits",
      required: 5,
      available: 8,
      satisfied: true,
      evidence: [],
    },
    blockers: [],
    transition: { status: "selected", reason: "test", evidence: [] },
    commitment: {
      strategyId,
      decisionsCommitted: 2,
      switchMargin: 8,
      minCommitmentDecisions: 2,
      evidence: [],
    },
    evidence: [],
  };
}
