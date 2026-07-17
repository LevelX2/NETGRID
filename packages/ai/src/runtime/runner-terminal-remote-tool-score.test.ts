import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { runnerTerminalRemoteToolScoreComponent } from "./runner-terminal-remote-tool-score";

describe("runnerTerminalRemoteToolScoreComponent", () => {
  it("prioritizes visible expose semantics against a possible matchpoint remote", () => {
    const component = runnerTerminalRemoteToolScoreComponent(
      input({ advancementCounters: 0 }),
      action("see-ya", "activated_card_ability"),
      candidate("effect:expose_info"),
    );

    expect(component).toMatchObject({
      key: "runner_terminal_remote_tool",
      value: 1800,
    });
    expect(component?.reason).toContain("terminal_remote_tool:expose_info");
  });

  it("does not project immediate expose value onto an install without a response click", () => {
    const current = input({ advancementCounters: 0 });
    current.playerView.own.clicks = 2;
    current.playerView.own.credits = 8;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        installAction(3),
        candidate("effect:expose_info"),
      ),
    ).toBeUndefined();
  });

  it("does not project expose install value without the activation credit", () => {
    const current = input({ advancementCounters: 0 });
    current.playerView.own.clicks = 3;
    current.playerView.own.credits = 3;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        installAction(3),
        candidate("effect:expose_info"),
      ),
    ).toBeUndefined();
  });

  it("keeps expose installation valuable when the complete short sequence is funded", () => {
    const current = input({ advancementCounters: 0 });
    current.playerView.own.clicks = 3;
    current.playerView.own.credits = 4;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        installAction(3),
        candidate("effect:expose_info"),
      ),
    ).toMatchObject({
      key: "runner_terminal_remote_tool",
      value: 1800,
    });
  });

  it("penalizes repeating expose after every hidden position was exposed exactly", () => {
    const current = input({ advancementCounters: 0 });
    current.eventTail = [
      {
        eventId: "exposed-remote-root",
        type: "resolve_choice",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "hash-exposed-remote-root",
        publicPayload: {
          actor: "runner",
          actionType: "resolve_choice",
          exposedServerId: "remote_1",
          exposedArea: "root",
          exposedIndex: 0,
        },
      },
    ];

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("see-ya", "activated_card_ability"),
        candidate("effect:expose_info"),
      ),
    ).toMatchObject({
      key: "runner_expose_no_unseen_target",
      value: -3200,
    });
  });

  it("prioritizes visible ICE disruption for an advanced matchpoint remote", () => {
    const component = runnerTerminalRemoteToolScoreComponent(
      input({ advancementCounters: 2 }),
      action("forged", "play_event"),
      candidate("effect:ice_trash"),
    );

    expect(component).toMatchObject({
      key: "runner_terminal_remote_tool",
      value: 2200,
    });
    expect(component?.reason).toContain("terminal_remote_tool:ice_disruption");
  });

  it("does not create terminal urgency below the Corp matchpoint", () => {
    const current = input({ advancementCounters: 2 });
    current.playerView.opponent.agendaPoints = 4;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("forged", "play_event"),
        candidate("effect:ice_trash"),
      ),
    ).toBeUndefined();
  });

  it("values proactive expose against a confirmed visible damage strategy", () => {
    const current = confirmedDamageStrategyInput({ advancementCounters: 2 });
    current.playerView.opponent.agendaPoints = 4;

    const component = runnerTerminalRemoteToolScoreComponent(
      current,
      action("see-ya", "activated_card_ability"),
      candidate("effect:expose_info"),
    );

    expect(component).toMatchObject({
      key: "runner_damage_intelligence_tool",
      value: 1300,
    });
    expect(component?.reason).toContain("damage_deck_belief_level:confirmed");
    expect(component?.reason).toContain("advanced_hidden_roots:1");
  });

  it("keeps confirmed damage-deck knowledge useful after acute risk decays", () => {
    const current = confirmedDamageStrategyInput({ advancementCounters: 2 });
    current.playerView.opponent.agendaPoints = 4;
    current.playerView.stateVersion = 80;

    const component = runnerTerminalRemoteToolScoreComponent(
      current,
      action("see-ya", "activated_card_ability"),
      candidate("effect:expose_info"),
    );

    expect(component).toMatchObject({
      key: "runner_damage_intelligence_tool",
      value: 1300,
    });
    expect(component?.reason).toContain("damage_deck_belief_level:confirmed");
    expect(component?.reason).toContain("flatline_risk_level:suspected");
  });

  it("does not infer proactive SeeYa value from a merely suspected damage plan", () => {
    const current = input({ advancementCounters: 2 });
    current.playerView.opponent.agendaPoints = 4;
    current.playerView.stateVersion = 12;
    current.eventTail = [
      publicCardEvent(
        "seen-chance-observation",
        10,
        "onr_v1_284_chance-observation",
      ),
    ];

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("see-ya", "activated_card_ability"),
        candidate("effect:expose_info"),
      ),
    ).toBeUndefined();
  });

  it("keeps hand-buffer survival ahead of SeeYa under critical damage pressure", () => {
    const current = confirmedDamageStrategyInput({ advancementCounters: 2 });
    current.playerView.opponent.agendaPoints = 4;
    current.playerView.own.gripOrHq = [];

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("see-ya", "activated_card_ability"),
        candidate("effect:expose_info"),
      ),
    ).toBeUndefined();
  });

  it("requires a complete proactive install and activation sequence against damage", () => {
    const current = confirmedDamageStrategyInput({ advancementCounters: 2 });
    current.playerView.opponent.agendaPoints = 4;
    current.playerView.own.clicks = 3;
    current.playerView.own.credits = 3;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        installAction(3),
        candidate("effect:expose_info"),
      ),
    ).toBeUndefined();

    current.playerView.own.credits = 4;
    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        installAction(3),
        candidate("effect:expose_info"),
      ),
    ).toMatchObject({
      key: "runner_damage_intelligence_tool",
      value: 1300,
    });
  });

  it("does not spend SeeYa proactively for damage when only a central target is unseen", () => {
    const current = confirmedDamageStrategyInput({ advancementCounters: 0 });
    current.playerView.opponent.agendaPoints = 4;
    current.playerView.servers = [
      {
        id: "hq",
        label: "HQ",
        root: [],
        ice: [{ instanceId: "hidden-hq-ice", known: false, rezzed: false }],
      },
    ];

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("see-ya", "activated_card_ability"),
        candidate("effect:expose_info"),
      ),
    ).toBeUndefined();
  });

  it("does not start an ICE-disruption sequence without a follow-up click", () => {
    const current = input({ advancementCounters: 2 });
    current.playerView.own.clicks = 1;

    expect(
      runnerTerminalRemoteToolScoreComponent(
        current,
        action("forged", "play_event"),
        candidate("effect:ice_trash"),
      ),
    ).toBeUndefined();
  });
});

function input(options: { advancementCounters: number }): AiDecisionInput {
  return {
    side: "runner",
    eventTail: [],
    playerView: {
      agendaPointsToWin: 7,
      stateVersion: 20,
      publicEvents: [],
      own: {
        agendaPoints: 0,
        clicks: 4,
        credits: 8,
        tags: 0,
        maxHandSize: 5,
        gripOrHq: [
          hiddenCard("runner-grip-1"),
          hiddenCard("runner-grip-2"),
          hiddenCard("runner-grip-3"),
          hiddenCard("runner-grip-4"),
        ],
        heapOrArchives: [],
        rig: [],
        scoreArea: [],
      },
      opponent: {
        agendaPoints: 6,
        identity: {
          instanceId: "corp-identity",
          definitionId: "corp-identity",
          known: true,
        },
        discardCards: [],
        scoreArea: [],
        rig: [],
      },
      servers: [
        {
          id: "remote_1",
          root: [
            {
              instanceId: "hidden-root",
              known: false,
              advancementCounters: options.advancementCounters,
            },
          ],
          ice: [
            {
              instanceId: "rezzed-ice",
              definitionId: "visible-ice",
              known: true,
              rezzed: true,
            },
          ],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function confirmedDamageStrategyInput(options: {
  advancementCounters: number;
}): AiDecisionInput {
  const current = input(options);
  current.playerView.stateVersion = 14;
  current.eventTail = [
    publicCardEvent(
      "seen-chance-observation",
      10,
      "onr_v1_284_chance-observation",
    ),
    publicCardEvent("seen-urban-renewal", 12, "onr_v1_307_urban-renewal"),
  ];
  return current;
}

function publicCardEvent(
  eventId: string,
  stateVersionAfter: number,
  cardDefinitionId: string,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `hash-${eventId}`,
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      cardDefinitionId,
    },
  } as AiDecisionInput["eventTail"][number];
}

function hiddenCard(instanceId: string) {
  return { instanceId, known: false };
}

function action(actionId: string, type: LegalAction["type"]): LegalAction {
  return { actionId, side: "runner", type } as LegalAction;
}

function installAction(credits: number): LegalAction {
  return {
    actionId: "install-expose-tool",
    side: "runner",
    type: "install_card",
    costs: [{ clicks: 1, credits }],
  } as LegalAction;
}

function candidate(signal: string): ActionSemanticCandidate {
  return {
    actorSide: "runner",
    semanticActionType: signal,
    actionTacticSignals: [signal],
    cardContextSignals: [],
    evidence: [],
  } as unknown as ActionSemanticCandidate;
}
