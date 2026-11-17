import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { latestTraceContext } from "./trace-context";

describe("latestTraceContext", () => {
  it("reads the public trace limit without inventing a starting value", () => {
    const input = traceInput();
    input.playerView.stateVersion = 2;
    input.eventTail = [
      {
        eventId: "trace-started",
        type: "play_operation",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "hash",
        publicPayload: {
          traceLimit: 5,
          effectiveTraceLimit: 3,
          traceRulesProfile: "classic_blind",
        },
      },
    ];

    expect(latestTraceContext(input)).toMatchObject({
      traceLimit: 5,
      effectiveTraceLimit: 3,
      traceRulesProfile: "classic_blind",
      runnerLink: 0,
    });
    expect(latestTraceContext(input).traceValue).toBeUndefined();
  });

  it("uses the Runner's own payment capacity in its view", () => {
    const input = traceInput();
    input.side = "runner";
    input.playerView.side = "runner";
    input.playerView.own.credits = 2;
    input.playerView.trace = {
      traceId: "open-trace",
      sourceDefinitionId: 461,
      profile: "modern_open",
      phase: "runner_bid",
      printedTrace: 5,
      effectiveTraceLimit: 5,
      bidsRevealed: true,
      corpBidCommitted: true,
      runnerBidCommitted: false,
      visibleOpponentBidCapacity: 9,
    };

    expect(latestTraceContext(input).runnerMaximumPreRevealStrength).toBe(2);
  });

  it("includes visible static Runner link before the Runner bid", () => {
    const input = traceInput();
    input.playerView.opponent.identity.baseLink = 1;
    input.playerView.opponent.rig = [
      {
        instanceId: "link-card",
        definitionId: "visible-link-card",
        known: true,
        baseLink: 2,
      },
    ];

    expect(latestTraceContext(input).runnerLink).toBe(3);
  });

  it("merges the public Corp bid when the visible trace omits resolved strength", () => {
    const input = traceInput();
    input.playerView.stateVersion = 4;
    input.playerView.trace = {
      traceId: "hunter-trace",
      sourceDefinitionId: 461,
      profile: "modern_open",
      phase: "runner_bid",
      printedTrace: 5,
      effectiveTraceLimit: 5,
      bidsRevealed: true,
      corpBidCommitted: true,
      runnerBidCommitted: false,
      visibleOpponentBidCapacity: 4,
    };
    input.eventTail = [
      {
        eventId: "corp-bid",
        type: "resolve_choice",
        stateVersionBefore: 2,
        stateVersionAfter: 3,
        stateHashAfter: "hash",
        publicPayload: {
          sourceDefinitionId: 461,
          traceId: "hunter-trace",
          traceValue: 2,
          corpBid: 2,
          runnerLink: 0,
        },
      },
      {
        eventId: "other-trace",
        type: "resolve_choice",
        stateVersionBefore: 3,
        stateVersionAfter: 4,
        stateHashAfter: "hash-other",
        publicPayload: {
          traceId: "other-trace",
          sourceDefinitionId: 461,
          traceValue: 5,
          corpBid: 5,
        },
      },
    ];

    expect(latestTraceContext(input)).toMatchObject({
      traceLimit: 5,
      traceValue: 2,
      corpBid: 2,
      runnerLink: 0,
    });
  });
});

function traceInput(): AiDecisionInput {
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "trace-context-test",
    seed: "trace-context-test",
    decisionId: "trace-context-test",
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
        identity: { instanceId: "corp-identity", known: true },
        credits: 5,
        clicks: 2,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 0,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: "runner-identity",
          known: true,
          baseLink: 0,
        },
        credits: 5,
        clicks: 0,
        agendaPoints: 0,
        tags: 0,
        handCount: 0,
        maxHandSize: 5,
        deckCount: 0,
        discardCount: 0,
        scoreArea: [],
        rig: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
  };
}
