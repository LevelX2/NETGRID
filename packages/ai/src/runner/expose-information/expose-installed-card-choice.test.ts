import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  runnerExposeInstalledOpportunity,
  selectedRunnerExposeInstalledCardChoiceOptionIds,
} from "./expose-installed-card-choice";

describe("runner installed-card expose choice", () => {
  it("prefers an unseen remote root over a previously exposed central ICE", () => {
    const current = input();
    const choice = current.playerView.pendingChoice!;

    expect(
      selectedRunnerExposeInstalledCardChoiceOptionIds(
        current,
        choice,
        choice.options,
      ),
    ).toEqual(["card_hidden_remote_root"]);
  });

  it("moves to another position after the remote root was exposed exactly", () => {
    const current = input();
    current.eventTail.push(exposeEvent("r1", "root", 0));
    const choice = current.playerView.pendingChoice!;

    expect(
      selectedRunnerExposeInstalledCardChoiceOptionIds(
        current,
        choice,
        choice.options,
      ),
    ).toEqual(["card_hidden_remote_ice"]);
  });

  it("forgets the ICE slot replaced by a public Singapore City Grid swap", () => {
    const current = input();
    current.eventTail.push(exposeEvent("r1", "ice", 0), {
      eventId: 4,
      type: "resolve_choice",
      stateVersionBefore: 2,
      stateVersionAfter: 3,
      stateHashAfter: "swap",
      publicPayload: {
        actor: "corp",
        actionType: "resolve_choice",
        hiddenZoneAction: "hq_ice_swap_swap",
        serverId: "r1",
        iceIndex: 0,
      },
    });
    expect(runnerExposeInstalledOpportunity(current).unseenPositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serverId: "r1",
          area: "ice",
          index: 0,
        }),
      ]),
    );
  });

  it("diagnoses a required expose target with no visible position binding", () => {
    const current = input();
    current.legalActions = [];
    current.playerView.stateVersion = 1;
    current.playerView.timingPoint = "runner_action.main";
    expect(() =>
      selectedRunnerExposeInstalledCardChoiceOptionIds(
        current,
        current.playerView.pendingChoice!,
        [{ id: "card_unbound", label: "Unbound" }],
      ),
    ).toThrow(expect.objectContaining({ code: "step_target_mismatch" }));
  });

  it("reports no unseen position after every hidden target was exposed", () => {
    const current = input();
    current.eventTail.push(
      exposeEvent("hq", "ice", 0),
      exposeEvent("r1", "ice", 0, 3),
      exposeEvent("r1", "root", 0, 4),
    );

    expect(runnerExposeInstalledOpportunity(current).unseenPositions).toEqual(
      [],
    );
  });

  it("remembers the aligned outermost ICE positions exposed by one Guide event", () => {
    const current = input();
    current.eventTail.push({
      eventId: 3,
      type: "play_event",
      stateVersionBefore: 1,
      stateVersionAfter: 2,
      stateHashAfter: "hash-guide-expose",
      publicPayload: {
        actor: "runner",
        actionType: "play_event",
        publicRevealKind: "expose",
        exposedServerIds: "hq,r1",
        exposedPositionKeys: "ice:0,ice:0",
        publicRevealDefinitionIds: "wall,code-gate",
      },
    } as AiDecisionInput["eventTail"][number]);

    expect(
      runnerExposeInstalledOpportunity(current).unseenPositions.map(
        (position) => `${position.serverId}:${position.area}:${position.index}`,
      ),
    ).toEqual(["r1:root:0"]);
  });

  it("treats a replacement card at an exposed remote-root position as unseen", () => {
    const current = input();
    current.eventTail.push(
      exposeEvent("r1", "root", 0),
      installEvent("r1", "root"),
    );
    current.playerView.servers[1]!.root = [
      {
        instanceId: "replacement_remote_root",
        known: false,
        advancementCounters: 1,
      },
    ];
    const choice = current.playerView.pendingChoice!;
    choice.options = [
      { id: "card_hidden_remote_ice", label: "Remote 1 ICE 1" },
      { id: "card_replacement_remote_root", label: "Remote 1 Root 1" },
    ];

    expect(
      selectedRunnerExposeInstalledCardChoiceOptionIds(
        current,
        choice,
        choice.options,
      ),
    ).toEqual(["card_replacement_remote_root"]);
  });
});

function input(): AiDecisionInput {
  return {
    side: "runner",
    eventTail: [legacyExposeEvent("hq")],
    playerView: {
      publicEvents: [],
      servers: [
        {
          id: "hq",
          ice: [{ instanceId: "hidden_hq_ice", known: false }],
          root: [],
        },
        {
          id: "r1",
          ice: [{ instanceId: "hidden_remote_ice", known: false }],
          root: [
            {
              instanceId: "hidden_remote_root",
              known: false,
              advancementCounters: 1,
            },
          ],
        },
      ],
      pendingChoice: {
        choiceId: "expose-choice",
        side: "runner",
        source: "p3_36.expose_installed_card:test",
        prompt: "Expose",
        kind: "select_cards",
        options: [
          { id: "card_hidden_hq_ice", label: "HQ ICE 1" },
          { id: "card_hidden_remote_ice", label: "Remote 1 ICE 1" },
          { id: "card_hidden_remote_root", label: "Remote 1 Root 1" },
        ],
        minSelections: 1,
        maxSelections: 1,
        stateVersion: 1,
        visibility: "hidden_info_barrier",
      },
    },
  } as unknown as AiDecisionInput;
}

function exposeEvent(
  serverId: string,
  area: "ice" | "root",
  index: number,
  stateVersionAfter = 2,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId: stateVersionAfter + 1,
    type: "resolve_choice",
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `hash-${serverId}-${area}-${index}`,
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      exposedServerId: serverId,
      exposedArea: area,
      exposedIndex: index,
    },
  } as AiDecisionInput["eventTail"][number];
}

function legacyExposeEvent(
  serverId: string,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId: 2,
    type: "resolve_choice",
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: `hash-legacy-${serverId}`,
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      exposedServerId: serverId,
    },
  } as AiDecisionInput["eventTail"][number];
}

function installEvent(
  serverId: string,
  placement: "ice" | "root",
): AiDecisionInput["eventTail"][number] {
  return {
    eventId: 4,
    type: "install_card",
    stateVersionBefore: 2,
    stateVersionAfter: 3,
    stateHashAfter: `hash-install-${serverId}-${placement}`,
    publicPayload: {
      actor: "corp",
      actionType: "install_card",
      serverId,
      placement,
    },
  } as AiDecisionInput["eventTail"][number];
}
