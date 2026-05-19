import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import snapshotsData from "../../../data/decks/deck-snapshots-0.6.json";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import profilesData08 from "../../../data/decks/deck-format-profiles-0.8.json";
import { beliefStateInvariantSignature, buildAiDecisionInputDto, reconstructBeliefState } from "@netgrid/ai";
import { createRuntimeCardsById } from "@netgrid/catalog";
import { createDeckSnapshot, type DeckFormatProfile, type DeckSnapshot, type EditableDeck } from "@netgrid/decks";
import { applyAction, applyEffectCommands, checkWinConditions, createGameAfterSetup, DEMO_CARDS_BY_ID, getLegalActions, hashState } from "@netgrid/engine";
import type { ConnectionAuditEvent } from "./connection-audit";
import { createConfiguredStorage, createNetgridHttpServer, isMaintenanceClientAddressAllowed, startNetgridServer } from "./http-server";
import { assertInviteLobbyPayloadRedacted, findInviteLobbyPayloadRedactionLeaks } from "./invite-lobby-redaction.test-helper";
import { FixedWindowRateLimiter, createRateLimiter, loadDeploymentConfig, redactSensitiveText, redactedJoinUrl, type DeploymentConfig } from "./internet-hardening";
import { InMemoryMatchStorage, MultiplayerService, type EventRecord, type JoinMatchResult, type MatchSettings, type MultiplayerStorage, type SidePayload, type StateSnapshot, type StoredMatch } from "./multiplayer";
import { SqliteMatchStorage, StorageError, inspectSqliteStorage, restoreSqliteStorageBackup } from "./storage-sqlite";
import { AI_DECISION_DEBUG_SCHEMA_VERSION, MVP_0_99_BASELINE, type CardInstanceId, type ChoiceRequest, type DeckDefinition, type GameEvent, type GameState, type LegalAction, type PublicGameEvent, type Side } from "@netgrid/shared";

describe("V1.0.9 private internet hardening", () => {
  it("uses a LAN-capable default bind address for direct server starts", async () => {
    const previousPublicHost = process.env.NETGRID_PUBLIC_HOST;
    process.env.NETGRID_PUBLIC_HOST = "192.0.2.10";
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "lan-default-bind" });
    const handle = await startNetgridServer({ port: 0, host: "0.0.0.0 ", service });
    try {
      expect(handle.bindUrl).toMatch(/^http:\/\/0\.0\.0\.0:\d+$/);
      expect(handle.url).toMatch(/^http:\/\/192\.0\.2\.10:\d+$/);
    } finally {
      await handle.close();
      restoreEnv("NETGRID_PUBLIC_HOST", previousPublicHost);
    }
  });

  it("normalizes advertised WebSocket URLs from environment-style base URLs", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "trim-ws-url",
      publicServerBaseUrl: "http://192.0.2.10:8787 "
    });
    const created = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", seed: "trim-ws-url" });
    expect(created.webSocketUrl).toBe("ws://192.0.2.10:8787/ws");
  });

  it("validates local and private internet deployment profiles", () => {
    const local = loadDeploymentConfig({ NETGRID_DEPLOYMENT_PROFILE: "local" } as NodeJS.ProcessEnv);
    expect(local.profile).toBe("local");
    expect(local.webBaseUrl).toBe("http://127.0.0.1:3100");
    expect(local.allowedOrigins).toContain("http://127.0.0.1:3100");

    expect(() =>
      loadDeploymentConfig({
        NETGRID_DEPLOYMENT_PROFILE: "private_internet",
        NETGRID_WEB_BASE_URL: "http://netgrid.example",
        NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
        NETGRID_ALLOWED_ORIGINS: "https://netgrid.example",
        NETGRID_TOKEN_SALT: "private-test-salt"
      } as NodeJS.ProcessEnv)
    ).toThrow(/HTTPS/);
    expect(() =>
      loadDeploymentConfig({
        NETGRID_DEPLOYMENT_PROFILE: "private_internet",
        NETGRID_WEB_BASE_URL: "https://netgrid.example",
        NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
        NETGRID_ALLOWED_ORIGINS: "https://netgrid.example",
        NETGRID_TOKEN_SALT: "local-dev-netgrid-token-salt"
      } as NodeJS.ProcessEnv)
    ).toThrow(/NETGRID_TOKEN_SALT/);

    const privateConfig = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS: "https://netgrid.example,https://tablet.netgrid.example",
      NETGRID_TOKEN_SALT: "private-test-salt"
    } as NodeJS.ProcessEnv);
    expect(privateConfig).toMatchObject({
      profile: "private_internet",
      webBaseUrl: "https://netgrid.example",
      serverBaseUrl: "https://api.netgrid.example",
      rateLimitProfile: "private_internet"
    });
    expect(privateConfig.allowedOrigins).toEqual(["https://netgrid.example", "https://tablet.netgrid.example"]);

    const legacyPrivateConfig = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://legacy.netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://legacy-api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS: "https://legacy.netgrid.example",
      NETGRID_TOKEN_SALT: "legacy-private-test-salt"
    } as NodeJS.ProcessEnv);
    expect(legacyPrivateConfig).toMatchObject({
      profile: "private_internet",
      webBaseUrl: "https://legacy.netgrid.example",
      serverBaseUrl: "https://legacy-api.netgrid.example"
    });
  });

  it("uses explicit REST CORS origins and keeps health redacted", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-health-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example"
    });
    const handle = createNetgridHttpServer(service, { deploymentConfig: privateDeploymentConfig() });
    const baseUrl = await listen(handle);
    try {
      const preflight = await fetch(`${baseUrl}/api/matches`, {
        method: "OPTIONS",
        headers: { origin: "https://netgrid.example", "access-control-request-method": "POST" }
      });
      expect(preflight.status).toBe(204);
      expect(preflight.headers.get("access-control-allow-origin")).toBe("https://netgrid.example");
      expect(preflight.headers.get("access-control-allow-methods")).toBe("GET,POST,OPTIONS");

      const denied = await fetch(`${baseUrl}/health`, { headers: { origin: "https://evil.example" } });
      const deniedText = await denied.text();
      expect(denied.status).toBe(403);
      expect(deniedText).toContain("origin_not_allowed");
      expect(deniedText).not.toMatch(/sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i);

      const health = await fetch(`${baseUrl}/health`);
      const body = (await health.json()) as { profile?: string; realtime?: { ready?: boolean }; storage?: { kind?: string; matchCount?: number } };
      expect(body.profile).toBe("private_internet");
      expect(body.realtime?.ready).toBe(true);
      expect(body.storage?.kind).toBe("memory");
      expect(body.storage?.matchCount).toBeUndefined();
      expect(JSON.stringify(body)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|privatePayload|decklist/i);
    } finally {
      await handle.close();
    }
  });

  it("checks WebSocket origins before join payloads are sent", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-ws-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example"
    });
    const created = await service.createMatch({ hostSide: "runner", seed: "v109-ws-origin" });
    const handle = createNetgridHttpServer(service, { deploymentConfig: privateDeploymentConfig() });
    const baseUrl = await listen(handle);
    const wsUrl = baseUrl.replace(/^http:/, "ws:") + "/ws";
    const deniedMessages: string[] = [];
    const denied = new WebSocket(wsUrl, { headers: { Origin: "https://evil.example" } });
    try {
      denied.on("message", (raw) => deniedMessages.push(raw.toString()));
      await waitForClosedOrErrored(denied);
      expect(deniedMessages).toEqual([]);

      const allowed = new WebSocket(wsUrl, { headers: { Origin: "https://netgrid.example" } });
      try {
        await waitForOpen(allowed);
        allowed.send(JSON.stringify({ type: "join_match", payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide } }));
        const update = await waitForMessage(allowed, "lobby_update");
        expect(messagePayload(update).matchStatus).toBe("pending");
        expect(JSON.stringify(update)).not.toMatch(/sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i);
      } finally {
        allowed.close();
      }
    } finally {
      denied.close();
      await handle.close();
    }
  });

  it("rate-limits sensitive REST and WebSocket join flows with redacted errors", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-rate-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example"
    });
    const handle = createNetgridHttpServer(service, { deploymentConfig: privateDeploymentConfig(), rateLimiter: createRateLimiter("test") });
    const baseUrl = await listen(handle);
    try {
      for (let index = 0; index < 2; index += 1) {
        const response = await fetch(`${baseUrl}/api/matches`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: "https://netgrid.example" },
          body: JSON.stringify({ hostSide: "runner", seed: `rate-rest-${index}` })
        });
        expect(response.status).toBe(201);
      }
      const limited = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://netgrid.example" },
        body: JSON.stringify({ hostSide: "runner", seed: "rate-rest-limited", sessionToken: "secret" })
      });
      const limitedText = await limited.text();
      expect(limited.status).toBe(429);
      expect(limitedText).toContain("rate_limited");
      expect(limitedText).not.toMatch(/secret|sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i);
    } finally {
      await handle.close();
    }

    const wsService = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-ws-rate-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example"
    });
    const created = await wsService.createMatch({ hostSide: "runner", seed: "v109-ws-rate" });
    const wsLimiter = new FixedWindowRateLimiter({
      create_match: undefined,
      token_probe: undefined,
      lifecycle: undefined,
      ai_advance: undefined,
      ws_handshake: { limit: 10, windowMs: 60_000 },
      ws_join: { limit: 1, windowMs: 60_000 }
    });
    const wsHandle = createNetgridHttpServer(wsService, { deploymentConfig: privateDeploymentConfig(), rateLimiter: wsLimiter });
    const wsBaseUrl = await listen(wsHandle);
    const wsUrl = wsBaseUrl.replace(/^http:/, "ws:") + "/ws";
    const socket = new WebSocket(wsUrl, { headers: { Origin: "https://netgrid.example" } });
    try {
      await waitForOpen(socket);
      socket.send(JSON.stringify({ type: "join_match", payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide } }));
      await waitForMessage(socket, "lobby_update");
      socket.send(JSON.stringify({ type: "join_match", payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide } }));
      const error = await waitForMessage(socket, "error");
      expect(JSON.stringify(error)).toContain("rate_limited");
      expect(JSON.stringify(error)).not.toMatch(/sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i);
    } finally {
      socket.close();
      await wsHandle.close();
    }
  });

  it("redacts token, hash, join URL and hidden-info diagnostics", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "private-redaction-salt" });
    const created = await service.createMatch({ hostSide: "runner", seed: "v109-redaction" });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    expect(joinToken).toBeTruthy();
    const redactedUrl = redactedJoinUrl(created.joinUrl);
    expect(redactedUrl).toContain("joinToken=[redacted]");
    expect(redactedUrl).not.toContain(joinToken ?? "missing");

    const text = redactSensitiveText(
      `joinToken=${joinToken} "sessionToken":"${created.hostSessionToken}" tokenHash=sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef privatePayload cardInstances decklist`
    );
    expect(text).toContain("joinToken=[redacted]");
    expect(text).not.toContain(created.hostSessionToken);
    expect(text).not.toContain(joinToken ?? "missing");
    expect(text).not.toMatch(/sha256:[a-f0-9]{64}|privatePayload|cardInstances|decklist/i);
  });
});

describe("Invite and lobby redaction harness", () => {
  it("names forbidden invite/lobby metadata patterns", () => {
    const leaks = findInviteLobbyPayloadRedactionLeaks({
      sessionToken: "raw-session-token",
      reconnectToken: "raw-reconnect-token",
      tokenHash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      sessionId: "session_private_123",
      decklist: [{ cardId: "onr_v1_001_afreet", quantity: 3 }],
      deckHash: "fnv1a:deadbeef",
      hiddenCard: { definitionId: "simple_agenda" },
      AIInput: { side: "runner" },
      DecisionDebug: { explored: true },
      url: "http://127.0.0.1:3100/?matchId=match_1&joinToken=raw-join-token"
    });
    const ruleIds = leaks.map((leak) => leak.ruleId);

    expect(ruleIds).toEqual(
      expect.arrayContaining([
        "token-or-token-hash-field",
        "session-id-field",
        "decklist-or-deckhash-field",
        "hidden-card-identity-field",
        "ai-input-or-decision-debug-field",
        "join-token-query-value",
        "token-hash-value",
        "session-id-value",
        "deck-hash-value"
      ])
    );
  });

  it("accepts current join-info, pending-lobby, and open-lobby metadata surfaces", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "invite-lobby-redaction-harness" });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "invite-lobby-redaction-harness",
      mode: "human_vs_human",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6"
      }
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");

    assertInviteLobbyPayloadRedacted(created.lobby, "createMatch pending lobby");
    assertInviteLobbyPayloadRedacted(await service.getJoinInfo(created.matchId), "join-info without token");
    assertInviteLobbyPayloadRedacted(await service.getJoinInfo(created.matchId, joinToken), "join-info with token");
    assertInviteLobbyPayloadRedacted(await service.listOpenMatches(), "V2.3a open lobby list");

    const missingDecks = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Joiner" });
    expect("error" in missingDecks).toBe(true);
    assertInviteLobbyPayloadRedacted(missingDecks, "join error payload");

    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Joiner",
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    assertInviteLobbyPayloadRedacted(joined.lobby, "joinMatch start lobby");

    const hostLobby = await service.bootstrap(created.matchId, created.hostSide, created.hostSessionToken, { allowLobby: true });
    expect("error" in hostLobby).toBe(false);
    assertInviteLobbyPayloadRedacted(hostLobby, "host bootstrap lobby payload");
  });
});

describe("Backend 0.5 private storage maintenance", () => {
  it("allows maintenance clients from loopback and private LAN addresses only", () => {
    expect(isMaintenanceClientAddressAllowed("127.0.0.1")).toBe(true);
    expect(isMaintenanceClientAddressAllowed("::ffff:192.168.178.42")).toBe(true);
    expect(isMaintenanceClientAddressAllowed("10.0.0.25")).toBe(true);
    expect(isMaintenanceClientAddressAllowed("172.20.1.5")).toBe(true);
    expect(isMaintenanceClientAddressAllowed("8.8.8.8")).toBe(false);
    expect(isMaintenanceClientAddressAllowed("203.0.113.10")).toBe(false);
  });

  it("serves a redacted local SQLite storage summary, match list and match detail", async () => {
    const dir = await tempStorageDir();
    const storage = new SqliteMatchStorage({ dbPath: join(dir, "netgrid.sqlite"), backupDir: join(dir, "backups"), autoImportLegacy: false });
    const service = new MultiplayerService(storage, { tokenSalt: "backend-05-maintenance" });
    const active = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Ludwig", seed: "backend-05-active" });
    await service.createMatch({ hostSide: "corp", displayName: "Korp Host", seed: "backend-05-pending" });
    const finished = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Archiv", seed: "backend-05-finished" });
    const finishedRecord = await service.loadForTest(finished.matchId);
    if (!finishedRecord) throw new Error("Missing finished record");
    finishedRecord.match.status = "finished";
    finishedRecord.match.winner = "runner";
    finishedRecord.match.updatedAt = "2026-04-01T00:00:00.000Z";
    finishedRecord.stateSnapshots.push({
      snapshotId: "backend-05-redacted-snapshot",
      matchId: finished.matchId,
      stateVersion: finishedRecord.gameState.stateVersion,
      matchVersion: finishedRecord.match.matchVersion,
      stateHash: hashState(finishedRecord.gameState),
      gameState: finishedRecord.gameState,
      createdAt: "2026-04-01T00:00:00.000Z",
      hiddenInfoBarrier: true
    });
    await storage.save(finishedRecord);

    const handle = createNetgridHttpServer(service, { deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv) });
    const baseUrl = await listen(handle);
    try {
      const summaryResponse = await fetch(`${baseUrl}/api/storage/maintenance/summary`);
      const summary = (await summaryResponse.json()) as {
        backendOpsVersion?: string;
        matchCount?: number;
        terminalCount?: number;
        matchCountsByStatus?: Record<string, number>;
        tableSizes?: Array<{ key: string; approximatePayloadBytes: number }>;
        largestMatches?: Array<{ matchId: string }>;
      };
      expect(summaryResponse.status).toBe(200);
      expect(summary.backendOpsVersion).toBe("Backend 0.5");
      expect(summary.matchCount).toBe(3);
      expect(summary.terminalCount).toBe(1);
      expect(summary.matchCountsByStatus?.finished).toBe(1);
      expect(summary.tableSizes?.some((row) => row.key === "matches" && row.approximatePayloadBytes > 0)).toBe(true);
      expect(JSON.stringify(summary)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i);

      const filteredResponse = await fetch(`${baseUrl}/api/storage/maintenance/matches?status=finished&terminal=true&olderThanDays=1&mode=human_runner_vs_corp_ai&largerThanBytes=1`);
      const filtered = (await filteredResponse.json()) as { matches?: Array<{ matchId: string; status: string; participants: Array<{ displayName: string }>; sizes: { approximateTotalBytes: number } }> };
      expect(filteredResponse.status).toBe(200);
      expect(filtered.matches?.map((match) => match.matchId)).toEqual([finished.matchId]);
      expect(filtered.matches?.[0]?.status).toBe("finished");
      expect(filtered.matches?.[0]?.participants[0]?.displayName).toBe("Archiv");
      expect(filtered.matches?.[0]?.sizes.approximateTotalBytes).toBeGreaterThan(0);
      expect(JSON.stringify(filtered)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i);

      const detailResponse = await fetch(`${baseUrl}/api/storage/maintenance/matches/${encodeURIComponent(active.matchId)}`);
      const detail = (await detailResponse.json()) as {
        matchId?: string;
        eventCount?: number;
        snapshotCount?: number;
        tableRows?: { events?: number; stateSnapshots?: number };
        sizes?: { gameStateBytes?: number; stateSnapshotBytes?: number };
        cleanupAssessment?: { recommendation?: string };
      };
      expect(detailResponse.status).toBe(200);
      expect(detail.matchId).toBe(active.matchId);
      expect(detail.eventCount).toBeGreaterThan(0);
      expect(detail.tableRows?.events).toBe(detail.eventCount);
      expect(detail.cleanupAssessment?.recommendation).toBe("not_active");
      expect(JSON.stringify(detail)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i);
    } finally {
      await handle.close();
    }
  });

  it("previews active cleanup candidates without exposing private storage data", async () => {
    const dir = await tempStorageDir();
    const storage = new SqliteMatchStorage({ dbPath: join(dir, "netgrid.sqlite"), backupDir: join(dir, "backups"), autoImportLegacy: false });
    const service = new MultiplayerService(storage, { tokenSalt: "backend-05-cleanup-preview" });
    const oldActive = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Alt Aktiv", seed: "backend-05-old-active" });
    const freshActive = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Frisch Aktiv", seed: "backend-05-fresh-active" });
    const oldFinished = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Archiv", seed: "backend-05-old-finished" });
    const oldActiveRecord = await service.loadForTest(oldActive.matchId);
    const oldFinishedRecord = await service.loadForTest(oldFinished.matchId);
    if (!oldActiveRecord || !oldFinishedRecord) throw new Error("Missing cleanup fixtures");
    oldActiveRecord.match.updatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    oldFinishedRecord.match.status = "finished";
    oldFinishedRecord.match.updatedAt = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    await storage.save(oldActiveRecord);
    await storage.save(oldFinishedRecord);

    const handle = createNetgridHttpServer(service, { deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv) });
    const baseUrl = await listen(handle);
    try {
      const response = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ statuses: ["active"], olderThanMinutes: 60, limit: 100 })
      });
      const preview = (await response.json()) as { matchCount?: number; previewId?: string; matches?: Array<{ matchId: string; status: string }>; warnings?: string[] };
      expect(response.status).toBe(200);
      expect(preview.matchCount).toBe(1);
      expect(preview.previewId).toMatch(/^[a-f0-9]{16}$/);
      expect(preview.matches?.map((match) => match.matchId)).toEqual([oldActive.matchId]);
      expect(preview.matches?.[0]?.status).toBe("active");
      expect(preview.matches?.map((match) => match.matchId)).not.toContain(freshActive.matchId);
      expect(preview.matches?.map((match) => match.matchId)).not.toContain(oldFinished.matchId);
      expect(preview.warnings?.join(" ")).toContain("Aktive Matches");
      expect(JSON.stringify(preview)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i);
    } finally {
      await handle.close();
    }
  });

  it("deletes only whole previewed matches after creating a backup", async () => {
    const dir = await tempStorageDir();
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath: join(dir, "netgrid.sqlite"), backupDir, autoImportLegacy: false });
    const service = new MultiplayerService(storage, { tokenSalt: "backend-05-cleanup-apply" });
    const oldActive = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Alt Aktiv", seed: "backend-05-delete-old-active" });
    const freshActive = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Frisch Aktiv", seed: "backend-05-keep-fresh-active" });
    const oldRecord = await service.loadForTest(oldActive.matchId);
    if (!oldRecord) throw new Error("Missing old cleanup record");
    oldRecord.match.updatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await storage.save(oldRecord);

    const handle = createNetgridHttpServer(service, { deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv) });
    const baseUrl = await listen(handle);
    try {
      const previewResponse = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/preview`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ statuses: ["active"], olderThanMinutes: 60, limit: 100 })
      });
      const preview = (await previewResponse.json()) as { previewId?: string; matchCount?: number };
      expect(previewResponse.status).toBe(200);
      expect(preview.matchCount).toBe(1);
      if (!preview.previewId) throw new Error("Missing cleanup preview id");

      const applyResponse = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/apply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ statuses: ["active"], olderThanMinutes: 60, limit: 100, previewId: preview.previewId, createBackup: true })
      });
      const result = (await applyResponse.json()) as { deletedCount?: number; deletedMatchIds?: string[]; backup?: { backupId?: string; backupDir?: string }; integrityCheck?: string };
      expect(applyResponse.status).toBe(200);
      expect(result.deletedCount).toBe(1);
      expect(result.deletedMatchIds).toEqual([oldActive.matchId]);
      expect(result.backup?.backupId).toMatch(/^netgrid-storage-/);
      expect(result.backup?.backupDir).toContain(backupDir);
      expect(result.integrityCheck).toBe("ok");
      expect(await storage.load(oldActive.matchId)).toBeUndefined();
      expect(await storage.load(freshActive.matchId)).toBeTruthy();
      expect((await readdir(backupDir)).length).toBeGreaterThan(0);
      expect(JSON.stringify(result)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i);
    } finally {
      await handle.close();
    }
  });

  it("marks matches as protected and excludes them from automatic cleanup by default without requiring backup", async () => {
    const dir = await tempStorageDir();
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath: join(dir, "netgrid.sqlite"), backupDir, autoImportLegacy: false });
    const service = new MultiplayerService(storage, { tokenSalt: "backend-05-retention-policy" });
    const protectedMatch = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Aufheben", seed: "backend-05-protected" });
    const cleanupMatch = await service.createMatch({ hostSide: "runner", playMode: "human_vs_ai", displayName: "Weg", seed: "backend-05-auto-delete" });
    const oldProtected = await service.loadForTest(protectedMatch.matchId);
    const oldCleanup = await service.loadForTest(cleanupMatch.matchId);
    if (!oldProtected || !oldCleanup) throw new Error("Missing retention fixtures");
    oldProtected.match.updatedAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    oldCleanup.match.updatedAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    await storage.save(oldProtected);
    await storage.save(oldCleanup);

    const handle = createNetgridHttpServer(service, { deploymentConfig: loadDeploymentConfig({} as NodeJS.ProcessEnv) });
    const baseUrl = await listen(handle);
    try {
      const protectResponse = await fetch(`${baseUrl}/api/matches/${encodeURIComponent(protectedMatch.matchId)}/retention-protection`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${protectedMatch.hostSessionToken}` },
        body: JSON.stringify({ side: protectedMatch.hostSide, protected: true })
      });
      const protection = (await protectResponse.json()) as { ok?: boolean; payload?: { retentionProtected?: boolean } };
      expect(protectResponse.status).toBe(200);
      expect(protection.ok).toBe(true);
      expect(protection.payload?.retentionProtected).toBe(true);

      const policyResponse = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/policy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: true, statuses: ["active"], olderThanDays: 3, limit: 100, includeProtected: false })
      });
      expect(policyResponse.status).toBe(200);

      const runResponse = await fetch(`${baseUrl}/api/storage/maintenance/cleanup/policy/run`, { method: "POST" });
      const run = (await runResponse.json()) as { applyResult?: { deletedCount?: number; deletedMatchIds?: string[]; backupCreated?: boolean; backup?: { backupId?: string } }; policy?: { lastRun?: { deletedCount?: number; backupCreated?: boolean } } };
      expect(runResponse.status).toBe(200);
      expect(run.applyResult?.deletedCount).toBe(1);
      expect(run.applyResult?.deletedMatchIds).toEqual([cleanupMatch.matchId]);
      expect(run.applyResult?.backupCreated).toBe(false);
      expect(run.applyResult?.backup).toBeUndefined();
      expect(run.policy?.lastRun?.deletedCount).toBe(1);
      expect(run.policy?.lastRun?.backupCreated).toBe(false);
      expect(await storage.load(cleanupMatch.matchId)).toBeUndefined();
      expect((await storage.load(protectedMatch.matchId))?.match.retentionProtection?.protected).toBe(true);
      expect(JSON.stringify(run)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i);
    } finally {
      await handle.close();
    }
  });

  it("blocks maintenance endpoints outside the local deployment profile", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "backend-05-private-block",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example"
    });
    const handle = createNetgridHttpServer(service, { deploymentConfig: privateDeploymentConfig() });
    const baseUrl = await listen(handle);
    try {
      const response = await fetch(`${baseUrl}/api/storage/maintenance/summary`, { headers: { origin: "https://netgrid.example" } });
      const text = await response.text();
      expect(response.status).toBe(403);
      expect(text).toContain("maintenance_unavailable");
      expect(text).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|privatePayload|decklist/i);
    } finally {
      await handle.close();
    }
  });
});

describe("V1.0.8 SQLite storage and backup hardening", () => {
  it("uses SQLite as configurable default storage and reports only redacted health signals", async () => {
    const dir = await tempStorageDir();
    const previousKind = process.env.NETGRID_STORAGE_KIND;
    const previousSqlite = process.env.NETGRID_SQLITE_STORAGE_PATH;
    const previousBackup = process.env.NETGRID_STORAGE_BACKUP_DIR;
    const previousLegacy = process.env.NETGRID_LEGACY_MATCH_STORAGE_PATH;
    process.env.NETGRID_STORAGE_KIND = "";
    process.env.NETGRID_SQLITE_STORAGE_PATH = join(dir, "configured.sqlite");
    process.env.NETGRID_STORAGE_BACKUP_DIR = join(dir, "backups");
    process.env.NETGRID_LEGACY_MATCH_STORAGE_PATH = join(dir, "missing-legacy.json");
    try {
      const storage = createConfiguredStorage();
      const service = new MultiplayerService(storage, { tokenSalt: "v108-default-storage" });
      const health = await service.storageHealth();
      expect(health.kind).toBe("sqlite");
      expect(health.schemaVersion).toBe(1);
      expect(health.storageFormat).toBe("netgrid_multiplayer_sqlite");
      expect(JSON.stringify(health)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|decklist/i);
      service.closeStorage();
    } finally {
      restoreEnv("NETGRID_STORAGE_KIND", previousKind);
      restoreEnv("NETGRID_SQLITE_STORAGE_PATH", previousSqlite);
      restoreEnv("NETGRID_STORAGE_BACKUP_DIR", previousBackup);
      restoreEnv("NETGRID_LEGACY_MATCH_STORAGE_PATH", previousLegacy);
    }
  });

  it("roundtrips full StoredMatch records through SQLite without persisting cleartext tokens", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: false });
    const service = new MultiplayerService(storage, { tokenSalt: "v108-sqlite-roundtrip" });
    const created = await service.createMatch({ hostSide: "runner", seed: "v108-sqlite-roundtrip" });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Corp" });
    expect("error" in joined).toBe(false);
    const before = await service.loadForTest(created.matchId);
    expect(before?.privateDeckSnapshots?.runner.cards.length).toBeGreaterThan(0);
    service.closeStorage();

    const reopenedStorage = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: false });
    const reopened = await reopenedStorage.load(created.matchId);
    expect(reopened?.match.matchId).toBe(created.matchId);
    expect(reopened?.tokens.every((token) => token.tokenHash.startsWith("sha256:"))).toBe(true);
    expect(reopened?.sessions.every((session) => session.sessionTokenHash.startsWith("sha256:"))).toBe(true);
    expect(reopened?.privateDeckSnapshots?.corp.cards.length).toBeGreaterThan(0);
    expect(reopened?.eventLog.at(0)?.publicPayload.type).toBe("game_created");
    const raw = await readFile(dbPath);
    expect(raw.toString("utf8")).not.toContain(created.hostSessionToken);
    expect(raw.toString("utf8")).not.toContain(created.hostReconnectToken);
    expect(raw.toString("utf8")).not.toContain(joinToken);
    reopenedStorage.close();
  });

  it("deduplicates repeated state snapshots before writing SQLite mirror tables", async () => {
    const fixture = await storedMatchFixture("v108-duplicate-state-snapshot");
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: false });
    const record = structuredClone(fixture.record) as StoredMatch;
    const gameState = createGameAfterSetup({ matchId: record.match.matchId, seed: "v108-duplicate-state-snapshot" });
    const snapshot = stateSnapshotForTest(record.match.matchId, gameState, record.match.matchVersion, "snap_duplicate");
    record.gameState = gameState;
    record.stateSnapshots = [snapshot, { ...snapshot, matchVersion: snapshot.matchVersion + 1 }];

    await expect(storage.save(record)).resolves.toBeUndefined();

    const reopened = await storage.load(record.match.matchId);
    expect(reopened?.stateSnapshots.map((candidate) => candidate.snapshotId)).toEqual(["snap_duplicate"]);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    expect(db.prepare("SELECT COUNT(*) AS count FROM state_snapshots WHERE match_id = ? AND snapshot_id = ?").get(record.match.matchId, "snap_duplicate")).toMatchObject({ count: 1 });
    db.close();
    storage.close();
  });

  it("imports the legacy netgrid.sqlite path non-destructively when the NETGRID default is empty", async () => {
    const dir = await tempStorageDir();
    const legacyPath = join(dir, "netgrid.sqlite");
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const legacyStorage = new SqliteMatchStorage({ dbPath: legacyPath, backupDir, autoImportLegacy: false });
    const legacyService = new MultiplayerService(legacyStorage, { tokenSalt: "v108-legacy-sqlite-copy" });
    const created = await legacyService.createMatch({ hostSide: "runner", seed: "v108-legacy-sqlite-copy" });
    legacyService.closeStorage();

    const storage = new SqliteMatchStorage({ dbPath, legacySqlitePath: legacyPath, backupDir, autoImportLegacy: false });
    expect((await storage.load(created.matchId))?.match.matchId).toBe(created.matchId);
    expect((await storage.health()).database).toBe("netgrid.sqlite");
    expect((await readFile(legacyPath)).byteLength).toBeGreaterThan(0);
    storage.close();
  });

  it("imports valid legacy JSON transactionally after creating a pre-migration backup", async () => {
    const fixture = await storedMatchFixture("v108-legacy-import");
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const legacyPath = join(dir, "matches.json");
    const backupDir = join(dir, "backups");
    const legacyRecord = structuredClone(fixture.record) as StoredMatch;
    delete (legacyRecord.match as Partial<StoredMatch["match"]>).mode;
    await writeFile(legacyPath, `${JSON.stringify({ matches: [legacyRecord] }, null, 2)}\n`, "utf8");

    const storage = new SqliteMatchStorage({ dbPath, legacyJsonPath: legacyPath, backupDir });
    const imported = await storage.load(fixture.record.match.matchId);
    expect(imported?.match.matchId).toBe(fixture.record.match.matchId);
    expect(imported?.match.mode).toBe("human_vs_human");
    expect((await storage.health()).legacyImport).toBe("completed");
    const backups = await listBackupManifests(backupDir);
    expect(backups.length).toBe(1);
    expect(backups[0]).toMatchObject({ source: "legacy_json_import", reason: "pre_migration" });
    const manifestText = JSON.stringify(backups[0]);
    expect(manifestText).not.toContain(fixture.hostSessionToken);
    expect(manifestText).not.toContain(fixture.joinToken);
    expect(manifestText).not.toMatch(/tokenHash|cardInstances|privateDeckSnapshots|decklist/i);
    expect(await readFile(legacyPath, "utf8")).toContain(fixture.record.match.matchId);
    storage.close();
  });

  it("rejects invalid legacy JSON without partial SQLite import", async () => {
    const fixture = await storedMatchFixture("v108-legacy-invalid");
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const legacyPath = join(dir, "matches.json");
    const invalid = structuredClone(fixture.record) as StoredMatch;
    (invalid.match as unknown as { status: string }).status = "future_status";
    await writeFile(legacyPath, `${JSON.stringify({ matches: [fixture.record, invalid] }, null, 2)}\n`, "utf8");

    expect(() => new SqliteMatchStorage({ dbPath, legacyJsonPath: legacyPath, backupDir: join(dir, "backups") })).toThrow(StorageError);
    const storage = new SqliteMatchStorage({ dbPath, legacyJsonPath: legacyPath, backupDir: join(dir, "backups"), autoImportLegacy: false });
    expect(await storage.list()).toEqual([]);
    storage.close();
  });

  it("rejects newer schema versions and corrupted SQLite files with side-safe errors", async () => {
    const dir = await tempStorageDir();
    const newerPath = join(dir, "newer.sqlite");
    const newer = new DatabaseSync(newerPath);
    newer.exec("CREATE TABLE storage_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)");
    newer.prepare("INSERT INTO storage_meta (key, value, updated_at) VALUES ('schema_version', '999', '2026-05-06T00:00:00.000Z')").run();
    newer.close();

    expect(() => new SqliteMatchStorage({ dbPath: newerPath, backupDir: join(dir, "backups"), autoImportLegacy: false })).toThrow(/neuer/);
    const corruptPath = join(dir, "corrupt.sqlite");
    await writeFile(corruptPath, "das ist keine sqlite datei", "utf8");
    expect(() => new SqliteMatchStorage({ dbPath: corruptPath, backupDir: join(dir, "backups"), autoImportLegacy: false })).toThrow(/Backup/);
  });

  it("creates validated backups and restores them after a pre-restore backup", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: false });
    const service = new MultiplayerService(storage, { tokenSalt: "v108-backup-restore" });
    const first = await service.createMatch({ hostSide: "runner", seed: "v108-backup-first" });
    const backup = await service.backupStorageForTest("manual");
    expect(backup.manifest.backupId).toMatch(/^netgrid-storage-/);
    expect(backup.manifest.files.map((file) => file.name)).toContain("netgrid.sqlite");
    const second = await service.createMatch({ hostSide: "corp", seed: "v108-backup-second" });
    expect((await storage.list()).map((record) => record.match.matchId)).toEqual([first.matchId, second.matchId]);
    service.closeStorage();

    const restored = restoreSqliteStorageBackup({ backupDir: backup.backupDir, targetPath: dbPath, backupRootDir: backupDir });
    expect(restored.preRestoreBackupDir).toBeTruthy();
    const reopened = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: false });
    expect((await reopened.list()).map((record) => record.match.matchId)).toEqual([first.matchId]);
    const health = inspectSqliteStorage(dbPath);
    expect(health).toMatchObject({ kind: "sqlite", schemaVersion: 1, matchCount: 1 });
    const manifestText = await readFile(join(backup.backupDir, "manifest.json"), "utf8");
    expect(manifestText).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|decklist/i);
    reopened.close();
  });

  it("rejects manipulated backups before restore", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir, autoImportLegacy: false });
    const service = new MultiplayerService(storage, { tokenSalt: "v108-bad-backup" });
    await service.createMatch({ hostSide: "runner", seed: "v108-bad-backup" });
    const backup = await service.backupStorageForTest("manual");
    service.closeStorage();
    await writeFile(join(backup.backupDir, "netgrid.sqlite"), "tampered", "utf8");
    expect(() => restoreSqliteStorageBackup({ backupDir: backup.backupDir, targetPath: dbPath, backupRootDir: backupDir })).toThrow(/Prüfsumme/);
  });

  it("does not return a successful action when persistence fails", async () => {
    const storage = new FailingStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "v108-persist-failure" });
    const created = await service.createMatch({ hostSide: "runner", seed: "v108-persist-failure" });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Corp" });
    expect("error" in joined).toBe(false);
    const activeSide = (await service.loadForTest(created.matchId))?.gameState.activeSide ?? "runner";
    const sessionToken = activeSide === "runner" ? created.hostSessionToken : "error" in joined ? "" : joined.sessionToken;
    const payload = await service.bootstrap(created.matchId, activeSide, sessionToken);
    if ("error" in payload) throw new Error(payload.error.message);
    const action = payload.legalActions[0];
    if (!action) throw new Error("Missing legal action");
    storage.failNextSave = true;
    await expect(
      service.submitAction({
        matchId: created.matchId,
        side: activeSide,
        sessionToken,
        actionId: action.actionId,
        clientKnownStateVersion: payload.playerView.stateVersion,
        idempotencyKey: "persist-fails"
      })
    ).rejects.toThrow("forced_storage_failure");
  });
});

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
    expect(stored?.match.settings.matchFormat).toBe("rules_match");
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

  it("starts private local O:NR matches from the shared runtime card pool when the overlay is present", async () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_015_codeslinger"]) return;
    expect(cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_006_black-dahlia"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.ai_supported).toBe(true);

    const profile = (profilesData08.profiles as DeckFormatProfile[]).find((candidate) => candidate.profileId === "local-demo-v0.8");
    if (!profile) throw new Error("Missing V0.8 deck format profile");
    const context = { cardsById, profile };
    const now = "2026-05-04T19:30:00.000Z";
    const runnerDeck: EditableDeck = {
      deckId: "local_onr_runner_match_smoke",
      deckVersion: "0.94.0-local-onr",
      name: "O:NR Runner Match Smoke",
      side: "runner",
      identityCardId: "runner_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: "onr_v1_015_codeslinger", quantity: 2 },
        { cardId: "onr_v1_052_raffles", quantity: 2 },
        { cardId: "onr_v1_054_raptor", quantity: 2 },
        { cardId: "onr_v1_070_tinweasel", quantity: 2 },
        { cardId: "onr_v1_144_tycho-mem-chip", quantity: 1 },
        { cardId: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
        { cardId: "onr_v1_079_bodyweight-synthetic-blood", quantity: 1 },
        { cardId: "onr_v1_095_jack-n-joe", quantity: 1 },
        { cardId: "onr_v1_097_livewires-contacts", quantity: 1 },
        { cardId: "onr_v1_108_score", quantity: 1 },
        { cardId: "onr_v1_072_wild-card", quantity: 1 },
        { cardId: "onr_v1_145_wutech-mem-chip", quantity: 1 },
        { cardId: "onr_v1_006_black-dahlia", quantity: 1 },
        { cardId: "onr_v1_014_codecracker", quantity: 1 },
        { cardId: "onr_v1_016_cyfermaster", quantity: 1 },
        { cardId: "onr_v1_040_loony-goon", quantity: 1 },
        { cardId: "onr_v1_060_shaka", quantity: 1 },
        { cardId: "onr_v1_073_wizards-book", quantity: 1 },
        { cardId: "simple_economy_event", quantity: 2 }
      ],
      createdAt: now,
      updatedAt: now
    };
    const corpDeck: EditableDeck = {
      deckId: "local_onr_corp_match_smoke",
      deckVersion: "0.94.0-local-onr",
      name: "O:NR Corp Match Smoke",
      side: "corp",
      identityCardId: "corp_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: "onr_v1_203_hostile-takeover", quantity: 3 },
        { cardId: "simple_agenda", quantity: 3 },
        { cardId: "onr_v1_230_cortical-scanner", quantity: 2 },
        { cardId: "onr_v1_232_crystal-wall", quantity: 2 },
        { cardId: "onr_v1_237_data-wall", quantity: 2 },
        { cardId: "onr_v1_238_data-wall-2-0", quantity: 2 },
        { cardId: "onr_v1_239_endless-corridor", quantity: 2 },
        { cardId: "onr_v1_220_tycho-extension", quantity: 2 },
        { cardId: "onr_v1_281_accounts-receivable", quantity: 1 },
        { cardId: "onr_v1_282_annual-reviews", quantity: 1 },
        { cardId: "onr_v1_285_closed-accounts", quantity: 1 },
        { cardId: "onr_v1_287_datapool-by-zetatech", quantity: 1 },
        { cardId: "onr_v1_288_day-shift", quantity: 1 },
        { cardId: "onr_v1_290_efficiency-experts", quantity: 1 },
        { cardId: "onr_v1_301_punitive-counterstrike", quantity: 1 },
        { cardId: "onr_v1_302_scorched-earth", quantity: 1 },
        { cardId: "onr_v1_307_urban-renewal", quantity: 1 },
        { cardId: "onr_v1_244_filter", quantity: 1 },
        { cardId: "onr_v1_245_fire-wall", quantity: 1 },
        { cardId: "onr_v1_252_keeper", quantity: 1 },
        { cardId: "onr_v1_256_mazer", quantity: 1 },
        { cardId: "onr_v1_253_laser-wire", quantity: 1 },
        { cardId: "onr_v1_257_nerve-labyrinth", quantity: 1 },
        { cardId: "onr_v1_259_in-the-face", quantity: 1 },
        { cardId: "onr_v1_261_quandary", quantity: 1 },
        { cardId: "onr_v1_262_razor-wire", quantity: 1 },
        { cardId: "onr_v1_263_reinforced-wall", quantity: 1 },
        { cardId: "onr_v1_265_rock-is-strong", quantity: 1 },
        { cardId: "onr_v1_266_scramble", quantity: 1 },
        { cardId: "onr_v1_269_shotgun-wire", quantity: 1 },
        { cardId: "onr_v1_270_sleeper", quantity: 1 },
        { cardId: "onr_v1_278_wall-of-ice", quantity: 1 },
        { cardId: "onr_v1_279_wall-of-static", quantity: 1 },
        { cardId: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
        { cardId: "onr_v1_295_night-shift", quantity: 1 },
        { cardId: "simple_economy_operation", quantity: 2 }
      ],
      createdAt: now,
      updatedAt: now
    };
    const runnerSnapshot = createDeckSnapshot(runnerDeck, context, { snapshotId: "local_onr_runner_match_smoke_snapshot", rulesBaselineId: "rules-baseline-mvp-0.94" });
    const corpSnapshot = createDeckSnapshot(corpDeck, context, { snapshotId: "local_onr_corp_match_smoke_snapshot", rulesBaselineId: "rules-baseline-mvp-0.94" });
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "onr-local-deck-service" });

    expect(runnerSnapshot.validation.ok).toBe(true);
    expect(corpSnapshot.validation.ok).toBe(true);

    const created = await service.createMatch({
      hostSide: "runner",
      seed: "onr-local-server-match",
      runnerDeckSnapshot: runnerSnapshot,
      corpDeckSnapshot: corpSnapshot,
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" }
    });
    const stored = await service.loadForTest(created.matchId);

    expect(created.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(created.playerView.deckMetadata?.own.deckName).toBe("O:NR Runner Match Smoke");
    expect(created.playerView.deckMetadata?.opponent.deckName).toBe("O:NR Corp Match Smoke");
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe("local_onr_runner_match_smoke_snapshot");
    expect(stored?.match.deckSetup.corpSnapshotId).toBe("local_onr_corp_match_smoke_snapshot");
    expect(JSON.stringify(stored?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(created)).not.toContain("onr_v1_203_hostile-takeover");
    expect(JSON.stringify(created)).not.toContain("cardInstances");

    expect(created.joinUrl).toBeTruthy();
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing O:NR join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "O:NR Corp" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    expect(joined.playerView.deckMetadata?.own.deckName).toBe("O:NR Corp Match Smoke");
    expect(JSON.stringify(joined)).not.toContain("onr_v1_015_codeslinger");
    expect(JSON.stringify(joined)).not.toContain("cardInstances");

    const aiCreated = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "onr-local-ai-match",
      participantADecks: { runnerDeckSnapshot: runnerSnapshot, corpDeckSnapshot: corpSnapshot },
      participantBDecks: { runnerDeckSnapshot: runnerSnapshot, corpDeckSnapshot: corpSnapshot },
      aiDeckPolicy: "selected",
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" }
    });
    expect(aiCreated.mode).toBe("human_runner_vs_corp_ai");
    expect(aiCreated.playerView.deckMetadata?.own.deckName).toBe("O:NR Runner Match Smoke");
    expect(aiCreated.playerView.deckMetadata?.opponent.deckName).toBe("O:NR Corp Match Smoke");
    expect(JSON.stringify(aiCreated)).not.toContain("cardInstances");
  });

  it("V1.9.9 card release matchstart", async () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]) return;

    expect(cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_007_blink"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_115_terrorist-reprisal"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_223_banpei"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_275_vacuum-link"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_013_cockroach"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_034_incubator"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_030_grubb"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_013_cockroach"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_034_incubator"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_030_grubb"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_076_all-nighter"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_096_kilroy-was-here"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_107_romp-through-hq"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_184_top-runners-conference"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_188_ai-chief-financial-officer"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_211_polymer-breakthrough"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_235_data-naga"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_076_all-nighter"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_096_kilroy-was-here"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_107_romp-through-hq"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_184_top-runners-conference"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_188_ai-chief-financial-officer"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_211_polymer-breakthrough"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_235_data-naga"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_207_netwatch-operations-office"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_213_private-cybernet-police"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_251_jack-attack"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_271_tko-2-0"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_207_netwatch-operations-office"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_213_private-cybernet-police"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_251_jack-attack"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_271_tko-2-0"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_208_on-call-solo-team"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_217_strike-force-kali"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_208_on-call-solo-team"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_217_strike-force-kali"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_219_superior-net-barriers"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_308_acme-savings-and-loan"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_236_data-raven"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_001_afreet"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_019_dropp"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_219_superior-net-barriers"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_308_acme-savings-and-loan"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_236_data-raven"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_001_afreet"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_019_dropp"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_349_aardvark"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_351_bizarre-encryption-scheme"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_352_chester-mix"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_353_chimera"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_349_aardvark"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_351_bizarre-encryption-scheme"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_352_chester-mix"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_353_chimera"]?.statuses.ai_supported).toBe(true);
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

  it("V23A-T002 V23A-T003 V23A-T004 V23A-T005 lists only pending discoverable LAN matches with safe metadata", async () => {
    let now = "2026-05-10T12:00:00.000Z";
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "v23a-open-list", now: () => now });
    const listed = await service.createMatch({ hostSide: "runner", seed: "v23a-listed", mode: "human_vs_human", displayName: "Host A", discoverableInLan: true });
    await service.createMatch({ hostSide: "runner", seed: "v23a-hidden", mode: "human_vs_human", displayName: "Hidden Host", discoverableInLan: false });
    const consumed = await service.createMatch({ hostSide: "corp", seed: "v23a-consumed", mode: "human_vs_human", displayName: "Consumed Host", discoverableInLan: true });
    await service.createMatch({ hostSide: "runner", seed: "v23a-ai", mode: "human_runner_vs_corp_ai", displayName: "AI Host", discoverableInLan: true });
    const consumedToken = new URL(consumed.joinUrl ?? "").searchParams.get("joinToken");
    if (!consumedToken) throw new Error("Missing consumed join token");
    const consumedJoin = await service.joinMatch(consumed.matchId, { token: consumedToken, displayName: "Joiner" });
    expect("error" in consumedJoin).toBe(false);
    now = "2026-05-10T12:01:30.000Z";
    const open = await service.listOpenMatches();
    expect(open).toHaveLength(1);
    expect(open[0]).toMatchObject({
      matchId: listed.matchId,
      hostDisplayName: "Host A",
      mode: "human_vs_human",
      status: "pending",
      createdAt: "2026-05-10T12:00:00.000Z",
      ageSeconds: 90
    });
    expect(Object.keys(open[0] ?? {}).sort()).toEqual(["ageSeconds", "createdAt", "hostDisplayName", "matchId", "mode", "status"]);
    const serialized = JSON.stringify(open);
    expect(serialized).not.toMatch(/joinToken|sessionToken|reconnectToken|tokenHash|deckHash|deckSnapshot|privateDeck|cardInstances/i);
  });

  it("V23A-T008 V23A-T009 exposes GET /api/matches/open and honors discoverableInLan at create time", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "v23a-open-http" });
    const handle = createNetgridHttpServer(service);
    const baseUrl = await listen(handle);
    try {
      const visibleResponse = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostSide: "runner", mode: "human_vs_human", seed: "v23a-http-visible" })
      });
      const hiddenResponse = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hostSide: "runner", mode: "human_vs_human", seed: "v23a-http-hidden", discoverableInLan: false })
      });
      expect(visibleResponse.status).toBe(201);
      expect(hiddenResponse.status).toBe(201);
      const visible = (await visibleResponse.json()) as { matchId: string };
      const hidden = (await hiddenResponse.json()) as { matchId: string };
      const openResponse = await fetch(`${baseUrl}/api/matches/open`);
      expect(openResponse.status).toBe(200);
      const openBody = (await openResponse.json()) as { matches?: Array<{ matchId: string }> };
      const listedIds = (openBody.matches ?? []).map((entry) => entry.matchId);
      expect(listedIds).toContain(visible.matchId);
      expect(listedIds).not.toContain(hidden.matchId);
      const serialized = JSON.stringify(openBody);
      expect(serialized).not.toMatch(/joinToken|sessionToken|reconnectToken|tokenHash|deckHash|deckSnapshot|privateDeck|cardInstances/i);
    } finally {
      await handle.close();
    }
  });

  it("V23A-T011 V23A-T016 rejects stale tokenless LAN joins after status changes", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "v23a-race" });
    const created = await service.createMatch({ hostSide: "runner", seed: "v23a-race-match", mode: "human_vs_human", discoverableInLan: true });
    const initiallyListed = await service.listOpenMatches();
    expect(initiallyListed.some((entry) => entry.matchId === created.matchId)).toBe(true);
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing race join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Teilnehmer B" });
    expect("error" in joined).toBe(false);
    const staleJoin = await service.joinMatch(created.matchId, { displayName: "Später Join" });
    expect("error" in staleJoin).toBe(true);
    if (!("error" in staleJoin)) throw new Error("Expected stale join rejection");
    expect(staleJoin.error.message).not.toContain("runner");
    expect(staleJoin.error.message).not.toContain("corp");
    const listedAfter = await service.listOpenMatches();
    expect(listedAfter.some((entry) => entry.matchId === created.matchId)).toBe(false);
    const stored = await service.loadForTest(created.matchId);
    expect(stored?.match.status).toBe("active");
    expect(stored?.sessions).toHaveLength(2);
  });

  it("V23A-T019 keeps open-list reads responsive in small LAN setups", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "v23a-performance" });
    for (let index = 0; index < 12; index += 1) {
      await service.createMatch({
        hostSide: index % 2 === 0 ? "runner" : "corp",
        seed: `v23a-perf-${index}`,
        mode: "human_vs_human",
        discoverableInLan: index % 3 !== 0
      });
    }
    const startedAt = Date.now();
    const open = await service.listOpenMatches();
    const elapsedMs = Date.now() - startedAt;
    expect(open.length).toBeGreaterThan(0);
    expect(elapsedMs).toBeLessThan(2000);
  });

  it("keeps normal Human-vs-Human matches in the start lobby until both players are ready", async () => {
    let now = "2026-05-04T20:00:00.000Z";
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "join-deck-handshake", now: () => now });
    const created = await service.createMatch({
      hostSide: "random",
      seed: "join-deck-handshake",
      mode: "human_vs_human",
      countdownSeconds: 5,
      settings: { matchFormat: "single_game" },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6"
      }
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const pending = await service.loadForTest(created.matchId);

    expect(created.matchStatus).toBe("pending");
    expect(created.pendingDeckHandshake).toBe(true);
    expect(created.lobby?.hostReady).toBe(false);
    expect(created.lobby?.joinerReady).toBe(false);
    expect(created.lobby?.participants.player_a.runnerDeckReady).toBe(true);
    expect(created.lobby?.participants.player_a.corpDeckReady).toBe(true);
    expect(created.lobby?.participants.player_b.connected).toBe(false);
    expect(created.lobby?.participants.player_b.runnerDeckReady).toBe(false);
    expect(created.lobby?.participants.player_b.corpDeckReady).toBe(false);
    expect(pending?.match.status).toBe("pending");
    expect(pending?.gameState).toBeFalsy();
    expect(JSON.stringify(pending?.match.deckSetup)).not.toContain("cards");
    expect(pending?.startLobby?.countdownSeconds).toBe(5);

    const missingDecks = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Joiner" });
    expect("error" in missingDecks).toBe(true);
    if (!("error" in missingDecks)) throw new Error("Expected deck requirement error");
    expect(missingDecks.error.code).toBe("join_runner_deck_missing");

    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Joiner",
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    const readyCheck = await service.loadForTest(created.matchId);
    expect(readyCheck?.match.status).toBe("ready_check");
    expect(readyCheck?.gameState).toBeFalsy();
    expect(readyCheck?.match.settings.agendaPointsToWin).toBe(7);
    expect(readyCheck?.match.settings.matchFormat).toBe("rules_match");
    expect(joined.lobby?.agendaPointsToWin).toBe(7);
    expect(joined.lobby?.matchFormat).toBe("rules_match");
    expect(joined.lobby?.hostReady).toBe(false);
    expect(joined.lobby?.joinerReady).toBe(false);
    expect(joined.lobby?.participants.player_a.runnerDeckReady).toBe(true);
    expect(joined.lobby?.participants.player_b.corpDeckReady).toBe(true);
    expect(JSON.stringify(joined.lobby)).not.toContain("deckName");
    expect(JSON.stringify(joined.lobby)).not.toContain("deckHash");
    expect(JSON.stringify(joined)).not.toContain("Simple Priority Agenda");
    expect(JSON.stringify(joined)).not.toContain("cardInstances");

    const chat = await service.sendLobbyChat({ matchId: created.matchId, side: created.hostSide, sessionToken: created.hostSessionToken, text: "  Hallo zum Start <b>  " });
    expect(chat.ok).toBe(true);
    if (!chat.ok) throw new Error(chat.error.message);
    expect("startLobby" in chat.actorPayload ? chat.actorPayload.startLobby?.chatMessages.at(-1)?.text : "").toBe("Hallo zum Start <b>");
    expect(JSON.stringify(chat.actorPayload)).not.toContain("sessionToken");
    expect(JSON.stringify(chat.actorPayload)).not.toContain("deckHash");

    const hostReady = await service.setLobbyReady({ matchId: created.matchId, side: created.hostSide, sessionToken: created.hostSessionToken, ready: true });
    expect(hostReady.ok).toBe(true);
    if (!hostReady.ok) throw new Error(hostReady.error.message);
    const joinerReady = await service.setLobbyReady({ matchId: created.matchId, side: joined.side, sessionToken: joined.sessionToken, ready: true });
    expect(joinerReady.ok).toBe(true);
    if (!joinerReady.ok) throw new Error(joinerReady.error.message);
    expect(joinerReady.actorPayload.matchStatus).toBe("countdown");

    const countdown = await service.loadForTest(created.matchId);
    expect(countdown?.match.status).toBe("countdown");
    const cancelled = await service.cancelLobbyCountdown({ matchId: created.matchId, side: joined.side, sessionToken: joined.sessionToken });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) throw new Error(cancelled.error.message);
    expect(cancelled.actorPayload.matchStatus).toBe("ready_check");
    const restarted = await service.setLobbyReady({ matchId: created.matchId, side: joined.side, sessionToken: joined.sessionToken, ready: true });
    expect(restarted.ok).toBe(true);
    if (!restarted.ok) throw new Error(restarted.error.message);
    expect(restarted.actorPayload.matchStatus).toBe("countdown");
    now = "2026-05-04T20:00:05.000Z";
    const activated = await service.activateLobbyCountdown(created.matchId);
    expect(activated.ok).toBe(true);
    if (!activated.ok) throw new Error(activated.error.message);
    const active = await service.loadForTest(created.matchId);
    expect(active?.match.status).toBe("active");
    expect(active?.gameState).toBeTruthy();
    expect(active?.startLobby).toBeUndefined();
  });

  it("handles V1.0.4 host cancel from pending, ready_check and countdown as terminal cancelled", async () => {
    const pending = await pendingDeckMatch("v104-cancel-pending");
    const pendingCancel = await pending.service.cancelMatch({
      matchId: pending.created.matchId,
      side: pending.created.hostSide,
      sessionToken: pending.created.hostSessionToken
    });
    expect(pendingCancel.ok).toBe(true);
    if (!pendingCancel.ok) throw new Error(pendingCancel.error.message);
    expect(pendingCancel.actorPayload.matchStatus).toBe("cancelled");
    expect(pendingCancel.actorPayload.lifecycleResult).toMatchObject({ status: "cancelled", reason: "cancel", actorSide: pending.created.hostSide });
    expectLifecyclePayloadSafe(pendingCancel.actorPayload);
    await expectOldTokensRejected(pending.service, pending.created.matchId, pending.created.hostSide, pending.created.hostSessionToken, pending.created.hostReconnectToken);
    const pendingJoinAfterCancel = await pending.service.joinMatch(pending.created.matchId, { token: pending.joinToken });
    expect("error" in pendingJoinAfterCancel).toBe(true);

    const ready = await readyLobby("v104-cancel-ready");
    const readyCancel = await ready.service.cancelMatch({ matchId: ready.created.matchId, side: ready.created.hostSide, sessionToken: ready.created.hostSessionToken });
    expect(readyCancel.ok).toBe(true);
    if (!readyCancel.ok) throw new Error(readyCancel.error.message);
    expect(readyCancel.actorPayload.matchStatus).toBe("cancelled");
    expect(readyCancel.opponentPayload?.matchStatus).toBe("cancelled");
    expect((await ready.service.loadForTest(ready.created.matchId))?.gameState).toBeFalsy();
    await expectOldTokensRejected(ready.service, ready.created.matchId, ready.created.hostSide, ready.created.hostSessionToken, ready.created.hostReconnectToken);
    await expectOldTokensRejected(ready.service, ready.created.matchId, ready.joined.side, ready.joined.sessionToken, ready.joined.reconnectToken);

    const countdown = await countdownLobby("v104-cancel-countdown");
    const countdownCancel = await countdown.service.cancelMatch({ matchId: countdown.created.matchId, side: countdown.created.hostSide, sessionToken: countdown.created.hostSessionToken });
    expect(countdownCancel.ok).toBe(true);
    if (!countdownCancel.ok) throw new Error(countdownCancel.error.message);
    expect(countdownCancel.actorPayload.matchStatus).toBe("cancelled");
    expect(countdownCancel.opponentPayload?.matchStatus).toBe("cancelled");
    const activateAfterCancel = await countdown.service.activateLobbyCountdown(countdown.created.matchId);
    expect(activateAfterCancel.ok).toBe(false);
    expect((await countdown.service.loadForTest(countdown.created.matchId))?.gameState).toBeFalsy();
  });

  it("handles V1.0.4 joiner leave before deck submission, from ready_check and from countdown", async () => {
    const pending = await pendingDeckMatch("v104-leave-pending");
    const noServerSessionLeave = await pending.service.leaveMatch({
      matchId: pending.created.matchId,
      side: otherSide(pending.created.hostSide),
      sessionToken: ""
    });
    expect(noServerSessionLeave.ok).toBe(false);
    expect((await pending.service.loadForTest(pending.created.matchId))?.match.status).toBe("pending");

    const ready = await readyLobby("v104-leave-ready");
    const readyLeave = await ready.service.leaveMatch({ matchId: ready.created.matchId, side: ready.joined.side, sessionToken: ready.joined.sessionToken });
    expect(readyLeave.ok).toBe(true);
    if (!readyLeave.ok) throw new Error(readyLeave.error.message);
    expect(readyLeave.actorPayload.matchStatus).toBe("abandoned");
    expect(readyLeave.opponentPayload?.matchStatus).toBe("abandoned");
    expect(readyLeave.actorPayload.lifecycleResult).toMatchObject({ status: "abandoned", reason: "leave", actorSide: ready.joined.side });
    expectLifecyclePayloadSafe(readyLeave.actorPayload);
    await expectOldTokensRejected(ready.service, ready.created.matchId, ready.joined.side, ready.joined.sessionToken, ready.joined.reconnectToken);

    const countdown = await countdownLobby("v104-leave-countdown");
    const countdownLeave = await countdown.service.leaveMatch({ matchId: countdown.created.matchId, side: countdown.joined.side, sessionToken: countdown.joined.sessionToken });
    expect(countdownLeave.ok).toBe(true);
    if (!countdownLeave.ok) throw new Error(countdownLeave.error.message);
    expect(countdownLeave.actorPayload.matchStatus).toBe("abandoned");
    expect(countdownLeave.opponentPayload?.matchStatus).toBe("abandoned");
    const activateAfterLeave = await countdown.service.activateLobbyCountdown(countdown.created.matchId);
    expect(activateAfterLeave.ok).toBe(false);
    expect((await countdown.service.loadForTest(countdown.created.matchId))?.gameState).toBeFalsy();
  });

  it("records V1.0.4 forfeit without faking an Engine win or changing replay StateHash", async () => {
    const runnerMatch = await joinedMatch("v104-forfeit-runner");
    const runnerBefore = await runnerMatch.service.loadForTest(runnerMatch.matchId);
    if (!runnerBefore?.gameState) throw new Error("Missing runner forfeit state");
    const runnerHash = hashState(runnerBefore.gameState);
    const runnerForfeit = await runnerMatch.service.forfeitMatch({ matchId: runnerMatch.matchId, side: "runner", sessionToken: runnerMatch.runner.sessionToken });
    expect(runnerForfeit.ok).toBe(true);
    if (!runnerForfeit.ok) throw new Error(runnerForfeit.error.message);
    const runnerForfeitPayload = expectSidePayload(runnerForfeit.actorPayload);
    expect(runnerForfeitPayload.matchStatus).toBe("forfeited");
    expect(runnerForfeitPayload.resultSummary).toMatchObject({ reason: "forfeit", winner: "corp", winnerSide: "corp", loserSide: "runner", finalEngineStateHash: runnerHash });
    expect(runnerForfeitPayload.finalStateHash).toBe(runnerHash);
    const runnerStored = await runnerMatch.service.loadForTest(runnerMatch.matchId);
    expect(runnerStored?.gameState.winner).toBeFalsy();
    expect(runnerStored?.match.winner).toBe("corp");
    const runnerReplay = await runnerMatch.service.replayMatch(runnerMatch.matchId);
    expect(runnerReplay.ok).toBe(true);
    expect(runnerReplay.finalStateHash).toBe(runnerHash);
    expectLifecyclePayloadSafe(runnerForfeitPayload);

    const corpMatch = await joinedMatch("v104-forfeit-corp");
    const corpBefore = await corpMatch.service.loadForTest(corpMatch.matchId);
    if (!corpBefore?.gameState) throw new Error("Missing corp forfeit state");
    const corpHash = hashState(corpBefore.gameState);
    const corpForfeit = await corpMatch.service.forfeitMatch({ matchId: corpMatch.matchId, side: "corp", sessionToken: corpMatch.corp.sessionToken });
    expect(corpForfeit.ok).toBe(true);
    if (!corpForfeit.ok) throw new Error(corpForfeit.error.message);
    expect(expectSidePayload(corpForfeit.actorPayload).resultSummary).toMatchObject({ reason: "forfeit", winner: "runner", winnerSide: "runner", loserSide: "corp", finalEngineStateHash: corpHash });
    expect((await corpMatch.service.replayMatch(corpMatch.matchId)).finalStateHash).toBe(corpHash);
  });

  it("allows Human-vs-KI forfeit only from the human side and stops AI advance afterwards", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "v104-ai-forfeit" });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "v104-ai-forfeit",
      corpDifficulty: "normal"
    });
    const beforeHash = hashState((await service.loadForTest(created.matchId))!.gameState);
    const aiForfeit = await service.forfeitMatch({ matchId: created.matchId, side: "corp", sessionToken: created.hostSessionToken });
    expect(aiForfeit.ok).toBe(false);
    if (aiForfeit.ok) throw new Error("Expected AI forfeit rejection");
    expect(aiForfeit.error.code).toBe("unauthorized");

    const humanForfeit = await service.forfeitMatch({ matchId: created.matchId, side: "runner", sessionToken: created.hostSessionToken });
    expect(humanForfeit.ok).toBe(true);
    if (!humanForfeit.ok) throw new Error(humanForfeit.error.message);
    const humanForfeitPayload = expectSidePayload(humanForfeit.actorPayload);
    expect(humanForfeitPayload.matchStatus).toBe("forfeited");
    expect(humanForfeitPayload.aiTurnPresentation?.canAdvanceAi).toBe(false);
    expect(humanForfeitPayload.resultSummary).toMatchObject({ reason: "forfeit", winnerSide: "corp", loserSide: "runner", finalEngineStateHash: beforeHash });
    const advanceAfterForfeit = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: created.playerView.stateVersion,
      knownMatchVersion: humanForfeitPayload.matchVersion,
      mode: "single_step"
    });
    expect(advanceAfterForfeit.ok).toBe(false);
    if (advanceAfterForfeit.ok) throw new Error("Expected advance_ai rejection");
    expect(advanceAfterForfeit.error.code).toBe("match_not_active");
  });

  it("tracks player clock grace, reconnect snapshots and terminal time expiry without changing Engine win state", async () => {
    const startMs = Date.parse("2026-05-19T08:00:00.000Z");
    let nowMs = startMs;
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "player-clock-grace",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:8787",
      now: () => new Date(nowMs).toISOString()
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "player-clock-grace",
      settings: { playerClock: { mode: "player_clock", startingTimeMs: 120_000, gracePeriodMs: 5_000 } }
    });
    expect(created.joinUrl).toBeTruthy();
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    const corp = { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken };
    await forceSetupComplete(service, created.matchId);

    const before = await bootstrap(service, created.matchId, corp);
    const beforeHash = hashState((await service.loadForTest(created.matchId))!.gameState);
    expect(before.playerClock).toMatchObject({
      schemaVersion: "player-clock-v1",
      mode: "player_clock",
      decisionOwnerSide: "corp",
      remainingMs: { runner: 120_000, corp: 120_000 },
      gracePeriodMs: 5_000,
      warningLevel: "grace"
    });
    const mandatoryDraw = mustAction(before, (action) => action.type === "mandatory_draw");

    nowMs = startMs + 7_000;
    const reconnected = await service.reconnectMatch(created.matchId, { side: "corp", reconnectToken: corp.reconnectToken });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerClock).toMatchObject({
      mode: "player_clock",
      decisionOwnerSide: "corp",
      remainingMs: { runner: 120_000, corp: 118_000 },
      graceRemainingMs: 0,
      warningLevel: "charging"
    });
    expect(JSON.stringify(reconnected.playerClock)).not.toMatch(/cardInstances|privatePayload|decklist|AIInput|DecisionDebug|FullState/i);

    nowMs = startMs + 126_000;
    const expired = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: reconnected.sessionToken,
      actionId: mandatoryDraw.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "player-clock-expire"
    });
    expect(expired.ok).toBe(false);
    if (expired.ok) throw new Error("Expected time expiry");
    expect(expired.error.code).toBe("time_expired");
    const payload = expectSidePayload(expired.payload);
    expect(payload.matchStatus).toBe("finished");
    expect(payload.playerClock).toMatchObject({ mode: "player_clock", expiredSide: "corp", warningLevel: "expired" });
    expect(payload.resultSummary).toMatchObject({
      reason: "time_expired",
      winner: "runner",
      winnerSide: "runner",
      loserSide: "corp",
      finalEngineStateHash: beforeHash
    });
    expect(payload.eventTail.at(-1)?.publicPayload.type).toBe("time_expired");
    expectLifecyclePayloadSafe(payload);
    expect((await service.loadForTest(created.matchId))?.gameState.winner).toBeFalsy();
    expect((await service.replayMatch(created.matchId)).finalStateHash).toBe(beforeHash);
  });

  it("keeps matches without player clock free of timer payloads and time-expiry losses", async () => {
    const { service, matchId, corp } = await joinedMatch("player-clock-none");
    const before = await bootstrap(service, matchId, corp);
    expect(before.playerClock).toBeUndefined();
    const mandatoryDraw = mustAction(before, (action) => action.type === "mandatory_draw");

    const submitted = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatoryDraw.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "player-clock-none-action"
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) throw new Error(submitted.error.message);
    expect(submitted.actorPayload.playerClock).toBeUndefined();
    expect(submitted.actorPayload.matchStatus).toBe("active");
    expect(submitted.actorPayload.resultSummary).toBeUndefined();
  });

  it("recreates V1.0.4 matches with new identity, links, seed and tokens while old tokens stop working", async () => {
    const pending = await pendingDeckMatch("v104-recreate-pending");
    const oldStored = await pending.service.loadForTest(pending.created.matchId);
    const recreated = await pending.service.recreateMatch(pending.created.matchId, {
      side: pending.created.hostSide,
      sessionToken: pending.created.hostSessionToken,
      displayName: "Host Recreate"
    });
    expect(recreated.ok).toBe(true);
    if (!recreated.ok || !recreated.newMatch) throw new Error("Expected recreated match");
    expect(recreated.actorPayload.matchStatus).toBe("cancelled");
    expect(recreated.newMatch.matchId).not.toBe(pending.created.matchId);
    expect(recreated.newMatch.joinUrl).toBeTruthy();
    expect(recreated.newMatch.joinUrl).not.toBe(pending.created.joinUrl);
    expect(recreated.newMatch.hostSessionToken).not.toBe(pending.created.hostSessionToken);
    expect(recreated.newMatch.hostReconnectToken).not.toBe(pending.created.hostReconnectToken);
    const newStored = await pending.service.loadForTest(recreated.newMatch.matchId);
    expect(newStored?.match.seed).toBeTruthy();
    expect(newStored?.match.seed).not.toBe(oldStored?.match.seed);
    expect((await pending.service.loadForTest(pending.created.matchId))?.match.status).toBe("cancelled");
    await expectOldTokensRejected(pending.service, pending.created.matchId, pending.created.hostSide, pending.created.hostSessionToken, pending.created.hostReconnectToken);
    const staleJoin = await pending.service.joinMatch(pending.created.matchId, { token: pending.joinToken });
    expect("error" in staleJoin).toBe(true);

    const cancelledRecreate = await pending.service.recreateMatch(pending.created.matchId, {
      side: pending.created.hostSide,
      sessionToken: pending.created.hostSessionToken,
      displayName: "Host Again"
    });
    expect(cancelledRecreate.ok).toBe(true);
    if (!cancelledRecreate.ok || !cancelledRecreate.newMatch) throw new Error("Expected terminal recreate");
    expect(cancelledRecreate.newMatch.matchId).not.toBe(recreated.newMatch.matchId);
  });

  it("delivers V1.1.0 setup mulligan choices side-safely through multiplayer and reconnect", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "v110-setup-server" });
    const created = await service.createMatch({ hostSide: "corp", seed: "v110-setup-server" });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const runner = { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken };
    const corp = { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken };
    const runnerView = await bootstrap(service, created.matchId, runner);
    const corpView = await bootstrap(service, created.matchId, corp);
    expect(runnerView.playerView.phase).toBe("setup");
    expect(runnerView.pendingChoice?.source).toBe("setup.mulligan");
    expect(runnerView.pendingChoice?.options.map((option) => option.id)).toEqual(["keep", "mulligan"]);
    expect(corpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpView)).not.toContain("Starthand behalten");
    expect(runnerView.playerView.agendaPointsToWin).toBe(7);

    await submitChoice(service, created.matchId, runner, "keep", "v110-runner-keep");
    const corpReconnect = await service.reconnectMatch(created.matchId, { side: "corp", reconnectToken: corp.reconnectToken });
    expect("error" in corpReconnect).toBe(false);
    if ("error" in corpReconnect) throw new Error(corpReconnect.error.message);
    expect(corpReconnect.pendingChoice?.source).toBe("setup.mulligan");
    expect(corpReconnect.pendingChoice?.options.map((option) => option.id)).toEqual(["keep", "mulligan"]);

    const reconnectedCorp = { ...corp, sessionToken: corpReconnect.sessionToken, reconnectToken: corpReconnect.reconnectToken };
    await submitChoice(service, created.matchId, reconnectedCorp, "keep", "v110-corp-keep");
    const after = await bootstrap(service, created.matchId, reconnectedCorp);
    expect(after.playerView.phase).toBe("corp_draw_phase");
    expect(after.legalActions.some((action) => action.type === "mandatory_draw")).toBe(true);
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
    await submitFirstChoice(accessMatch.service, accessMatch.matchId, accessMatch.corp, "discard");
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
    if (!accepted.ok) throw new Error(accepted.error.message);
    expect(accepted.requesterPayload.pendingUndo).toBeUndefined();
    expect(accepted.opponentPayload.pendingUndo).toBeUndefined();
    const restored = await bootstrap(first.service, first.matchId, first.corp);
    expect(restored.playerView.stateVersion).toBe(0);
    expect(restored.pendingUndo).toBeUndefined();
    const acceptedReconnect = await first.service.reconnectMatch(first.matchId, {
      side: "runner",
      reconnectToken: first.runner.reconnectToken
    });
    expect("error" in acceptedReconnect).toBe(false);
    if ("error" in acceptedReconnect) throw new Error(acceptedReconnect.error.message);
    expect(acceptedReconnect.pendingUndo).toBeUndefined();

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
    if (!declined.ok) throw new Error(declined.error.message);
    expect(declined.requesterPayload.pendingUndo).toBeUndefined();
    expect(declined.opponentPayload.pendingUndo).toBeUndefined();
    const declinedRequester = await bootstrap(declineMatch.service, declineMatch.matchId, declineMatch.corp);
    const declinedResponder = await declineMatch.service.reconnectMatch(declineMatch.matchId, {
      side: "runner",
      reconnectToken: declineMatch.runner.reconnectToken
    });
    expect(declinedRequester.pendingUndo).toBeUndefined();
    expect("error" in declinedResponder).toBe(false);
    if ("error" in declinedResponder) throw new Error(declinedResponder.error.message);
    expect(declinedResponder.pendingUndo).toBeUndefined();

    const invalidMatch = await joinedMatch("undo-invalid-cleanup");
    const invalidAction = await submit(invalidMatch.service, invalidMatch.matchId, invalidMatch.corp, (action) => action.type === "mandatory_draw", "invalid-mandatory");
    const invalidRequest = await invalidMatch.service.requestUndo({
      matchId: invalidMatch.matchId,
      side: "corp",
      sessionToken: invalidMatch.corp.sessionToken,
      targetEventId: `evt_${invalidAction.receipt.stateVersionAfter}`
    });
    expect(invalidRequest.ok).toBe(true);
    if (!invalidRequest.ok || !invalidRequest.undoRequest) throw new Error("Expected undo request");
    const invalidRecord = await invalidMatch.service.loadForTest(invalidMatch.matchId);
    if (!invalidRecord) throw new Error("Missing invalid cleanup match");
    invalidRecord.undoSnapshots = [];
    await (invalidMatch.service as unknown as { storage: MultiplayerStorage }).storage.save(invalidRecord);
    const invalidResponse = await invalidMatch.service.acceptUndo({
      matchId: invalidMatch.matchId,
      side: "runner",
      sessionToken: invalidMatch.runner.sessionToken,
      undoRequestId: invalidRequest.undoRequest.undoRequestId
    });
    expect(invalidResponse.ok).toBe(false);
    if (invalidResponse.ok) throw new Error("Expected invalid undo response");
    expect(invalidResponse.payload?.pendingUndo).toBeUndefined();
    expect((await invalidMatch.service.loadForTest(invalidMatch.matchId))?.pendingUndo).toBeUndefined();

    const second = await joinedMatch("undo-blocked");
    await submit(second.service, second.matchId, second.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(second.service, second.matchId, second.corp, (action) => action.type === "end_turn", "end-turn");
    await submitFirstChoice(second.service, second.matchId, second.corp, "discard");
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

  it("auto-accepts undo in Human-vs-KI matches", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "undo-ai-auto-accept" });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "undo-ai-auto",
      runnerDifficulty: "normal"
    });

    const afterSetup = await submitChoice(
      service,
      created.matchId,
      { side: "corp", sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
      "keep",
      "undo-ai-setup"
    );
    const mandatory = mustAction(afterSetup, (action) => action.type === "mandatory_draw");
    const mandatoryResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: afterSetup.playerView.stateVersion,
      idempotencyKey: "undo-ai-mandatory"
    });
    expect(mandatoryResult.ok).toBe(true);
    if (!mandatoryResult.ok) throw new Error(mandatoryResult.error.message);

    const undo = await service.requestUndo({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      targetEventId: `evt_${mandatoryResult.receipt.stateVersionAfter}`,
      reason: "Misclick"
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok) throw new Error(undo.error.message);
    expect(undo.requesterPayload.pendingUndo).toBeUndefined();
    expect(undo.requesterPayload.playerView.stateVersion).toBe(afterSetup.playerView.stateVersion);

    const stored = await service.loadForTest(created.matchId);
    expect(stored?.pendingUndo).toBeUndefined();
    expect(stored?.undoSnapshots.at(-1)?.status).toBe("accepted");
  });

  it("handles V0.94 Damage through submit, idempotency, reconnect and undo barriers", async () => {
    const match = await joinedV094DamageMatch("mp-v094-damage");

    const run = await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v094-run");
    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: run.receipt.idempotencyKey,
      clientKnownStateVersion: run.receipt.stateVersionBefore,
      idempotencyKey: "v094-run"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(run.receipt.stateVersionAfter);

    await submit(match.service, match.matchId, match.corp, (action) => action.type === "rez_ice" && action.label.includes("Neural Sentry"), "v094-rez");
    const beforeDamage = await bootstrap(match.service, match.matchId, match.runner);
    const continueAction = mustAction(beforeDamage, (action) => action.type === "continue_run");
    const damage = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: continueAction.actionId,
      clientKnownStateVersion: beforeDamage.playerView.stateVersion,
      idempotencyKey: "v094-damage"
    });

    expect(damage.ok).toBe(true);
    if (!damage.ok) throw new Error(damage.error.message);
    expect(damage.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(damage.publicEvent?.publicPayload).toMatchObject({ damageResolved: true, damageType: "net", cardsTrashed: 1 });
    expect(damage.actorPayload.playerView.own.heapOrArchives).toHaveLength(1);
    expect(damage.opponentPayload.playerView.opponent.discardCount).toBe(1);
    expect(JSON.stringify(damage.opponentPayload)).not.toContain("Simple Fracter");
    expect(JSON.stringify(damage.opponentPayload)).not.toContain("Simple Decoder");
    expect(JSON.stringify(damage.opponentPayload)).not.toContain("Simple Killer");

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: continueAction.actionId,
      clientKnownStateVersion: beforeDamage.playerView.stateVersion,
      idempotencyKey: "v094-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "corp",
      reconnectToken: match.corp.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Decoder");
    expect(reconnected.playerView.opponent.discardCount).toBe(1);

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      targetEventId: `evt_${damage.receipt.stateVersionAfter}`,
      reason: "Damage undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected Damage hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("handles V1.2.0 Event Modification pending choices through submit, reconnect, idempotency and undo barriers", async () => {
    const match = await joinedV120EventModificationMatch("mp-v120-event-modification");
    const beforeOperation = await bootstrap(match.service, match.matchId, match.corp);
    const operation = mustAction(beforeOperation, (action) => action.type === "play_operation" && action.label.includes("Core Damage"));

    const opened = await match.service.submitAction({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      actionId: operation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v120-open-window"
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) throw new Error(opened.error.message);
    expect(opened.actorPayload.pendingChoice).toBeUndefined();
    expect(opened.opponentPayload.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(opened.publicEvent?.publicPayload).toMatchObject({ eventModificationWindowOpened: true, imminentEventType: "damage" });
    expect(JSON.stringify(opened.actorPayload)).not.toContain("v120_damage_prevent");

    const duplicateOpen = await match.service.submitAction({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      actionId: operation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v120-open-window"
    });
    expect(duplicateOpen.ok).toBe(true);
    if (!duplicateOpen.ok) throw new Error(duplicateOpen.error.message);
    expect(duplicateOpen.receipt.stateVersionAfter).toBe(opened.receipt.stateVersionAfter);

    const reconnectedRunner = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnectedRunner).toBe(false);
    if ("error" in reconnectedRunner) throw new Error(reconnectedRunner.error.message);
    expect(reconnectedRunner.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(JSON.stringify(reconnectedRunner)).not.toContain("Test-only Damage Prevention");

    const staleChoice = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion - 1,
      selectedChoices: { choiceId: reconnectedRunner.pendingChoice?.choiceId, selectedOptionIds: ["pass"] },
      idempotencyKey: "v120-stale-choice"
    });
    expect(staleChoice.ok).toBe(false);
    if (staleChoice.ok) throw new Error("Expected stale choice rejection");
    expect(staleChoice.error.code).toBe("stale_state");

    const preventOption = reconnectedRunner.pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    if (!preventOption) throw new Error("Missing prevent option");
    const prevented = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: { choiceId: reconnectedRunner.pendingChoice?.choiceId, selectedOptionIds: [preventOption] },
      idempotencyKey: "v120-prevent"
    });
    expect(prevented.ok).toBe(true);
    if (!prevented.ok) throw new Error(prevented.error.message);
    expect(prevented.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(prevented.publicEvent?.publicPayload).toMatchObject({ eventModificationDecision: "apply", eventModificationOutcome: "prevented", damageAmount: 0 });
    expect(prevented.actorPayload.playerView.own.coreDamage).toBe(0);
    expect(prevented.opponentPayload.playerView.opponent.coreDamage).toBe(0);

    const duplicatePrevent = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: { choiceId: reconnectedRunner.pendingChoice?.choiceId, selectedOptionIds: [preventOption] },
      idempotencyKey: "v120-prevent"
    });
    expect(duplicatePrevent.ok).toBe(true);
    if (!duplicatePrevent.ok) throw new Error(duplicatePrevent.error.message);
    expect(duplicatePrevent.receipt.stateVersionAfter).toBe(prevented.receipt.stateVersionAfter);

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      targetEventId: `evt_${prevented.receipt.stateVersionAfter}`,
      reason: "Event modification undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected Event Modification hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("handles V1.2.1 Replacement pending choices without applying original damage twice", async () => {
    const match = await joinedV121ReplacementMatch("mp-v121-replacement");
    const beforeOperation = await bootstrap(match.service, match.matchId, match.corp);
    const operation = mustAction(beforeOperation, (action) => action.type === "play_operation" && action.label.includes("Core Damage"));

    const opened = await match.service.submitAction({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      actionId: operation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v121-open-window"
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) throw new Error(opened.error.message);
    expect(opened.actorPayload.pendingChoice).toBeUndefined();
    expect(opened.opponentPayload.pendingChoice?.source).toBe("v121.replacement.damage");
    expect(opened.publicEvent?.publicPayload).toMatchObject({ replacementWindowOpened: true, originalEventType: "damage" });

    const reconnectedRunner = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnectedRunner).toBe(false);
    if ("error" in reconnectedRunner) throw new Error(reconnectedRunner.error.message);
    expect(reconnectedRunner.pendingChoice?.source).toBe("v121.replacement.damage");
    expect(JSON.stringify(reconnectedRunner)).not.toContain("Test-only Damage Replacement");

    const replaceOption = reconnectedRunner.pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    if (!replaceOption) throw new Error("Missing replacement option");
    const replaced = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: { choiceId: reconnectedRunner.pendingChoice?.choiceId, selectedOptionIds: [replaceOption] },
      idempotencyKey: "v121-replace"
    });
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) throw new Error(replaced.error.message);
    expect(replaced.publicEvent?.publicPayload).toMatchObject({
      replacementDecision: "apply",
      replacementOutcome: "replaced",
      originalEventType: "damage",
      replacementEventType: "add_tag",
      tagsAdded: 1
    });
    expect(replaced.actorPayload.playerView.own.coreDamage).toBe(0);
    expect(replaced.actorPayload.playerView.own.tags).toBe(1);
    expect(replaced.opponentPayload.playerView.opponent.coreDamage).toBe(0);
    expect(replaced.opponentPayload.playerView.opponent.tags).toBe(1);

    const duplicateReplace = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: { choiceId: reconnectedRunner.pendingChoice?.choiceId, selectedOptionIds: [replaceOption] },
      idempotencyKey: "v121-replace"
    });
    expect(duplicateReplace.ok).toBe(true);
    if (!duplicateReplace.ok) throw new Error(duplicateReplace.error.message);
    expect(duplicateReplace.receipt.stateVersionAfter).toBe(replaced.receipt.stateVersionAfter);
  });

  it("handles V1.2.2 Special Zone submit, reconnect, idempotency, stale rejection and undo barrier side-safely", async () => {
    const match = await joinedV122SpecialZoneMatch("mp-v122-special-zone");
    const before = await bootstrap(match.service, match.matchId, match.runner);
    const special = mustAction(before, (action) => action.type === "move_to_set_aside");

    const moved = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      actionId: special.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v122-set-aside"
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) throw new Error(moved.error.message);
    expect(moved.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(moved.publicEvent?.publicPayload).toMatchObject({ actionType: "move_to_set_aside", specialZone: "set_aside", redactedKind: "special_zone" });
    expect(JSON.stringify(moved.publicEvent?.publicPayload)).not.toContain("Simple Economy Event");
    expect(moved.actorPayload.playerView.specialZones?.setAside[0]).toMatchObject({ definitionId: "simple_economy_event", controller: "runner" });
    expect(moved.opponentPayload.playerView.specialZones?.setAside[0]).toMatchObject({ known: false });
    expect(JSON.stringify(moved.opponentPayload)).not.toContain("Simple Economy Event");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      actionId: special.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v122-set-aside"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(moved.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      actionId: special.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v122-stale-set-aside"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnectedCorp = await match.service.reconnectMatch(match.matchId, {
      side: "corp",
      reconnectToken: match.corp.reconnectToken
    });
    expect("error" in reconnectedCorp).toBe(false);
    if ("error" in reconnectedCorp) throw new Error(reconnectedCorp.error.message);
    expect(reconnectedCorp.playerView.specialZones?.setAside[0]).toMatchObject({ known: false });
    expect(JSON.stringify(reconnectedCorp)).not.toContain("Simple Economy Event");

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      targetEventId: `evt_${moved.receipt.stateVersionAfter}`,
      reason: "Special zone undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected Special Zone hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("starts V1.2.3 decks from snapshots and handles MIT West Tier through reconnect, idempotency and undo barrier", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "mp-v123-card-release" });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "mp-v123-mit-west-tier",
      runnerDeckSnapshotId: "demo_runner_123_snapshot_v1_2_3",
      corpDeckSnapshotId: "demo_corp_123_snapshot_v1_2_3",
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" }
    });
    expect(created.baseline.engineSchemaVersion).toBe("0.94.0");
    expect(created.playerView.deckMetadata?.opponent.deckName).toBe("Runner Demo Deck 1.2.3 - Mechanic Unlock 1");
    expect(JSON.stringify(created)).not.toContain("onr_v1_101_mit-west-tier");
    expect(created.joinUrl).toBeTruthy();
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    await prepareV123MitRunnerTurn(service, created.matchId);
    const runner = { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken };
    const before = await bootstrap(service, created.matchId, runner);
    expect(before.playerView.deckMetadata?.own.deckHash).toBe("fnv1a:f57f1d98");
    const mit = mustAction(before, (action) => action.type === "play_event" && action.label.includes("MIT West Tier"));

    const played = await service.submitAction({
      matchId: created.matchId,
      side: "runner",
      sessionToken: runner.sessionToken,
      actionId: mit.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v123-mit-west-tier"
    });
    expect(played.ok).toBe(true);
    if (!played.ok) throw new Error(played.error.message);
    expect(played.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(played.publicEvent?.publicPayload).toMatchObject({ actionType: "play_event", cardDefinitionId: "onr_v1_101_mit-west-tier", hiddenZoneBarrier: true });
    expect(JSON.stringify(played.publicEvent?.publicPayload)).not.toContain("runner_");
    expect(played.actorPayload.playerView.specialZones?.removedFromGame[0]).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier", controller: "runner" });
    expect(played.opponentPayload.playerView.specialZones?.removedFromGame[0]).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });

    const duplicate = await service.submitAction({
      matchId: created.matchId,
      side: "runner",
      sessionToken: runner.sessionToken,
      actionId: mit.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v123-mit-west-tier"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(played.receipt.stateVersionAfter);

    const reconnectedCorp = await service.reconnectMatch(created.matchId, { side: "corp", reconnectToken: created.hostReconnectToken });
    expect("error" in reconnectedCorp).toBe(false);
    if ("error" in reconnectedCorp) throw new Error(reconnectedCorp.error.message);
    expect(reconnectedCorp.playerView.specialZones?.removedFromGame[0]).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });
    expect(JSON.stringify(reconnectedCorp)).not.toContain("Dwarf");
    expect(JSON.stringify(reconnectedCorp)).not.toContain("Krash");

    const blocked = await service.requestUndo({
      matchId: created.matchId,
      side: "runner",
      sessionToken: runner.sessionToken,
      targetEventId: `evt_${played.receipt.stateVersionAfter}`,
      reason: "V1.2.3 hidden-zone shuffle undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected MIT hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("starts V1.3.0 private local format snapshots and revalidates invalid or AI-unsupported decks server-side", async () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_021_dwarf"]) return;
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "mp-v130-format-foundation" });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "mp-v130-private-local",
      runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
      corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" }
    });

    expect(created.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(created.playerView.deckMetadata?.opponent.formatProfileId).toBe("netgrid_private_local_v1");
    expect(created.playerView.deckMetadata?.opponent.formatProfileVersion).toBe("1.3.0");
    expect(JSON.stringify(created)).not.toContain("onr_v1_021_dwarf");
    expect(JSON.stringify(created)).not.toContain("decklist");

    const record = await service.loadForTest(created.matchId);
    expect(record?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_130_snapshot_v1_3_0");
    expect(JSON.stringify(record?.match.deckSetup)).not.toContain("cards");

    const invalidRunner = structuredClone((snapshotsData08.snapshots as DeckSnapshot[]).find((snapshot) => snapshot.deckSnapshotId === "demo_runner_130_snapshot_v1_3_0"));
    if (!invalidRunner) throw new Error("Missing V1.3.0 runner snapshot");
    invalidRunner.cards.push({ cardId: "onr_v1_018_dogcatcher", quantity: 1 });
    await expect(
      service.createMatch({
        hostSide: "runner",
        seed: "mp-v130-invalid-runner",
        runnerDeckSnapshot: invalidRunner,
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0"
      })
    ).rejects.toThrow("deck_snapshot_invalid");

    const aiCreated = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "mp-v130-ai-supported",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0"
      },
      aiDeckPolicy: "selected"
    });
    expect(aiCreated.mode).toBe("human_corp_vs_runner_ai");
    expect(aiCreated.playerView.deckMetadata?.opponent.formatProfileId).toBe("netgrid_private_local_v1");
    expect(aiCreated.playerView.deckMetadata?.opponent.formatProfileVersion).toBe("1.3.0");
    expect(JSON.stringify(aiCreated)).not.toContain("cardInstances");
  });

  it("handles V1.1.1 Discard and Core-Damage status through side-safe multiplayer payloads", async () => {
    const match = await joinedMatch("mp-v111-discard");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "v111-mandatory");
    const endTurn = await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "v111-end-turn");

    expect(endTurn.actorPayload.pendingChoice?.source).toBe("discard_phase");
    expect(endTurn.actorPayload.pendingChoice?.kind).toBe("select_cards");
    expect(endTurn.opponentPayload.pendingChoice).toBeUndefined();
    expect(JSON.stringify(endTurn.opponentPayload)).not.toContain(endTurn.actorPayload.pendingChoice?.options[0]?.label ?? "not-present");

    const discarded = await submitFirstChoice(match.service, match.matchId, match.corp, "v111-discard");
    expect(discarded.playerView.phase).toBe("runner_action_phase");
    expect(discarded.eventTail.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(discarded.eventTail.at(-1)?.publicPayload).toMatchObject({ discardResolved: true, discardSide: "corp", discardCount: 1 });

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      targetEventId: `evt_${discarded.playerView.stateVersion}`,
      reason: "Discard undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected discard undo barrier");
    expect(blocked.error.code).toBe("undo_blocked");

    const record = await match.service.loadForTest(match.matchId);
    expect(record).toBeTruthy();
    if (!record?.gameState) throw new Error("Missing game state");
    record.gameState = applyEffectCommands(record.gameState, [{ type: "do_damage", damageType: "core", amount: 1, source: "server_v111_core" }]);
    record.eventLog = record.gameState.eventLog.map((event) => toEventRecordForTest(match.matchId, event));
    await (match.service as unknown as { storage: MultiplayerStorage }).storage.save(record);

    const reconnectedCorp = await match.service.reconnectMatch(match.matchId, { side: "corp", reconnectToken: match.corp.reconnectToken });
    expect("error" in reconnectedCorp).toBe(false);
    if ("error" in reconnectedCorp) throw new Error(reconnectedCorp.error.message);
    expect(reconnectedCorp.playerView.opponent.coreDamage).toBe(1);
    expect(reconnectedCorp.playerView.opponent.maxHandSize).toBe(4);
    expect(JSON.stringify(reconnectedCorp)).not.toContain("Simple Fracter");
  });

  it("handles V0.95 Resource trash through submit, idempotency, reconnect and undo", async () => {
    const match = await joinedV095ResourceMatch("mp-v095-resource");
    const beforeTrash = await bootstrap(match.service, match.matchId, match.corp);
    const trashAction = mustAction(beforeTrash, (action) => action.type === "trash_resource");

    const trashed = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: trashAction.actionId,
      clientKnownStateVersion: beforeTrash.playerView.stateVersion,
      idempotencyKey: "v095-trash"
    });

    expect(trashed.ok).toBe(true);
    if (!trashed.ok) throw new Error(trashed.error.message);
    expect(trashed.publicEvent?.visibilityClass).toBe("public");
    expect(trashed.publicEvent?.publicPayload).toMatchObject({
      actionType: "trash_resource",
      cardDefinitionId: "v095_safehouse_resource",
      title: "Safehouse Resource"
    });
    expect(trashed.actorPayload.playerView.opponent.discardCount).toBe(1);
    expect(trashed.opponentPayload.playerView.own.heapOrArchives.some((card) => card.definitionId === "v095_safehouse_resource")).toBe(true);
    expect(JSON.stringify(trashed.actorPayload)).not.toContain("Simple Fracter");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: trashAction.actionId,
      clientKnownStateVersion: beforeTrash.playerView.stateVersion,
      idempotencyKey: "v095-trash"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(trashed.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: trashAction.actionId,
      clientKnownStateVersion: beforeTrash.playerView.stateVersion,
      idempotencyKey: "v095-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerView.own.heapOrArchives.some((card) => card.definitionId === "v095_safehouse_resource")).toBe(true);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Barrier ICE");

    const undo = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${trashed.receipt.stateVersionAfter}`,
      reason: "Resource trash undo"
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok) throw new Error(undo.error.message);
    expect(undo.undoRequest?.targetEventId).toBe(`evt_${trashed.receipt.stateVersionAfter}`);
  });

  it("handles V0.96 Trace bids through submit, idempotency, reconnect and undo", async () => {
    const match = await joinedV096TraceMatch("mp-v096-trace");
    const corpChoice = await bootstrap(match.service, match.matchId, match.corp);
    const runnerBefore = await bootstrap(match.service, match.matchId, match.runner);
    const corpAction = mustAction(corpChoice, (action) => action.type === "resolve_choice");

    expect(corpChoice.pendingChoice?.kind).toBe("bid_amount");
    expect(runnerBefore.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerBefore)).not.toContain("Trace Probe ICE_");

    const corpBid = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: corpAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: { choiceId: corpChoice.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] },
      idempotencyKey: "v096-corp-bid"
    });

    expect(corpBid.ok).toBe(true);
    if (!corpBid.ok) throw new Error(corpBid.error.message);
    expect(corpBid.publicEvent?.visibilityClass).toBe("public");
    expect(corpBid.publicEvent?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      corpBid: 1,
      traceStrength: 3
    });
    expect(corpBid.opponentPayload.pendingChoice?.kind).toBe("bid_amount");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: corpAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: { choiceId: corpChoice.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] },
      idempotencyKey: "v096-corp-bid"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(corpBid.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: corpAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: { choiceId: corpChoice.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] },
      idempotencyKey: "v096-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnectedRunner = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnectedRunner).toBe(false);
    if ("error" in reconnectedRunner) throw new Error(reconnectedRunner.error.message);
    expect(reconnectedRunner.pendingChoice?.kind).toBe("bid_amount");
    expect(JSON.stringify(reconnectedRunner)).not.toContain("Simple Agenda");

    const runnerAction = reconnectedRunner.legalActions.find((action) => action.type === "resolve_choice");
    expect(runnerAction).toBeDefined();
    if (!runnerAction) throw new Error("Missing Runner trace bid action");
    const runnerBid = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnectedRunner.sessionToken,
      actionId: runnerAction.actionId,
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: { choiceId: reconnectedRunner.pendingChoice?.choiceId, selectedOptionIds: ["bid_0"] },
      idempotencyKey: "v096-runner-bid"
    });

    expect(runnerBid.ok).toBe(true);
    if (!runnerBid.ok) throw new Error(runnerBid.error.message);
    expect(runnerBid.publicEvent?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 1
    });
    expect(runnerBid.actorPayload.playerView.own.tags).toBe(1);

    const undo = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      targetEventId: `evt_${runnerBid.receipt.stateVersionAfter}`,
      reason: "Trace bid undo"
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok) throw new Error(undo.error.message);
  });

  it("handles V0.97 Breach multiaccess through submit, idempotency, reconnect and undo barrier", async () => {
    const match = await joinedV097BreachMatch("mp-v097-breach");
    const before = await bootstrap(match.service, match.matchId, match.runner);
    const deepDive = mustAction(before, (action) => action.type === "play_event" && action.payload?.serverId === "rd");

    expect(JSON.stringify(before)).not.toContain("Simple Agenda");
    expect(JSON.stringify(before)).not.toContain("Simple Economy Operation");

    const started = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: deepDive.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v097-deep-dive"
    });

    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.error.message);
    expect(started.publicEvent?.visibilityClass).toBe("public");
    expect(started.actorPayload.playerView.run?.breach).toMatchObject({ serverId: "rd", remainingCount: 2 });
    expect(JSON.stringify(started.actorPayload)).not.toContain("Simple Agenda");
    expect(JSON.stringify(started.actorPayload)).not.toContain("Simple Economy Operation");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: deepDive.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v097-deep-dive"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(started.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: deepDive.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v097-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerView.run?.breach?.remainingCount).toBe(2);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Agenda");
    expect(JSON.stringify(reconnected)).not.toContain("Simple Economy Operation");

    const accessAction = reconnected.legalActions.find((action) => action.type === "access_card");
    expect(accessAction).toBeDefined();
    if (!accessAction) throw new Error("Missing access action");
    const access = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnected.sessionToken,
      actionId: accessAction.actionId,
      clientKnownStateVersion: reconnected.playerView.stateVersion,
      idempotencyKey: "v097-access-first"
    });

    expect(access.ok).toBe(true);
    if (!access.ok) throw new Error(access.error.message);
    expect(access.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(access.publicEvent?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation"
    });
    expect(JSON.stringify(access.publicEvent?.publicPayload)).not.toContain("Simple Agenda");
    expect(access.actorPayload.playerView.run?.breach?.remainingCount).toBe(1);

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${access.receipt.stateVersionAfter}`,
      reason: "Breach access undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected undo_blocked");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("keeps V1.1.2 Archives breach reconnect and payloads side-safe", async () => {
    const match = await joinedV112ArchivesMatch("mp-v112-archives");
    const before = await bootstrap(match.service, match.matchId, match.runner);

    expect(before.playerView.opponent.discardCount).toBe(3);
    expect(JSON.stringify(before)).toContain("Simple Economy Operation");
    expect(JSON.stringify(before)).not.toContain("Simple Economy Asset");
    expect(JSON.stringify(before)).not.toContain("Simple Agenda");

    const started = await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "archives", "v112-run-archives");
    expect(started.actorPayload.playerView.run?.breach).toMatchObject({ serverId: "archives", remainingCount: 1 });
    expect(JSON.stringify(started.actorPayload)).toContain("Simple Economy Asset");
    expect(JSON.stringify(started.actorPayload)).toContain("Simple Agenda");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerView.run?.breach?.remainingCount).toBe(1);
    expect(JSON.stringify(reconnected)).toContain("Simple Economy Operation");
    expect(JSON.stringify(reconnected)).toContain("Simple Economy Asset");
    expect(JSON.stringify(reconnected)).toContain("Simple Agenda");

    const firstAccess = await submit(match.service, match.matchId, { ...match.runner, sessionToken: reconnected.sessionToken }, (action) => action.type === "access_card", "v112-access-agenda");
    expect(firstAccess.publicEvent?.publicPayload).toMatchObject({ actionType: "access_card", cardDefinitionId: "simple_agenda", serverLabel: "Archives" });
    expect(JSON.stringify(firstAccess.actorPayload)).toContain("Simple Economy Asset");
    expect(JSON.stringify(firstAccess.actorPayload)).toContain("Simple Agenda");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnected.sessionToken,
      actionId: firstAccess.receipt.idempotencyKey,
      clientKnownStateVersion: firstAccess.receipt.stateVersionBefore,
      idempotencyKey: "v112-access-agenda"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(firstAccess.receipt.stateVersionAfter);

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${started.receipt.stateVersionAfter}`,
      reason: "Archives reveal undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected undo_blocked");
    expect(blocked.error.code).toBe("undo_blocked");
    expect(JSON.stringify(blocked.error)).not.toContain("Simple Agenda");
  });

  it("handles V0.98 Hidden-Zone Search through submit, idempotency, reconnect and undo barrier", async () => {
    const match = await joinedV098HiddenSearchMatch("mp-v098-hidden-search");
    const before = await bootstrap(match.service, match.matchId, match.runner);
    const searchAction = mustAction(before, (action) => action.type === "play_event" && String(action.source).includes("v098_stack_search_event"));

    const started = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: searchAction.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v098-search-start"
    });

    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.error.message);
    expect(started.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(started.actorPayload.pendingChoice?.kind).toBe("select_cards");
    expect(started.actorPayload.pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(started.opponentPayload.pendingChoice).toBeUndefined();
    expect(JSON.stringify(started.opponentPayload)).not.toContain("Simple Decoder");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: searchAction.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v098-search-start"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(started.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: searchAction.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v098-search-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Agenda");

    const choiceAction = reconnected.legalActions.find((action) => action.type === "resolve_choice");
    const selectedOptionId = reconnected.pendingChoice?.options.find((option) => option.label === "Simple Decoder")?.id;
    expect(choiceAction).toBeDefined();
    expect(selectedOptionId).toBeDefined();
    if (!choiceAction || !selectedOptionId) throw new Error("Missing V0.98 search choice");
    const resolved = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnected.sessionToken,
      actionId: choiceAction.actionId,
      clientKnownStateVersion: reconnected.playerView.stateVersion,
      selectedChoices: { choiceId: reconnected.pendingChoice?.choiceId, selectedOptionIds: [selectedOptionId] },
      idempotencyKey: "v098-search-resolve"
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error(resolved.error.message);
    expect(resolved.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(resolved.publicEvent?.publicPayload)).not.toContain("Simple Decoder");
    expect(resolved.actorPayload.playerView.own.gripOrHq.some((card) => card.definitionId === "simple_decoder")).toBe(true);
    expect(JSON.stringify(resolved.opponentPayload)).not.toContain("Simple Decoder");

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${started.receipt.stateVersionAfter}`,
      reason: "Hidden-zone search undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected undo_blocked");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("handles V0.99 Hosting through submit, idempotency, reconnect and undo barrier", async () => {
    const match = await joinedV099HostingMatch("mp-v099-hosting");
    const before = await bootstrap(match.service, match.matchId, match.runner);
    const hostAction = mustAction(before, (action) => action.type === "install_card" && String(action.source).includes("v099_host_resource"));

    const started = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: hostAction.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v099-host-install"
    });

    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.error.message);
    expect(started.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(started.actorPayload.pendingChoice?.kind).toBe("select_cards");
    expect(started.actorPayload.pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(started.opponentPayload.pendingChoice).toBeUndefined();
    expect(JSON.stringify(started.opponentPayload)).not.toContain("Simple Decoder");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: hostAction.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v099-host-install"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(started.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: hostAction.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v099-host-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.pendingChoice?.options.some((option) => option.label === "Simple Decoder")).toBe(true);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Agenda");

    const choiceAction = reconnected.legalActions.find((action) => action.type === "resolve_choice");
    const selectedOptionId = reconnected.pendingChoice?.options.find((option) => option.label === "Simple Decoder")?.id;
    expect(choiceAction).toBeDefined();
    expect(selectedOptionId).toBeDefined();
    if (!choiceAction || !selectedOptionId) throw new Error("Missing V0.99 hosting choice");
    const resolved = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnected.sessionToken,
      actionId: choiceAction.actionId,
      clientKnownStateVersion: reconnected.playerView.stateVersion,
      selectedChoices: { choiceId: reconnected.pendingChoice?.choiceId, selectedOptionIds: [selectedOptionId] },
      idempotencyKey: "v099-host-resolve"
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error(resolved.error.message);
    expect(resolved.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(resolved.publicEvent?.publicPayload)).not.toContain("Simple Decoder");
    expect(resolved.actorPayload.playerView.own.rig?.some((card) => card.definitionId === "simple_decoder" && card.hostedOn)).toBe(true);
    expect(resolved.opponentPayload.playerView.opponent.rig?.some((card) => card.definitionId === "simple_decoder" && card.hostedOn)).toBe(true);

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${started.receipt.stateVersionAfter}`,
      reason: "Hosting hidden-zone undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected undo_blocked");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("reports V0.94 Flatline as a side-safe result reason", async () => {
    const match = await joinedV094DamageMatch("mp-v094-flatline", { emptyRunnerGrip: true });

    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v094-flatline-run");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "rez_ice" && action.label.includes("Neural Sentry"), "v094-flatline-rez");
    const flatline = await submit(match.service, match.matchId, match.runner, (action) => action.type === "continue_run", "v094-flatline-damage");

    expect(flatline.actorPayload.winner).toBe("corp");
    expect(flatline.actorPayload.matchStatus).toBe("finished");
    expect(flatline.actorPayload.resultSummary).toMatchObject({ winner: "corp", reason: "flatline" });
    expect(JSON.stringify(flatline.opponentPayload)).not.toContain("Simple Killer");
    expect(JSON.stringify(flatline.publicEvent)).not.toContain("Simple Killer");
  });

  it("projects Bad-Publicity-7+ game end as a side-safe result reason on reconnect", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "mp-bad-publicity-result" });
    const created = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      seed: "mp-bad-publicity-result",
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    const gameState = createGameAfterSetup({
      matchId: created.matchId,
      seed: "mp-bad-publicity-result",
      agendaPointsToWin: 7,
    });
    gameState.corp.badPublicity = 7;
    checkWinConditions(gameState);
    record.gameState = gameState;
    record.match.status = "finished";
    record.match.winner = "runner";
    record.match.updatedAt = "2026-05-17T00:00:00.000Z";
    record.eventLog = [];
    await storage.save(record);

    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "runner",
      reconnectToken: created.hostReconnectToken,
    });
    if ("error" in reconnected) throw new Error(reconnected.error.message);

    expect(reconnected.winner).toBe("runner");
    expect(reconnected.resultSummary).toMatchObject({
      winner: "runner",
      reason: "bad_publicity_7",
    });
    expect(reconnected.playerView.gameEndReason).toBe("bad_publicity_7");
    expect(JSON.stringify(reconnected)).not.toContain("cardInstances");
    expect(JSON.stringify(reconnected)).not.toContain("privatePayload");
    expect(JSON.stringify(reconnected)).not.toContain("onr_proteus_");
  });

  it("replays a multiplayer match to the stored final state hash", async () => {
    const match = await joinedMatch("replay-multiplayer");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "gain_credit", "credit");

    const replay = await match.service.replayMatch(match.matchId);
    expect(replay.ok).toBe(true);
    expect(replay.finalStateHash).toMatch(/^fnv1a:/);
  });

  it("builds V1.5.0 private replay views with timeline checks and redacted export", async () => {
    const match = await joinedMatch("v150-private-replay");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "v150-mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "install_card", "v150-install");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "v150-end-turn");
    await resolveCorpDiscardIfPending(match.service, match.matchId, match.corp, "v150-corp-discard");
    await putTopCorpAgendaForMatch(match.service, match.matchId);
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v150-rd-run-1");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "access_card", "v150-rd-access");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "steal_agenda", "v150-rd-steal");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v150-rd-run-2");

    const index = await match.service.listReplayIndex();
    const entry = index.find((candidate) => candidate.matchId === match.matchId);
    expect(entry).toBeDefined();
    if (!entry) throw new Error("Missing replay index entry");
    expect(entry.finalStateHash).toMatch(/^fnv1a:/);
    expect(typeof entry.replayOk).toBe("boolean");
    expect(JSON.stringify(entry)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist/i);
    const stored = await match.service.loadForTest(match.matchId);
    expect(stored?.gameState.eventLog.some((event) => Boolean(event.privatePayload))).toBe(true);
    expect(stored?.eventLog.some((event) => "privatePayload" in event)).toBe(false);
    expect(stored?.eventLog.every((event) => typeof event.privatePayloadLocalOnly === "boolean")).toBe(true);
    expect(stored?.eventLog.map((event) => event.eventId)).toEqual(stored?.gameState.eventLog.map((event) => event.eventId));

    const runnerLoaded = await match.service.loadReplayView(match.matchId, "runner");
    expect(runnerLoaded.ok).toBe(true);
    if (!runnerLoaded.ok) throw new Error(runnerLoaded.error.message);
    const runnerReplay = runnerLoaded.replay;
    expect(runnerReplay.perspective).toBe("runner");
    expect(runnerReplay.localAnalysis).toBe(false);
    expect(runnerReplay.timeline.length).toBeGreaterThan(0);
    expect(runnerReplay.timeline.every((step) => typeof step.stateVersionBefore === "number" && typeof step.stateVersionAfter === "number" && typeof step.timingPoint === "string")).toBe(true);
    expect(runnerReplay.timeline.every((step) => step.stateHashCheck.expected.startsWith("fnv1a:"))).toBe(true);
    expect(runnerReplay.timeline.some((step) => step.hiddenInfoBarrier)).toBe(true);
    expect(runnerReplay.randomDrawRecords.length).toBeGreaterThan(0);
    expect(runnerReplay.randomDrawRecords.every((entry) => entry.valueHash.startsWith("fnv1a:"))).toBe(true);
    expect(JSON.stringify(runnerReplay)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist|[A-Za-z]:\\\\/i);

    const localLoaded = await match.service.loadReplayView(match.matchId, "local_analysis");
    expect(localLoaded.ok).toBe(true);
    if (!localLoaded.ok) throw new Error(localLoaded.error.message);
    expect(localLoaded.replay.localAnalysis).toBe(true);
    expect(localLoaded.replay.exploitSuggestions.every((candidate) => candidate.status === "review_suggestion")).toBe(true);

    const exported = await match.service.exportReplay(match.matchId, "runner");
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(exported.error.message);
    expect(exported.artifact.version).toBe("1.5.0");
    expect(exported.artifact.perspective).toBe("runner");
    expect(exported.artifact.baseline.engineSchemaVersion).toBe(exported.artifact.replay.metadata.baseline.engineSchemaVersion);
    expect(exported.artifact.replay.localAnalysis).toBe(false);
    expect(exported.artifact.replay.perspective).toBe("runner");
    expect(JSON.stringify(exported.artifact)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist|[A-Za-z]:\\\\/i);

    const localExport = await match.service.exportReplay(match.matchId, "local_analysis");
    expect(localExport.ok).toBe(false);
    if (localExport.ok) throw new Error("Expected local_analysis export to be rejected");
    expect(localExport.error.code).toBe("bad_request");
  });

  it("keeps replay DecisionDebug side-safe across runner/corp/local perspectives", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "v150-decision-debug" });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "v150-decision-debug",
      corpDifficulty: "normal"
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      { side: "runner", sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
      "keep",
      "v150-setup-keep"
    );
    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "single_step"
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);

    const runnerReplayLoaded = await service.loadReplayView(created.matchId, "runner");
    const corpReplayLoaded = await service.loadReplayView(created.matchId, "corp");
    const localReplayLoaded = await service.loadReplayView(created.matchId, "local_analysis");
    expect(runnerReplayLoaded.ok).toBe(true);
    expect(corpReplayLoaded.ok).toBe(true);
    expect(localReplayLoaded.ok).toBe(true);
    if (!runnerReplayLoaded.ok || !corpReplayLoaded.ok || !localReplayLoaded.ok) throw new Error("Replay load failed");

    const runnerDebugStep = runnerReplayLoaded.replay.timeline.find((step) => step.decisionDebug);
    const corpDebugStep = corpReplayLoaded.replay.timeline.find((step) => step.decisionDebug);
    const localDebugStep = localReplayLoaded.replay.timeline.find((step) => step.decisionDebug);
    expect(runnerDebugStep).toBeDefined();
    expect(corpDebugStep).toBeDefined();
    expect(localDebugStep).toBeDefined();
    if (!runnerDebugStep || !corpDebugStep || !localDebugStep) throw new Error("Missing decision debug step");

    expect(runnerDebugStep.side).toBe("corp");
    expect(runnerDebugStep.decisionDebug).toMatchObject({ schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION, redacted: true, reason: "side_private_ai_debug" });
    expect(corpDebugStep.decisionDebug).toMatchObject({ schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION, actor: "corp" });
    expect((corpDebugStep.decisionDebug as { redacted?: boolean })?.redacted).toBeUndefined();
    expect(localDebugStep.decisionDebug).toMatchObject({ schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION, actor: "corp" });
    expect((localDebugStep.decisionDebug as { redacted?: boolean })?.redacted).toBeUndefined();

    const stored = await storage.load(created.matchId);
    expect(stored).toBeDefined();
    if (!stored) throw new Error("Missing stored match");
    const debugRecord = stored.eventLog.find((event) => event.publicPayload.publicPayload.aiDecisionDebug);
    expect(debugRecord).toBeDefined();
    if (!debugRecord) throw new Error("Missing AI debug record");
    debugRecord.publicPayload.publicPayload.aiDecisionDebug = {
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      aiLevel: 2,
      planKind: "fallback",
      facts: ["public_fact:ok", "privatePayload runner-sessionToken"],
      opponentHqContents: ["Hidden Priority Agenda"],
      privatePayload: { FullState: true },
      opponentModel: {
        visibleSignal: "safe",
        rdContents: ["hidden-deck-card"],
        sessionToken: "runner-session-secret"
      }
    };
    await storage.save(stored);

    const redactedCorpReplayLoaded = await service.loadReplayView(created.matchId, "corp");
    expect(redactedCorpReplayLoaded.ok).toBe(true);
    if (!redactedCorpReplayLoaded.ok) throw new Error(redactedCorpReplayLoaded.error.message);
    const redactedDebugStep = redactedCorpReplayLoaded.replay.timeline.find((step) => step.decisionDebug);
    expect(redactedDebugStep?.decisionDebug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      actor: "corp",
      facts: ["public_fact:ok", "[redacted-debug-value]"]
    });
    expect(JSON.stringify(redactedCorpReplayLoaded.replay)).not.toMatch(/runner-session-secret|privatePayload|FullState|Hidden Priority Agenda|hidden-deck-card|decklist|sessionToken|reconnectToken|joinToken/i);
  });

  it("classifies V1.5.0 replay event families for access, damage, trace, replacement and special-zone flows", async () => {
    const accessMatch = await joinedMatch("v150-family-access");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.corp, (action) => action.type === "mandatory_draw", "v150-family-access-draw");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.corp, (action) => action.type === "install_card", "v150-family-access-install");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.corp, (action) => action.type === "end_turn", "v150-family-access-end");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v150-family-access-run");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.runner, (action) => action.type === "access_card" || action.type === "steal_agenda", "v150-family-access-access");
    const accessReplay = await accessMatch.service.loadReplayView(accessMatch.matchId, "local_analysis");
    expect(accessReplay.ok).toBe(true);
    if (!accessReplay.ok) throw new Error(accessReplay.error.message);
    expect(accessReplay.replay.timeline.some((step) => step.eventFamily === "run_and_access")).toBe(true);

    const damageMatch = await joinedV094DamageMatch("v150-family-damage");
    await submit(damageMatch.service, damageMatch.matchId, damageMatch.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v150-family-damage-run");
    await submit(damageMatch.service, damageMatch.matchId, damageMatch.corp, (action) => action.type === "rez_ice" && action.label.includes("Neural Sentry"), "v150-family-damage-rez");
    await submit(damageMatch.service, damageMatch.matchId, damageMatch.runner, (action) => action.type === "continue_run", "v150-family-damage-continue");
    const damageReplay = await damageMatch.service.loadReplayView(damageMatch.matchId, "local_analysis");
    expect(damageReplay.ok).toBe(true);
    if (!damageReplay.ok) throw new Error(damageReplay.error.message);
    expect(damageReplay.replay.timeline.some((step) => step.eventFamily === "damage_and_survival")).toBe(true);

    const traceMatch = await joinedV096TraceMatch("v150-family-trace");
    const corpChoice = await bootstrap(traceMatch.service, traceMatch.matchId, traceMatch.corp);
    const corpBidAction = mustAction(corpChoice, (action) => action.type === "resolve_choice");
    await traceMatch.service.submitAction({
      matchId: traceMatch.matchId,
      side: traceMatch.corp.side,
      sessionToken: traceMatch.corp.sessionToken,
      actionId: corpBidAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: { choiceId: corpChoice.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] },
      idempotencyKey: "v150-family-trace-bid"
    });
    const traceReplay = await traceMatch.service.loadReplayView(traceMatch.matchId, "local_analysis");
    expect(traceReplay.ok).toBe(true);
    if (!traceReplay.ok) throw new Error(traceReplay.error.message);
    expect(traceReplay.replay.timeline.some((step) => step.eventFamily === "trace_and_tags")).toBe(true);

    const replacementMatch = await joinedV121ReplacementMatch("v150-family-replacement");
    const beforeOperation = await bootstrap(replacementMatch.service, replacementMatch.matchId, replacementMatch.corp);
    const replacementOperation = mustAction(beforeOperation, (action) => action.type === "play_operation" && action.label.includes("Core Damage"));
    await replacementMatch.service.submitAction({
      matchId: replacementMatch.matchId,
      side: replacementMatch.corp.side,
      sessionToken: replacementMatch.corp.sessionToken,
      actionId: replacementOperation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v150-family-replacement-open"
    });
    const replacementReplay = await replacementMatch.service.loadReplayView(replacementMatch.matchId, "local_analysis");
    expect(replacementReplay.ok).toBe(true);
    if (!replacementReplay.ok) throw new Error(replacementReplay.error.message);
    expect(replacementReplay.replay.timeline.some((step) => step.eventFamily === "replacement_and_prevention")).toBe(true);

    const specialMatch = await joinedV122SpecialZoneMatch("v150-family-special-zone");
    const specialBefore = await bootstrap(specialMatch.service, specialMatch.matchId, specialMatch.runner);
    const specialAction = mustAction(specialBefore, (action) => action.type === "move_to_set_aside");
    await specialMatch.service.submitAction({
      matchId: specialMatch.matchId,
      side: specialMatch.runner.side,
      sessionToken: specialMatch.runner.sessionToken,
      actionId: specialAction.actionId,
      clientKnownStateVersion: specialBefore.playerView.stateVersion,
      idempotencyKey: "v150-family-special-zone"
    });
    const specialReplay = await specialMatch.service.loadReplayView(specialMatch.matchId, "local_analysis");
    expect(specialReplay.ok).toBe(true);
    if (!specialReplay.ok) throw new Error(specialReplay.error.message);
    expect(specialReplay.replay.timeline.some((step) => step.eventFamily === "special_zones_and_control")).toBe(true);
  });

  it("plays a private two-player match through to a Runner win", async () => {
    const match = await joinedMatch("mp-win-1", { agendaPointsToWin: 2, matchFormat: "single_game" });
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await putTopCorpAgendaForMatch(match.service, match.matchId);
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "end-turn");
    await resolveCorpDiscardIfPending(match.service, match.matchId, match.corp, "corp-discard-before-run");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "access_card", "access-rd");
    const steal = await submit(match.service, match.matchId, match.runner, (action) => action.type === "steal_agenda", "steal");

    expect(steal.actorPayload.winner).toBe("runner");
    expect(steal.actorPayload.matchStatus).toBe("finished");
    expect(steal.actorPayload.finalStateHash).toMatch(/^fnv1a:/);
    expect(steal.actorPayload.resultSummary).toMatchObject({
      winner: "runner",
      viewerOutcome: "won",
      reason: "agenda_points",
      matchFormat: "rules_match",
      agendaPointsToWin: 2,
      runnerAgendaPoints: 2,
      corpAgendaPoints: 0,
      runCount: 1,
      successfulRunCount: 1,
      stolenAgendaCount: 1,
      scoredAgendaCount: 0
    });
    expect(steal.actorPayload.resultSummary?.actionCount).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(steal.actorPayload.resultSummary)).not.toContain("Simple Agenda");
    expect(JSON.stringify(steal.actorPayload.resultSummary)).not.toContain("cardInstances");

    const corpPayload = await bootstrap(match.service, match.matchId, match.corp);
    expect(corpPayload.resultSummary?.viewerOutcome).toBe("lost");
    expect(corpPayload.legalActions).toEqual([]);
  });

  it("applies the selected, fixed and deterministic random KI deck policies without exposing decklists", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-deck-policy" });
    const participantADecks = {
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6"
    };
    const participantBDecks = {
      runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
      corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6"
    };

    const selected = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-selected",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "selected"
    });
    const selectedRecord = await service.loadForTest(selected.matchId);
    expect(selectedRecord?.match.deckSetup.aiDeckPolicy).toBe("selected");
    expect(selectedRecord?.match.deckSetup.assignment).toEqual({ runnerPlayer: "player_b", corpPlayer: "player_a" });
    expect(selectedRecord?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_004_snapshot_v0_6");
    expect(selectedRecord?.match.deckSetup.corpSnapshotId).toBe("demo_corp_004_snapshot_v0_6");

    const fixed = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-fixed",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "fixed"
    });
    const fixedRecord = await service.loadForTest(fixed.matchId);
    expect(fixedRecord?.match.deckSetup.aiDeckPolicy).toBe("fixed");
    expect(fixedRecord?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_008_snapshot_v0_8");
    expect(fixedRecord?.match.deckSetup.corpSnapshotId).toBe("demo_corp_004_snapshot_v0_6");
    expect(fixedRecord?.match.deckSetup.participants?.player_b).toMatchObject({
      runnerSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpSnapshotId: "demo_corp_008_snapshot_v0_8"
    });

    const randomOne = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-random-seed",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "seeded_random"
    });
    const randomTwo = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-random-seed",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "seeded_random"
    });
    const randomRecordOne = await service.loadForTest(randomOne.matchId);
    const randomRecordTwo = await service.loadForTest(randomTwo.matchId);
    const validRunnerIds = (snapshotsData08.snapshots as DeckSnapshot[]).filter((snapshot) => snapshot.side === "runner" && snapshot.validation.ok).map((snapshot) => snapshot.deckSnapshotId);
    const validCorpIds = (snapshotsData08.snapshots as DeckSnapshot[]).filter((snapshot) => snapshot.side === "corp" && snapshot.validation.ok).map((snapshot) => snapshot.deckSnapshotId);
    expect(randomRecordOne?.match.deckSetup.aiDeckPolicy).toBe("seeded_random");
    expect(randomRecordOne?.match.deckSetup.participants?.player_b).toEqual(randomRecordTwo?.match.deckSetup.participants?.player_b);
    expect(validRunnerIds).toContain(randomRecordOne?.match.deckSetup.participants?.player_b.runnerSnapshotId);
    expect(validCorpIds).toContain(randomRecordOne?.match.deckSetup.participants?.player_b.corpSnapshotId);
    expect(randomRecordOne?.match.deckSetup.runnerSnapshotId).toBe(randomRecordOne?.match.deckSetup.participants?.player_b.runnerSnapshotId);
    expect(JSON.stringify(randomRecordOne?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(randomOne)).not.toContain("cardInstances");
  });

  it("starts Human-Korp-vs-Runner-KI with the King of the Road Runner AI snapshot", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "kotr-runner-ai-start" });
    const created = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "kotr-runner-ai-start",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      participantBDecks: {
        runnerDeckSnapshotId: "king_of_the_road_runner_ai_snapshot_v1",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      aiDeckPolicy: "selected",
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" }
    });
    const record = await service.loadForTest(created.matchId);

    expect(created.hostSide).toBe("corp");
    expect(created.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(record?.match.deckSetup.aiDeckPolicy).toBe("selected");
    expect(record?.match.deckSetup.assignment).toEqual({ runnerPlayer: "player_b", corpPlayer: "player_a" });
    expect(record?.match.deckSetup.runnerSnapshotId).toBe("king_of_the_road_runner_ai_snapshot_v1");
    expect(record?.match.deckSetup.corpSnapshotId).toBe("demo_corp_008_snapshot_v0_8");
    expect(record?.match.deckSetup.participants?.player_b.runnerSnapshotId).toBe("king_of_the_road_runner_ai_snapshot_v1");
    expect(record?.match.deckSetup.participants?.player_b.corpSnapshotId).toBe("demo_corp_008_snapshot_v0_8");
    expect(created.playerView.deckMetadata?.opponent.deckName).toBe("King of the Road");
    expect(JSON.stringify(record?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(created)).not.toMatch(/onr_v1_006_black-dahlia|onr_v1_108_score|cardInstances|privatePayload|joinToken|tokenHash/);
  });

  it("accepts O:NR origins AI runner and corp snapshots in selected KI deck mode", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "onr-origins-ai-start" });

    const runnerAiCreated = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "onr-origins-runner-ai",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      participantBDecks: {
        runnerDeckSnapshotId: "onr_origin_runner_ai_snapshot_v1",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      aiDeckPolicy: "selected"
    });
    const runnerAiRecord = await service.loadForTest(runnerAiCreated.matchId);
    expect(runnerAiRecord?.match.deckSetup.runnerSnapshotId).toBe("onr_origin_runner_ai_snapshot_v1");
    expect(runnerAiCreated.playerView.deckMetadata?.opponent.deckName).toBe("Runner Origins AI - Probe Pressure");

    const corpAiCreated = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "onr-origins-corp-ai",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "onr_origin_corp_ai_snapshot_v1"
      },
      aiDeckPolicy: "selected"
    });
    const corpAiRecord = await service.loadForTest(corpAiCreated.matchId);
    expect(corpAiRecord?.match.deckSetup.corpSnapshotId).toBe("onr_origin_corp_ai_snapshot_v1");
    expect(corpAiCreated.playerView.deckMetadata?.opponent.deckName).toBe("Corp Origins AI - Tax & Punish");
    expect(JSON.stringify(corpAiCreated)).not.toMatch(/onr_v1_203_hostile-takeover|onr_v1_297_overtime-incentives|cardInstances|privatePayload|joinToken|tokenHash/);

    const runnerVariantCreated = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "onr-origins-runner-ai-variant",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      participantBDecks: {
        runnerDeckSnapshotId: "onr_origin_runner_ai_event_pressure_snapshot_v1",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      aiDeckPolicy: "selected"
    });
    expect(runnerVariantCreated.playerView.deckMetadata?.opponent.deckName).toBe("Runner Origins AI - Event Pressure");

    const corpVariantCreated = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "onr-origins-corp-ai-variant",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "onr_origin_corp_ai_tag_ops_snapshot_v1"
      },
      aiDeckPolicy: "selected"
    });
    expect(corpVariantCreated.playerView.deckMetadata?.opponent.deckName).toBe("Corp Origins AI - Tag Ops Control");
  });

  it("derives Human-vs-KI random side assignment server-side from the seed", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-random-side" });
    const first = await service.createMatch({
      hostSide: "random",
      playMode: "human_vs_ai",
      humanSide: "random",
      seed: "human-ai-random-side",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      aiDeckPolicy: "fixed"
    });
    const second = await service.createMatch({
      hostSide: "random",
      playMode: "human_vs_ai",
      humanSide: "random",
      seed: "human-ai-random-side",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      },
      aiDeckPolicy: "fixed"
    });

    expect(first.hostSide).toBe(second.hostSide);
    expect(first.mode).toBe(second.mode);
    expect(["human_runner_vs_corp_ai", "human_corp_vs_runner_ai"]).toContain(first.mode);
    expect(first.matchStatus).toBe("active");
    expect(first.aiTurnPresentation?.pacingMode).toBe("paced");
    expect(JSON.stringify(first)).not.toContain("cardInstances");
  });

  it("creates the next private series game with a side swap and side-safe standings", async () => {
    const match = await joinedMatch("series-side-swap", { agendaPointsToWin: 2, matchFormat: "two_game_side_swap" });
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await putTopCorpAgendaForMatch(match.service, match.matchId);
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "end-turn");
    await resolveCorpDiscardIfPending(match.service, match.matchId, match.corp, "corp-discard-before-run");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "access_card", "access-rd");
    const steal = await submit(match.service, match.matchId, match.runner, (action) => action.type === "steal_agenda", "steal");

    expect(steal.actorPayload.resultSummary?.series).toMatchObject({
      mode: "two_game_side_swap",
      status: "between_games",
      gameNumber: 1,
      gamesPlanned: 2,
      viewerWins: 1,
      opponentWins: 0,
      draws: 0,
      viewerMatchPoints: 10,
      opponentMatchPoints: 0,
      viewerSeriesOutcome: "won",
      seriesDecision: "match_points",
      nextAvailable: true
    });

    const next = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      displayName: "Runner im Seitenwechsel"
    });
    expect("error" in next).toBe(false);
    if ("error" in next) throw new Error(next.error.message);
    expect(next.matchId).not.toBe(match.matchId);
    expect(next.hostSide).toBe("corp");
    expect(next.joinUrl).toBeTruthy();
    expect(JSON.stringify(next)).not.toContain("cardInstances");

    const oldRecord = await match.service.loadForTest(match.matchId);
    const nextRecord = await match.service.loadForTest(next.matchId);
    expect(oldRecord?.match.series?.nextMatchId).toBe(next.matchId);
    expect(nextRecord?.match.settings.matchFormat).toBe("two_game_side_swap");
    expect(nextRecord?.match.settings.agendaPointsToWin).toBe(2);
    expect(nextRecord?.match.series).toMatchObject({
      seriesId: oldRecord?.match.series?.seriesId,
      status: "active",
      gameNumber: 2,
      gamesPlanned: 2,
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
      previousMatchId: match.matchId
    });
    expect(nextRecord?.match.series?.results).toHaveLength(1);

    const duplicate = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken
    });
    expect("error" in duplicate).toBe(true);
    if (!("error" in duplicate)) throw new Error("Expected duplicate series-next rejection");
    expect(duplicate.error.code).toBe("series_next_exists");
  });

  it("treats forfeit in game 1 of a private series as a single-game result and keeps series-next available", async () => {
    const match = await joinedMatch("series-forfeit-game-1", { agendaPointsToWin: 7, matchFormat: "two_game_side_swap" });
    const beforeRecord = await match.service.loadForTest(match.matchId);
    if (!beforeRecord?.gameState) throw new Error("Missing series game state");
    const beforeHash = hashState(beforeRecord.gameState);

    const forfeited = await match.service.forfeitMatch({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken
    });
    expect(forfeited.ok).toBe(true);
    if (!forfeited.ok) throw new Error(forfeited.error.message);
    const runnerPayload = expectSidePayload(forfeited.actorPayload);
    expect(runnerPayload.matchStatus).toBe("forfeited");
    expect(runnerPayload.resultSummary).toMatchObject({
      reason: "forfeit",
      winnerSide: "corp",
      loserSide: "runner",
      finalEngineStateHash: beforeHash,
      series: {
        status: "between_games",
        gameNumber: 1,
        gamesPlanned: 2,
        viewerWins: 0,
        opponentWins: 1,
        viewerMatchPoints: 0,
        opponentMatchPoints: 10,
        viewerSeriesOutcome: "lost",
        nextAvailable: true
      }
    });

    const stored = await match.service.loadForTest(match.matchId);
    expect(stored?.gameState.winner).toBeFalsy();
    expect(stored?.match.series?.results[0]).toMatchObject({
      matchId: match.matchId,
      gameNumber: 1,
      winner: "corp",
      reason: "forfeit",
      finalStateHash: beforeHash
    });
    expect((await match.service.replayMatch(match.matchId)).finalStateHash).toBe(beforeHash);

    const next = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      displayName: "Runner nach Aufgabe"
    });
    expect("error" in next).toBe(false);
    if ("error" in next) throw new Error(next.error.message);
    expect(next.hostSide).toBe("corp");
    expect(next.matchId).not.toBe(match.matchId);
    expect((await match.service.loadForTest(match.matchId))?.match.series?.nextMatchId).toBe(next.matchId);
  });

  it("closes a private series when the last planned game ends by forfeit", async () => {
    const match = await joinedMatch("series-forfeit-final-game", { agendaPointsToWin: 7, matchFormat: "two_game_side_swap" });
    const record = await match.service.loadForTest(match.matchId);
    if (!record?.gameState || !record.match.series) throw new Error("Missing active series record");
    record.match.series = {
      ...record.match.series,
      gameNumber: 2,
      results: [
        {
          matchId: "series-forfeit-final-game-1",
          gameNumber: 1,
          winner: "corp",
          reason: "agenda_points",
          runnerPlayer: record.match.series.runnerPlayer,
          corpPlayer: record.match.series.corpPlayer,
          runnerAgendaPoints: 0,
          corpAgendaPoints: 2,
          finishedAt: "2026-05-19T08:00:00.000Z",
          finalStateHash: "fnv1a:game1"
        }
      ]
    };
    await (match.service as unknown as { storage: MultiplayerStorage }).storage.save(record);

    const beforeHash = hashState(record.gameState);
    const forfeited = await match.service.forfeitMatch({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken
    });
    expect(forfeited.ok).toBe(true);
    if (!forfeited.ok) throw new Error(forfeited.error.message);
    const corpPayload = expectSidePayload(forfeited.actorPayload);
    expect(corpPayload.resultSummary).toMatchObject({
      reason: "forfeit",
      winnerSide: "runner",
      loserSide: "corp",
      finalEngineStateHash: beforeHash,
      series: {
        status: "finished",
        gameNumber: 2,
        gamesPlanned: 2,
        viewerWins: 1,
        opponentWins: 1,
        viewerMatchPoints: 10,
        opponentMatchPoints: 10,
        viewerSeriesOutcome: "draw",
        seriesDecision: "draw",
        nextAvailable: false
      }
    });
    const stored = await match.service.loadForTest(match.matchId);
    expect(stored?.match.series?.status).toBe("finished");
    expect(stored?.match.series?.results).toHaveLength(2);
    const next = await match.service.startNextSeriesGame(match.matchId, {
      side: match.corp.side,
      sessionToken: match.corp.sessionToken
    });
    expect("error" in next).toBe(true);
    if (!("error" in next)) throw new Error("Expected finished series rejection");
    expect(next.error.code).toBe("series_finished");
  });

  it("uses 10-point game wins and loser agenda points for private series scoring", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "series-agenda-tiebreak" });
    const created = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "series-agenda-tiebreak",
      settings: { agendaPointsToWin: 7, matchFormat: "two_game_side_swap" }
    });
    const record = await storage.load(created.matchId);
    if (!record?.gameState || !record.match.series) throw new Error("Expected active series record");

    record.gameState.winner = "runner";
    record.match.status = "finished";
    record.match.winner = "runner";
    record.match.series = {
      ...record.match.series,
      status: "finished",
      gameNumber: 2,
      gamesPlanned: 2,
      runnerPlayer: "player_b",
      corpPlayer: "player_a",
      results: [
        {
          matchId: "series-game-1",
          gameNumber: 1,
          winner: "corp",
          runnerPlayer: "player_b",
          corpPlayer: "player_a",
          runnerAgendaPoints: 2,
          corpAgendaPoints: 0,
          finishedAt: "2026-05-07T10:00:00.000Z",
          finalStateHash: "hash-game-1"
        },
        {
          matchId: created.matchId,
          gameNumber: 2,
          winner: "runner",
          runnerPlayer: "player_b",
          corpPlayer: "player_a",
          runnerAgendaPoints: 7,
          corpAgendaPoints: 0,
          finishedAt: "2026-05-07T10:30:00.000Z",
          finalStateHash: hashState(record.gameState)
        }
      ]
    };
    await storage.save(record);

    const payload = await service.bootstrap(created.matchId, "corp", created.hostSessionToken);
    expect("error" in payload).toBe(false);
    if ("error" in payload) throw new Error(payload.error.message);
    expect(payload.resultSummary?.viewerOutcome).toBe("lost");
    expect(payload.resultSummary?.series).toMatchObject({
      status: "finished",
      viewerWins: 1,
      opponentWins: 1,
      viewerMatchPoints: 10,
      opponentMatchPoints: 12,
      viewerAgendaPoints: 0,
      opponentAgendaPoints: 9,
      viewerSeriesOutcome: "lost",
      seriesDecision: "match_points"
    });
  });

  it("keeps personal Runner/Corp deck pairs across a private side-swap series", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "series-personal-decks",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:8787"
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "series-personal-decks",
      settings: { agendaPointsToWin: 2, matchFormat: "two_game_side_swap" },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6"
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
      }
    });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Corp B" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const firstRecord = await service.loadForTest(created.matchId);
    expect(firstRecord?.match.deckSetup.assignment).toEqual({ runnerPlayer: "player_a", corpPlayer: "player_b" });
    expect(firstRecord?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_008_snapshot_v0_8");
    expect(firstRecord?.match.deckSetup.corpSnapshotId).toBe("demo_corp_008_snapshot_v0_8");
    expect(firstRecord?.match.deckSetup.participants?.player_a).toMatchObject({
      runnerSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpSnapshotId: "demo_corp_004_snapshot_v0_6"
    });
    expect(firstRecord?.match.deckSetup.participants?.player_b).toMatchObject({
      runnerSnapshotId: "demo_runner_004_snapshot_v0_6",
      corpSnapshotId: "demo_corp_008_snapshot_v0_8"
    });
    expect(JSON.stringify(firstRecord?.match.deckSetup)).not.toContain("cards");

    const runner = { side: "runner" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken };
    const corp = { side: "corp" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken };
    await forceSetupComplete(service, created.matchId);
    await submit(service, created.matchId, corp, (action) => action.type === "mandatory_draw", "mandatory");
    await putTopCorpAgendaForMatch(service, created.matchId);
    await submit(service, created.matchId, corp, (action) => action.type === "end_turn", "end-turn");
    await resolveCorpDiscardIfPending(service, created.matchId, corp, "corp-discard-before-run");
    await submit(service, created.matchId, runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(service, created.matchId, runner, (action) => action.type === "access_card", "access-rd");
    const steal = await submit(service, created.matchId, runner, (action) => action.type === "steal_agenda", "steal");
    expect(steal.actorPayload.resultSummary?.series).toMatchObject({
      viewerPlayer: "player_a",
      viewerWins: 1,
      opponentWins: 0,
      viewerAgendaPoints: 2,
      opponentAgendaPoints: 0
    });

    const next = await service.startNextSeriesGame(created.matchId, {
      side: runner.side,
      sessionToken: runner.sessionToken,
      displayName: "Teilnehmer A"
    });
    expect("error" in next).toBe(false);
    if ("error" in next) throw new Error(next.error.message);
    const nextRecord = await service.loadForTest(next.matchId);
    expect(next.hostSide).toBe("corp");
    expect(next.playerView.deckMetadata?.own.deckHash).toBe(firstRecord?.match.deckSetup.participants?.player_a.corp.deckHash);
    expect(next.playerView.deckMetadata?.opponent.deckHash).toBe(firstRecord?.match.deckSetup.participants?.player_b.runner.deckHash);
    expect(nextRecord?.match.deckSetup.assignment).toEqual({ runnerPlayer: "player_b", corpPlayer: "player_a" });
    expect(nextRecord?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_004_snapshot_v0_6");
    expect(nextRecord?.match.deckSetup.corpSnapshotId).toBe("demo_corp_004_snapshot_v0_6");
    expect(nextRecord?.privateDeckSnapshots?.participants?.player_a.corp.deckSnapshotId).toBe("demo_corp_004_snapshot_v0_6");
    expect(nextRecord?.privateDeckSnapshots?.participants?.player_b.runner.deckSnapshotId).toBe("demo_runner_004_snapshot_v0_6");
    expect(nextRecord?.match.series?.results[0]).toMatchObject({
      winner: "runner",
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
      runnerAgendaPoints: 2,
      corpAgendaPoints: 0
    });
    expect(JSON.stringify(next)).not.toContain("cardInstances");
    expect(JSON.stringify(nextRecord?.match.deckSetup)).not.toContain("cards");
  });

  it("sends side-filtered bootstrap messages over WebSocket", async () => {
    const auditEvents: ConnectionAuditEvent[] = [];
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-test",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "runner", seed: "ws-bootstrap" });
    const handle = createNetgridHttpServer(service, { connectionAudit: { record: (event) => auditEvents.push(event) } });
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
      const update = await waitForMessage(socket, "lobby_update");
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
      await waitForMessage(replacement, "lobby_update");
      const oldMessage = await oldClosed;
      expect(JSON.stringify(oldMessage)).toContain("reconnected_elsewhere");
      socket.close();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const stored = await service.loadForTest(created.matchId);
      expect(stored?.sessions.find((session) => session.side === created.hostSide)?.connected).toBe(true);
      replacement.close();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(auditEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ event: "ws_open" }),
          expect.objectContaining({ event: "ws_join_ok", matchId: created.matchId, side: created.hostSide }),
          expect.objectContaining({ event: "ws_replaced_by_reconnect", matchId: created.matchId, side: created.hostSide, code: 4000 }),
          expect.objectContaining({ event: "ws_close", matchId: created.matchId, side: created.hostSide, ignoredAsReplaced: true })
        ])
      );
      expect(JSON.stringify(auditEvents)).not.toContain(created.hostSessionToken);
      expect(JSON.stringify(auditEvents)).not.toContain(created.hostReconnectToken);
      expect(JSON.stringify(auditEvents)).not.toMatch(/Simple Agenda|cardInstances|privatePayload|decklist/i);
    } finally {
      socket.close();
      await handle.close();
    }
  });

  it("clears pending undo prompts over WebSocket after a response", async () => {
    const match = await joinedMatch("ws-undo-clear");
    const mandatory = await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "ws-undo-clear-mandatory");
    const targetEventId = `evt_${mandatory.receipt.stateVersionAfter}`;
    const handle = createNetgridHttpServer(match.service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const corpSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    const runnerSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await Promise.all([waitForOpen(corpSocket), waitForOpen(runnerSocket)]);
      corpSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: match.matchId, sessionToken: match.corp.sessionToken, side: "corp" }
        })
      );
      runnerSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: match.matchId, sessionToken: match.runner.sessionToken, side: "runner" }
        })
      );
      await Promise.all([waitForMessage(corpSocket, "state_update"), waitForMessage(runnerSocket, "state_update")]);

      const corpPendingUpdate = waitForMessage(corpSocket, "state_update");
      const runnerPendingUpdate = waitForMessage(runnerSocket, "state_update");
      const corpUndoRequest = waitForMessage(corpSocket, "undo_request");
      const runnerUndoRequest = waitForMessage(runnerSocket, "undo_request");
      corpSocket.send(JSON.stringify({ type: "request_undo", payload: { targetEventId, reason: "Misclick" } }));

      expect((messagePayload(await corpPendingUpdate) as { pendingUndo?: { needsResponse?: boolean } }).pendingUndo?.needsResponse).toBe(false);
      expect((messagePayload(await runnerPendingUpdate) as { pendingUndo?: { needsResponse?: boolean } }).pendingUndo?.needsResponse).toBe(true);
      const runnerUndoMessage = (await runnerUndoRequest) as { payload?: { undoRequestId?: string; needsResponse?: boolean } };
      const runnerUndoPayload = runnerUndoMessage.payload;
      expect(runnerUndoPayload?.needsResponse).toBe(true);
      expect(JSON.stringify(await corpUndoRequest)).not.toMatch(/Simple Agenda|cardInstances|privatePayload|decklist/i);
      expect(runnerUndoPayload?.undoRequestId).toBeTruthy();

      const corpClearedUpdate = waitForMessage(corpSocket, "state_update");
      const runnerClearedUpdate = waitForMessage(runnerSocket, "state_update");
      runnerSocket.send(JSON.stringify({ type: "accept_undo", payload: { undoRequestId: runnerUndoPayload!.undoRequestId } }));

      expect((messagePayload(await corpClearedUpdate) as { pendingUndo?: unknown }).pendingUndo).toBeNull();
      expect((messagePayload(await runnerClearedUpdate) as { pendingUndo?: unknown }).pendingUndo).toBeNull();
      const corpBootstrap = await match.service.bootstrap(match.matchId, "corp", match.corp.sessionToken);
      expect("error" in corpBootstrap).toBe(false);
      if ("error" in corpBootstrap) throw new Error(corpBootstrap.error.message);
      expect(corpBootstrap.pendingUndo).toBeUndefined();
      const reconnected = await match.service.reconnectMatch(match.matchId, {
        side: "runner",
        reconnectToken: match.runner.reconnectToken
      });
      expect("error" in reconnected).toBe(false);
      if ("error" in reconnected) throw new Error(reconnected.error.message);
      expect(reconnected.pendingUndo).toBeUndefined();
    } finally {
      corpSocket.close();
      runnerSocket.close();
      await handle.close();
    }
  });

  it("sends V0.93 pending choices only to the owning side over bootstrap, reconnect and WebSocket", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ws-choice-test",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "runner", seed: "ws-choice" });
    expect(created.joinUrl).toBeTruthy();
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Corp" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const stored = await storage.load(created.matchId);
    expect(stored).toBeDefined();
    if (!stored) throw new Error("Missing stored match");
    stored.gameState.pendingChoice = choiceRequest(stored.gameState, "runner");
    await storage.save(stored);

    const runnerBootstrap = await service.bootstrap(created.matchId, "runner", created.hostSessionToken);
    const corpBootstrap = await service.bootstrap(created.matchId, "corp", joined.sessionToken);
    expect("error" in runnerBootstrap).toBe(false);
    expect("error" in corpBootstrap).toBe(false);
    if ("error" in runnerBootstrap || "error" in corpBootstrap) throw new Error("Bootstrap failed");
    expect(runnerBootstrap.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(corpBootstrap.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpBootstrap)).not.toContain("Runner private option");

    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "runner",
      reconnectToken: created.hostReconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.pendingChoice?.choiceId).toBe("choice_v093_runner");

    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: reconnected.sessionToken, side: "runner" }
        })
      );
      const choiceMessage = await waitForMessage(socket, "choice_request");
      const choice = (choiceMessage as { payload?: { choice?: { choiceId?: string; options?: Array<{ label?: string }> } | null } }).payload?.choice;
      expect(choice?.choiceId).toBe("choice_v093_runner");
      expect(choice?.options?.[0]?.label).toBe("Runner private option");
      expect(JSON.stringify(choiceMessage)).not.toContain("hostSessionToken");
    } finally {
      socket.close();
      await handle.close();
    }
  });

  it("broadcasts active match status to the host when the second player joins by WebSocket", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-status-test",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "corp", seed: "ws-status" });
    const handle = createNetgridHttpServer(service);
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
      const waitingUpdate = await waitForMessage(hostSocket, "lobby_update");
      expect(messagePayload(waitingUpdate).matchStatus).toBe("pending");

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

  it("keeps both browser tabs in the ready lobby after the joiner submits decks", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-join-deck-lobby",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({
      mode: "human_vs_human",
      hostSide: "runner",
      seed: "ws-join-deck-lobby",
      countdownSeconds: 5,
      settings: { matchFormat: "single_game" },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6"
      }
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");

    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const hostSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    let joinerSocket: WebSocket | undefined;

    try {
      await waitForOpen(hostSocket);
      hostSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide }
        })
      );
      const waitingUpdate = await waitForMessage(hostSocket, "lobby_update");
      const waitingPayload = messagePayload(waitingUpdate) as {
        matchStatus?: string;
        startLobby?: { participants?: { player_b?: { connected?: boolean; runnerDeckReady?: boolean } } };
      };
      expect(waitingPayload.matchStatus).toBe("pending");
      expect(waitingPayload.startLobby?.participants?.player_b?.connected).toBe(false);
      expect(waitingPayload.startLobby?.participants?.player_b?.runnerDeckReady).toBe(false);

      const joinedResponse = await fetch(`http://127.0.0.1:${address.port}/api/matches/${encodeURIComponent(created.matchId)}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token: joinToken,
          displayName: "Teilnehmer B",
          runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
          corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
        })
      });
      expect(joinedResponse.status).toBe(200);
      const joined = (await joinedResponse.json()) as JoinMatchResult;
      expect(joined.matchStatus).toBe("ready_check");
      expect(joined.lobby?.hostReady).toBe(false);
      expect(joined.lobby?.joinerReady).toBe(false);
      expect(joined.lobby?.participants.player_b.runnerDeckReady).toBe(true);
      expect(joined.lobby?.participants.player_b.corpDeckReady).toBe(true);
      expect(joined.playerView).toBeFalsy();

      joinerSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
      await waitForOpen(joinerSocket);
      joinerSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: joined.sessionToken, side: joined.side }
        })
      );
      const hostReadyUpdate = await waitForMessage(hostSocket, "lobby_update");
      const hostPayload = messagePayload(hostReadyUpdate) as {
        matchStatus?: string;
        startLobby?: { participants?: { player_b?: { runnerDeckReady?: boolean; corpDeckReady?: boolean } } };
      };
      expect(hostPayload.matchStatus).toBe("ready_check");
      expect(hostPayload.startLobby?.participants?.player_b?.runnerDeckReady).toBe(true);
      expect(hostPayload.startLobby?.participants?.player_b?.corpDeckReady).toBe(true);
      expect(JSON.stringify(hostPayload)).not.toContain("deckHash");
      expect(JSON.stringify(hostPayload)).not.toContain("cardInstances");
    } finally {
      hostSocket.close();
      joinerSocket?.close();
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
    expect(created.pendingChoice?.source).toBe("setup.mulligan");
    expect(created.matchVersion).toBe(1);
    expect(created.aiTurnPresentation).toEqual({ canAdvanceAi: false, pacingMode: "paced" });
    expect(created.legalActions.some((action) => action.type === "resolve_choice")).toBe(true);

    const stored = await service.loadForTest(created.matchId);
    expect(stored?.match.aiControllers?.corp?.type).toBe("ai");
    expect(JSON.stringify(created)).not.toContain("cardInstances");
    expect(JSON.stringify(created)).not.toContain("Simple Agenda");

    const afterSetup = await submitChoice(
      service,
      created.matchId,
      { side: "runner", sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
      "keep",
      "runner-ai-mode-setup"
    );
    expect(afterSetup.aiTurnPresentation).toEqual({ activeAiSide: "corp", canAdvanceAi: true, pacingMode: "paced" });

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "single_step"
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(advanced.requesterPayload.playerView.stateVersion).toBe(afterSetup.playerView.stateVersion + 1);
    expect(advanced.requesterPayload.aiTurnPresentation?.activeAiSide).toBe("corp");
    expect(advanced.publicEvent?.publicPayload.aiExplanation).toBeTruthy();
    expect(JSON.stringify(advanced.requesterPayload)).not.toContain("cardInstances");
    expect(JSON.stringify(advanced.requesterPayload)).not.toContain("Simple Agenda");
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
    expect(before.pendingChoice?.source).toBe("setup.mulligan");
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      { side: "corp", sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
      "keep",
      "corp-ai-mode-setup"
    );
    const mandatory = mustAction(afterSetup, (action) => action.type === "mandatory_draw");
    const mandatoryResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: afterSetup.playerView.stateVersion,
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

    expect(endTurnResult.actorPayload.playerView.stateVersion).toBe(afterMandatory.playerView.stateVersion + 1);
    expect(endTurnResult.actorPayload.pendingChoice?.source).toBe("discard_phase");
    const afterDiscard = await submitFirstChoice(
      service,
      created.matchId,
      { side: "corp", sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
      "corp-ai-mode-discard"
    );
    expect(afterDiscard.aiTurnPresentation).toEqual({ activeAiSide: "runner", canAdvanceAi: true, pacingMode: "paced" });
    expect(afterDiscard.opponentStatus.connected).toBe(true);
    expect(JSON.stringify(afterDiscard)).not.toContain("Simple Fracter");

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterDiscard.playerView.stateVersion,
      knownMatchVersion: afterDiscard.matchVersion
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(advanced.requesterPayload.playerView.stateVersion).toBeGreaterThan(afterDiscard.playerView.stateVersion);
    expect(JSON.stringify(advanced.requesterPayload)).not.toContain("Simple Fracter");
  });

  it("waits for an explicit Human Corp rez decision during Runner AI runs", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "ai-runner-rez-window" });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai-rez-window",
      runnerDifficulty: "normal"
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    let gameState = createGameAfterSetup({ matchId: created.matchId, seed: "server-runner-ai-rez-window" });
    gameState = applyEngineAction(gameState, "corp", (action) => action.type === "mandatory_draw");
    gameState = applyEngineAction(gameState, "corp", (action) => action.type === "end_turn");
    if (gameState.pendingChoice?.source === "discard_phase") gameState = applyEngineChoice(gameState, "corp", [String(gameState.pendingChoice.options[0]?.id)]);
    putCorpIceOnServerForTest(gameState, "rd", "simple_barrier_ice");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    expect(gameState.activeSide).toBe("corp");
    expect(gameState.timingPoint).toBe("run.approach_ice");

    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
    record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_ai_rez_window")];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const before = await service.bootstrap(created.matchId, "corp", created.hostSessionToken);
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    expect(before.aiTurnPresentation).toEqual({ canAdvanceAi: false, pacingMode: "paced" });
    expect(before.legalActions.map((action) => action.type).sort()).toEqual(["decline_rez", "rez_ice"]);

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: before.playerView.stateVersion,
      knownMatchVersion: before.matchVersion,
      mode: "single_step"
    });
    expect(advanced.ok).toBe(false);
    if (advanced.ok) throw new Error("Expected advance_ai to wait for the human Corp rez decision");
    expect(advanced.error.code).toBe("ai_not_active");

    const declineRez = before.legalActions.find((action) => action.type === "decline_rez");
    if (!declineRez) throw new Error("Missing decline rez action");
    const declined = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: declineRez.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "human-corp-decline-rez"
    });
    expect(declined.ok).toBe(true);
    if (!declined.ok) throw new Error(declined.error.message);
    expect(declined.actorPayload.playerView.activeSide).toBe("runner");
    expect(declined.actorPayload.playerView.timingPoint).toBe("access.resolve_card");
    expect(declined.actorPayload.aiTurnPresentation).toEqual({ activeAiSide: "runner", canAdvanceAi: true, pacingMode: "paced" });
    expect(declined.publicEvent?.publicPayload).toMatchObject({ actionType: "decline_rez" });
    expect(declined.publicEvent?.publicPayload).not.toHaveProperty("autoPacedPass");

    const continued = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: declined.actorPayload.playerView.stateVersion,
      knownMatchVersion: declined.actorPayload.matchVersion,
      mode: "single_step"
    });
    expect(continued.ok).toBe(true);
    if (!continued.ok) throw new Error(continued.error.message);
    expect(continued.requesterPayload.playerView.stateVersion).toBeGreaterThan(declined.actorPayload.playerView.stateVersion);
  });

  it("advances Runner AI through Krash breaking Filter into R&D access without post-pass jack-out", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "ai-runner-krash-filter-access" });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai-krash-filter-access",
      runnerDifficulty: "normal",
      runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
      corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0"
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    const runnerDeck: DeckDefinition = {
      id: "server_runner_ai_krash_filter_runner",
      name: "Server Runner AI Krash Filter Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_039_krash", quantity: 1 },
        { id: "simple_economy_event", quantity: 8 }
      ]
    };
    const corpDeck: DeckDefinition = {
      id: "server_runner_ai_krash_filter_corp",
      name: "Server Runner AI Krash Filter Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "onr_v1_244_filter", quantity: 1 },
        { id: "simple_draw_operation", quantity: 1 },
        { id: "simple_economy_operation", quantity: 3 },
        { id: "simple_agenda", quantity: 3 }
      ]
    };
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "server-runner-ai-krash-filter-access-engine",
        baseline: MVP_0_99_BASELINE,
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7
      })
    );
    gameState.runner.credits = 5;
    gameState.corp.credits = 5;
    moveRunnerCardToGripForTest(gameState, "onr_v1_039_krash");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) => {
        const cardId = String(action.payload?.cardId ?? "");
        return action.type === "install_card" && gameState.cardInstances[cardId]?.definitionId === "onr_v1_039_krash";
      }
    );
    putCorpIceOnServerForTest(gameState, "rd", "onr_v1_244_filter");
    putCorpCardOnTopOfRdForTest(gameState, "simple_draw_operation");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    expect(gameState.activeSide).toBe("corp");
    expect(gameState.timingPoint).toBe("run.approach_ice");

    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
    record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_ai_krash_filter_access")];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const beforeRez = await service.bootstrap(created.matchId, "corp", created.hostSessionToken);
    expect("error" in beforeRez).toBe(false);
    if ("error" in beforeRez) throw new Error(beforeRez.error.message);
    expect(beforeRez.legalActions.map((action) => action.type).sort()).toEqual(["decline_rez", "rez_ice"]);

    const rezAction = beforeRez.legalActions.find((action) => action.type === "rez_ice");
    if (!rezAction) throw new Error("Missing rez action");
    const rezzed = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: rezAction.actionId,
      clientKnownStateVersion: beforeRez.playerView.stateVersion,
      idempotencyKey: "human-corp-rez-filter-for-runner-ai"
    });
    expect(rezzed.ok).toBe(true);
    if (!rezzed.ok) throw new Error(rezzed.error.message);
    expect(rezzed.publicEvent?.publicPayload).toMatchObject({ actionType: "rez_ice" });

    let corpPayload = rezzed.actorPayload;
    const actionTypes: string[] = [];
    const reasonCodes: string[] = [];
    async function advanceRunnerAiStep(label: string) {
      const result = await service.advanceAi({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        knownStateVersion: corpPayload.playerView.stateVersion,
        knownMatchVersion: corpPayload.matchVersion,
        mode: "single_step"
      });
      expect(result.ok, label).toBe(true);
      if (!result.ok) throw new Error(result.error.message);
      corpPayload = result.requesterPayload;
      actionTypes.push(String(result.publicEvent?.publicPayload.actionType));
      reasonCodes.push(String(result.publicEvent?.publicPayload.aiReasonCode));
      return result;
    }

    const breakStep = await advanceRunnerAiStep("break Filter with Krash");
    expect(breakStep.publicEvent?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      aiReasonCode: "runner.encounter.break_etr"
    });

    const passIceStep = await advanceRunnerAiStep("continue after broken Filter");
    expect(passIceStep.publicEvent?.publicPayload).toMatchObject({
      actionType: "continue_run",
      encounterContinue: true
    });

    const accessWindowStep = await advanceRunnerAiStep("continue from server movement to access");
    expect(accessWindowStep.publicEvent?.publicPayload.actionType).toBe("continue_run");
    expect(["runner.plan.safe_probe_run", "runner.encounter.continue"]).toContain(
      accessWindowStep.publicEvent?.publicPayload.aiReasonCode
    );
    expect(JSON.stringify(accessWindowStep.publicEvent?.publicPayload)).not.toMatch(
      /ambush|simple_economy_operation|privatePayload|cardInstances/i
    );

    const accessStep = await advanceRunnerAiStep("access R&D");
    expect(accessStep.publicEvent?.publicPayload).toMatchObject({
      actionType: "access_card",
      aiReasonCode: "runner.access.open_card"
    });
    expect(actionTypes).toEqual([
      "break_subroutine",
      "continue_run",
      "continue_run",
      "access_card"
    ]);
    expect(reasonCodes).not.toContain("runner.run.jack_out_before_access_low_value");
    expect(actionTypes).not.toContain("jack_out");
    expect(JSON.stringify(accessStep.requesterPayload)).not.toMatch(
      /Simple Draw Operation|simple_draw_operation|privatePayload|cardInstances/i
    );
  });

  it("redacts R&D access card identities from Corp payloads", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "central-access-redaction" });
    const created = await service.createMatch({ hostSide: "corp", seed: "central-access-redaction" });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });

    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing record");
    let gameState = toRunnerTurnEngine(createGameAfterSetup({ matchId: created.matchId, seed: "central-access-redaction-engine" }));
    putCorpCardOnTopOfRdForTest(gameState, "simple_agenda");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "access_card");
    record.gameState = gameState;
    record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
    record.match.matchVersion += 1;
    await storage.save(record);

    const corpPayload = await service.bootstrap(created.matchId, "corp", created.hostSessionToken);
    expect("error" in corpPayload).toBe(false);
    if ("error" in corpPayload) throw new Error(corpPayload.error.message);
    expect(JSON.stringify(corpPayload.eventTail)).not.toContain("Simple Agenda");
    expect(JSON.stringify(corpPayload.playerView.publicEvents)).not.toContain("Simple Agenda");
    expect(corpPayload.eventTail.at(-1)?.publicPayload).toMatchObject({ actionType: "access_card", serverLabel: "R&D", redactedKind: "accessed_card" });
  });

  it("keeps HQ access card identities visible in Corp payloads", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "hq-access-visible" });
    const created = await service.createMatch({ hostSide: "corp", seed: "hq-access-visible" });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });

    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing record");
    let gameState = toRunnerTurnEngine(createGameAfterSetup({ matchId: created.matchId, seed: "hq-access-visible-engine" }));
    moveCorpCardToHqForTest(gameState, "simple_economy_operation");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "hq");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "access_card");
    record.gameState = gameState;
    record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
    record.match.matchVersion += 1;
    await storage.save(record);

    const corpPayload = await service.bootstrap(created.matchId, "corp", created.hostSessionToken);
    expect("error" in corpPayload).toBe(false);
    if ("error" in corpPayload) throw new Error(corpPayload.error.message);
    const eventTailPayload = corpPayload.eventTail.at(-1)?.publicPayload;
    const playerViewPayload = corpPayload.playerView.publicEvents.at(-1)?.publicPayload;
    expect(eventTailPayload?.actionType).toBe("access_card");
    expect(eventTailPayload?.serverLabel).toBe("HQ");
    expect(typeof eventTailPayload?.title).toBe("string");
    expect(eventTailPayload).not.toHaveProperty("redactedKind");
    expect(playerViewPayload?.actionType).toBe("access_card");
    expect(playerViewPayload?.serverLabel).toBe("HQ");
    expect(typeof playerViewPayload?.title).toBe("string");
    expect(playerViewPayload).not.toHaveProperty("redactedKind");
  });

  it("preserves side-safe central-access belief across reconnect without storage leakage", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, { tokenSalt: "belief-reconnect-rd" });
    const created = await service.createMatch({ hostSide: "corp", seed: "belief-reconnect-rd" });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing record");
    let gameState = toRunnerTurnEngine(createGameAfterSetup({ matchId: created.matchId, seed: "belief-reconnect-rd-engine" }));
    putCorpCardOnTopOfRdForTest(gameState, "simple_economy_operation");
    putCorpCardOnTopOfRdForTest(gameState, "simple_agenda");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
    gameState = applyEngineAction(gameState, "runner", (action) => action.type === "access_card");
    record.gameState = gameState;
    record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
    record.match.matchVersion += 1;
    await storage.save(record);

    const storedWithHiddenDecoy = await storage.load(created.matchId);
    expect(JSON.stringify(storedWithHiddenDecoy?.gameState)).toContain("simple_economy_operation");

    const livePayload = await service.bootstrap(created.matchId, "runner", joined.sessionToken);
    expect("error" in livePayload).toBe(false);
    if ("error" in livePayload) throw new Error(livePayload.error.message);
    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "runner",
      reconnectToken: joined.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);

    const liveBelief = reconstructBeliefState(sidePayloadBeliefInput(livePayload, "runner", "live"));
    const reconnectBelief = reconstructBeliefState(sidePayloadBeliefInput(reconnected, "runner", "reconnect"));
    const reconnectSerialized = JSON.stringify(reconnected);
    const beliefSerialized = JSON.stringify(reconnectBelief);

    expect(beliefStateInvariantSignature(reconnectBelief)).toBe(beliefStateInvariantSignature(liveBelief));
    expect(reconnectBelief.knownPositionMemory?.[0]).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda"
    });
    expect(reconnectSerialized).not.toMatch(/privatePayload|cardInstances|privateDeckSnapshots|simple_economy_operation/i);
    expect(beliefSerialized).not.toMatch(/privatePayload|cardInstances|privateDeckSnapshots|simple_economy_operation/i);
  });

  it("rejects advance_ai when the session or version is wrong", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-advance-auth" });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai-auth",
      corpDifficulty: "normal"
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      { side: "runner", sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
      "keep",
      "ai-auth-setup"
    );

    const stale = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion + 1
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale rejection");
    expect(stale.error.code).toBe("stale_state");
    expect(stale.payload?.side).toBe("runner");

    const wrongToken = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: "wrong",
      knownStateVersion: afterSetup.playerView.stateVersion
    });
    expect(wrongToken.ok).toBe(false);
    if (wrongToken.ok) throw new Error("Expected token rejection");
    expect(wrongToken.error.code).toBe("unauthorized");

    const first = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "until_human"
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error.message);
    expect(first.requesterPayload.playerView.activeSide).toBe("runner");
    expect(first.requesterPayload.aiTurnPresentation?.canAdvanceAi).toBe(false);
  });

  it("keeps REST ai-advance responses limited to the requesting human side", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-advance-rest" });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai-rest",
      corpDifficulty: "normal"
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      { side: "runner", sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
      "keep",
      "ai-rest-setup"
    );
    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/matches/${encodeURIComponent(created.matchId)}/ai-advance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          side: "runner",
          sessionToken: created.hostSessionToken,
          knownStateVersion: afterSetup.playerView.stateVersion,
          mode: "single_step"
        })
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        requesterPayload?: SidePayload;
        opponentPayload?: SidePayload;
        publicEvent?: PublicGameEvent;
      };

      expect(response.status).toBe(200);
      expect(payload.ok).toBe(true);
      expect(payload.requesterPayload?.side).toBe("runner");
      expect(payload.opponentPayload).toBeUndefined();
      expect(payload.publicEvent?.publicPayload.aiExplanation).toBeTruthy();
      expect(JSON.stringify(payload)).not.toContain("cardInstances");
      expect(JSON.stringify(payload)).not.toContain("Simple Agenda");
    } finally {
      await handle.close();
    }
  });

  it("exposes V1.5.0 replay REST endpoints side-safely and blocks local-analysis export", async () => {
    const match = await joinedMatch("v150-replay-rest");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "v150-rest-mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "install_card", "v150-rest-install");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "v150-rest-end-turn");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v150-rest-run");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "access_card" || action.type === "steal_agenda", "v150-rest-access");

    const handle = createNetgridHttpServer(match.service);
    const baseUrl = await listen(handle);
    try {
      const indexResponse = await fetch(`${baseUrl}/api/replays`);
      const indexPayload = (await indexResponse.json()) as { replays?: Array<{ matchId: string; finalStateHash: string }> };
      expect(indexResponse.status).toBe(200);
      expect(indexPayload.replays?.some((entry) => entry.matchId === match.matchId)).toBe(true);
      expect(JSON.stringify(indexPayload)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist/i);

      const replayResponse = await fetch(`${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}?perspective=runner`);
      const replayPayload = (await replayResponse.json()) as { perspective?: string; localAnalysis?: boolean; timeline?: Array<{ hiddenInfoBarrier?: boolean }> };
      expect(replayResponse.status).toBe(200);
      expect(replayPayload.perspective).toBe("runner");
      expect(replayPayload.localAnalysis).toBe(false);
      expect(replayPayload.timeline?.some((entry) => entry.hiddenInfoBarrier)).toBe(true);
      expect(JSON.stringify(replayPayload)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist/i);

      const badPerspective = await fetch(`${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}?perspective=invalid`);
      expect(badPerspective.status).toBe(400);

      const localExportResponse = await fetch(`${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}/export?perspective=local_analysis`);
      const localExportPayload = (await localExportResponse.json()) as { error?: { code?: string } };
      expect(localExportResponse.status).toBe(400);
      expect(localExportPayload.error?.code).toBe("bad_request");

      const exportResponse = await fetch(`${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}/export?perspective=runner`);
      const exportPayload = (await exportResponse.json()) as { version?: string; perspective?: string };
      expect(exportResponse.status).toBe(200);
      expect(exportPayload.version).toBe("1.5.0");
      expect(exportPayload.perspective).toBe("runner");
      expect(JSON.stringify(exportPayload)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist|[A-Za-z]:\\\\/i);
    } finally {
      await handle.close();
    }
  });

  it("exposes a side-safe AI-vs-AI simulation API", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-api-service" });
    const handle = createNetgridHttpServer(service);
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

const V094_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_094",
  name: "Runner Demo Deck 0.94 - Multiplayer Damage Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 }
  ]
};

const V094_CORP_DECK: DeckDefinition = {
  id: "demo_corp_094",
  name: "Corp Demo Deck 0.94 - Multiplayer Damage Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "v094_neural_sentry_ice", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 }
  ]
};

const V111_CORP_DECK: DeckDefinition = {
  ...V094_CORP_DECK,
  id: "demo_corp_111",
  name: "Corp Demo Deck 1.1.1 - Multiplayer Core Damage Harness",
  cards: [...V094_CORP_DECK.cards, { id: "v111_core_damage_operation", quantity: 2 }]
};

const V095_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_095",
  name: "Runner Demo Deck 0.95 - Multiplayer Resource Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "v095_safehouse_resource", quantity: 2 }
  ]
};

const V095_CORP_DECK: DeckDefinition = {
  id: "demo_corp_095",
  name: "Corp Demo Deck 0.95 - Multiplayer Resource Trash Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 }
  ]
};

async function joinedMatch(seed = "service-test", settings?: Partial<MatchSettings>) {
  const service = new MultiplayerService(new InMemoryMatchStorage(), {
    tokenSalt: "test-salt",
    publicWebBaseUrl: "http://127.0.0.1:3100",
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
  const runner = { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken };
  const corp = { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken };
  await forceSetupComplete(service, created.matchId);
  return {
    service,
    created,
    joinToken,
    matchId: created.matchId,
    corp,
    runner
  };
}

async function forceSetupComplete(service: MultiplayerService, matchId: string): Promise<void> {
  const record = await service.loadForTest(matchId);
  if (!record?.gameState) throw new Error("Missing active game state");
  const gameState = structuredClone(record.gameState);
  record.match.status = "active";
  gameState.stateVersion = 0;
  gameState.activeSide = "corp";
  gameState.phase = "corp_draw_phase";
  gameState.timingPoint = "corp_draw.mandatory_draw";
  gameState.setup = { status: "complete", initialHandSize: 5, resolved: { runner: "keep", corp: "keep" }, mulligansTaken: {} };
  delete gameState.pendingChoice;
  gameState.winner = null;
  delete gameState.gameEndReason;
  const event = {
    ...gameState.eventLog[0]!,
    stateHashAfter: hashState({ ...gameState, eventLog: [] } as GameState),
    publicPayload: {
      ...gameState.eventLog[0]!.publicPayload,
      setupStatus: "complete"
    }
  };
  gameState.eventLog = [event];
  event.stateHashAfter = hashState(gameState);
  gameState.eventLog = [{ ...event, stateHashAfter: hashState(gameState) }];
  record.gameState = gameState;
  record.eventLog = gameState.eventLog.map((entry) => toEventRecordForTest(matchId, entry));
  record.actionReceipts = [];
  record.undoSnapshots = [];
  record.stateSnapshots = [stateSnapshotForTest(matchId, gameState, record.match.matchVersion, "snap_initial")];
  delete record.pendingUndo;
  await (service as unknown as { storage: MultiplayerStorage }).storage.save(record);
}

async function putTopCorpAgendaForMatch(service: MultiplayerService, matchId: string): Promise<void> {
  const record = await service.loadForTest(matchId);
  if (!record?.gameState) throw new Error("Missing active game state");
  const gameState = structuredClone(record.gameState);
  const agenda = Object.values(gameState.cardInstances).find((card) => {
    const definition = DEMO_CARDS_BY_ID[card.definitionId];
    return card.zone.side === "corp" && definition?.side === "corp" && definition.type === "agenda";
  });
  if (!agenda) throw new Error("Missing corp agenda");
  putCorpCardOnTopOfRdForTest(gameState, agenda.definitionId);
  const latestEventIndex = gameState.eventLog.length - 1;
  const event = latestEventIndex >= 0 ? gameState.eventLog[latestEventIndex] : undefined;
  if (event) gameState.eventLog[latestEventIndex] = { ...event, stateHashAfter: hashState(gameState) };
  record.gameState = gameState;
  record.eventLog = gameState.eventLog.map((entry) => toEventRecordForTest(matchId, entry));
  record.stateSnapshots = [stateSnapshotForTest(matchId, gameState, record.match.matchVersion, "snap_setup_agenda_top")];
  delete record.pendingUndo;
  await (service as unknown as { storage: MultiplayerStorage }).storage.save(record);
}

async function pendingDeckMatch(seed: string, countdownSeconds: 3 | 5 | 10 = 5) {
  const service = new MultiplayerService(new InMemoryMatchStorage(), {
    tokenSalt: `v104-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({
    hostSide: "runner",
    seed,
    mode: "human_vs_human",
    countdownSeconds,
    settings: { matchFormat: "single_game" },
    participantADecks: {
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6"
    }
  });
  const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  return { service, created, joinToken };
}

async function readyLobby(seed: string, countdownSeconds: 3 | 5 | 10 = 5) {
  const pending = await pendingDeckMatch(seed, countdownSeconds);
  const joined = await pending.service.joinMatch(pending.created.matchId, {
    token: pending.joinToken,
    displayName: "Joiner",
    runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
    corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8"
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);
  expect(joined.matchStatus).toBe("ready_check");
  return { ...pending, joined };
}

async function countdownLobby(seed: string) {
  const lobby = await readyLobby(seed, 5);
  const hostReady = await lobby.service.setLobbyReady({ matchId: lobby.created.matchId, side: lobby.created.hostSide, sessionToken: lobby.created.hostSessionToken, ready: true });
  expect(hostReady.ok).toBe(true);
  if (!hostReady.ok) throw new Error(hostReady.error.message);
  const joinerReady = await lobby.service.setLobbyReady({ matchId: lobby.created.matchId, side: lobby.joined.side, sessionToken: lobby.joined.sessionToken, ready: true });
  expect(joinerReady.ok).toBe(true);
  if (!joinerReady.ok) throw new Error(joinerReady.error.message);
  expect(joinerReady.actorPayload.matchStatus).toBe("countdown");
  return lobby;
}

async function expectOldTokensRejected(service: MultiplayerService, matchId: string, side: Side, sessionToken: string, reconnectToken: string) {
  const bootstrapResult = await service.bootstrap(matchId, side, sessionToken, { allowLobby: true });
  expect("error" in bootstrapResult).toBe(true);
  const reconnectResult = await service.reconnectMatch(matchId, { side, reconnectToken });
  expect("error" in reconnectResult).toBe(true);
}

function expectLifecyclePayloadSafe(payload: unknown) {
  const serialized = JSON.stringify(payload);
  expect(serialized).not.toContain("sessionToken");
  expect(serialized).not.toContain("reconnectToken");
  expect(serialized).not.toContain("hostSessionToken");
  expect(serialized).not.toContain("hostReconnectToken");
  expect(serialized).not.toContain("joinToken");
  expect(serialized).not.toContain("cardInstances");
}

function expectSidePayload(payload: unknown): SidePayload {
  if (!payload || typeof payload !== "object" || !("playerView" in payload) || !(payload as { playerView?: unknown }).playerView) throw new Error("Expected side payload");
  return payload as SidePayload;
}

function otherSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

async function joinedV094DamageMatch(seed: string, options: { emptyRunnerGrip?: boolean } = {}) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let gameState = toRunnerTurnEngine(createGameAfterSetup({ matchId: created.matchId, seed, runnerDeck: V094_RUNNER_DECK, corpDeck: V094_CORP_DECK, agendaPointsToWin: 7 }));
  if (options.emptyRunnerGrip) emptyRunnerGripForTest(gameState);
  putCorpIceOnServerForTest(gameState, "rd", "v094_neural_sentry_ice");
  gameState.corp.credits = 10;
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v094_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV120EventModificationMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = createGameAfterSetup({ matchId: created.matchId, seed, runnerDeck: V094_RUNNER_DECK, corpDeck: V111_CORP_DECK, agendaPointsToWin: 7 });
  let ready = applyEngineAction(gameState, "corp", (action) => action.type === "mandatory_draw");
  ready.eventModificationHarness = { damagePrevention: { side: "runner", preventAmount: 1 } };
  moveCorpCardToHqForTest(ready, "v111_core_damage_operation");
  ready.corp.credits = 10;
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, ready, record.match.matchVersion, "snap_v120_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV121ReplacementMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = createGameAfterSetup({ matchId: created.matchId, seed, runnerDeck: V094_RUNNER_DECK, corpDeck: V111_CORP_DECK, agendaPointsToWin: 7 });
  let ready = applyEngineAction(gameState, "corp", (action) => action.type === "mandatory_draw");
  ready.eventModificationHarness = { damageReplacement: { side: "runner", tagAmount: 1 } };
  moveCorpCardToHqForTest(ready, "v111_core_damage_operation");
  ready.corp.credits = 10;
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, ready, record.match.matchVersion, "snap_v121_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV122SpecialZoneMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let ready = toRunnerTurnEngine(createGameAfterSetup({ matchId: created.matchId, seed, agendaPointsToWin: 7 }));
  const cardId = moveRunnerCardToGripForTest(ready, "simple_economy_event");
  ready.specialZoneHarness = {
    actor: "runner",
    cardInstanceId: cardId,
    setAside: { visibility: "side_private", visibilitySide: "runner", reason: "mp_v122_side_private_set_aside" }
  };
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, ready, record.match.matchVersion, "snap_v122_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function prepareV123MitRunnerTurn(service: MultiplayerService, matchId: string): Promise<void> {
  const record = await service.loadForTest(matchId);
  if (!record?.gameState) throw new Error("Missing stored V1.2.3 match");
  const gameState = structuredClone(record.gameState);
  record.match.status = "active";
  gameState.activeSide = "runner";
  gameState.phase = "runner_action_phase";
  gameState.timingPoint = "runner_action.main";
  gameState.runner.clicks = 4;
  gameState.runner.credits = 5;
  gameState.setup = { status: "complete", initialHandSize: 5, resolved: { runner: "keep", corp: "keep" }, mulligansTaken: {} };
  delete gameState.pendingChoice;
  moveRunnerCardToGripForTest(gameState, "onr_v1_101_mit-west-tier");
  const latestEventIndex = gameState.eventLog.length - 1;
  if (latestEventIndex >= 0) gameState.eventLog[latestEventIndex] = { ...gameState.eventLog[latestEventIndex]!, stateHashAfter: hashState(gameState) };
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(matchId, gameState, record.match.matchVersion, "snap_v123_mit_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await (service as unknown as { storage: MultiplayerStorage }).storage.save(record);
}

async function joinedV095ResourceMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let gameState = toRunnerTurnEngine(createGameAfterSetup({ matchId: created.matchId, seed, runnerDeck: V095_RUNNER_DECK, corpDeck: V095_CORP_DECK, agendaPointsToWin: 7 }));
  gameState.runner.credits = 6;
  moveRunnerCardToGripForTest(gameState, "v095_safehouse_resource");
  gameState = applyEngineAction(gameState, "runner", (action) => action.type === "install_card" && action.label.includes("Safehouse Resource"));
  gameState.activeSide = "corp";
  gameState.phase = "corp_action_phase";
  gameState.timingPoint = "corp_action.main";
  gameState.corp.clicks = 3;
  gameState.corp.credits = 5;
  gameState.runner.tags = 1;
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v095_resource_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV096TraceMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let gameState = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_096",
      corpDeckId: "demo_corp_096",
      agendaPointsToWin: 7
    })
  );
  putCorpIceOnServerForTest(gameState, "rd", "v096_trace_probe_ice");
  gameState.corp.credits = 8;
  gameState.runner.credits = 5;
  gameState = applyEngineAction(gameState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
  gameState = applyEngineAction(gameState, "corp", (action) => action.type === "rez_ice" && action.label.includes("Trace Probe"));
  gameState = applyEngineAction(gameState, "runner", (action) => action.type === "continue_run");
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v096_trace_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV097BreachMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097",
      agendaPointsToWin: 7
    })
  );
  gameState.runner.credits = 5;
  moveRunnerCardToGripForTest(gameState, "v097_deep_dive_event");
  putCorpCardOnTopOfRdForTest(gameState, "simple_agenda");
  putCorpCardOnTopOfRdForTest(gameState, "simple_economy_operation");
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v097_breach_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV112ArchivesMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097",
      agendaPointsToWin: 7
    })
  );
  gameState.runner.credits = 10;
  const faceupOperation = moveCorpCardToArchivesForTest(gameState, "simple_economy_operation", true);
  const facedownAsset = moveCorpCardToArchivesForTest(gameState, "simple_economy_asset", false);
  const facedownAgenda = moveCorpCardToArchivesForTest(gameState, "simple_agenda", false);
  keepOnlyCorpArchivesCardsForTest(gameState, [faceupOperation, facedownAsset, facedownAgenda]);
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v112_archives_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV098HiddenSearchMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_098",
      corpDeckId: "demo_corp_098",
      agendaPointsToWin: 7
    })
  );
  moveRunnerCardToGripForTest(gameState, "v098_stack_search_event");
  putRunnerCardOnTopOfStackForTest(gameState, "simple_decoder");
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v098_hidden_search_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV099HostingMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_099",
      corpDeckId: "demo_corp_099",
      agendaPointsToWin: 7
    })
  );
  gameState.runner.credits = 2;
  moveRunnerCardToGripForTest(gameState, "v099_host_resource");
  moveRunnerCardToGripForTest(gameState, "simple_decoder");
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v099_hosting_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
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

function sidePayloadBeliefInput(
  payload: Pick<SidePayload, "playerView" | "eventTail" | "legalActions">,
  side: Side,
  label: string
) {
  return buildAiDecisionInputDto({
    side,
    playerView: payload.playerView,
    eventTail: payload.eventTail,
    legalActions: payload.legalActions,
    difficulty: "normal",
    seed: `server-belief:${label}`,
    decisionId: `server-belief:${label}:${side}:${payload.playerView.stateVersion}`,
    actionNumber: payload.playerView.stateVersion,
    profileId: `${side}-ai-v1.4.2-normal`
  });
}

function toRunnerTurnEngine(state: GameState): GameState {
  let next = applyEngineAction(state, "corp", (action) => action.type === "mandatory_draw");
  next = applyEngineAction(next, "corp", (action) => action.type === "end_turn");
  if (next.pendingChoice?.source === "discard_phase" && next.pendingChoice.side === "corp") {
    next = applyEngineChoice(next, "corp", [String(next.pendingChoice.options[0]?.id)]);
  }
  return next;
}

async function submitChoice(service: MultiplayerService, matchId: string, session: PlayerSession, optionId: string, key: string): Promise<SidePayload> {
  const before = await bootstrap(service, matchId, session);
  const choice = before.playerView.pendingChoice;
  if (!choice) throw new Error("Missing pending choice");
  const action = mustAction(before, (candidate) => candidate.type === "resolve_choice");
  const result = await service.submitAction({
    matchId,
    side: session.side,
    sessionToken: session.sessionToken,
    actionId: action.actionId,
    clientKnownStateVersion: before.playerView.stateVersion,
    selectedChoices: { choiceId: choice.choiceId, selectedOptionIds: [optionId] },
    idempotencyKey: `${key}-${before.playerView.stateVersion}`
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.actorPayload;
}

async function submitFirstChoice(service: MultiplayerService, matchId: string, session: PlayerSession, key: string): Promise<SidePayload> {
  const before = await bootstrap(service, matchId, session);
  const optionId = before.playerView.pendingChoice?.options[0]?.id;
  if (!optionId) throw new Error("Missing first choice option");
  return submitChoice(service, matchId, session, optionId, key);
}

async function resolveCorpDiscardIfPending(service: MultiplayerService, matchId: string, session: PlayerSession, key: string): Promise<void> {
  const before = await bootstrap(service, matchId, session);
  if (before.playerView.pendingChoice?.source !== "discard_phase") return;
  if (before.playerView.pendingChoice.side !== "corp") return;
  await submitFirstChoice(service, matchId, session, key);
}

function applyEngineAction(state: GameState, side: Side, predicate: (action: LegalAction) => boolean): GameState {
  const selected = getLegalActions(state, side).find(predicate);
  if (!selected) throw new Error(`Missing engine action for ${side}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyEngineChoice(state: GameState, side: Side, selectedOptionIds: string[]): GameState {
  const selected = getLegalActions(state, side).find((action) => action.type === "resolve_choice");
  if (!selected) throw new Error(`Missing engine choice action for ${side}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: { choiceId: state.pendingChoice?.choiceId, selectedOptionIds },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function putCorpIceOnServerForTest(state: GameState, serverId: "hq" | "rd" | "archives" | `remote_${number}`, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new Error("Missing server");
  removeEverywhereForTest(state, id);
  server.ice.push(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "serverIce", serverId }, faceup: false, rezzed: false };
  return id;
}

function putCorpCardOnTopOfRdForTest(state: GameState, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  return id;
}

function moveCorpCardToHqForTest(state: GameState, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "hq" }, faceup: false, rezzed: false };
  return id;
}

function moveCorpCardToArchivesForTest(state: GameState, definitionId: string, faceup = true): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.corp.archives.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "archives" }, faceup, rezzed: faceup };
  return id;
}

function keepOnlyCorpArchivesCardsForTest(state: GameState, ids: CardInstanceId[]): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = { ...state.cardInstances[cardId]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  }
}

function moveRunnerCardToGripForTest(state: GameState, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "grip" }, faceup: true, rezzed: true };
  return id;
}

function putRunnerCardOnTopOfStackForTest(state: GameState, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "stack" }, faceup: true, rezzed: true };
  return id;
}

function emptyRunnerGripForTest(state: GameState): void {
  for (const id of state.runner.grip.slice()) {
    removeEverywhereForTest(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "heap" }, faceup: true, rezzed: true };
  }
}

function findCardForTest(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(([, card]) => card.definitionId === definitionId);
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0];
}

function removeEverywhereForTest(state: GameState, cardId: string): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter((id) => id !== cardId);
  state.runner.rig.hardware = state.runner.rig.hardware.filter((id) => id !== cardId);
  state.runner.rig.resources = state.runner.rig.resources.filter((id) => id !== cardId);
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter((id) => id !== cardId);
    state.specialZones.removedFromGame = state.specialZones.removedFromGame.filter((id) => id !== cardId);
  }
}

function toEventRecordForTest(matchId: string, event: GameEvent): EventRecord {
  return {
    eventId: event.eventId,
    matchId,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    publicPayload: toPublicEventForTest(event),
    privatePayloadLocalOnly: true,
    hiddenInfoBarrier: false
  };
}

function stateSnapshotForTest(matchId: string, state: GameState, matchVersion: number, snapshotId: string): StateSnapshot {
  return {
    snapshotId,
    matchId,
    stateVersion: state.stateVersion,
    matchVersion,
    stateHash: hashState(state),
    gameState: structuredClone(state),
    createdAt: "2026-05-04T00:00:00.000Z",
    hiddenInfoBarrier: false
  };
}

function toPublicEventForTest(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass ? { visibilityClass: event.visibilityClass } : {}),
    publicPayload: event.publicPayload
  };
}

function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "server_v093_choice",
    prompt: "Runner private prompt",
    kind: "select_option",
    options: [{ id: "keep", label: "Runner private option" }],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side"
  };
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

function privateDeploymentConfig(): DeploymentConfig {
  return loadDeploymentConfig({
    NETGRID_DEPLOYMENT_PROFILE: "private_internet",
    NETGRID_WEB_BASE_URL: "https://netgrid.example",
    NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
    NETGRID_ALLOWED_ORIGINS: "https://netgrid.example",
    NETGRID_TOKEN_SALT: "private-test-salt",
    NETGRID_RATE_LIMIT_PROFILE: "private_internet"
  } as NodeJS.ProcessEnv);
}

async function listen(handle: ReturnType<typeof createNetgridHttpServer>): Promise<string> {
  await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
  const address = handle.server.address();
  if (!address || typeof address === "string") throw new Error("Missing server address");
  return `http://127.0.0.1:${address.port}`;
}

function waitForClosedOrErrored(socket: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    socket.once("close", () => resolve());
    socket.once("error", () => resolve());
  });
}

async function tempStorageDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "netgrid-v108-"));
}

async function storedMatchFixture(seed: string): Promise<{ record: StoredMatch; hostSessionToken: string; hostReconnectToken: string; joinToken: string }> {
  const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: `fixture-${seed}` });
  const created = await service.createMatch({ hostSide: "runner", seed });
  const joinToken = new URL(created.joinUrl ?? "").searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Corp" });
  expect("error" in joined).toBe(false);
  const record = await service.loadForTest(created.matchId);
  if (!record) throw new Error("Missing stored fixture");
  return { record, hostSessionToken: created.hostSessionToken, hostReconnectToken: created.hostReconnectToken, joinToken };
}

async function listBackupManifests(backupDir: string) {
  const entries = await readdir(backupDir, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => JSON.parse(await readFile(join(backupDir, entry.name, "manifest.json"), "utf8")) as Record<string, unknown>)
  );
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

class FailingStorage implements MultiplayerStorage {
  private readonly inner = new InMemoryMatchStorage();
  failNextSave = false;

  load(matchId: string): Promise<StoredMatch | undefined> {
    return this.inner.load(matchId);
  }

  async save(record: StoredMatch): Promise<void> {
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error("forced_storage_failure");
    }
    await this.inner.save(record);
  }

  list(): Promise<StoredMatch[]> {
    return this.inner.list();
  }
}
