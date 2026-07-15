import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  runnerExposeInstalledOpportunity,
  selectedRunnerExposeInstalledCardChoiceOptionIds,
} from "./runner-expose-installed-card-choice";

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
    current.eventTail.push(exposeEvent("remote_1", "root", 0));
    const choice = current.playerView.pendingChoice!;

    expect(
      selectedRunnerExposeInstalledCardChoiceOptionIds(
        current,
        choice,
        choice.options,
      ),
    ).toEqual(["card_hidden_remote_ice"]);
  });

  it("reports no unseen position after every hidden target was exposed", () => {
    const current = input();
    current.eventTail.push(
      exposeEvent("hq", "ice", 0),
      exposeEvent("remote_1", "ice", 0),
      exposeEvent("remote_1", "root", 0),
    );

    expect(runnerExposeInstalledOpportunity(current).unseenPositions).toEqual(
      [],
    );
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
          id: "remote_1",
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
): AiDecisionInput["eventTail"][number] {
  return {
    eventId: `expose-${serverId}-${area}-${index}`,
    type: "resolve_choice",
    stateVersionBefore: 1,
    stateVersionAfter: 2,
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
    eventId: `legacy-expose-${serverId}`,
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
