import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { runnerInput } from "../runner-hand-development.test-support";

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

  it("recognizes a protected hidden remote at the Corp two-point matchpoint", () => {
    expect(
      runnerTerminalContestThreat(
        input({ agendaPoints: 5, advancement: 0, iceCount: 3 }),
      ),
    ).toMatchObject({
      kind: "protected_two_point_matchpoint_remote",
      pointsNeeded: 2,
      remoteServerIds: ["remote_1"],
      evidence: expect.arrayContaining([
        "terminal_contest_public_basis:protected_unknown_root_at_two_point_matchpoint",
      ]),
    });
  });

  it("recognizes a one-advanced remote that can score a three-point agenda next turn", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 4, advancement: 1 })),
    ).toMatchObject({
      kind: "visible_three_point_remote",
      pointsNeeded: 3,
      remoteServerIds: ["remote_1"],
    });
  });

  it("does not invent a three-point terminal threat without visible advancement", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 4, advancement: 0 })),
    ).toBeUndefined();
  });

  it("recognizes an advanced remote that can complete a four-point Corp win", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 3, advancement: 2 })),
    ).toMatchObject({
      kind: "visible_four_point_remote",
      pointsNeeded: 4,
      remoteServerIds: ["remote_1"],
    });
  });

  it("includes the first public advancement in a possible four-point scoring turn", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 3, advancement: 1 })),
    ).toMatchObject({ remoteServerIds: ["remote_1"] });
  });

  it("does not infer a four-point win from an unadvanced remote", () => {
    expect(
      runnerTerminalContestThreat(input({ agendaPoints: 3, advancement: 0 })),
    ).toBeUndefined();
  });

  it("excludes a known non-agenda from the four-point threat", () => {
    const decisionInput = input({ agendaPoints: 3, advancement: 2 });
    Object.assign(decisionInput.playerView.servers[0]!.root[0]!, {
      known: true,
      type: "asset",
    });
    expect(runnerTerminalContestThreat(decisionInput)).toBeUndefined();
  });

  it("does not turn an exposed smaller agenda into a four-point threat", () => {
    const decisionInput = input({ agendaPoints: 3, advancement: 2 });
    Object.assign(decisionInput.playerView.servers[0]!.root[0]!, {
      known: true,
      type: "agenda",
      agendaPoints: 2,
    });
    expect(runnerTerminalContestThreat(decisionInput)).toBeUndefined();
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
  iceCount?: number;
}): AiDecisionInput {
  const decisionInput = runnerInput({
    credits: 5,
    hand: [],
    legalActions: [],
    servers: [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: Array.from({ length: params.iceCount ?? 0 }, (_, index) => ({
          instanceId: `hidden-ice-${index}`,
          known: false,
        })),
        root: [
          {
            instanceId: "unknown-root",
            known: false,
            advancementCounters: params.advancement,
          },
        ],
      },
    ],
  });
  decisionInput.playerView.opponent.agendaPoints = params.agendaPoints;
  return decisionInput;
}
