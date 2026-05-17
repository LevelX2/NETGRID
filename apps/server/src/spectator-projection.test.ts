import { createGameAfterSetup, hashState } from "@netgrid/engine";
import type { CardInstanceId, GameState, PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  buildSpectatorProjectionV1,
  SPECTATOR_PROJECTION_V1_SCHEMA,
  type SpectatorProjectionV1,
} from "./spectator-projection";
import type { EventRecord, StateSnapshot, StoredMatch } from "./multiplayer";

describe("SpectatorProjectionV1 leakscan harness", () => {
  it("builds a named versioned spectator projection without player, replay, token or hidden-card payload leaks", () => {
    const { record, secrets } = spectatorFixture();
    const projection = buildSpectatorProjectionV1(record, { eventCursor: 2 });

    expect(projection.schemaVersion).toBe(SPECTATOR_PROJECTION_V1_SCHEMA);
    expect(projection.kind).toBe("private_spectator_live_v1");
    expect(projection.cursor).toEqual({ eventCursor: 2, stateVersion: 2 });
    expect(projection.board.servers.find((server) => server.id === "remote_1")?.rootSlots).toEqual([
      { slot: 0, visibility: "hidden" },
    ]);
    expect(leakFindings(projection, secrets)).toEqual([]);
  });

  it("keeps delayed cursor projections free of board and event data from cursor N+1", () => {
    const { record, secrets } = spectatorFixture();

    const delayed = buildSpectatorProjectionV1(record, {
      kind: "delayed_public_spectator_v1",
      eventCursor: 2,
    });
    const current = buildSpectatorProjectionV1(record, {
      kind: "delayed_public_spectator_v1",
      eventCursor: 3,
    });

    expect(JSON.stringify(delayed)).not.toContain("remote_2");
    expect(JSON.stringify(delayed)).not.toContain("future_public_marker");
    expect(current.board.servers.some((server) => server.id === "remote_2")).toBe(true);
    expect(current.events.some((event) => event.type === "future_public_marker")).toBe(true);
    expect(leakFindings(delayed, secrets)).toEqual([]);
    expect(leakFindings(current, secrets)).toEqual([]);
  });

  it("rejects delayed cursor projections when no safe historical snapshot exists", () => {
    const { record } = spectatorFixture();
    const withoutHistoricalSnapshot = {
      ...record,
      stateSnapshots: record.stateSnapshots.filter((snapshot) => snapshot.stateVersion > 2),
    };

    expect(() =>
      buildSpectatorProjectionV1(withoutHistoricalSnapshot, {
        kind: "delayed_public_spectator_v1",
        eventCursor: 2,
      }),
    ).toThrow("spectator_projection_cursor_snapshot_missing");
  });

  it("rebuilds the same spectator projection for the same reconnect cursor without PlayerView fallback", () => {
    const { record, secrets } = spectatorFixture();

    const firstReconnect = buildSpectatorProjectionV1(record, { eventCursor: 2 });
    const secondReconnect = buildSpectatorProjectionV1(record, { eventCursor: 2 });

    expect(secondReconnect).toEqual(firstReconnect);
    expect(JSON.stringify(firstReconnect)).not.toMatch(/playerView|legalActions|pendingChoice/i);
    expect(leakFindings(firstReconnect, secrets)).toEqual([]);
  });
});

function spectatorFixture(): { record: StoredMatch; secrets: string[] } {
  const matchId = "match_spectator_projection_v1";
  const base = createGameAfterSetup({
    matchId,
    seed: "spectator-projection-v1",
    runnerDeckId: "demo_runner_098",
    corpDeckId: "demo_corp_098",
    agendaPointsToWin: 7,
  });
  const initial = structuredClone(base);
  const hiddenState = structuredClone(base);
  hiddenState.stateVersion = 2;
  const hiddenAgendaId = putCorpRootInRemote(hiddenState, "remote_1", "simple_agenda");
  hiddenState.pendingChoice = {
    choiceId: "choice_spectator_hidden",
    side: "runner",
    source: "spectator_hidden_fixture",
    prompt: "Private Simple Agenda choice",
    kind: "select_option",
    options: [{ id: "secret-simple-agenda", label: "Simple Agenda", value: hiddenAgendaId }],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: hiddenState.stateVersion,
    visibility: "private_to_side",
  };

  const futureState = structuredClone(hiddenState);
  futureState.stateVersion = 3;
  putCorpRootInRemote(futureState, "remote_2", "simple_economy_asset");
  futureState.runner.credits += 1;

  const eventLog: EventRecord[] = [
    eventRecord(matchId, {
      eventId: "evt_hidden_access",
      type: "access_card",
      stateVersionBefore: 1,
      stateVersionAfter: 2,
      stateHashAfter: hashState(hiddenState),
      visibilityClass: "public",
      publicPayload: {
        actor: "runner",
        actionType: "access_card",
        title: "Simple Agenda",
        cardDefinitionId: "simple_agenda",
        privatePayload: { runner: { cardInstances: hiddenState.cardInstances } },
        sessionToken: "raw_session_secret",
        reconnectToken: "raw_reconnect_secret",
        joinToken: "raw_join_secret",
        tokenHash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        decklist: ["simple_agenda"],
        deckHash: "deck:secret-hash",
        AIInput: { side: "runner" },
        DecisionDebug: { local_analysis: true },
        exploitSuggestions: ["play hidden agenda"],
        randomDrawRecords: [{ counter: 7, value: 42 }],
        localPath: "C:\\Projekte\\NETGRID\\secret.txt",
      },
    }, true),
    eventRecord(matchId, {
      eventId: "evt_future_public_marker",
      type: "future_public_marker",
      stateVersionBefore: 2,
      stateVersionAfter: 3,
      stateHashAfter: hashState(futureState),
      visibilityClass: "public",
      publicPayload: {
        actor: "corp",
        actionType: "future_public_marker",
        title: "Simple Economy Asset",
        cardDefinitionId: "simple_economy_asset",
        serverId: "remote_2",
      },
    }, false),
  ];

  const record: StoredMatch = {
    match: {
      matchId,
      status: "active",
      mode: "human_vs_human",
      matchVersion: 5,
      seed: "spectator-projection-v1",
      baseline: futureState.baseline,
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "single_game",
      },
      deckSetup: {
        runnerSnapshotId: "demo_runner_098_snapshot_v0_98",
        corpSnapshotId: "demo_corp_098_snapshot_v0_98",
        runner: {
          side: "runner",
          identityCardId: "runner_identity",
          deckName: "Runner Private Deck",
          cardPoolSnapshotId: "private-runner-card-pool",
          formatProfileId: "snapshot",
          deckHash: "runner-deck-hash-secret",
        },
        corp: {
          side: "corp",
          identityCardId: "corp_identity",
          deckName: "Corp Private Deck",
          cardPoolSnapshotId: "private-corp-card-pool",
          formatProfileId: "snapshot",
          deckHash: "corp-deck-hash-secret",
        },
      },
      createdAt: "2026-05-17T00:00:00.000Z",
      updatedAt: "2026-05-17T00:01:00.000Z",
    },
    sessions: [
      {
        sessionId: "session_private_spectator_runner",
        matchId,
        side: "runner",
        displayName: "Runner",
        sessionTokenHash: "sha256:runner-session-token-hash",
        reconnectTokenHash: "sha256:runner-reconnect-token-hash",
        connected: true,
        createdAt: "2026-05-17T00:00:00.000Z",
        lastSeenAt: "2026-05-17T00:01:00.000Z",
      },
    ],
    tokens: [
      {
        tokenId: "token_join_secret",
        matchId,
        kind: "join",
        allowedSide: "corp",
        tokenHash: "sha256:join-token-hash",
        createdAt: "2026-05-17T00:00:00.000Z",
      },
    ],
    gameState: futureState,
    privateDeckSnapshots: {
      runner: { deckSnapshotId: "private_runner_snapshot_secret" } as never,
      corp: { deckSnapshotId: "private_corp_snapshot_secret" } as never,
    },
    eventLog,
    actionReceipts: [],
    undoSnapshots: [],
    stateSnapshots: [
      snapshot(matchId, initial, 5, "snap_initial"),
      snapshot(matchId, hiddenState, 5, "snap_hidden_cursor"),
      snapshot(matchId, futureState, 5, "snap_future_cursor"),
    ],
    pendingUndo: {
      undoRequestId: "undo_secret",
      requestedBy: "runner",
      targetEventId: "evt_hidden_access",
      reason: "contains Simple Agenda",
    },
  };

  return {
    record,
    secrets: [
      "PlayerView",
      "legalActions",
      "pendingChoice",
      "privatePayload",
      "cardInstances",
      "FullState",
      "GameState",
      "Simple Agenda",
      "simple_agenda",
      "Runner Private Deck",
      "Corp Private Deck",
      "runner-deck-hash-secret",
      "corp-deck-hash-secret",
      "raw_session_secret",
      "raw_reconnect_secret",
      "raw_join_secret",
      "runner-session-token-hash",
      "runner-reconnect-token-hash",
      "join-token-hash",
      "AIInput",
      "DecisionDebug",
      "local_analysis",
      "exploitSuggestions",
      "randomDrawRecords",
      "C:\\Projekte\\NETGRID\\secret.txt",
      "private_runner_snapshot_secret",
      "private_corp_snapshot_secret",
    ],
  };
}

function putCorpRootInRemote(
  state: GameState,
  serverId: "remote_1" | "remote_2",
  definitionId: string,
): CardInstanceId {
  const cardId = findCard(state, definitionId);
  removeEverywhere(state, cardId);
  let server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) {
    server = { id: serverId, kind: "remote", label: serverId, ice: [], root: [] };
    state.corp.servers.push(server);
  }
  server.root.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "corp", zone: "serverRoot", serverId },
    faceup: false,
    rezzed: false,
  };
  return cardId;
}

function findCard(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
  if (!entry) throw new Error(`Missing card fixture ${definitionId}`);
  return entry[0];
}

function removeEverywhere(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((candidate) => candidate !== cardId);
  state.corp.rd = state.corp.rd.filter((candidate) => candidate !== cardId);
  state.corp.archives = state.corp.archives.filter((candidate) => candidate !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((candidate) => candidate !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((candidate) => candidate !== cardId);
    server.root = server.root.filter((candidate) => candidate !== cardId);
  }
}

function snapshot(
  matchId: string,
  gameState: GameState,
  matchVersion: number,
  snapshotId: string,
): StateSnapshot {
  return {
    snapshotId,
    matchId,
    stateVersion: gameState.stateVersion,
    matchVersion,
    stateHash: hashState(gameState),
    gameState,
    createdAt: "2026-05-17T00:00:00.000Z",
    hiddenInfoBarrier: true,
  };
}

function eventRecord(
  matchId: string,
  publicPayload: PublicGameEvent,
  hiddenInfoBarrier: boolean,
): EventRecord {
  return {
    eventId: publicPayload.eventId,
    matchId,
    stateVersionBefore: publicPayload.stateVersionBefore,
    stateVersionAfter: publicPayload.stateVersionAfter,
    stateHashAfter: publicPayload.stateHashAfter,
    publicPayload,
    privatePayloadLocalOnly: true,
    hiddenInfoBarrier,
  };
}

function leakFindings(projection: SpectatorProjectionV1, forbiddenValues: string[]): string[] {
  const serialized = JSON.stringify(projection);
  const keyFindings = findForbiddenKeys(projection);
  const valueFindings = forbiddenValues.filter((value) => serialized.includes(value));
  const regexFindings = [
    /"playerView"\s*:/i,
    /"legalActions"\s*:/i,
    /"pendingChoice"\s*:/i,
    /"privatePayload"\s*:/i,
    /"cardInstances"\s*:/i,
    /"randomDrawRecords"\s*:/i,
    /"AIInput"\s*:/i,
    /"DecisionDebug"\s*:/i,
    /"tokenHash"\s*:/i,
    /"deckHash"\s*:/i,
    /"decklist"\s*:/i,
    /[A-Za-z]:\\/,
  ]
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => pattern.source);
  return [...keyFindings, ...valueFindings, ...regexFindings];
}

function findForbiddenKeys(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => findForbiddenKeys(entry, [...path, String(index)]));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const nextPath = [...path, key];
    const ownFinding =
      /^(PlayerView|legalActions|pendingChoice|privatePayload|cardInstances|FullState|GameState|AIInput|DecisionDebug|local_analysis|exploitSuggestions|randomDrawRecords|sessionToken|reconnectToken|joinToken|tokenHash|deckHash|decklist)$/i.test(
        key,
      )
        ? [nextPath.join(".")]
        : [];
    return [...ownFinding, ...findForbiddenKeys(nested, nextPath)];
  });
}
