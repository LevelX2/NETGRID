import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { traceTagExpectedSuccessEstimate } from "./trace-tag-success-estimate";

describe("trace tag expected success estimate", () => {
  it("returns no expected conversion against an overwhelming runner pool", () => {
    expect(traceTagExpectedSuccessEstimate(input(6, 109))).toBe(0);
  });

  it("keeps a strong conversion estimate when repeated traces can exhaust the runner", () => {
    expect(traceTagExpectedSuccessEstimate(input(6, 4))).toBe(1);
  });
});

function input(corpCredits: number, runnerCredits: number): AiDecisionInput {
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: { instanceId: "corp-id", known: true },
        credits: corpCredits,
        clicks: 3,
        agendaPoints: 5,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: { instanceId: "runner-id", known: true },
        credits: runnerCredits,
        clicks: 4,
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
    eventTail: [],
    legalActions: [],
    difficulty: "hard",
    seed: "trace-estimate",
    decisionId: "trace-estimate:1:corp",
    actionNumber: 1,
    profileId: "current_candidate",
  };
}
