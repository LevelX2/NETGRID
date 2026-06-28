import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticDecisionFrame } from "./semantic-decision-frame";
import { buildCorpTacticalGoals } from "./corp-tactical-goals";
import { synthesizeNeutralTacticalGoals } from "./neutral-goal-synthesis";

describe("corp tactical goals", () => {
  it("builds scoreline, economy and central-defense goals from side-safe legal actions", () => {
    const frame = frameFor([
      legalAction("score-1", "score_agenda"),
      legalAction("gain-1", "gain_credit"),
      legalAction("rez-rd", "rez_ice"),
    ]);
    frame.actionCandidates = frame.actionCandidates.map((candidate) =>
      candidate.actionId === "rez-rd"
        ? {
            ...candidate,
            targetContext: {
              selectedTargets: [
                {
                  targetId: "rd",
                  targetKind: "server",
                  targetSide: "corp",
                  visibilityScope: "public",
                  evidence: ["server:rd"],
                },
              ],
              targetKind: "server",
              targetZones: ["rd"],
              targetSide: "corp",
              hiddenInfoPolicy: "engine_provided_targets_only",
              availableTargetsStatus: "engine_provided",
              targetProfileMatches: [],
              targetConstraintResults: [],
            },
          }
        : candidate,
    );

    const goals = buildCorpTacticalGoals(frame);

    expect(goals.map((goal) => goal.goalId)).toEqual([
      "corp.tactical.score_closeout",
      "corp.tactical.rez_relevant_ice",
      "corp.tactical.stabilize_economy",
    ]);
    expect(goals[1]).toEqual(
      expect.objectContaining({
        family: "corp_ice_defense",
        source: "boardstate",
        targetServerId: "rd",
        evidence: expect.arrayContaining(["corp_goal:rez_or_reserve_ice"]),
      }),
    );
    expect(JSON.stringify(goals)).not.toMatch(
      /cardInstances|privatePayload|fullGameState|sessionToken|decklist/i,
    );
  });

  it("does not invent tag-punish or damage goals without visible action evidence", () => {
    const frame = frameFor([
      legalAction("ability-1", "activated_card_ability"),
      legalAction("draw-1", "draw_card"),
    ]);

    const goals = buildCorpTacticalGoals(frame);

    expect(goals.some((goal) => goal.family === "tag_punish")).toBe(false);
    expect(goals.some((goal) => goal.family === "damage_pressure")).toBe(false);
  });

  it("builds punish and damage goals from structured signals only", () => {
    const frame = frameFor([
      legalAction("tag-punish", "trigger_ability"),
      legalAction("damage-window", "trigger_ability"),
    ]);
    frame.actionCandidates = frame.actionCandidates.map((candidate) => {
      if (candidate.actionId === "tag-punish") {
        return {
          ...candidate,
          semanticActionType: "tag.apply",
          actionTacticSignals: ["punish.payoff"],
        };
      }
      return {
        ...candidate,
        semanticActionType: "damage.net",
        actionTacticSignals: ["ambush.window"],
      };
    });

    const goals = buildCorpTacticalGoals(frame);

    expect(goals.map((goal) => goal.goalId)).toEqual([
      "corp.tactical.visible_tag_punish",
      "corp.tactical.visible_damage_or_ambush_window",
    ]);
  });

  it("ignores substring-only punish and damage signal noise", () => {
    const frame = frameFor([
      legalAction("tag-noise", "trigger_ability"),
      legalAction("damage-noise", "trigger_ability"),
    ]);
    frame.actionCandidates = frame.actionCandidates.map((candidate) =>
      candidate.actionId === "tag-noise"
        ? {
            ...candidate,
            semanticActionType: "tagalong.apply",
            actionTacticSignals: ["tagalong_punishment_noise"],
          }
        : {
            ...candidate,
            semanticActionType: "damaged_goods",
            actionTacticSignals: ["ambushment_noise"],
          },
    );

    const goals = buildCorpTacticalGoals(frame);

    expect(goals.some((goal) => goal.family === "tag_punish")).toBe(false);
    expect(goals.some((goal) => goal.family === "damage_pressure")).toBe(false);
  });

  it("builds score closeout goals from advancement-burst action semantics", () => {
    const frame = frameFor([legalAction("advance-burst", "play_operation")]);
    frame.actionCandidates = frame.actionCandidates.map((candidate) => ({
      ...candidate,
      actionTacticSignals: [
        ...candidate.actionTacticSignals,
        "corp.score_closeout",
        "advance.counter_cashout",
      ],
      evidence: [...candidate.evidence, "advance.counter_cashout"],
    }));

    const goals = buildCorpTacticalGoals(frame);

    expect(goals[0]).toEqual(
      expect.objectContaining({
        goalId: "corp.tactical.score_closeout",
        family: "corp_scoreline",
        priority: 860,
        evidence: expect.arrayContaining([
          "corp_goal:score_closeout",
          "corp_goal:score_closeout_semantic_signal",
        ]),
      }),
    );
  });

  it("feeds neutral goal synthesis with the explicit Corp goal module", () => {
    const goals = synthesizeNeutralTacticalGoals(
      frameFor([legalAction("score-1", "score_agenda")]),
    );

    expect(goals[0]).toEqual(
      expect.objectContaining({
        goalId: "corp.tactical.score_closeout",
        family: "corp_scoreline",
        evidence: expect.arrayContaining(["corp_goal:score_closeout"]),
      }),
    );
  });
});

function frameFor(legalActions: LegalAction[]) {
  const input = {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 11,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: visibleCard("corp-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
      },
      opponent: {
        identity: visibleCard("runner-identity"),
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
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "corp-tactical-goals",
    decisionId: "corp-tactical-goals",
    actionNumber: 11,
    profileId: "corp-test",
  } as any;
  return buildSemanticDecisionFrame({
    input,
    actionCandidates: buildActionSemanticCandidates({
      legalActions,
      observerSide: "corp",
      stateVersion: 11,
    }),
  });
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: type,
    source: "basic_action",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 11,
  };
}

function visibleCard(cardId: string) {
  return {
    instanceId: `${cardId}-instance`,
    definitionId: cardId,
    title: cardId,
    side: cardId.startsWith("corp") ? "corp" : "runner",
    type: "identity",
    zone: "identity",
    visibility: "public",
    known: true,
  };
}
