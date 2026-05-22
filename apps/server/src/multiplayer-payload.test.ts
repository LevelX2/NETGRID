import { describe, expect, it } from "vitest";
import { createGame } from "@netgrid/engine";
import { CURRENT_RULES_BASELINE, type DeckPublicMetadata, type PublicGameEvent, type Side } from "@netgrid/shared";
import { buildSidePayload, SIDE_PAYLOAD_EVENT_TAIL_LIMIT } from "./multiplayer-payload";
import type { EventRecord, StoredMatch } from "./multiplayer";

describe("multiplayer side payload projection", () => {
  it("limits normal playerView publicEvents to the side event tail", () => {
    const record = storedMatchWithEvents(SIDE_PAYLOAD_EVENT_TAIL_LIMIT + 7);
    const payload = buildSidePayload(record, "runner", {
      isAiSide: () => false,
      safeDisplayNameFor: () => "Gegenüber",
      aiTurnPresentationFor: () => undefined,
      resultSummaryFor: () => undefined,
      retentionProtectionPayload: { retentionProtected: false }
    });

    expect(payload.eventTail).toHaveLength(SIDE_PAYLOAD_EVENT_TAIL_LIMIT);
    expect(payload.playerView.publicEvents).toHaveLength(SIDE_PAYLOAD_EVENT_TAIL_LIMIT);
    expect(payload.playerView.publicEvents).toEqual(payload.eventTail);
    expect(payload.eventTail[0]?.eventId).toBe("evt_7");
    expect(payload.eventTail.at(-1)?.eventId).toBe("evt_86");
    expect(payload.eventTail[0]?.publicPayload.chronicleTurnNumber).toBeGreaterThan(1);
    expect(payload.eventTail[0]?.publicPayload.chronicleTurnSide).toBe("corp");
  });
});

function storedMatchWithEvents(count: number): StoredMatch {
  const now = "2026-05-22T00:00:00.000Z";
  const runnerMetadata = deckMetadata("runner");
  const corpMetadata = deckMetadata("corp");
  return {
    match: {
      matchId: "payload_tail_match",
      status: "active",
      mode: "human_vs_human",
      matchVersion: 1,
      baseline: CURRENT_RULES_BASELINE,
      settings: { agendaPointsToWin: 7, matchFormat: "single_game" },
      deckSetup: {
        runnerSnapshotId: "runner_snapshot",
        corpSnapshotId: "corp_snapshot",
        runner: runnerMetadata,
        corp: corpMetadata
      },
      createdAt: now,
      updatedAt: now
    },
    sessions: [
      session("runner", true, now),
      session("corp", true, now)
    ],
    tokens: [],
    gameState: createGame({ seed: "payload-tail" }),
    eventLog: Array.from({ length: count }, (_, index) => eventRecord(index)),
    actionReceipts: [],
    undoSnapshots: [],
    stateSnapshots: []
  };
}

function deckMetadata(side: Side): DeckPublicMetadata {
  return {
    side,
    identityCardId: side === "runner" ? "runner_identity_001" : "corp_identity_001",
    deckName: `${side} deck`,
    cardPoolSnapshotId: "test",
    formatProfileId: "test",
    deckHash: `${side}_hash`
  };
}

function session(side: Side, connected: boolean, now: string): StoredMatch["sessions"][number] {
  return {
    sessionId: `${side}_session`,
    matchId: "payload_tail_match",
    side,
    displayName: side,
    sessionTokenHash: `${side}_session_hash`,
    reconnectTokenHash: `${side}_reconnect_hash`,
    connected,
    createdAt: now,
    lastSeenAt: now
  };
}

function eventRecord(index: number): EventRecord {
  const publicEvent: PublicGameEvent = {
    eventId: `evt_${index}`,
    type: "action",
    stateVersionBefore: index,
    stateVersionAfter: index + 1,
    stateHashAfter: `hash_${index}`,
    publicPayload: {
      actor: index % 2 === 0 ? "runner" : "corp",
      actionType: index % 2 === 0 ? "gain_credit" : "end_turn"
    }
  };
  return {
    eventId: publicEvent.eventId,
    matchId: "payload_tail_match",
    stateVersionBefore: publicEvent.stateVersionBefore,
    stateVersionAfter: publicEvent.stateVersionAfter,
    stateHashAfter: publicEvent.stateHashAfter,
    publicPayload: publicEvent,
    privatePayloadLocalOnly: false,
    hiddenInfoBarrier: false
  };
}
