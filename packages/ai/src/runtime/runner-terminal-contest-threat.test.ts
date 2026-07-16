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
  } as unknown as AiDecisionInput;
}
