import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { runnerTerminalContestThreat } from "./runner-terminal-contest-threat";

describe("runnerTerminalContestThreat", () => {
  it("recognizes a public two-point terminal remote without revealing its card", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 5, advancement: 2 })),
    ).toMatchObject({
      kind: "visible_two_point_remote",
      pointsNeeded: 2,
      remoteServerIds: ["remote_1"],
    });
  });

  it("does not invent a two-point terminal threat without visible advancement", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 5, advancement: 0 })),
    ).toBeUndefined();
  });

  it("does not generalize the two-point signal to three missing points", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 4, advancement: 3 })),
    ).toBeUndefined();
  });

  it("focuses an occupied remote that the Corp publicly used to score at matchpoint", () => {
    const decisionInput = input({ agendaPoints: 6, advancement: 0 });
    decisionInput.playerView.publicEvents = [
      {
        eventId: "corp-score-remote-1",
        type: "score_agenda",
        stateVersionBefore: 4,
        stateVersionAfter: 5,
        turnSerial: 2,
        stateHashAfter: "fnv1a:corp-score-remote-1",
        publicPayload: {
          actor: "corp",
          actionType: "score_agenda",
          targets: { scoredFromServerId: "remote_1" },
        },
      },
    ];
    decisionInput.eventTail = decisionInput.playerView.publicEvents;

    expect(runnerTerminalContestThreat(decisionInput)).toMatchObject({
      kind: "opponent_matchpoint",
      pointsNeeded: 1,
      remoteServerIds: ["remote_1"],
      evidence: expect.arrayContaining([
        "terminal_contest_public_basis:occupied_remote_previously_scored_by_corp",
      ]),
    });
  });

  it("does not focus an occupied matchpoint remote without a public scoring pattern", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 6, advancement: 0 })),
    ).toMatchObject({
      kind: "opponent_matchpoint",
      pointsNeeded: 1,
      remoteServerIds: [],
    });
  });
});

function input(params: {
  agendaPoints: number;
  advancement: number;
}): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      agendaPointsToWin: 7,
      opponent: { agendaPoints: params.agendaPoints },
      publicEvents: [],
      servers: [
        {
          id: "remote_1",
          ice: [],
          root: [
            {
              instanceId: "unknown-root",
              known: false,
              advancementCounters: params.advancement,
            },
          ],
        },
      ],
    },
    eventTail: [],
  } as unknown as AiDecisionInput;
}
