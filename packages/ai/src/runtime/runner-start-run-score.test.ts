import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";
import { runnerStartRunScoreComponents } from "./runner-start-run-score";

describe("runnerStartRunScoreComponents", () => {
  it("surfaces empty HQ as a no-access payoff in start-run scoring", () => {
    const components = runnerStartRunScoreComponents(
      aiInput({ opponentHandCount: 0 }),
      startRun("hq"),
      dependencies(),
    );

    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_hq_empty_no_access_payoff",
          value: -3200,
          reason: "opponent_hand_count:0",
        }),
      ]),
    );
  });

  it("does not penalize HQ pressure while HQ still has visible cards", () => {
    const components = runnerStartRunScoreComponents(
      aiInput({ opponentHandCount: 1 }),
      startRun("hq"),
      dependencies(),
    );

    expect(components.map((component) => component.key)).not.toContain(
      "runner_hq_empty_no_access_payoff",
    );
  });
});

function dependencies(): Parameters<typeof runnerStartRunScoreComponents>[2] {
  return {
    serverId: (action) =>
      typeof action.payload?.serverId === "string"
        ? action.payload.serverId
        : undefined,
    hqMemoryComponents: () => [],
    rndMemoryComponents: () => [],
    archivesComponents: () => [],
    isRemoteServerTarget: (serverId) => serverId?.startsWith("remote_") ?? false,
    remoteComponents: () => [],
    knownIcePathComponents: () => [],
    repeatedRunTargetComponents: () => [],
  };
}

function startRun(serverId: string): LegalAction {
  return {
    actionId: `runner.start_run.${serverId}`,
    side: "runner",
    type: "start_run",
    label: `Run auf ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

function aiInput(params: { opponentHandCount: number }): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: 3,
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
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: params.opponentHandCount,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [{ id: "hq", label: "HQ", ice: [], root: [] }],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "runner-start-run-score-test",
    decisionId: "runner-start-run-score-test",
    actionNumber: 1,
    profileId: "runner-start-run-score-test",
  };
}

function visibleIdentity(side: "runner" | "corp"): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}
