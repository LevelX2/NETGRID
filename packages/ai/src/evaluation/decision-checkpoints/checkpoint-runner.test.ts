import {
  createGameAfterSetup,
  DEMO_DECKS,
  hashGameState,
} from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";

import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import {
  getTacticalPlanMemorySnapshot,
  resetTacticalPlanMemory,
  restoreTacticalPlanMemorySnapshot,
} from "../../plans/plan-memory";
import { TACTICAL_PLAN_SCHEMA_VERSION } from "../../plans/tactical-plan-types";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import {
  AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
  type AiDecisionCheckpointV1,
} from "./checkpoint-types";
import {
  AiDecisionCheckpointValidationError,
  validateAiDecisionCheckpoint,
} from "./checkpoint-validation";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import {
  AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
  exportAiRuntimeCheckpoint,
  restoreAiRuntimeCheckpoint,
} from "./runtime-checkpoint";

describe("AI decision checkpoints", () => {
  beforeEach(() => resetTacticalPlanMemory());

  it("runs a versioned fixture through Engine input and the productive chooser", () => {
    const result = runAiDecisionCheckpoint(fixture());

    expect(result).toMatchObject({
      ok: true,
      selectedAction: { type: "mandatory_draw" },
    });
    expect(
      result.input.legalActions.some(
        (action) => action.actionId === result.decision?.actionId,
      ),
    ).toBe(true);
  });

  it("matches stable strategic-intent expectations after the productive chooser", () => {
    const baseline = runAiDecisionCheckpoint(fixture());
    const primaryStrategyId = baseline.strategicIntent?.primaryStrategyId;
    const family = baseline.strategicIntent?.state.primaryStrategy.family;
    if (!primaryStrategyId || !family) {
      throw new Error("Missing strategic intent in checkpoint smoke fixture");
    }

    const accepted = fixture();
    accepted.expectation.strategicIntent = {
      acceptablePrimaryStrategyIds: [primaryStrategyId],
      acceptableFamilies: [family],
      forbiddenTargetKinds: ["survival"],
    };
    expect(runAiDecisionCheckpoint(accepted)).toMatchObject({ ok: true });

    const rejected = fixture();
    rejected.expectation.strategicIntent = {
      forbiddenPrimaryStrategyIds: [primaryStrategyId],
    };
    expect(runAiDecisionCheckpoint(rejected)).toMatchObject({
      ok: false,
      code: "behavior_regression",
    });
  });

  it("matches selected choice values through the productive chooser", () => {
    const current = fixture();
    const state = current.engine.testOnlyGameState;
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.pendingChoice = {
      choiceId: "checkpoint-trace-bid",
      side: "corp",
      source: "trace:checkpoint",
      prompt: "Trace-Gebot",
      kind: "bid_amount",
      options: [0, 1, 2].map((amount) => ({
        id: `bid_${amount}`,
        label: String(amount),
        value: amount,
      })),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    current.engine.stateHash = hashGameState(state);
    current.expectation = {
      choice: { mustSelectValues: [2], mustNotSelectValues: [1] },
    };

    const result = runAiDecisionCheckpoint(current);

    expect(result.ok, result.message).toBe(true);
  });

  it("roundtrips tactical runtime memory fail-closed by match context", () => {
    const current = fixture();
    const input = buildInput(current.engine.testOnlyGameState);
    restoreTacticalPlanMemorySnapshot(input, {
      schemaVersion: TACTICAL_PLAN_SCHEMA_VERSION,
      memoryId: `${current.engine.testOnlyGameState.matchId}:corp:${input.profileId}`,
      side: "corp",
      planId: "checkpoint-plan",
      type: "corp.establish_scoring_remote",
      status: "progressing",
      blockedBy: [],
      ttlDecisionsRemaining: 2,
      planProgressionReason: "checkpoint_roundtrip",
      updatedAtStateVersion: input.playerView.stateVersion,
    });
    const runtime = exportAiRuntimeCheckpoint(input, DECK.deckSnapshotId);
    resetTacticalPlanMemory();
    restoreAiRuntimeCheckpoint(input, DECK.deckSnapshotId, runtime);

    expect(getTacticalPlanMemorySnapshot(input)).toMatchObject({
      planId: "checkpoint-plan",
      planProgressionReason: "checkpoint_roundtrip",
    });

    const wrongMatchInput = buildAiDecisionInput(
      { ...current.engine.testOnlyGameState, matchId: "wrong-match" },
      "corp",
      {
        profileId: PROFILE,
        decisionId: `wrong-match:${current.engine.stateVersion}:corp`,
        ownDeckSnapshot: DECK,
      },
    );
    expect(() =>
      restoreAiRuntimeCheckpoint(wrongMatchInput, DECK.deckSnapshotId, runtime),
    ).toThrow("invalid_tactical_plan_memory_checkpoint");
  });

  it("rejects forbidden transport fields before the chooser runs", () => {
    const current = fixture();
    current.engine.eventPrefix = [
      {
        eventId: "unsafe",
        type: "unsafe",
        stateVersionBefore: 0,
        stateVersionAfter: 0,
        stateHashAfter: current.engine.stateHash,
        publicPayload: { sessionToken: "must-not-be-captured" },
      },
    ];

    expect(() => validateAiDecisionCheckpoint(current)).toThrowError(
      AiDecisionCheckpointValidationError,
    );
    try {
      validateAiDecisionCheckpoint(current);
    } catch (error) {
      expect(error).toMatchObject({ code: "fixture_redaction_violation" });
    }
  });
});

const PROFILE = "checkpoint-test-corp";
const DECK: AiDeckStrategyDeckSnapshot = {
  deckSnapshotId: "checkpoint-test-corp-deck",
  sourceDeckId: DEMO_DECKS.demo_corp_001.id,
  side: "corp",
  cards: DEMO_DECKS.demo_corp_001.cards.map((card) => ({
    cardId: card.id,
    quantity: card.quantity,
  })),
};

function fixture(): AiDecisionCheckpointV1 {
  const state = createGameAfterSetup({
    seed: "decision-checkpoint-runner",
    agendaPointsToWin: 7,
    corpDeck: DEMO_DECKS.demo_corp_001,
    runnerDeck: DEMO_DECKS.demo_runner_001,
  });
  return {
    schemaVersion: AI_DECISION_CHECKPOINT_SCHEMA_VERSION,
    checkpointId: "checkpoint-runner-smoke",
    source: {
      kind: "synthetic_companion",
      findingId: "checkpoint-runner-smoke",
      capturedAt: "2026-07-12T00:00:00.000Z",
      matchId: state.matchId,
      stateVersion: state.stateVersion,
    },
    compatibility: {
      engineSchemaVersion: state.baseline.engineSchemaVersion,
      aiRuntimeCheckpointVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION,
    },
    actor: "corp",
    difficulty: "hard",
    profileId: PROFILE,
    deckSnapshot: DECK,
    engine: {
      stateVersion: state.stateVersion,
      stateHash: hashGameState(state),
      testOnlyGameState: state,
      eventPrefix: [],
    },
    runtime: { schemaVersion: AI_RUNTIME_CHECKPOINT_SCHEMA_VERSION },
    expectation: { acceptableActions: [{ type: "mandatory_draw" }] },
  };
}

function buildInput(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    profileId: PROFILE,
    decisionId: `${state.matchId}:${state.stateVersion}:corp`,
    ownDeckSnapshot: DECK,
  });
}
