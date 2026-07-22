import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { AiDecisionInputWithDeckCapabilities } from "../ai-decision-input";
import { corpMatchpointHqProtectionComponent } from "./semantic-runtime-corp-score-scoreline-components";

describe("Corp matchpoint HQ protection", () => {
  it("does not protect agenda-free HQ from an old lifetime access", () => {
    const input = matchpointInput([]);
    input.eventTail = [hqAccess("old-hq-access", 10)];
    input.playerView.stateVersion = 100;

    expect(corpMatchpointHqProtectionComponent(input, installHqIce())).toBe(
      undefined,
    );
  });

  it("protects a known HQ agenda under current HQ access pressure", () => {
    const input = matchpointInput([agenda("agenda-in-hq")]);
    input.eventTail = [hqAccess("recent-hq-access", 98)];
    input.playerView.stateVersion = 100;

    expect(
      corpMatchpointHqProtectionComponent(input, installHqIce()),
    ).toMatchObject({
      key: "corp_matchpoint_hq_protection_alignment",
      value: 2200,
      reason: expect.stringContaining("hq_agenda_count:1"),
    });
  });
});

function matchpointInput(
  hq: VisibleCard[],
): AiDecisionInputWithDeckCapabilities {
  return {
    side: "corp",
    difficulty: "hard",
    profileId: "matchpoint-hq-test",
    seed: "matchpoint-hq-test",
    decisionId: "matchpoint-hq-test",
    actionNumber: 100,
    legalActions: [installHqIce()],
    eventTail: [],
    ownDeckSnapshot: {
      deckSnapshotId: "matchpoint-hq-test",
      side: "corp",
      cards: [
        { cardId: "onr_v1_196_corporate-war", quantity: 3 },
        { cardId: "onr_v1_252_keeper", quantity: 36 },
      ],
    },
    playerView: {
      side: "corp",
      stateVersion: 100,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-identity", "corp-identity", "identity"),
        credits: 8,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: hq,
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-identity", "runner-identity", "identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 6,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [agenda("runner-scored-1"), agenda("runner-scored-2")],
        rig: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
      ],
      publicEvents: [],
      legalActions: [installHqIce()],
      winner: null,
      agendaPointsToWin: 7,
    },
  } as AiDecisionInputWithDeckCapabilities;
}

function installHqIce(): LegalAction {
  return {
    actionId: "install-hq-ice",
    side: "corp",
    type: "install_card",
    label: "Install HQ ICE",
    source: "hq-ice",
    costs: [{ clicks: 1 }],
    payload: { placement: "ice", serverId: "hq" },
  } as unknown as LegalAction;
}

function agenda(instanceId: string): VisibleCard {
  return card(instanceId, "onr_v1_196_corporate-war", "agenda", 3);
}

function card(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  agendaPoints?: number,
): VisibleCard {
  return {
    instanceId,
    definitionId,
    title: definitionId,
    type,
    known: true,
    owner: "corp",
    controller: "corp",
    ...(agendaPoints !== undefined ? { agendaPoints } : {}),
  };
}

function hqAccess(
  eventId: string,
  stateVersionAfter: number,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "hq",
    },
  };
}
