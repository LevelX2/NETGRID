import type { AiDecisionInput, PlayerView, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { BeliefState } from "./belief-state";
import { evaluateKnownRemoteAccessPayoff } from "./known-remote-access-payoff";

describe("evaluateKnownRemoteAccessPayoff", () => {
  it("treats a visible empty remote as known to have no current payoff", () => {
    const input = inputWithUnidentifiedKnownRoot("remote_1");
    input.playerView.servers[0]!.root = [];

    expect(
      evaluateKnownRemoteAccessPayoff(
        input,
        "remote_1",
        beliefWithInvalidations([]),
      ),
    ).toMatchObject({
      payoff: "known_low_value",
      accessDecision: "decline",
      declineReason: "no_current_payoff",
      contestable: false,
      knownNoCurrentPayoff: true,
      penalty: 420,
    });
  });

  it("matches remote invalidation entries by bounded server id", () => {
    expect(
      evaluateKnownRemoteAccessPayoff(
        inputWithUnidentifiedKnownRoot("remote_1"),
        "remote_1",
        beliefWithInvalidations(["server:remote_1:root_changed"]),
      ).payoff,
    ).toBe("changed");
    expect(
      evaluateKnownRemoteAccessPayoff(
        inputWithUnidentifiedKnownRoot("remote_1"),
        "remote_1",
        beliefWithInvalidations(["server:remote_10:root_changed"]),
      ).payoff,
    ).toBe("unknown");
  });

  it("keeps a declined free-trash target free of trash-only projection fields", () => {
    const payoff = evaluateKnownRemoteAccessPayoff(
      inputWithDepletedFreeTrashTarget(),
      "remote_1",
      beliefWithInvalidations([]),
    );

    expect(payoff).toMatchObject({
      payoff: "known_low_value",
      accessDecision: "decline",
      declineReason: "low_value_target",
    });
    expect(payoff.evidence).toContain(
      "access_decision_projection:decline_trash",
    );
    expect(payoff.evidence).not.toContain(
      "access_decision_projection:free_trash",
    );
    expect(payoff.evidence).not.toContain(
      "access_decision_projection:trash_cost_waiver",
    );
  });

  it("prices only remaining ICE after the active run has reached the server", () => {
    const input = inputWithDepletedFreeTrashTarget();
    input.playerView.own.credits = 12;
    input.playerView.servers[0]!.root = [
      visibleCard("dr-dreff", {
        definitionId: "onr_v1_358_dr-dreff",
        title: "Dr. Dreff",
        type: "upgrade",
        trashCost: 3,
        rezzed: true,
      }),
    ];
    input.playerView.servers[0]!.ice = [
      visibleCard("passed-data-wall", {
        definitionId: "onr_v1_237_data-wall",
        title: "Data Wall",
        type: "ice",
        rezzed: true,
      }),
    ];
    input.playerView.run = {
      attackedServerId: "remote_1",
      phase: "movement",
      position: { kind: "server", serverId: "remote_1" },
      successful: false,
    };

    expect(
      evaluateKnownRemoteAccessPayoff(
        input,
        "remote_1",
        beliefWithInvalidations([]),
      ),
    ).toMatchObject({
      payoff: "trash_affordable",
      accessDecision: "trash",
      knownNoCurrentPayoff: false,
    });
  });
});

function inputWithDepletedFreeTrashTarget(): AiDecisionInput {
  const root = visibleCard("depleted-holovid", {
    definitionId: "onr_v1_326_holovid-campaign",
    title: "Holovid Campaign",
    type: "asset",
    counters: { bit: 0 },
  });
  const playerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleCard("runner-identity", {
        definitionId: "runner-identity",
        type: "identity",
      }),
      credits: 10,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: [
        visibleCard("kilroy", {
          definitionId: "onr_v1_096_kilroy-was-here",
          title: "Kilroy Was Here",
          type: "event",
        }),
      ],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleCard("corp-identity", {
        definitionId: "corp-identity",
        type: "identity",
      }),
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
    servers: [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [root],
      },
    ],
    publicEvents: [],
    legalActions: [],
    winner: null,
    agendaPointsToWin: 7,
  } as PlayerView;
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "known-remote-declined-free-trash",
    decisionId: "known-remote-declined-free-trash:runner:1",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function inputWithUnidentifiedKnownRoot(serverId: string): AiDecisionInput {
  return {
    playerView: {
      servers: [
        {
          id: serverId,
          root: [{ known: true }],
          ice: [],
        },
      ],
      own: {
        credits: 5,
        rig: [],
      },
    },
  } as unknown as AiDecisionInput;
}

function beliefWithInvalidations(invalidationLog: string[]): BeliefState {
  return {
    invalidationLog,
  } as unknown as BeliefState;
}

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId"> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
  };
}
