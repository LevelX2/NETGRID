import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { runnerInevitableCorpDeckoutSemanticChoice } from "./runner-inevitable-corp-deckout-choice";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";

describe("runner inevitable Corp deckout choice", () => {
  it("selects legal end turn when the next mandatory Corp draw is empty", () => {
    const endTurn = action("end-turn", "end_turn");
    const broker = action("broker", "activated_card_ability");
    const selected = runnerInevitableCorpDeckoutSemanticChoice(
      input(0),
      [choice(broker, 2_000), choice(endTurn, -500)],
    );

    expect(selected?.action.actionId).toBe(endTurn.actionId);
    expect(selected?.reasonCode).toBe(
      "runner.endgame.inevitable_corp_deckout",
    );
    expect(selected?.evidence).toContain(
      "runner_inevitable_corp_deckout:true",
    );
    expect(selected?.score).toBeGreaterThanOrEqual(100_000);
  });

  it("does not lock end turn while Corp R&D still has a card", () => {
    const endTurn = action("end-turn", "end_turn");

    expect(
      runnerInevitableCorpDeckoutSemanticChoice(input(1), [
        choice(endTurn, -500),
      ]),
    ).toBeUndefined();
  });
});

function input(corpDeckCount: number): AiDecisionInput {
  const endTurn = action("end-turn", "end_turn");
  return {
    side: "runner",
    playerView: {
      stateVersion: 1,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: { instanceId: "runner-id", known: true },
        credits: 5,
        clicks: 1,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "corp-id", known: true },
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: corpDeckCount,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [endTurn],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [endTurn],
    difficulty: "hard",
    seed: "runner-deckout-test",
    decisionId: "runner-deckout-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  } as AiDecisionInput;
}

function action(
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: type === "end_turn" ? "game_rule" : "runner-resource",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload: {},
  };
}

function choice(
  legalAction: LegalAction,
  score: number,
): SemanticRuntimeChoice {
  return {
    action: legalAction,
    scopeId: "test",
    score,
    scoreBreakdown: [],
    reasonCode: "test",
    explanation: "test",
    evidence: [],
  };
}
