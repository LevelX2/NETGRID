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

  it("defers a repeated known agenda access until its observed damage is survivable", () => {
    const input = inputWithDepletedFreeTrashTarget();
    input.playerView.stateVersion = 12;
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("only-grip-card", { definitionId: "runner-card" }),
    ];
    input.playerView.servers[0]!.root = [
      visibleCard("known-damage-agenda", {
        definitionId: "onr_proteus_004_fetal-ai",
        title: "Known Damage Agenda",
        type: "agenda",
      }),
    ];
    input.eventTail = input.playerView.publicEvents = [
      {
        eventId: "evt-access",
        type: "access_card",
        stateVersionBefore: 10,
        stateVersionAfter: 11,
        stateHashAfter: "fnv1a:access",
        publicPayload: {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          cardDefinitionId: "onr_proteus_004_fetal-ai",
          accessedCardPositionKey: "root:0",
          damageResolved: true,
          damageType: "net",
          damageAmount: 2,
        },
      },
      {
        eventId: "evt-decline",
        type: "decline_trash",
        stateVersionBefore: 11,
        stateVersionAfter: 12,
        stateHashAfter: "fnv1a:decline",
        publicPayload: {
          actor: "runner",
          actionType: "decline_trash",
          serverId: "remote_1",
          stealCost: 2,
          stealBlockedByCost: true,
        },
      },
    ];
    const belief = beliefWithKnownRemoteRoot(
      "remote_1",
      "root:0",
      "onr_proteus_004_fetal-ai",
      "evt-access",
    );

    const unsafe = evaluateKnownRemoteAccessPayoff(input, "remote_1", belief);
    expect(unsafe).toMatchObject({
      payoff: "agenda",
      accessDecision: "defer_until_safe",
      declineReason: "unsafe_access_damage",
      contestable: false,
    });
    expect(unsafe.evidence).toEqual(
      expect.arrayContaining([
        "known_remote_agenda_steal_cost:2",
        "known_remote_access_damage_amount:2",
        "known_remote_access_damage_survivable:false",
      ]),
    );

    input.playerView.own.credits = 2;
    input.playerView.own.gripOrHq.push(
      visibleCard("second-grip-card", { definitionId: "runner-card-2" }),
      visibleCard("third-grip-card", { definitionId: "runner-card-3" }),
    );
    expect(
      evaluateKnownRemoteAccessPayoff(input, "remote_1", belief),
    ).toMatchObject({
      payoff: "agenda",
      accessDecision: "steal",
      contestable: true,
    });
  });

  it("defers a known payable TRAP when its Net damage breaks the hand buffer", () => {
    const input = inputWithDepletedFreeTrashTarget();
    input.playerView.own.gripOrHq = [
      visibleCard("grip-1"),
      visibleCard("grip-2"),
      visibleCard("grip-3"),
    ];
    input.playerView.opponent.credits = 4;
    input.playerView.servers[0]!.root = [
      visibleCard("trap-1", { known: false, advancementCounters: 0 }),
    ];
    const payoff = evaluateKnownRemoteAccessPayoff(
      input,
      "remote_1",
      beliefWithKnownRemoteRoot(
        "remote_1",
        "root:0",
        "onr_v1_345_trap",
        "evt-expose-trap",
      ),
    );

    expect(payoff).toMatchObject({
      accessDecision: "defer_until_safe",
      declineReason: "unsafe_access_damage",
      contestable: false,
      knownAccessThreatProjection: {
        status: "complete",
        sourceDefinitionId: "onr_v1_345_trap",
        activationCreditCost: 4,
        corpCanPayActivation: true,
        damage: {
          type: "net",
          amount: 3,
          runnerHandBufferPreserved: false,
        },
      },
    });
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "known_access_effect_source:onr_v1_345_trap",
        "known_access_effect_damage:net:3",
        "remote_run_deferred_for_known_access_damage:true",
      ]),
    );
  });

  it("treats TRAP's optional effect as currently inapplicable when Corp cannot pay", () => {
    const input = inputWithDepletedFreeTrashTarget();
    input.playerView.opponent.credits = 3;
    input.playerView.servers[0]!.root = [
      visibleCard("trap-1", { known: false }),
    ];
    const payoff = evaluateKnownRemoteAccessPayoff(
      input,
      "remote_1",
      beliefWithKnownRemoteRoot(
        "remote_1",
        "root:0",
        "onr_v1_345_trap",
        "evt-expose-trap",
      ),
    );
    expect(payoff.contestable).toBe(true);
    expect(payoff.declineReason).not.toBe("unsafe_access_damage");
    expect(payoff.evidence).toEqual(
      expect.arrayContaining([
        "known_access_effect_status:not_applicable",
        "known_access_effect_corp_can_pay:false",
      ]),
    );
  });

  it("does not infer TRAP without exact public knowledge", () => {
    const input = inputWithDepletedFreeTrashTarget();
    input.playerView.opponent.credits = 5;
    input.playerView.servers[0]!.root = [
      visibleCard("hidden-root", { known: false }),
    ];
    const payoff = evaluateKnownRemoteAccessPayoff(
      input,
      "remote_1",
      beliefWithInvalidations([]),
    );
    expect(payoff.payoff).toBe("unknown");
    expect(payoff.evidence.join("|")).not.toContain("onr_v1_345_trap");
  });

  it("does not value a known program-trash Ambush as material without visible targets", () => {
    const input = inputWithDepletedFreeTrashTarget();
    input.playerView.own.rig = [];
    input.playerView.servers[0]!.root = [
      visibleCard("experimental-ai-1", {
        known: false,
        advancementCounters: 3,
      }),
    ];
    const payoff = evaluateKnownRemoteAccessPayoff(
      input,
      "remote_1",
      beliefWithKnownRemoteRoot(
        "remote_1",
        "root:0",
        "onr_v1_323_experimental-ai",
        "evt-expose-experimental-ai",
      ),
    );
    expect(payoff.knownAccessThreatProjection).toMatchObject({
      status: "complete",
      relevantVisibleTargetCount: 0,
      threatValue: 0,
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

function beliefWithKnownRemoteRoot(
  zone: string,
  positionKey: string,
  definitionId: string,
  sourceEventId: string,
): BeliefState {
  return {
    invalidationLog: [],
    runnerOpponentModel: {
      knownPositionMemory: [
        {
          zone,
          positionKey,
          definitionId,
          certainty: "observed",
          sourceEventId,
          invalidatedBy: [],
        },
      ],
    },
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
