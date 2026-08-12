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
  accessOutcomeMemoryEvidence,
  accessOutcomeMemoryPlanEvidence,
  createAccessOutcomeMemory,
  deriveObservedRemoteNoProgressAccessMemory,
  evaluateAccessOutcomeMemoryStatus,
  readAccessOutcomeMemory,
  rememberAccessOutcome,
  resetAccessOutcomeMemoryForMatch,
} from "./access-outcome-memory";

describe("access outcome memory", () => {
  it("remembers and reads a side-safe access outcome by match, side, profile and server", () => {
    const key = {
      matchId: "match-1",
      side: "runner" as const,
      profileId: "runner-ai",
      serverId: "remote_1",
    };
    const memory = rememberAccessOutcome(createAccessOutcomeMemory(), key, {
      remoteFingerprint: "remote:fingerprint:1",
      observedDecision: "decline",
      reason: "reserve_would_break",
      creditsAtOutcome: 4,
      desiredReserveAtOutcome: 5,
      generalTrashCost: 4,
      stateVersion: 12,
    });

    expect(readAccessOutcomeMemory(memory, key)).toMatchObject({
      ...key,
      remoteFingerprint: "remote:fingerprint:1",
      observedDecision: "decline",
      reason: "reserve_would_break",
    });
    expect(accessOutcomeMemoryEvidence(memory.records[0]!)).toEqual(
      expect.arrayContaining([
        "access_outcome_memory_server:remote_1",
        "access_outcome_memory_decision:decline",
        "access_outcome_memory_reason:reserve_would_break",
      ]),
    );
  });

  it("replaces existing records for the same key", () => {
    const key = {
      matchId: "match-1",
      side: "runner" as const,
      profileId: "runner-ai",
      serverId: "remote_1",
    };
    const first = rememberAccessOutcome(createAccessOutcomeMemory(), key, {
      remoteFingerprint: "old",
      observedDecision: "decline",
      reason: "low_value_target",
      creditsAtOutcome: 3,
      desiredReserveAtOutcome: 5,
      stateVersion: 10,
    });
    const second = rememberAccessOutcome(first, key, {
      remoteFingerprint: "new",
      observedDecision: "trash",
      reason: "trash_affordable",
      creditsAtOutcome: 8,
      desiredReserveAtOutcome: 5,
      stateVersion: 14,
    });

    expect(second.records).toHaveLength(1);
    expect(readAccessOutcomeMemory(second, key)?.remoteFingerprint).toBe("new");
  });

  it("resets all records for a match", () => {
    const memory = rememberAccessOutcome(
      rememberAccessOutcome(
        createAccessOutcomeMemory(),
        {
          matchId: "match-1",
          side: "runner",
          profileId: "runner-ai",
          serverId: "remote_1",
        },
        {
          remoteFingerprint: "a",
          observedDecision: "decline",
          reason: "low_value_target",
          creditsAtOutcome: 2,
          desiredReserveAtOutcome: 4,
          stateVersion: 1,
        },
      ),
      {
        matchId: "match-2",
        side: "runner",
        profileId: "runner-ai",
        serverId: "remote_1",
      },
      {
        remoteFingerprint: "b",
        observedDecision: "trash",
        reason: "trash_affordable",
        creditsAtOutcome: 8,
        desiredReserveAtOutcome: 4,
        stateVersion: 1,
      },
    );

    expect(resetAccessOutcomeMemoryForMatch(memory, "match-1").records).toEqual(
      [expect.objectContaining({ matchId: "match-2" })],
    );
  });

  it("invalidates remembered outcomes when the remote fingerprint changes", () => {
    const record = rememberAccessOutcome(
      createAccessOutcomeMemory(),
      {
        matchId: "match-1",
        side: "runner",
        profileId: "runner-ai",
        serverId: "remote_1",
      },
      {
        remoteFingerprint: "old",
        observedDecision: "decline",
        reason: "low_value_target",
        creditsAtOutcome: 3,
        desiredReserveAtOutcome: 5,
        stateVersion: 1,
      },
    ).records[0]!;

    expect(
      evaluateAccessOutcomeMemoryStatus(record, {
        currentRemoteFingerprint: "new",
        currentCredits: 3,
        currentDesiredReserve: 5,
      }),
    ).toMatchObject({
      applies: false,
      invalidationReason: "remote_fingerprint_changed",
      suppressesPlanBonus: false,
      evidence: expect.arrayContaining([
        "access_outcome_memory_invalidated:remote_fingerprint_changed",
      ]),
    });
  });

  it("invalidates declined outcomes when credits or reserve improve", () => {
    const record = rememberAccessOutcome(
      createAccessOutcomeMemory(),
      {
        matchId: "match-1",
        side: "runner",
        profileId: "runner-ai",
        serverId: "remote_1",
      },
      {
        remoteFingerprint: "same",
        observedDecision: "decline",
        reason: "reserve_would_break",
        creditsAtOutcome: 3,
        desiredReserveAtOutcome: 5,
        stateVersion: 1,
      },
    ).records[0]!;

    expect(
      evaluateAccessOutcomeMemoryStatus(record, {
        currentRemoteFingerprint: "same",
        currentCredits: 7,
        currentDesiredReserve: 5,
      }),
    ).toMatchObject({
      applies: false,
      invalidationReason: "credits_or_reserve_improved",
      suppressesPlanBonus: false,
      evidence: expect.arrayContaining([
        "access_outcome_memory_invalidated:credits_or_reserve_improved",
      ]),
    });
  });

  it("keeps matching outcome memory applicable while context is unchanged", () => {
    const record = rememberAccessOutcome(
      createAccessOutcomeMemory(),
      {
        matchId: "match-1",
        side: "runner",
        profileId: "runner-ai",
        serverId: "remote_1",
      },
      {
        remoteFingerprint: "same",
        observedDecision: "decline",
        reason: "reserve_would_break",
        creditsAtOutcome: 3,
        desiredReserveAtOutcome: 5,
        stateVersion: 1,
      },
    ).records[0]!;

    expect(
      evaluateAccessOutcomeMemoryStatus(record, {
        currentRemoteFingerprint: "same",
        currentCredits: 3,
        currentDesiredReserve: 5,
      }),
    ).toMatchObject({
      applies: true,
      suppressesPlanBonus: true,
      evidence: expect.arrayContaining([
        "access_outcome_memory_applies:true",
        "access_outcome_memory_suppresses_plan_bonus:true",
      ]),
    });
  });

  it("formats no-plan-bonus evidence from structured memory status", () => {
    const record = rememberAccessOutcome(
      createAccessOutcomeMemory(),
      {
        matchId: "match-1",
        side: "runner",
        profileId: "runner-ai",
        serverId: "remote_1",
      },
      {
        remoteFingerprint: "same",
        observedDecision: "decline",
        reason: "reserve_would_break",
        creditsAtOutcome: 3,
        desiredReserveAtOutcome: 5,
        stateVersion: 1,
      },
    ).records[0]!;
    const status = evaluateAccessOutcomeMemoryStatus(record, {
      currentRemoteFingerprint: "same",
      currentCredits: 3,
      currentDesiredReserve: 5,
    });

    expect(accessOutcomeMemoryPlanEvidence(status)).toEqual([
      "access_outcome_memory_no_plan_bonus:true",
      "access_outcome_memory_applied:declined_access",
    ]);
    expect(
      accessOutcomeMemoryPlanEvidence({
        ...status,
        applies: false,
      }),
    ).toEqual([]);
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

  it("keeps an explicit declined trash suppressed until the remote or economy changes", () => {
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
        "remote_access_outcome_reason:reserve_would_break",
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
