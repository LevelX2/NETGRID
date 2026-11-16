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
  accessOutcomeMemoryPlanEvidence,
  deriveObservedRemoteNoProgressAccessMemory,
} from "./access-outcome-memory";

describe("access outcome memory", () => {
  it("only reports a suppressed plan bonus when the observed memory applies", () => {
    const status = { applies: true, suppressesPlanBonus: true, evidence: [] };
    expect(accessOutcomeMemoryPlanEvidence(status)).toEqual([
      "access_outcome_memory_no_plan_bonus:true",
      "access_outcome_memory_applied:declined_access",
    ]);
    expect(
      accessOutcomeMemoryPlanEvidence({ ...status, applies: false }),
    ).toEqual([]);
  });

  it("derives no-progress remote access memory from side-safe public events", () => {
    const input = aiInput({
      eventTail: [
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
        "access_outcome_memory_match:access-outcome-memory-match",
      ]),
    );
    expect(status?.evidence.join("\n")).not.toMatch(
      /privatePayload|cardInstances|decklist/i,
    );
  });

  it("does not derive Runner memory without the actor-private match binding", () => {
    const input = aiInput({
      eventTail: [],
      servers: [],
    });
    const { matchId: _matchId, ...inputWithoutMatchId } = input;

    expect(
      deriveObservedRemoteNoProgressAccessMemory(
        inputWithoutMatchId,
        "remote_1",
      ),
    ).toBeUndefined();
    expect(
      deriveObservedRemoteNoProgressAccessMemory(
        { ...input, side: "corp" },
        "remote_1",
      ),
    ).toBeUndefined();
  });

  it("derives no-progress memory from visible remote labels", () => {
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

  it("retains the latest observed no-progress access across later failed runs on the unchanged remote", () => {
    const input = aiInput({
      eventTail: [
        publicEvent("evt-run-accessed", 8, "start_run", {
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
        publicEvent("evt-run-failed", 10, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        }),
        publicEvent("evt-end-run", 11, "end_run", {
          actor: "runner",
          actionType: "end_run",
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
    ).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
      evidence: expect.arrayContaining([
        "remote_access_outcome_source_event:evt-access",
        "repeated_remote_no_progress_suppressed",
      ]),
    });
  });

  it("remembers a declined trash without attributing an unobserved reason", () => {
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
        publicEvent("evt-decline", 10, "decline_trash", {
          actor: "runner",
          actionType: "decline_trash",
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
    ).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
      suppressUntilInvalidated: true,
      evidence: expect.arrayContaining([
        "remote_access_outcome_decision:decline",
        "remote_access_outcome_reason:unknown",
        "remote_access_outcome_decline_event:evt-decline",
      ]),
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
    matchId: "access-outcome-memory-match",
    side: "runner",
    playerView,
    eventTail: params.eventTail,
    legalActions,
    difficulty: "normal",
    seed: "access-outcome-memory-test",
    decisionId: "access-outcome-memory-test:1:runner",
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
  return { id, label: id, ice: [], root };
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
  return { instanceId, known: true, ...overrides };
}
