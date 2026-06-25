import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, PlayerView } from "@netgrid/shared";
import { buildStrategicIntentState } from "./strategic-intent-state";
import {
  getStrategicIntentMemorySnapshot,
  rememberStrategicIntentState,
  resetStrategicIntentMemory,
} from "./strategic-intent-memory";
import type { AiDeckStrategyProfile, DeckStrategyScore } from "./deck-doctrine-strategy";

describe("StrategicIntent memory", () => {
  afterEach(() => {
    resetStrategicIntentMemory();
  });

  it("stores side-safe strategic state and supports deterministic continuation", () => {
    const input = aiInput("runner", "match-a", "deck-runner-a");
    const first = buildStrategicIntentState({
      side: "runner",
      stateVersion: 10,
      strategyProfile: strategyProfile("runner", "runner.rnd_pressure"),
      availableCredits: 8,
    });

    const snapshot = rememberStrategicIntentState(input, first);
    const previous = getStrategicIntentMemorySnapshot(input);
    const continued = buildStrategicIntentState({
      side: "runner",
      stateVersion: 11,
      strategyProfile: strategyProfile("runner", "runner.rnd_pressure"),
      availableCredits: 8,
      ...(previous ? { previousState: previous.state } : {}),
    });

    expect(snapshot).toMatchObject({
      side: "runner",
      deckSnapshotId: "deck-runner-a",
      primaryStrategyId: "runner.rnd_pressure",
      phase: "enable",
    });
    expect(continued.transition).toMatchObject({
      status: "continued",
      previousStrategyId: "runner.rnd_pressure",
    });
    expect(continued.commitment.decisionsCommitted).toBe(2);
    expect(JSON.stringify(snapshot)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|fullGameState/i,
    );
  });

  it("isolates memory by match, side, profile and deck snapshot", () => {
    const input = aiInput("corp", "match-a", "deck-corp-a", "corp-profile-a");
    const state = buildStrategicIntentState({
      side: "corp",
      stateVersion: 12,
      strategyProfile: strategyProfile("corp", "corp.remote_scoring"),
      availableCredits: 8,
    });

    rememberStrategicIntentState(input, state);

    expect(getStrategicIntentMemorySnapshot(input)?.primaryStrategyId).toBe(
      "corp.remote_scoring",
    );
    expect(
      getStrategicIntentMemorySnapshot(
        aiInput("corp", "match-a", "deck-corp-b", "corp-profile-a"),
      ),
    ).toBeUndefined();
    expect(
      getStrategicIntentMemorySnapshot(
        aiInput("runner", "match-a", "deck-corp-a", "corp-profile-a"),
      ),
    ).toBeUndefined();
    expect(
      getStrategicIntentMemorySnapshot(
        aiInput("corp", "match-b", "deck-corp-a", "corp-profile-a"),
      ),
    ).toBeUndefined();
    expect(
      getStrategicIntentMemorySnapshot(
        aiInput("corp", "match-a", "deck-corp-a", "corp-profile-b"),
      ),
    ).toBeUndefined();
  });

  it("clears memory for terminal player views", () => {
    const input = aiInput("runner", "match-terminal", "deck-runner-a");
    const state = buildStrategicIntentState({
      side: "runner",
      stateVersion: 4,
      strategyProfile: strategyProfile("runner", "runner.rnd_pressure"),
      availableCredits: 8,
    });

    rememberStrategicIntentState(input, state);
    input.playerView.winner = "runner";

    expect(getStrategicIntentMemorySnapshot(input)).toBeUndefined();
  });

  it("does not use report-only Doctrine diagnostics as a productive memory key", () => {
    const input = aiInput("runner", "match-diagnostic-only", "deck-runner-a");
    delete (input as any).ownDeckStrategyProfile;
    (input as any).ownDeckDoctrineV2Diagnostic = {
      deckSnapshotId: "diagnostic-only-deck",
      scope: "diagnostic_only",
      productiveUseAllowed: false,
    };
    const state = buildStrategicIntentState({
      side: "runner",
      stateVersion: 5,
      strategyProfile: strategyProfile("runner", "runner.rnd_pressure"),
      availableCredits: 8,
    });

    const snapshot = rememberStrategicIntentState(input, state);

    expect(snapshot?.deckSnapshotId).toBe("no_deck_snapshot");
    expect(
      getStrategicIntentMemorySnapshot(input, "diagnostic-only-deck"),
    ).toBeUndefined();
  });

  it("expires abandoned strategic states immediately", () => {
    const input = aiInput("runner", "match-abandoned", "deck-runner-a");
    const active = buildStrategicIntentState({
      side: "runner",
      stateVersion: 8,
      strategyProfile: strategyProfile("runner", "runner.rnd_pressure"),
      availableCredits: 8,
    });
    const abandoned = buildStrategicIntentState({
      side: "runner",
      stateVersion: 9,
      previousState: active,
      availableCredits: 8,
    });

    const snapshot = rememberStrategicIntentState(input, abandoned);

    expect(abandoned.transition.status).toBe("abandoned");
    expect(snapshot?.ttlDecisionsRemaining).toBe(0);
    expect(getStrategicIntentMemorySnapshot(input)).toBeUndefined();
  });
});

function strategyProfile(
  side: "runner" | "corp",
  strategyId: "runner.rnd_pressure" | "corp.remote_scoring",
): AiDeckStrategyProfile {
  return {
    schemaVersion: "ai-deck-strategy-profile-v1",
    taskId: "AI006",
    deckId: `${side}-deck`,
    side,
    cardCount: 8,
    strategyScores: {
      [strategyId]: score(strategyId),
    },
    primaryStrategies: [strategyId],
    secondaryStrategies: [],
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

function score(strategyId: string): DeckStrategyScore {
  return {
    anchorScore: 80,
    supportScore: 80,
    finalScore: 80,
    confidence: "high",
    supportGaps: [],
    runtimeStatus: "productive",
    runtimeBlockers: [],
    anchorEvidence: [
      {
        cardId: "fixture-anchor",
        quantity: 1,
        source: "derivedStrategyAnchor",
        strategyId,
        reason: "test",
      },
    ],
    supportEvidence: [],
  };
}

function aiInput(
  side: "runner" | "corp",
  decisionScope: string,
  deckSnapshotId: string,
  profileId = `${side}-profile`,
): AiDecisionInput {
  const legalActions = [legalAction(side)];
  return {
    side,
    playerView: playerViewFor(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: decisionScope,
    decisionId: `${decisionScope}:10:${side}`,
    actionNumber: 10,
    profileId,
    ownDeckStrategyProfile: {
      deckId: deckSnapshotId,
    },
  } as unknown as AiDecisionInput;
}

function playerViewFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): PlayerView {
  return {
    side,
    stateVersion: 10,
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    own: {
      identity: visibleCard(`${side}-identity`),
      credits: 8,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleCard(`${side}-opponent-identity`),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  } as unknown as PlayerView;
}

function visibleCard(cardId: string) {
  return {
    instanceId: `${cardId}-instance`,
    definitionId: cardId,
    title: cardId,
    side: "runner",
    type: "identity",
    zone: "identity",
    visibility: "public",
    known: true,
  };
}

function legalAction(side: "runner" | "corp"): LegalAction {
  return {
    actionId: `${side}-gain-credit`,
    side,
    type: "gain_credit",
    label: "Gain 1",
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 10,
  };
}
