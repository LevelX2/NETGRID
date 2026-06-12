import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, PlayerView } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  buildSemanticDecisionFrame,
  type TacticalGoalLike,
} from "./semantic-decision-frame";
import { buildEmptySemanticDecisionTrace } from "./semantic-decision-trace";

describe("SemanticDecisionFrame", () => {
  it("contains exactly the LegalAction ids from AiDecisionInput", () => {
    const input = inputFor("runner", [
      legalAction("runner-1", "gain_credit", "runner"),
      legalAction("runner-2", "draw_card", "runner"),
    ]);
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    });

    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: candidates,
      tacticalGoals: [goal("runner.build_economy_base", "economy")],
    });

    expect(frame.legalActionIds).toEqual(["runner-1", "runner-2"]);
    expect(frame.actionCandidates.map((candidate) => candidate.actionId)).toEqual([
      "runner-1",
      "runner-2",
    ]);
    expect(frame.economyContext).toMatchObject({
      availableCredits: 5,
      clicksRemaining: 3,
      creditPressure: "low",
    });
    expect(frame.economyContext?.evidence).toEqual(
      expect.arrayContaining([
        "available_credits:5",
        "clicks_remaining:3",
        "credit_pressure:low",
      ]),
    );
    expect(frame.hiddenInfoPolicy).toBe("player_view_only");
  });

  it("rejects candidates that were not built from current LegalActions", () => {
    const input = inputFor("runner", [
      legalAction("runner-1", "gain_credit", "runner"),
    ]);
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [legalAction("runner-2", "draw_card", "runner")],
      observerSide: "runner",
      stateVersion: input.playerView.stateVersion,
    });

    expect(() =>
      buildSemanticDecisionFrame({
        input,
        actionCandidates: candidate ? [candidate] : [],
      }),
    ).toThrow(/non-legal action candidates/);
  });

  it("rejects forbidden hidden-info keys before serialization", () => {
    const input = inputFor("runner", [
      legalAction("runner-1", "gain_credit", "runner"),
    ]);

    expect(() =>
      buildSemanticDecisionFrame({
        input,
        beliefSummary: {
          fullGameState: { opponentHand: ["hidden-definition-id"] },
        },
      }),
    ).toThrow(/forbidden hidden-info marker/);
  });

  it("rejects forbidden hidden-info string values before serialization", () => {
    const input = inputFor("runner", [
      legalAction("runner-1", "gain_credit", "runner"),
    ]);

    expect(() =>
      buildSemanticDecisionFrame({
        input,
        evidence: ["safe_evidence", "fullGameState:opponent_hand"],
      }),
    ).toThrow(/forbidden hidden-info marker/);
  });

  it("builds deterministic runner and corp frames from equivalent inputs", () => {
    const runnerInput = inputFor("runner", [
      legalAction("runner-1", "gain_credit", "runner"),
      legalAction("runner-2", "end_turn", "runner"),
    ]);
    const corpInput = inputFor("corp", [
      legalAction("corp-1", "gain_credit", "corp"),
      legalAction("corp-2", "end_turn", "corp"),
    ]);

    const runnerA = buildSemanticDecisionFrame({
      input: runnerInput,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: runnerInput.legalActions,
        observerSide: "runner",
        stateVersion: runnerInput.playerView.stateVersion,
      }),
      evidence: ["test:runner"],
    });
    const runnerB = buildSemanticDecisionFrame({
      input: runnerInput,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: runnerInput.legalActions,
        observerSide: "runner",
        stateVersion: runnerInput.playerView.stateVersion,
      }),
      evidence: ["test:runner"],
    });
    const corpFrame = buildSemanticDecisionFrame({
      input: corpInput,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: corpInput.legalActions,
        observerSide: "corp",
        stateVersion: corpInput.playerView.stateVersion,
      }),
    });

    expect(JSON.stringify(runnerA)).toBe(JSON.stringify(runnerB));
    expect(runnerA.side).toBe("runner");
    expect(corpFrame.side).toBe("corp");
    expect(JSON.stringify(runnerA)).not.toContain("privatePayload");
    expect(JSON.stringify(corpFrame)).not.toContain("cardInstances");
  });

  it("derives high credit pressure from side-safe runner economy posture", () => {
    const input = inputFor("runner", [
      legalAction("runner-1", "gain_credit", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      runner: {
        economyPosture: {
          minimumCreditFloor: 2,
          desiredCreditReserve: 5,
          fundingNeed: true,
          recommendation: "build_economy",
          evidence: ["test_economy_posture"],
        } as any,
      },
    });

    expect(frame.economyContext?.creditPressure).toBe("high");
    expect(JSON.stringify(frame.economyContext)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState/i,
    );
  });

  it("creates an empty trace without selectedActionId before ranking", () => {
    const input = inputFor("runner", [
      legalAction("runner-1", "gain_credit", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({ input });

    const trace = buildEmptySemanticDecisionTrace(frame);

    expect(trace.schemaVersion).toBe("semantic-decision-trace-v1");
    expect(trace.frameSummary.legalActionCount).toBe(1);
    expect(trace.rankedActions).toEqual([]);
    expect(trace.selectedActionId).toBeUndefined();
    expect(trace.noRuntimeEffect).toBe(true);
  });
});

function goal(goalId: string, family: string): TacticalGoalLike {
  return {
    goalId,
    family,
    priority: 80,
    urgency: "high",
    source: "boardstate",
    evidence: ["test_goal"],
  };
}

function inputFor(side: "runner" | "corp", legalActions: LegalAction[]): AiDecisionInput {
  return {
    side,
    playerView: playerViewFor(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "seed",
    decisionId: `${side}:decision`,
    actionNumber: 12,
    profileId: `${side}:profile`,
  };
}

function playerViewFor(side: "runner" | "corp", legalActions: LegalAction[]): PlayerView {
  return {
    side,
    stateVersion: 12,
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    own: {
      identity: visibleCard(`${side}-identity`),
      credits: 5,
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
  };
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  side: "runner" | "corp",
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: type,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 12,
  };
}
