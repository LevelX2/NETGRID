import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { corpVisibleMeatDamagePayoff } from "./corp-tag-punish-visible-payoff";

describe("corpVisibleMeatDamagePayoff", () => {
  it("does not count brain damage in HQ as a meat damage payoff", () => {
    const input = corpInput();
    input.playerView.own.gripOrHq = [
      card("scrub", 443),
    ];

    expect(corpVisibleMeatDamagePayoff(input)).toBe(false);
  });

  it("does not treat an Archives card as a live damage payoff", () => {
    const scorched = card("scorched", 514);
    const input = corpInput();
    input.playerView.own.heapOrArchives = [scorched];
    input.playerView.servers = [
      {
        id: "archives",
        label: "Archives",
        ice: [],
        root: [scorched],
      },
    ];

    expect(corpVisibleMeatDamagePayoff(input)).toBe(false);

    input.playerView.own.heapOrArchives = [];
    input.playerView.own.gripOrHq = [scorched];
    input.playerView.servers = [];

    expect(corpVisibleMeatDamagePayoff(input)).toBe(true);
  });
});

function corpInput(): AiDecisionInput {
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "visible-payoff-test",
    seed: "visible-payoff-test",
    decisionId: "visible-payoff-test",
    actionNumber: 1,
    legalActions: [],
    eventTail: [],
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-identity", 3),
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
        identity: card("runner-identity", 587),
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
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  };
}

function card(instanceId: string, definitionId: number): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: instanceId,
    type: "operation",
    known: true,
    owner: "corp",
    controller: "corp",
  };
}
