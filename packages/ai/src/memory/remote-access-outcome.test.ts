import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";

import {
  createRemoteAccessOutcomeMemoryEntry,
  declinedTrashOutcomePlanEvidence,
  deriveObservedRemoteNoProgressAccessMemory,
  evaluateRemoteAccessOutcomeMemory,
  remoteAccessOutcomePlanEvidence,
  remoteAccessOutcomeEvidence,
} from "./remote-access-outcome";

describe("remote access outcome memory", () => {
  it("suppresses plan bonus after declined trash on an unchanged known remote", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });

    const status = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
    });

    expect(status).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
    });
    expect(status.evidence).toEqual(
      expect.arrayContaining([
        "remote_access_outcome_decision:declined_trash",
        "remote_access_outcome_suppresses_plan_bonus:true",
      ]),
    );
  });

  it("invalidates declined trash memory when the remote root changes", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });

    expect(
      evaluateRemoteAccessOutcomeMemory(entry, {
        currentKnownRootDefinitionIds: ["simple_agenda"],
      }),
    ).toMatchObject({
      applies: false,
      invalidationReason: "remote_changed",
      suppressesPlanBonus: false,
    });
  });

  it("invalidates declined trash memory when credits or reserve improve", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });

    expect(
      evaluateRemoteAccessOutcomeMemory(entry, {
        currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
        creditsOrReserveImproved: true,
      }),
    ).toMatchObject({
      applies: false,
      invalidationReason: "credits_or_reserve_improved",
      suppressesPlanBonus: false,
    });
  });

  it("does not suppress plan bonus for successful agenda or trash outcomes", () => {
    const stolen = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "simple_agenda",
      accessDecision: "stolen",
      reason: "agenda_payoff",
      stateVersion: 15,
    });
    const trashed = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_2",
      knownRootDefinitionId: "onr_v1_309_bbs-whispering-campaign",
      accessDecision: "trashed",
      reason: "trash_affordable",
      stateVersion: 18,
    });

    expect(
      evaluateRemoteAccessOutcomeMemory(stolen, {
        currentKnownRootDefinitionIds: ["simple_agenda"],
      }).suppressesPlanBonus,
    ).toBe(false);
    expect(
      evaluateRemoteAccessOutcomeMemory(trashed, {
        currentKnownRootDefinitionIds: [
          "onr_v1_309_bbs-whispering-campaign",
        ],
      }).suppressesPlanBonus,
    ).toBe(false);
  });

  it("formats declined-trash plan evidence from structured memory status", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });
    const status = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
    });

    expect(remoteAccessOutcomePlanEvidence(status)).toEqual([
      "remote_access_outcome_no_plan_bonus:true",
      "remote_access_outcome_memory_applied:declined_trash",
    ]);
  });

  it("keeps the deprecated declined-trash evidence bridge status-gated", () => {
    const entry = createRemoteAccessOutcomeMemoryEntry({
      serverId: "remote_1",
      knownRootDefinitionId: "onr_v1_326_holovid-campaign",
      accessDecision: "declined_trash",
      reason: "reserve_would_break",
      stateVersion: 12,
    });
    const status = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["onr_v1_326_holovid-campaign"],
    });

    expect(declinedTrashOutcomePlanEvidence(status.evidence)).toEqual([
      "remote_access_outcome_no_plan_bonus:true",
      "remote_access_outcome_memory_applied:declined_trash",
    ]);
    expect(declinedTrashOutcomePlanEvidence(remoteAccessOutcomeEvidence(entry))).toEqual(
      [],
    );
    const invalidated = evaluateRemoteAccessOutcomeMemory(entry, {
      currentKnownRootDefinitionIds: ["different-card"],
    });
    expect(declinedTrashOutcomePlanEvidence(invalidated.evidence)).toEqual([]);
  });

  it("derives no-progress remote access memory from side-safe public events", () => {
    const input = aiInput({
      eventTail: [
        publicEvent("evt-run", 8, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        }),
        publicEvent("evt-access", 9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          cardDefinitionId: "onr_v1_317_data-masons",
          accessedCardPositionKey: "root:0",
          accessedArea: "root",
        }),
      ],
      servers: [
        server("remote_1", [
          visibleCard("remote-root", {
            definitionId: "onr_v1_317_data-masons",
            title: "Data Masons",
            type: "asset",
            trashCost: 1,
          }),
        ]),
      ],
    });

    const status = deriveObservedRemoteNoProgressAccessMemory(
      input,
      "remote_1",
    );

    expect(status).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
    });
    expect(status?.evidence).toEqual(
      expect.arrayContaining([
        "remote_access_outcome_source:observed_public_access",
        "remote_access_outcome_decision:access_only",
        "remote_access_outcome_no_progress:true",
        "known_remote_no_current_payoff",
        "repeated_remote_no_progress_suppressed",
        "remote_access_outcome_source_event:evt-access",
      ]),
    );
    expect(status?.evidence.join("\n")).not.toMatch(
      /privatePayload|cardInstances|decklist/i,
    );
  });

  it("derives no-progress memory from visible remote labels in public events", () => {
    const input = aiInput({
      eventTail: [
        publicEvent("evt-run", 8, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverLabel: "Remote 1",
        }),
        publicEvent("evt-access", 9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          targets: { serverLabel: "Remote 1" },
          cardDefinitionId: "onr_v1_317_data-masons",
        }),
      ],
      servers: [
        server("remote_1", [
          visibleCard("remote-root", {
            definitionId: "onr_v1_317_data-masons",
            type: "asset",
            trashCost: 1,
          }),
        ]),
      ],
    });

    expect(
      deriveObservedRemoteNoProgressAccessMemory(input, "remote_1"),
    ).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
    });
  });

  it("does not derive no-progress memory after a visible remote change", () => {
    const input = aiInput({
      eventTail: [
        publicEvent("evt-run", 8, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        }),
        publicEvent("evt-access", 9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          cardDefinitionId: "onr_v1_317_data-masons",
        }),
        publicEvent("evt-install", 10, "install_card", {
          actor: "corp",
          actionType: "install_card",
          serverId: "remote_1",
        }),
      ],
      servers: [
        server("remote_1", [
          visibleCard("remote-root", {
            definitionId: "onr_v1_317_data-masons",
            type: "asset",
            trashCost: 1,
          }),
        ]),
      ],
    });

    expect(
      deriveObservedRemoteNoProgressAccessMemory(input, "remote_1"),
    ).toBeUndefined();
  });
});

function aiInput(params: {
  eventTail: PublicGameEvent[];
  servers: PlayerView["servers"];
}): AiDecisionInput {
  const legalActions = [runAction("run-remote-1", "remote_1")];
  const playerView: PlayerView = {
    stateVersion: 11,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: 6,
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
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: params.servers,
    publicEvents: params.eventTail,
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.eventTail,
    legalActions,
    difficulty: "normal",
    seed: "remote-access-outcome-test",
    decisionId: "remote-access-outcome-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function publicEvent(
  eventId: string,
  stateVersionAfter: number,
  type: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  root: VisibleCard[],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice: [],
    root,
  };
}

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 12,
    payload: { serverId },
  };
}

function visibleIdentity(side: Side): VisibleCard {
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

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId">,
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
  };
}
