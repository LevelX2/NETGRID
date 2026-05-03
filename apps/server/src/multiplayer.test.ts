import { describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import snapshotsData from "../../../data/decks/deck-snapshots-0.6.json";
import { createNetrunnerHttpServer } from "./http-server";
import { InMemoryMatchStorage, MultiplayerService, type JoinMatchResult, type MatchSettings, type SidePayload } from "./multiplayer";
import type { DeckSnapshot } from "@netrunner/decks";
import type { LegalAction, Side } from "@netrunner/shared";

describe("MVP 0.2 multiplayer service", () => {
  it("starts V0.6 matches from validated immutable deck snapshots without exposing opponent decklists", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "deck-v06-service" });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "deck-v06-match",
      runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
      corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6"
    });
    const stored = await service.loadForTest(created.matchId);

    expect(created.baseline.engineSchemaVersion).toBe("0.4.0");
    expect(created.playerView.deckMetadata?.own.deckHash).toBe("fnv1a:b6bc479a");
    expect(created.playerView.deckMetadata?.opponent.deckHash).toBe("fnv1a:d77d0873");
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_004_snapshot_v0_6");
    expect(stored?.match.settings.agendaPointsToWin).toBe(7);
    expect(JSON.stringify(stored?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(created)).not.toContain("simple_priority_agenda");
    expect(JSON.stringify(created)).not.toContain("cardInstances");

    const invalidSnapshot = structuredClone(snapshotsData.snapshots.find((snapshot) => snapshot.deckSnapshotId === "demo_runner_004_snapshot_v0_6")) as DeckSnapshot | undefined;
    if (!invalidSnapshot) throw new Error("Missing runner snapshot");
    invalidSnapshot.cards.push({ cardId: "catalog_preview_resource_001", quantity: 1 });
    await expect(
      service.createMatch({
        hostSide: "runner",
        seed: "deck-v06-invalid",
        runnerDeckSnapshot: invalidSnapshot,
        corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6"
      })
    ).rejects.toThrow("deck_snapshot_invalid");
  });

  it("creates private matches with hashed tokens and side-filtered bootstrap payloads", async () => {
    const { service, created, runner, matchId, joinToken } = await joinedMatch();
    const stored = await service.loadForTest(matchId);

    expect(stored?.match.status).toBe("active");
    expect(stored?.match.baseline.multiplayerSchemaVersion).toBe("0.8.0");
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_008_snapshot_v0_8");
    expect(stored?.match.deckSetup.corpSnapshotId).toBe("demo_corp_008_snapshot_v0_8");
    expect(stored?.tokens.every((token) => token.tokenHash.startsWith("sha256:"))).toBe(true);
    expect(created.hostSessionToken.length).toBeGreaterThanOrEqual(32);
    expect(created.hostReconnectToken.length).toBeGreaterThanOrEqual(32);
    expect(joinToken.length).toBeGreaterThanOrEqual(32);
    const serializedStorage = JSON.stringify(stored);
    expect(serializedStorage).not.toContain(created.hostSessionToken);
    expect(serializedStorage).not.toContain(created.hostReconnectToken);
    expect(serializedStorage).not.toContain(joinToken);

    const bootstrap = await service.bootstrap(matchId, runner.side, runner.sessionToken);
    expect("error" in bootstrap).toBe(false);
    const payload = bootstrap as SidePayload;
    expect(payload.side).toBe("runner");
    expect(JSON.stringify(payload)).not.toContain("Simple Agenda");
    expect(JSON.stringify(created.playerView)).not.toContain("Simple Economy Event");

    const runnerHosted = await service.createMatch({ hostSide: "runner", seed: "runner-host" });
    expect(runnerHosted.hostSide).toBe("runner");
    const randomHosted = await service.createMatch({ hostSide: "random", seed: "random-host" });
    expect(["runner", "corp"]).toContain(randomHosted.hostSide);
    const invalidJoin = await service.joinMatch(runnerHosted.matchId, { token: "definitely-wrong" });
    expect("error" in invalidJoin).toBe(true);
    if (!("error" in invalidJoin)) throw new Error("Expected invalid token rejection");
    expect(invalidJoin.error.message).not.toContain("runner");
    expect(invalidJoin.error.message).not.toContain("corp");
  });

  it("runs actions only through the server pipeline with idempotency and stale-state rejection", async () => {
    const { service, corp, matchId } = await joinedMatch();
    const before = await bootstrap(service, matchId, corp);
    const mandatory = mustAction(before, (action) => action.type === "mandatory_draw");

    const first = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-1"
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error.message);

    const duplicate = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-1"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(first.receipt.stateVersionAfter);

    const stale = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale rejection");
    expect(stale.error.code).toBe("stale_state");
    expect(stale.error.playerView?.side).toBe("corp");

    const stored = await service.loadForTest(matchId);
    expect(stored?.actionReceipts.length).toBeGreaterThanOrEqual(2);
    expect(stored?.stateSnapshots.length).toBeGreaterThanOrEqual(2);
    expect(stored?.eventLog.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(stored)).not.toContain(corp.sessionToken);

    const concurrent = await joinedMatch("concurrent");
    const concurrentBoot = await bootstrap(concurrent.service, concurrent.matchId, concurrent.corp);
    const concurrentMandatory = mustAction(concurrentBoot, (action) => action.type === "mandatory_draw");
    const [firstConcurrent, secondConcurrent] = await Promise.all([
      concurrent.service.submitAction({
        matchId: concurrent.matchId,
        side: "corp",
        sessionToken: concurrent.corp.sessionToken,
        actionId: concurrentMandatory.actionId,
        clientKnownStateVersion: 0,
        idempotencyKey: "concurrent-a"
      }),
      concurrent.service.submitAction({
        matchId: concurrent.matchId,
        side: "corp",
        sessionToken: concurrent.corp.sessionToken,
        actionId: concurrentMandatory.actionId,
        clientKnownStateVersion: 0,
        idempotencyKey: "concurrent-b"
      })
    ]);
    expect([firstConcurrent.ok, secondConcurrent.ok].filter(Boolean)).toHaveLength(1);
  });

  it("reconnects a side and restores view, legal actions and event tail", async () => {
    const { service, runner, matchId } = await joinedMatch();
    const reconnected = await service.reconnectMatch(matchId, {
      side: runner.side,
      reconnectToken: runner.reconnectToken,
      displayName: "Runner Reloaded"
    });

    expect("error" in reconnected).toBe(false);
    const result = reconnected as JoinMatchResult & { eventTail: unknown[] };
    expect(result.side).toBe("runner");
    expect(result.sessionToken).not.toBe(runner.sessionToken);
    expect(result.playerView.side).toBe("runner");
    expect(result.legalActions).toEqual(result.playerView.legalActions);
    expect(result.eventTail.length).toBeGreaterThan(0);

    const accessMatch = await joinedMatch("mp-win-1");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.corp, (action) => action.type === "end_turn", "end-turn");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    const accessReconnect = await accessMatch.service.reconnectMatch(accessMatch.matchId, {
      side: "runner",
      reconnectToken: accessMatch.runner.reconnectToken
    });
    expect("error" in accessReconnect).toBe(false);
    if ("error" in accessReconnect) throw new Error(accessReconnect.error.message);
    expect(accessReconnect.playerView.run?.phase).toBe("access");

    const encounterMatch = await joinedMatch("mp-enc-1");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "install_card" && action.payload?.serverId === "rd" && String(action.source).includes("ice"), "install-ice");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "end_turn", "end-turn");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "rez_ice", "rez");
    const encounterReconnect = await encounterMatch.service.reconnectMatch(encounterMatch.matchId, {
      side: "runner",
      reconnectToken: encounterMatch.runner.reconnectToken
    });
    expect("error" in encounterReconnect).toBe(false);
    if ("error" in encounterReconnect) throw new Error(encounterReconnect.error.message);
    expect(encounterReconnect.playerView.run?.phase).toBe("encounter_ice");
  });

  it("allows undo before hidden information and blocks undo after access", async () => {
    const first = await joinedMatch("undo-safe");
    const firstAction = await submit(first.service, first.matchId, first.corp, (action) => action.type === "mandatory_draw", "mandatory");
    const undo = await first.service.requestUndo({
      matchId: first.matchId,
      side: "corp",
      sessionToken: first.corp.sessionToken,
      targetEventId: firstAction.receipt.stateVersionAfter === 1 ? "evt_1" : "",
      reason: "Misclick"
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok || !undo.undoRequest) throw new Error("Expected undo request");
    const accepted = await first.service.acceptUndo({
      matchId: first.matchId,
      side: "runner",
      sessionToken: first.runner.sessionToken,
      undoRequestId: undo.undoRequest.undoRequestId
    });
    expect(accepted.ok).toBe(true);
    const restored = await bootstrap(first.service, first.matchId, first.corp);
    expect(restored.playerView.stateVersion).toBe(0);

    const declineMatch = await joinedMatch("undo-decline");
    const declineAction = await submit(declineMatch.service, declineMatch.matchId, declineMatch.corp, (action) => action.type === "mandatory_draw", "mandatory");
    const declineRequest = await declineMatch.service.requestUndo({
      matchId: declineMatch.matchId,
      side: "corp",
      sessionToken: declineMatch.corp.sessionToken,
      targetEventId: `evt_${declineAction.receipt.stateVersionAfter}`
    });
    expect(declineRequest.ok).toBe(true);
    if (!declineRequest.ok || !declineRequest.undoRequest) throw new Error("Expected undo request");
    const declined = await declineMatch.service.declineUndo({
      matchId: declineMatch.matchId,
      side: "runner",
      sessionToken: declineMatch.runner.sessionToken,
      undoRequestId: declineRequest.undoRequest.undoRequestId
    });
    expect(declined.ok).toBe(true);

    const second = await joinedMatch("undo-blocked");
    await submit(second.service, second.matchId, second.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(second.service, second.matchId, second.corp, (action) => action.type === "end_turn", "end-turn");
    const run = await submit(second.service, second.matchId, second.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(second.service, second.matchId, second.runner, (action) => action.type === "access_card", "access");

    const blocked = await second.service.requestUndo({
      matchId: second.matchId,
      side: "runner",
      sessionToken: second.runner.sessionToken,
      targetEventId: `evt_${run.receipt.stateVersionAfter}`,
      reason: "Undo after access"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
    expect(JSON.stringify(blocked.error)).not.toContain("Simple Agenda");
  });

  it("replays a multiplayer match to the stored final state hash", async () => {
    const match = await joinedMatch("replay-multiplayer");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "gain_credit", "credit");

    const replay = await match.service.replayMatch(match.matchId);
    expect(replay.ok).toBe(true);
    expect(replay.finalStateHash).toMatch(/^fnv1a:/);
  });

  it("plays a private two-player match through to a Runner win", async () => {
    const match = await joinedMatch("mp-win-1", { agendaPointsToWin: 2 });
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "end-turn");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "access_card", "access-rd");
    const steal = await submit(match.service, match.matchId, match.runner, (action) => action.type === "steal_agenda", "steal");

    expect(steal.actorPayload.winner).toBe("runner");
    expect(steal.actorPayload.matchStatus).toBe("finished");
    expect(steal.actorPayload.finalStateHash).toMatch(/^fnv1a:/);
  });

  it("sends side-filtered bootstrap messages over WebSocket", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-test",
      publicWebBaseUrl: "http://127.0.0.1:3000",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "runner", seed: "ws-bootstrap" });
    const handle = createNetrunnerHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide }
        })
      );
      const update = await waitForMessage(socket, "state_update");
      expect(JSON.stringify(update)).not.toContain("hostSessionToken");
      expect(JSON.stringify(update)).not.toContain("Simple Agenda");

      const replacement = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
      await waitForOpen(replacement);
      const oldClosed = waitForMessage(socket, "error");
      replacement.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide }
        })
      );
      await waitForMessage(replacement, "state_update");
      const oldMessage = await oldClosed;
      expect(JSON.stringify(oldMessage)).toContain("reconnected_elsewhere");
      socket.close();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const stored = await service.loadForTest(created.matchId);
      expect(stored?.sessions.find((session) => session.side === created.hostSide)?.connected).toBe(true);
      replacement.close();
    } finally {
      socket.close();
      await handle.close();
    }
  });

  it("broadcasts active match status to the host when the second player joins by WebSocket", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-status-test",
      publicWebBaseUrl: "http://127.0.0.1:3000",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "corp", seed: "ws-status" });
    const handle = createNetrunnerHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const hostSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    let runnerSocket: WebSocket | undefined;

    try {
      await waitForOpen(hostSocket);
      hostSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: "corp" }
        })
      );
      const waitingUpdate = await waitForMessage(hostSocket, "state_update");
      expect(messagePayload(waitingUpdate).matchStatus).toBe("waiting_for_runner");

      expect(created.joinUrl).toBeTruthy();
      if (!created.joinUrl) throw new Error("Missing join URL");
      const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
      if (!joinToken) throw new Error("Missing join token");
      const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
      if ("error" in joined) throw new Error(joined.error.message);

      runnerSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
      await waitForOpen(runnerSocket);
      runnerSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: joined.sessionToken, side: "runner" }
        })
      );
      const activeUpdate = await waitForMessage(hostSocket, "state_update");
      expect(messagePayload(activeUpdate).matchStatus).toBe("active");
    } finally {
      hostSocket.close();
      runnerSocket?.close();
      await handle.close();
    }
  });

  it("runs Human Runner vs Corp AI matches without a second player", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-runner-service" });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai",
      corpDifficulty: "normal"
    });

    expect(created.mode).toBe("human_runner_vs_corp_ai");
    expect(created.joinUrl).toBeUndefined();
    expect(created.playerView.side).toBe("runner");
    expect(created.playerView.activeSide).toBe("runner");
    expect(created.matchVersion).toBeGreaterThan(1);
    expect(created.legalActions.length).toBeGreaterThan(0);

    const stored = await service.loadForTest(created.matchId);
    expect(stored?.match.aiControllers?.corp?.type).toBe("ai");
    expect(JSON.stringify(created)).not.toContain("cardInstances");
    expect(JSON.stringify(created)).not.toContain("Simple Agenda");
  });

  it("runs Human Corp vs Runner AI through the same action pipeline", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-corp-service" });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai",
      runnerDifficulty: "normal"
    });

    const before = await service.bootstrap(created.matchId, "corp", created.hostSessionToken);
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    const mandatory = mustAction(before, (action) => action.type === "mandatory_draw");
    const mandatoryResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-ai-mode-mandatory"
    });
    expect(mandatoryResult.ok).toBe(true);
    if (!mandatoryResult.ok) throw new Error(mandatoryResult.error.message);

    const afterMandatory = mandatoryResult.actorPayload;
    const endTurn = mustAction(afterMandatory, (action) => action.type === "end_turn");
    const endTurnResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: endTurn.actionId,
      clientKnownStateVersion: afterMandatory.playerView.stateVersion,
      idempotencyKey: "corp-ai-mode-end"
    });
    expect(endTurnResult.ok).toBe(true);
    if (!endTurnResult.ok) throw new Error(endTurnResult.error.message);

    expect(endTurnResult.actorPayload.playerView.stateVersion).toBeGreaterThan(afterMandatory.playerView.stateVersion + 1);
    expect(endTurnResult.actorPayload.opponentStatus.connected).toBe(true);
    expect(JSON.stringify(endTurnResult.actorPayload)).not.toContain("Simple Fracter");
  });

  it("exposes a side-safe AI-vs-AI simulation API", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-api-service" });
    const handle = createNetrunnerHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/simulations/ai-vs-ai`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed: "server-ai-sim", maxActions: 60 })
      });
      const payload = (await response.json()) as { summary?: { finalStateHash?: string; replayOk?: boolean; errors?: string[] } };
      expect(response.status).toBe(200);
      expect(payload.summary?.finalStateHash).toMatch(/^fnv1a:/);
      expect(payload.summary?.replayOk).toBe(true);
      expect(payload.summary?.errors).toEqual([]);
      expect(JSON.stringify(payload)).not.toContain("cardInstances");
      expect(JSON.stringify(payload)).not.toContain("sessionToken");
    } finally {
      await handle.close();
    }
  });
});

type PlayerSession = {
  side: Side;
  sessionToken: string;
  reconnectToken: string;
};

async function joinedMatch(seed = "service-test", settings?: Partial<MatchSettings>) {
  const service = new MultiplayerService(new InMemoryMatchStorage(), {
    tokenSalt: "test-salt",
    publicWebBaseUrl: "http://127.0.0.1:3000",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed, ...(settings ? { settings } : {}) });
  expect(created.joinUrl).toBeTruthy();
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  expect(joinToken).toBeTruthy();
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);
  return {
    service,
    created,
    joinToken,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function bootstrap(service: MultiplayerService, matchId: string, session: PlayerSession): Promise<SidePayload> {
  const payload = await service.bootstrap(matchId, session.side, session.sessionToken);
  expect("error" in payload).toBe(false);
  if ("error" in payload) throw new Error(payload.error.message);
  return payload;
}

async function submit(
  service: MultiplayerService,
  matchId: string,
  session: PlayerSession,
  predicate: (action: LegalAction) => boolean,
  idempotencyKey: string
) {
  const payload = await bootstrap(service, matchId, session);
  const action = mustAction(payload, predicate);
  const result = await service.submitAction({
    matchId,
    side: session.side,
    sessionToken: session.sessionToken,
    actionId: action.actionId,
    clientKnownStateVersion: payload.playerView.stateVersion,
    idempotencyKey
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

function mustAction(payload: SidePayload, predicate: (action: LegalAction) => boolean): LegalAction {
  const selected = payload.legalActions.find(predicate);
  expect(selected, payload.legalActions.map((action) => `${action.type}:${action.label}`).join(", ")).toBeDefined();
  if (!selected) throw new Error("Missing action");
  return selected;
}

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
}

function waitForMessage(socket: WebSocket, type: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${type}`)), 5000);
    socket.on("message", (raw) => {
      const parsed = JSON.parse(raw.toString()) as { type?: string };
      if (parsed.type === type) {
        clearTimeout(timeout);
        resolve(parsed);
      }
    });
    socket.once("error", reject);
  });
}

function messagePayload(message: unknown): { matchStatus?: string } {
  return (message as { payload?: { matchStatus?: string } }).payload ?? {};
}
