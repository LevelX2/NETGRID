import { describe, expect, it, vi } from "vitest";
import { quoteAccessReserve } from "./access-reserve-adapter";
import type { AiDecisionInput, PlayerView } from "@netgrid/shared";

describe("access reserve adapter", () => {
  it("uses RunnerEconomyPosture without evaluating the phase policy", () => {
    const remotePhaseReserve = vi.fn(() => 4);
    expect(
      quoteAccessReserve({
        input: aiInput(),
        remotePhaseReserve,
        economyPosture: {
          desiredCreditReserve: 8,
          creditReservePolicy: {
            reserveDrivers: ["visible_remote_score_threat"],
            reserveOverrides: ["late_contest"],
          },
        },
      }),
    ).toMatchObject({
      desiredCreditReserve: 8,
      source: "runner_economy_posture",
      evidence: expect.arrayContaining([
        "access_reserve_source:runner_economy_posture",
        "access_reserve_desired:8",
        "access_reserve_driver:visible_remote_score_threat",
        "access_reserve_override:late_contest",
      ]),
    });
    expect(remotePhaseReserve).not.toHaveBeenCalled();
  });

  it("uses the remote phase policy when no economy posture was requested", () => {
    expect(
      quoteAccessReserve({
        input: aiInput(),
        remotePhaseReserve: () => 5,
      }),
    ).toMatchObject({
      desiredCreditReserve: 5,
      source: "remote_phase_policy",
      evidence: expect.arrayContaining([
        "access_reserve_source:remote_phase_policy",
        "access_reserve_desired:5",
      ]),
    });
  });
});

function aiInput(): AiDecisionInput {
  return {
    side: "runner",
    playerView: playerView(),
    legalActions: [],
    eventTail: [],
    difficulty: "normal",
    seed: "access-reserve-adapter-test",
    decisionId: "access-reserve-adapter-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function playerView(): PlayerView {
  return {
    stateVersion: 12,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: { instanceId: "runner", known: true, type: "identity" },
      credits: 5,
      clicks: 3,
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
      identity: { instanceId: "corp", known: true, type: "identity" },
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
  };
}
