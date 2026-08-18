import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import snapshotsData from "../../../data/decks/deck-snapshots-0.6.json";
import snapshotsData08 from "../../../data/decks/deck-snapshots-0.8.json";
import profilesData08 from "../../../data/decks/deck-format-profiles-0.8.json";
import {
  beliefStateInvariantSignature,
  buildAiDecisionInputDto,
  chooseAiAction as chooseRuntimeAiAction,
  residentPlanPortfolioSnapshot,
  reconstructBeliefState,
  resetResidentPlanPortfolioMemory,
} from "@netgrid/ai";
import { createRuntimeCardsById } from "@netgrid/catalog";
import {
  computeDeckHash,
  createDeckSnapshot,
  type DeckFormatProfile,
  type DeckSnapshot,
  type EditableDeck,
} from "@netgrid/decks";
import {
  applyAction,
  applyEffectCommands,
  checkWinConditions,
  createGameAfterSetup,
  CARD_DEFINITIONS_BY_ID,
  DEMO_DECKS,
  getLegalActions,
  hashState,
} from "@netgrid/engine";
import type { ConnectionAuditEvent } from "./connection-audit";
import {
  createConfiguredStorage,
  createNetgridHttpServer,
  isMaintenanceClientAddressAllowed,
  resolveConfiguredAccountSqlitePath,
  resolveConfiguredMatchSqlitePath,
  startNetgridServer,
} from "./http-server";
import { chronicleTurnContextByEventId } from "./chronicle-turn-context";
import {
  InMemoryMaintenanceCredentialStore,
  MaintenanceAuthService,
} from "./maintenance-auth";
import {
  assertInviteLobbyPayloadRedacted,
  findInviteLobbyPayloadRedactionLeaks,
} from "./invite-lobby-redaction.test-helper";
import {
  FixedWindowRateLimiter,
  createRateLimiter,
  loadDeploymentConfig,
  redactSensitiveText,
  redactedJoinUrl,
  type DeploymentConfig,
} from "./internet-hardening";
import {
  InMemoryMatchStorage,
  MultiplayerService,
  deckConsumerAuditFromCheckpointCapture,
  successfulRunCountForResult,
  turnPlanningAuditFromTrace,
  type ActionPersistenceLoadInput,
  type EventRecord,
  type JoinMatchResult,
  type MatchSettings,
  type MultiplayerStorage,
  type SidePayload,
  type StateSnapshot,
  type StoredMatch,
} from "./multiplayer";
import { SIDE_PAYLOAD_EVENT_TAIL_LIMIT } from "./multiplayer-payload";
import {
  SqliteMatchStorage,
  StorageError,
  inspectSqliteStorage,
  restoreSqliteStorageBackup,
} from "./storage-sqlite";
import {
  AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION,
  AI_DECISION_DEBUG_SCHEMA_VERSION,
  AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
  CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
  CURRENT_RULES_BASELINE,
  ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
  type AiDecision,
  type AiPlanFirstDecisionDebug,
  type ApiCreateMatchResponse,
  type CardInstanceId,
  type ChoiceRequest,
  type DeckDefinition,
  type GameEvent,
  type GameState,
  type LegalAction,
  type PublicGameEvent,
  type Side,
} from "@netgrid/shared";

function expectCurrentRulesBaseline(state: Pick<GameState, "baseline">): void {
  expect(state.baseline).toStrictEqual(CURRENT_RULES_BASELINE);
  expect(state.baseline.engineSchemaVersion).toBe(
    CURRENT_RULES_BASELINE.engineSchemaVersion,
  );
}

describe("trace rule profile setup", () => {
  it("persists an explicit profile into match settings, GameState and PlayerView", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "trace-profile-setup",
    });

    const created = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      seed: "trace-profile-setup",
      settings: { traceRulesProfile: "classic_blind_corp_ties" },
    });
    const stored = await storage.load(created.matchId);

    expect(stored?.match.settings.traceRulesProfile).toBe(
      "classic_blind_corp_ties",
    );
    expect(stored?.gameState.traceRulesProfile).toBe("classic_blind_corp_ties");
    expect(created.playerView.traceRulesProfile).toBe(
      "classic_blind_corp_ties",
    );
  });

  it("defaults old or omitted setup to Modern and exposes it in a start lobby", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "trace-profile-default",
    });

    const created = await service.createMatch({
      hostSide: "runner",
      seed: "trace-profile-default",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6",
      },
    });

    expect(created.lobby?.traceRulesProfile).toBe("modern_open");
    const stored = await storage.load(created.matchId);
    expect(stored?.match.settings.traceRulesProfile).toBe("modern_open");
  });
});

describe("recent match results", () => {
  it("exports a terminal full-information gamebook without technical or secret data", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "gamebook-export-test",
      now: () => "2026-07-21T12:00:00.000Z",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      seed: "gamebook-export-test",
    });
    const record = await storage.load(created.matchId);
    if (!record?.gameState) throw new Error("Missing gamebook test match");
    record.gameState.winner = "runner";
    record.match.status = "finished";
    record.match.winner = "runner";
    await storage.save(record);

    const exported = await service.exportGamebook(created.matchId);

    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(exported.error.message);
    expect(exported.artifact.version).toBe("gamebook-v1");
    expect(exported.artifact.markdown).toContain("# Spielprotokoll");
    expect(exported.artifact.markdown).toContain("## Beteiligte");
    expect(exported.artifact.markdown).toContain("**Runner:**");
    expect(exported.artifact.markdown).toContain("**Korp:**");
    expect(exported.artifact.markdown).toContain("## Spielvorbereitung");
    expect(exported.artifact.markdown).toContain("Korp – Starthand");
    expect(exported.artifact.markdown).toContain("Runner – erste Starthand");
    expect(exported.artifact.markdown).toContain("## Endergebnis");
    expect(exported.artifact.markdown).toContain("**Endstand:**");
    expect(exported.artifact.markdown).toContain("**Credits:** Runner");
    expect(exported.artifact.markdown).not.toMatch(
      /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|[A-Za-z]:\\/i,
    );
  });

  it("does not export a private gamebook without a participant session", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "private-gamebook-export-test",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      seed: "private-gamebook-export-test",
    });
    const record = await storage.load(created.matchId);
    if (!record?.gameState)
      throw new Error("Missing private gamebook test match");
    record.match.status = "finished";
    record.match.isPublic = false;
    await storage.save(record);

    const denied = await service.exportGamebook(created.matchId);
    expect(denied.ok).toBe(false);
  });

  it("lists the newest fully finished games without session tokens", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "recent-results-test",
      now: () => "2026-05-27T12:00:00.000Z",
    });
    await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      displayName: "Ludwig",
      identityKind: "account",
      seed: "recent-results-finished",
    });
    await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      displayName: "Offen",
      seed: "recent-results-active",
    });

    const records = await storage.list();
    const finished = records.find(
      (record) => record.match.seed === "recent-results-finished",
    );
    if (!finished?.gameState) throw new Error("Missing finished test match");
    finished.gameState.winner = "runner";
    finished.match.status = "finished";
    finished.match.winner = "runner";
    finished.match.updatedAt = "2026-05-27T12:10:00.000Z";
    await storage.save(finished);

    const results = await service.listRecentGameResults(20);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entryType: "single_game",
      matchId: finished.match.matchId,
      matchStatus: "finished",
      isPublic: true,
      matchMode: "human_runner_vs_corp_ai",
      winner: "runner",
      runner: {
        displayName: "Ludwig",
        identityKind: "account",
        matchPoints: 10,
      },
      corp: { displayName: "Korp-KI", identityKind: "ai", matchPoints: 0 },
    });
    const serialized = JSON.stringify(results[0]);
    expect(serialized).not.toContain("sessionToken");
    expect(serialized).not.toContain("reconnectToken");
    expect(serialized).not.toContain("tokenHash");

    const cached = await storage.load(finished.match.matchId);
    expect(cached?.resultSnapshot).toMatchObject({
      schemaVersion: "netgrid-match-result-v1",
      matchId: finished.match.matchId,
      winner: "runner",
      actionCount: expect.any(Number),
      finalStateHash: expect.any(String),
    });
    let fullLoadCount = 0;
    const cacheOnlyStorage: MultiplayerStorage = {
      load: async () => {
        fullLoadCount += 1;
        return undefined;
      },
      save: async () => undefined,
      listResultSnapshotCandidates: async () => (cached ? [cached] : []),
    };
    const cacheOnlyService = new MultiplayerService(cacheOnlyStorage, {
      tokenSalt: "recent-results-cache-only",
    });
    expect(await cacheOnlyService.listRecentGameResults(20)).toHaveLength(1);
    expect(fullLoadCount).toBe(0);
  });

  it("backfills a historical SQLite result once and reuses its compact snapshot", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-result-backfill-"));
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir: join(dir, "backups"),
    });
    try {
      const service = new MultiplayerService(storage, {
        tokenSalt: "result-backfill-test",
        now: () => "2026-05-27T13:00:00.000Z",
      });
      const created = await service.createMatch({
        hostSide: "runner",
        playMode: "human_vs_ai",
        humanSide: "runner",
        seed: "historical-result-backfill",
      });
      const historical = await storage.load(created.matchId);
      if (!historical?.gameState)
        throw new Error("Missing historical test match");
      historical.gameState.winner = "runner";
      historical.match.status = "finished";
      historical.match.winner = "runner";
      historical.match.updatedAt = "2026-05-27T13:10:00.000Z";
      delete historical.resultSnapshot;
      await storage.save(historical);

      expect(
        (await storage.listResultSnapshotCandidates())[0]?.resultSnapshot,
      ).toBeUndefined();
      expect(await service.listRecentGameResults(20)).toHaveLength(1);

      const compact = (await storage.listResultSnapshotCandidates())[0];
      expect(compact?.resultSnapshot).toMatchObject({
        matchId: created.matchId,
        matchStatus: "finished",
        winner: "runner",
      });
      expect(compact?.eventLog).toEqual([]);
      expect(
        await storage.listResultSnapshotCandidatesByMatchIds(["unknown"]),
      ).toEqual([]);
      expect(
        (
          await storage.listResultSnapshotCandidatesByMatchIds([
            created.matchId,
          ])
        )[0]?.match.matchId,
      ).toBe(created.matchId);

      let fullLoadCount = 0;
      const cachedStorage: MultiplayerStorage = {
        load: async () => {
          fullLoadCount += 1;
          return undefined;
        },
        save: async () => undefined,
        listResultSnapshotCandidates: async () => (compact ? [compact] : []),
      };
      expect(
        await new MultiplayerService(cachedStorage).listRecentGameResults(20),
      ).toHaveLength(1);
      expect(fullLoadCount).toBe(0);
    } finally {
      storage.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("aggregates finished side-swap series into one recent result with match points", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "recent-series-test",
      now: () => "2026-05-28T12:00:00.000Z",
    });
    await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      humanSide: "runner",
      displayName: "Ludwig",
      seed: "recent-series-game-1",
      settings: { matchFormat: "two_game_side_swap" },
    });
    await service.createMatch({
      hostSide: "corp",
      playMode: "human_vs_ai",
      humanSide: "corp",
      displayName: "Ludwig",
      seed: "recent-series-game-2",
      settings: { matchFormat: "two_game_side_swap" },
    });

    const [first, second] = await storage.list();
    if (!first?.gameState || !second?.gameState)
      throw new Error("Missing series test records");
    const seriesId = "series_recent_results";
    const gameOne = {
      matchId: first.match.matchId,
      gameNumber: 1,
      winner: "runner" as const,
      reason: "agenda_points" as const,
      runnerPlayer: "player_a" as const,
      corpPlayer: "player_b" as const,
      runnerAgendaPoints: 7,
      corpAgendaPoints: 2,
      finishedAt: "2026-05-28T12:10:00.000Z",
      finalStateHash: "hash:game-one",
    };
    const gameTwo = {
      matchId: second.match.matchId,
      gameNumber: 2,
      winner: "corp" as const,
      reason: "forfeit" as const,
      runnerPlayer: "player_b" as const,
      corpPlayer: "player_a" as const,
      runnerAgendaPoints: 3,
      corpAgendaPoints: 1,
      finishedAt: "2026-05-28T12:30:00.000Z",
      finalStateHash: "hash:game-two",
    };

    first.gameState.winner = "runner";
    first.match.status = "finished";
    first.match.winner = "runner";
    first.match.updatedAt = gameOne.finishedAt;
    first.match.series = {
      seriesId,
      mode: "two_game_side_swap",
      status: "between_games",
      gameNumber: 1,
      gamesPlanned: 2,
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
      results: [gameOne],
    };
    second.gameState.winner = "corp";
    second.match.status = "finished";
    second.match.winner = "corp";
    second.match.updatedAt = gameTwo.finishedAt;
    second.match.series = {
      seriesId,
      mode: "two_game_side_swap",
      status: "finished",
      gameNumber: 2,
      gamesPlanned: 2,
      runnerPlayer: "player_b",
      corpPlayer: "player_a",
      results: [gameOne, gameTwo],
    };
    await storage.save(first);
    await storage.save(second);

    const results = await service.listRecentGameResults(20);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entryType: "series",
      seriesId,
      isPublic: true,
      status: "finished",
      gamesPlayed: 2,
      gamesPlanned: 2,
      outcome: "player_a",
      players: {
        player_a: {
          displayName: "Ludwig",
          matchPoints: 20,
          agendaPoints: 8,
          wins: 2,
        },
        player_b: {
          displayName: "Runner-KI",
          matchPoints: 5,
          agendaPoints: 5,
          wins: 0,
        },
      },
      games: [
        {
          gameNumber: 1,
          isPublic: true,
          runnerMatchPoints: 10,
          corpMatchPoints: 2,
        },
        {
          gameNumber: 2,
          isPublic: true,
          runnerMatchPoints: 3,
          corpMatchPoints: 10,
          reason: "forfeit",
        },
      ],
    });
    const serialized = JSON.stringify(results[0]);
    expect(serialized).not.toContain("sessionToken");
    expect(serialized).not.toContain("reconnectToken");
    expect(serialized).not.toContain("tokenHash");
    expect(serialized).not.toContain("cardInstances");
  });
});

describe("V1.0.9 private internet hardening", () => {
  it("uses a LAN-capable default bind address for direct server starts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "netgrid-direct-server-start-"));
    const previousPublicHost = process.env.NETGRID_PUBLIC_HOST;
    const previousAccountStorage = process.env.NETGRID_ACCOUNT_SQLITE_PATH;
    const previousBackupDir = process.env.NETGRID_STORAGE_BACKUP_DIR;
    process.env.NETGRID_PUBLIC_HOST = "192.0.2.10";
    process.env.NETGRID_ACCOUNT_SQLITE_PATH = join(dir, "netgrid.sqlite");
    process.env.NETGRID_STORAGE_BACKUP_DIR = join(dir, "backups");
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "lan-default-bind",
    });
    let handle: Awaited<ReturnType<typeof startNetgridServer>> | undefined;
    try {
      handle = await startNetgridServer({ port: 0, host: "0.0.0.0 ", service });
      expect(handle.bindUrl).toMatch(/^http:\/\/0\.0\.0\.0:\d+$/);
      expect(handle.url).toMatch(/^http:\/\/192\.0\.2\.10:\d+$/);
    } finally {
      await handle?.close();
      restoreEnv("NETGRID_PUBLIC_HOST", previousPublicHost);
      restoreEnv("NETGRID_ACCOUNT_SQLITE_PATH", previousAccountStorage);
      restoreEnv("NETGRID_STORAGE_BACKUP_DIR", previousBackupDir);
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("normalizes advertised WebSocket URLs from environment-style base URLs", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "trim-ws-url",
      publicServerBaseUrl: "http://192.0.2.10:8787 ",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      seed: "trim-ws-url",
    });
    expect(created.webSocketUrl).toBe("ws://192.0.2.10:8787/ws");
  });

  it("validates local and private internet deployment profiles", () => {
    const local = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "local",
    } as NodeJS.ProcessEnv);
    expect(local.profile).toBe("local");
    expect(local.webBaseUrl).toBe("http://127.0.0.1:3100");
    expect(local.allowedOrigins).toContain("http://127.0.0.1:3100");
    expect(local.maintenanceEnabled).toBe(true);
    expect(local.maintenanceBaseUrl).toBe("http://127.0.0.1:3100");

    expect(() =>
      loadDeploymentConfig({
        NETGRID_DEPLOYMENT_PROFILE: "private_internet",
        NETGRID_WEB_BASE_URL: "http://netgrid.example",
        NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
        NETGRID_ALLOWED_ORIGINS: "https://netgrid.example",
        NETGRID_TOKEN_SALT: "private-test-salt",
      } as NodeJS.ProcessEnv),
    ).toThrow(/HTTPS/);
    expect(() =>
      loadDeploymentConfig({
        NETGRID_DEPLOYMENT_PROFILE: "private_internet",
        NETGRID_WEB_BASE_URL: "https://netgrid.example",
        NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
        NETGRID_ALLOWED_ORIGINS: "https://netgrid.example",
        NETGRID_TOKEN_SALT: "local-dev-netgrid-token-salt",
      } as NodeJS.ProcessEnv),
    ).toThrow(/NETGRID_TOKEN_SALT/);

    const privateConfig = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS:
        "https://netgrid.example,https://tablet.netgrid.example",
      NETGRID_TOKEN_SALT: "private-test-salt",
    } as NodeJS.ProcessEnv);
    expect(privateConfig).toMatchObject({
      profile: "private_internet",
      webBaseUrl: "https://netgrid.example",
      serverBaseUrl: "https://api.netgrid.example",
      rateLimitProfile: "private_internet",
    });
    expect(privateConfig.allowedOrigins).toEqual([
      "https://netgrid.example",
      "https://tablet.netgrid.example",
    ]);
    expect(privateConfig.maintenanceEnabled).toBe(false);

    expect(() =>
      loadDeploymentConfig({
        NETGRID_DEPLOYMENT_PROFILE: "private_internet",
        NETGRID_WEB_BASE_URL: "https://netgrid.example",
        NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
        NETGRID_ALLOWED_ORIGINS: "https://netgrid.example",
        NETGRID_TOKEN_SALT: "private-test-salt",
        NETGRID_MAINTENANCE_ENABLED: "true",
        NETGRID_MAINTENANCE_BASE_URL: "http://admin.netgrid.example",
        NETGRID_MAINTENANCE_ALLOWED_ORIGINS: "http://admin.netgrid.example",
        NETGRID_MAINTENANCE_TRUSTED_PROXY_ADDRESSES: "127.0.0.1",
      } as NodeJS.ProcessEnv),
    ).toThrow(/HTTPS/);

    const privateMaintenance = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS: "https://netgrid.example",
      NETGRID_TOKEN_SALT: "private-test-salt",
      NETGRID_MAINTENANCE_ENABLED: "true",
      NETGRID_MAINTENANCE_BASE_URL: "https://admin.netgrid.example",
      NETGRID_MAINTENANCE_ALLOWED_ORIGINS: "https://admin.netgrid.example",
      NETGRID_MAINTENANCE_TRUSTED_PROXY_ADDRESSES: "127.0.0.1,::1",
    } as NodeJS.ProcessEnv);
    expect(privateMaintenance).toMatchObject({
      maintenanceEnabled: true,
      maintenanceBaseUrl: "https://admin.netgrid.example",
      maintenanceAllowedOrigins: ["https://admin.netgrid.example"],
      maintenanceTrustedProxyAddresses: ["127.0.0.1", "::1"],
    });

    const legacyPrivateConfig = loadDeploymentConfig({
      NETGRID_DEPLOYMENT_PROFILE: "private_internet",
      NETGRID_WEB_BASE_URL: "https://legacy.netgrid.example",
      NETGRID_SERVER_BASE_URL: "https://legacy-api.netgrid.example",
      NETGRID_ALLOWED_ORIGINS: "https://legacy.netgrid.example",
      NETGRID_TOKEN_SALT: "legacy-private-test-salt",
    } as NodeJS.ProcessEnv);
    expect(legacyPrivateConfig).toMatchObject({
      profile: "private_internet",
      webBaseUrl: "https://legacy.netgrid.example",
      serverBaseUrl: "https://legacy-api.netgrid.example",
    });
  });

  it("uses explicit REST CORS origins and keeps health redacted", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-health-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example",
    });
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: privateDeploymentConfig(),
    });
    const baseUrl = await listen(handle);
    try {
      const preflight = await fetch(`${baseUrl}/api/matches`, {
        method: "OPTIONS",
        headers: {
          origin: "https://netgrid.example",
          "access-control-request-method": "POST",
        },
      });
      expect(preflight.status).toBe(204);
      expect(preflight.headers.get("access-control-allow-origin")).toBe(
        "https://netgrid.example",
      );
      expect(preflight.headers.get("access-control-allow-methods")).toBe(
        "GET,POST,OPTIONS",
      );

      const denied = await fetch(`${baseUrl}/health`, {
        headers: { origin: "https://evil.example" },
      });
      const deniedText = await denied.text();
      expect(denied.status).toBe(403);
      expect(deniedText).toContain("origin_not_allowed");
      expect(deniedText).not.toMatch(
        /sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i,
      );

      const health = await fetch(`${baseUrl}/health`);
      const body = (await health.json()) as {
        profile?: string;
        realtime?: { ready?: boolean };
        storage?: { kind?: string; matchCount?: number };
      };
      expect(body.profile).toBe("private_internet");
      expect(body.realtime?.ready).toBe(true);
      expect(body.storage?.kind).toBe("memory");
      expect(body.storage?.matchCount).toBeUndefined();
      expect(JSON.stringify(body)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|privatePayload|decklist/i,
      );
    } finally {
      await handle.close();
    }
  });

  it("creates an observable AI-vs-AI match through the public REST contract", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "observable-ai-vs-ai-http-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example",
    });
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: privateDeploymentConfig(),
    });
    const baseUrl = await listen(handle);
    try {
      const response = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://netgrid.example",
        },
        body: JSON.stringify({
          mode: "ai_vs_ai",
          hostSide: "runner",
          seed: "observable-ai-vs-ai-http",
          aiDeckPolicy: "fixed",
          runnerDifficulty: "normal",
          corpDifficulty: "normal",
          settings: {
            matchFormat: "two_game_side_swap",
            playerClock: { mode: "player_clock", startingTimeMs: 1_000 },
          },
        }),
      });
      const body = (await response.json()) as ApiCreateMatchResponse;
      expect(response.status).toBe(201);
      expect(body).toMatchObject({
        mode: "ai_vs_ai",
        matchStatus: "active",
        hostSide: "runner",
        legalActions: [],
        aiTurnPresentation: { canAdvanceAi: true },
      });
      expect(body.playerView).toBeDefined();
      expect(body.joinUrl).toBeUndefined();
      expect(JSON.stringify(body)).not.toMatch(
        /cardInstances|privatePayload|decklist|AIInput|FullState/i,
      );
      const stored = await service.loadForTest(body.matchId);
      expect(stored?.match.settings.matchFormat).toBe("two_game_side_swap");
      expect(stored?.match.series).toMatchObject({
        gameNumber: 1,
        runnerPlayer: "player_a",
        corpPlayer: "player_b",
      });
    } finally {
      await handle.close();
    }
  });

  it("checks WebSocket origins before join payloads are sent", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-ws-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "v109-ws-origin",
    });
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: privateDeploymentConfig(),
    });
    const baseUrl = await listen(handle);
    const wsUrl = baseUrl.replace(/^http:/, "ws:") + "/ws";
    const deniedMessages: string[] = [];
    const denied = new WebSocket(wsUrl, {
      headers: { Origin: "https://evil.example" },
    });
    try {
      denied.on("message", (raw) => deniedMessages.push(raw.toString()));
      await waitForClosedOrErrored(denied);
      expect(deniedMessages).toEqual([]);

      const allowed = new WebSocket(wsUrl, {
        headers: { Origin: "https://netgrid.example" },
      });
      try {
        await waitForOpen(allowed);
        allowed.send(
          JSON.stringify({
            type: "join_match",
            payload: {
              matchId: created.matchId,
              sessionToken: created.hostSessionToken,
              side: created.hostSide,
            },
          }),
        );
        const update = await waitForMessage(allowed, "lobby_update");
        expect(messagePayload(update).matchStatus).toBe("pending");
        expect(JSON.stringify(update)).not.toMatch(
          /sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i,
        );
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
      publicServerBaseUrl: "https://api.netgrid.example",
    });
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: privateDeploymentConfig(),
      rateLimiter: createRateLimiter("test"),
    });
    const baseUrl = await listen(handle);
    try {
      for (let index = 0; index < 2; index += 1) {
        const response = await fetch(`${baseUrl}/api/matches`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://netgrid.example",
          },
          body: JSON.stringify({
            hostSide: "runner",
            seed: `rate-rest-${index}`,
          }),
        });
        expect(response.status).toBe(201);
      }
      const limited = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://netgrid.example",
        },
        body: JSON.stringify({
          hostSide: "runner",
          seed: "rate-rest-limited",
          sessionToken: "secret",
        }),
      });
      const limitedText = await limited.text();
      expect(limited.status).toBe(429);
      expect(limitedText).toContain("rate_limited");
      expect(limitedText).not.toMatch(
        /secret|sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i,
      );
    } finally {
      await handle.close();
    }

    const wsService = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-ws-rate-salt",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example",
    });
    const created = await wsService.createMatch({
      hostSide: "runner",
      seed: "v109-ws-rate",
    });
    const wsLimiter = new FixedWindowRateLimiter({
      create_match: undefined,
      token_probe: undefined,
      account_read: undefined,
      lifecycle: undefined,
      ai_advance: undefined,
      ws_handshake: { limit: 10, windowMs: 60_000 },
      ws_join: { limit: 1, windowMs: 60_000 },
    });
    const wsHandle = createNetgridHttpServer(wsService, {
      deploymentConfig: privateDeploymentConfig(),
      rateLimiter: wsLimiter,
    });
    const wsBaseUrl = await listen(wsHandle);
    const wsUrl = wsBaseUrl.replace(/^http:/, "ws:") + "/ws";
    const socket = new WebSocket(wsUrl, {
      headers: { Origin: "https://netgrid.example" },
    });
    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: created.hostSessionToken,
            side: created.hostSide,
          },
        }),
      );
      await waitForMessage(socket, "lobby_update");
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: created.hostSessionToken,
            side: created.hostSide,
          },
        }),
      );
      const error = await waitForMessage(socket, "error");
      expect(JSON.stringify(error)).toContain("rate_limited");
      expect(JSON.stringify(error)).not.toMatch(
        /sessionToken|joinToken|tokenHash|cardInstances|privatePayload|decklist/i,
      );
    } finally {
      socket.close();
      await wsHandle.close();
    }
  });

  it("redacts token, hash, join URL and hidden-info diagnostics", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "private-redaction-salt",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "v109-redaction",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    expect(joinToken).toBeTruthy();
    const redactedUrl = redactedJoinUrl(created.joinUrl);
    expect(redactedUrl).toContain("joinToken=[redacted]");
    expect(redactedUrl).not.toContain(joinToken ?? "missing");

    const text = redactSensitiveText(
      `joinToken=${joinToken} "sessionToken":"${created.hostSessionToken}" tokenHash=sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef privatePayload cardInstances decklist`,
    );
    expect(text).toContain("joinToken=[redacted]");
    expect(text).not.toContain(created.hostSessionToken);
    expect(text).not.toContain(joinToken ?? "missing");
    expect(text).not.toMatch(
      /sha256:[a-f0-9]{64}|privatePayload|cardInstances|decklist/i,
    );
  });
});

describe("Invite and lobby redaction harness", () => {
  it("names forbidden invite/lobby metadata patterns", () => {
    const leaks = findInviteLobbyPayloadRedactionLeaks({
      sessionToken: "raw-session-token",
      reconnectToken: "raw-reconnect-token",
      tokenHash:
        "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      sessionId: "session_private_123",
      decklist: [{ cardId: "onr_v1_001_afreet", quantity: 3 }],
      deckHash: "fnv1a:deadbeef",
      hiddenCard: { definitionId: "simple_agenda" },
      AIInput: { side: "runner" },
      DecisionDebug: { explored: true },
      url: "http://127.0.0.1:3100/?matchId=match_1&joinToken=raw-join-token",
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
        "deck-hash-value",
      ]),
    );
  });

  it("accepts current join-info, pending-lobby, and open-lobby metadata surfaces", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "invite-lobby-redaction-harness",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "invite-lobby-redaction-harness",
      mode: "human_vs_human",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6",
      },
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");

    assertInviteLobbyPayloadRedacted(
      created.lobby,
      "createMatch pending lobby",
    );
    assertInviteLobbyPayloadRedacted(
      await service.getJoinInfo(created.matchId),
      "join-info without token",
    );
    assertInviteLobbyPayloadRedacted(
      await service.getJoinInfo(created.matchId, joinToken),
      "join-info with token",
    );
    assertInviteLobbyPayloadRedacted(
      await service.listOpenMatches(),
      "V2.3a open lobby list",
    );

    const missingDecks = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Joiner",
    });
    expect("error" in missingDecks).toBe(true);
    assertInviteLobbyPayloadRedacted(missingDecks, "join error payload");

    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Joiner",
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    assertInviteLobbyPayloadRedacted(joined.lobby, "joinMatch start lobby");

    const hostLobby = await service.bootstrap(
      created.matchId,
      created.hostSide,
      created.hostSessionToken,
      { allowLobby: true },
    );
    expect("error" in hostLobby).toBe(false);
    assertInviteLobbyPayloadRedacted(hostLobby, "host bootstrap lobby payload");
  });
});

describe("Backend 0.5 private storage maintenance", () => {
  it("projects all three persisted deck consumers and fails closed on gaps or actor mismatches", () => {
    const checkpoint = {
      schemaVersion: "netgrid-ai-decision-checkpoint-capture-v2",
      provenance: "persisted_at_decision",
      actor: "runner",
      stateVersion: 42,
      inputProjection: {
        schemaVersion: "netgrid-ai-decision-input-projection-v1",
        side: "runner",
        stateVersion: 42,
        deckConsumers: {
          deckCapabilities: {
            schemaVersion: "deck-capability-profile-v1",
            side: "runner",
          },
          deckStrategyProfile: {
            schemaVersion: "ai-deck-strategy-profile-v1",
            side: "runner",
          },
          deckDoctrineDiagnostic: {
            schemaVersion: "deck-doctrine-v2-diagnostic-v1",
            side: "runner",
          },
        },
      },
    };

    expect(deckConsumerAuditFromCheckpointCapture(checkpoint)).toEqual({
      schemaVersion: "netgrid-deck-consumer-audit-v1",
      provenance: "persisted_at_decision",
      actor: "runner",
      stateVersion: 42,
      deckCapabilities:
        checkpoint.inputProjection.deckConsumers.deckCapabilities,
      deckStrategyProfile:
        checkpoint.inputProjection.deckConsumers.deckStrategyProfile,
      deckDoctrineDiagnostic:
        checkpoint.inputProjection.deckConsumers.deckDoctrineDiagnostic,
      validation: {
        inputMatchesActor: true,
        consumerSidesMatchActor: true,
        allConsumersPersisted: true,
      },
    });

    const missingDoctrine = structuredClone(checkpoint);
    delete (
      missingDoctrine.inputProjection.deckConsumers as Partial<
        typeof missingDoctrine.inputProjection.deckConsumers
      >
    ).deckDoctrineDiagnostic;
    expect(deckConsumerAuditFromCheckpointCapture(missingDoctrine)).toEqual({
      schemaVersion: "netgrid-deck-consumer-audit-v1",
      provenance: "unavailable",
      reason: "historical_deck_consumer_audit_not_persisted",
      missingConsumers: ["deckDoctrineDiagnostic"],
      invalidConsumers: [],
    });

    const mismatchedDoctrine = structuredClone(checkpoint);
    mismatchedDoctrine.inputProjection.deckConsumers.deckDoctrineDiagnostic.side =
      "corp";
    expect(deckConsumerAuditFromCheckpointCapture(mismatchedDoctrine)).toEqual({
      schemaVersion: "netgrid-deck-consumer-audit-v1",
      provenance: "unavailable",
      reason: "historical_deck_consumer_audit_binding_mismatch",
      missingConsumers: [],
      invalidConsumers: ["deckDoctrineDiagnostic"],
    });
  });

  it("exposes only persisted TurnPlanner audits and never reconstructs old traces", () => {
    const planning = {
      schemaVersion: "ai-turn-planning-debug-v1",
      candidateAudit: {
        schemaVersion: "ai-turn-planning-candidate-audit-v1",
        provenance: "persisted_at_decision",
      },
      heads: [
        {
          candidateId: "head:interface",
          actionId: "install-interface",
          dependencyCandidateIds: ["head:score"],
          assessment: { withinClassValue: 900 },
        },
      ],
      consideredLines: [
        {
          lineId: "line:score-interface-run",
          steps: [
            { actionId: "play-score" },
            { actionId: "install-interface" },
            { actionId: "run-rd" },
          ],
          projectedEndState: { creditMinimum: 5 },
        },
      ],
      pruneEvents: [],
    };

    expect(
      turnPlanningAuditFromTrace({
        planFirstDecision: { turnPlanning: planning },
      }),
    ).toEqual({
      schemaVersion: "netgrid-turn-planning-audit-v1",
      provenance: "persisted_at_decision",
      planning,
    });
    expect(turnPlanningAuditFromTrace({})).toEqual({
      schemaVersion: "netgrid-turn-planning-audit-v1",
      provenance: "unavailable",
      reason: "historical_turn_planning_audit_not_persisted",
    });
  });

  it("allows only loopback transport and never treats private LAN addresses as admin proof", () => {
    expect(isMaintenanceClientAddressAllowed("127.0.0.1")).toBe(true);
    expect(isMaintenanceClientAddressAllowed("::1")).toBe(true);
    expect(isMaintenanceClientAddressAllowed("::ffff:192.168.178.42")).toBe(
      false,
    );
    expect(isMaintenanceClientAddressAllowed("10.0.0.25")).toBe(false);
    expect(isMaintenanceClientAddressAllowed("172.20.1.5")).toBe(false);
    expect(isMaintenanceClientAddressAllowed("8.8.8.8")).toBe(false);
    expect(isMaintenanceClientAddressAllowed("203.0.113.10")).toBe(false);
  });

  it("marks every legacy SQLite match public exactly once during the rollout backfill", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "public-match-backfill",
    });
    const first = await service.createMatch({
      hostSide: "runner",
      seed: "legacy-public-first",
      isPublic: false,
    });
    const second = await service.createMatch({
      hostSide: "corp",
      seed: "legacy-public-second",
      isPublic: false,
    });
    storage.close?.();

    const legacyDb = new DatabaseSync(dbPath);
    try {
      legacyDb
        .prepare("DELETE FROM storage_meta WHERE key = ?")
        .run("public_match_backfill_v1_completed_at");
      const rows = legacyDb
        .prepare(
          "SELECT match_id AS matchId, record_json AS recordJson FROM matches",
        )
        .all() as Array<{ matchId: string; recordJson: string }>;
      const update = legacyDb.prepare(
        "UPDATE matches SET record_json = ? WHERE match_id = ?",
      );
      for (const row of rows) {
        const record = JSON.parse(row.recordJson) as {
          match: { isPublic?: boolean; discoverableInLan?: boolean };
        };
        delete record.match.isPublic;
        record.match.discoverableInLan = false;
        update.run(JSON.stringify(record), row.matchId);
      }
    } finally {
      legacyDb.close();
    }

    const reopened = new SqliteMatchStorage({ dbPath, backupDir });
    try {
      const records = await reopened.list?.();
      expect(records?.map((record) => record.match.matchId)).toEqual([
        first.matchId,
        second.matchId,
      ]);
      expect(records?.every((record) => record.match.isPublic)).toBe(true);

      const publicCandidates = await reopened.listPublicMatchCandidates();
      expect(publicCandidates).toHaveLength(2);
      expect(publicCandidates.every((record) => record.match.isPublic)).toBe(
        true,
      );
      expect(
        publicCandidates.every(
          (record) =>
            record.eventLog.length === 0 &&
            record.stateSnapshots.length === 0 &&
            record.gameState.eventLog.length === 0,
        ),
      ).toBe(true);

      const publicService = new MultiplayerService(reopened, {
        tokenSalt: "public-match-backfill-reopened",
      });
      expect(await publicService.listPublicMatches()).toHaveLength(2);

      const auditDb = new DatabaseSync(dbPath, { readOnly: true });
      try {
        const rawRows = auditDb
          .prepare("SELECT record_json AS recordJson FROM matches")
          .all() as Array<{ recordJson: string }>;
        expect(rawRows).toHaveLength(2);
        expect(
          rawRows.every(
            (row) => JSON.parse(row.recordJson).match.isPublic === true,
          ),
        ).toBe(true);
        expect(
          rawRows.some(
            (row) => "discoverableInLan" in JSON.parse(row.recordJson).match,
          ),
        ).toBe(false);
        expect(
          auditDb
            .prepare("SELECT value FROM storage_meta WHERE key = ?")
            .get("public_match_backfill_v1_completed_at"),
        ).toBeDefined();
      } finally {
        auditDb.close();
      }
    } finally {
      reopened.close?.();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("serves a redacted local SQLite storage summary, match list and match detail", async () => {
    const dir = await tempStorageDir();
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir: join(dir, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "backend-05-maintenance",
    });
    const active = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Ludwig",
      seed: "backend-05-active",
    });
    await service.createMatch({
      hostSide: "corp",
      displayName: "Korp Host",
      seed: "backend-05-pending",
    });
    const finished = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Archiv",
      seed: "backend-05-finished",
    });
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
      hiddenInfoBarrier: true,
    });
    await storage.save(finishedRecord);

    const maintenance = await authenticatedMaintenanceServer(service);
    try {
      const summaryResponse = await maintenance.request(
        "/api/storage/maintenance/summary",
      );
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
      expect(
        summary.tableSizes?.some(
          (row) => row.key === "matches" && row.approximatePayloadBytes > 0,
        ),
      ).toBe(true);
      expect(JSON.stringify(summary)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i,
      );

      const filteredResponse = await maintenance.request(
        "/api/storage/maintenance/matches?status=finished&terminal=true&olderThanDays=1&mode=human_runner_vs_corp_ai&largerThanBytes=1",
      );
      const filtered = (await filteredResponse.json()) as {
        matches?: Array<{
          matchId: string;
          status: string;
          participants: Array<{ displayName: string }>;
          sizes: { approximateTotalBytes: number };
        }>;
      };
      expect(filteredResponse.status).toBe(200);
      expect(filtered.matches?.map((match) => match.matchId)).toEqual([
        finished.matchId,
      ]);
      expect(filtered.matches?.[0]?.status).toBe("finished");
      expect(filtered.matches?.[0]?.participants[0]?.displayName).toBe(
        "Archiv",
      );
      expect(
        filtered.matches?.[0]?.sizes.approximateTotalBytes,
      ).toBeGreaterThan(0);
      expect(JSON.stringify(filtered)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i,
      );

      const detailResponse = await maintenance.request(
        `/api/storage/maintenance/matches/${encodeURIComponent(active.matchId)}`,
      );
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
      expect(JSON.stringify(detail)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i,
      );
    } finally {
      await maintenance.handle.close();
    }
  });

  it("stores enabled AI decision traces in SQLite and exposes redacted maintenance views only", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "backend-05-ai-traces",
      chooseAiAction: (input, options): AiDecision => {
        const decision = chooseRuntimeAiAction(input, options);
        if (!("actionId" in decision) || !decision.decisionDebug)
          return decision;
        const selectedAction = input.legalActions.find(
          (action) => action.actionId === decision.actionId,
        );
        if (!selectedAction) return decision;
        return {
          ...decision,
          decisionDebug: {
            ...decision.decisionDebug,
            actionAlternatives: [
              {
                rank: 1,
                actionId: selectedAction.actionId,
                actionType: selectedAction.type,
                selected: true,
                score: 205,
                scoreBreakdown: [
                  {
                    key: "run_route_raw_score",
                    label: "Run route raw score",
                    value: 250,
                  },
                  {
                    key: "consumable_run_opportunity_cost",
                    label: "Consumable run opportunity cost",
                    value: -45,
                  },
                ],
              },
            ],
          },
        };
      },
    });
    const traced = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "backend-05-ai-trace-on",
      corpDifficulty: "normal",
      aiTraceMode: "detailed",
    });
    const untraced = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "backend-05-ai-trace-off",
      corpDifficulty: "normal",
    });
    const tracedSetup = await submitChoice(
      service,
      traced.matchId,
      {
        side: "runner",
        sessionToken: traced.hostSessionToken,
        reconnectToken: traced.hostReconnectToken,
      },
      "keep",
      "ai-trace-on-setup",
    );
    const untracedSetup = await submitChoice(
      service,
      untraced.matchId,
      {
        side: "runner",
        sessionToken: untraced.hostSessionToken,
        reconnectToken: untraced.hostReconnectToken,
      },
      "keep",
      "ai-trace-off-setup",
    );
    const beforePreview = await service.loadForTest(traced.matchId);
    const preview = await service.previewAi({
      matchId: traced.matchId,
      requesterSide: "runner",
      targetSide: "corp",
      sessionToken: traced.hostSessionToken,
      knownStateVersion: tracedSetup.playerView.stateVersion,
      knownMatchVersion: tracedSetup.matchVersion,
    });
    const afterPreview = await service.loadForTest(traced.matchId);
    expect(preview.ok).toBe(false);
    if (preview.ok) throw new Error("Expected foreign-side preview rejection");
    expect(preview.error.code).toBe("preview_side_forbidden");
    expect(JSON.stringify(preview)).not.toMatch(
      /aiPrivateHandPreview|developerPrivateHandsPreview|privateDeckSnapshots|cardInstances/,
    );
    expect(afterPreview?.eventLog.length).toBe(beforePreview?.eventLog.length);
    expect(afterPreview?.gameState?.stateVersion).toBe(
      beforePreview?.gameState?.stateVersion,
    );
    const tracedAdvanced = await service.advanceAi({
      matchId: traced.matchId,
      side: "runner",
      sessionToken: traced.hostSessionToken,
      knownStateVersion: tracedSetup.playerView.stateVersion,
      mode: "single_step",
    });
    const untracedAdvanced = await service.advanceAi({
      matchId: untraced.matchId,
      side: "runner",
      sessionToken: untraced.hostSessionToken,
      knownStateVersion: untracedSetup.playerView.stateVersion,
      mode: "single_step",
    });
    expect(tracedAdvanced.ok).toBe(true);
    expect(untracedAdvanced.ok).toBe(true);
    storage.close?.();

    const reopenedStorage = new SqliteMatchStorage({ dbPath, backupDir });
    const reopenedService = new MultiplayerService(reopenedStorage, {
      tokenSalt: "backend-05-ai-traces",
    });
    const initialMatches =
      await reopenedService.storageMaintenanceAiDecisionTraceMatches();
    expect(initialMatches?.map((match) => match.matchId)).toEqual([
      traced.matchId,
    ]);
    expect(initialMatches?.[0]).toMatchObject({ aiTraceMode: "detailed" });
    expect(initialMatches?.[0]?.traceCount).toBeGreaterThan(0);
    const enabledLate =
      await reopenedService.enableStorageMaintenanceAiDecisionTrace(
        untraced.matchId,
        "detailed",
      );
    expect(enabledLate).toMatchObject({
      matchId: untraced.matchId,
      aiTraceMode: "detailed",
      traceCount: 0,
    });
    const matches =
      await reopenedService.storageMaintenanceAiDecisionTraceMatches();
    expect(matches?.map((match) => match.matchId)).toEqual(
      expect.arrayContaining([traced.matchId, untraced.matchId]),
    );
    const index = await reopenedService.storageMaintenanceAiDecisionTraceIndex(
      traced.matchId,
    );
    expect(index?.[0]).toMatchObject({
      matchId: traced.matchId,
      eventId: expect.any(String),
      side: "corp",
      turn: 1,
      schemaVersion: "ai-decision-trace-v2",
      meta: expect.objectContaining({ actor: "corp" }),
    });
    const cursorIndex =
      await reopenedService.storageMaintenanceAiDecisionTraceIndex(
        traced.matchId,
        { afterDecisionIndex: index?.[0]?.decisionIndex ?? 0 },
      );
    expect(
      cursorIndex?.some((entry) => entry.traceId === index?.[0]?.traceId),
    ).toBe(false);
    const details = await Promise.all(
      (index ?? []).map((entry) =>
        reopenedService.storageMaintenanceAiDecisionTraceDetail(entry.traceId),
      ),
    );
    const detail = details[0];
    expect(detail?.selectedActionId).toBeDefined();
    expect(detail?.selectedActionType).toBeDefined();
    expect(detail?.detail).toMatchObject({
      schemaVersion: "ai-decision-trace-v1",
      actor: "corp",
      debugSchemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      selectedActionId: detail?.selectedActionId,
      selectedActionType: detail?.selectedActionType,
      debugSelectionMatchesApplied: true,
    });
    expect(detail?.detail).toMatchObject({
      actionAlternatives: [
        {
          score: 205,
          scoreBreakdown: [
            { key: "run_route_raw_score", value: 250 },
            { key: "consumable_run_opportunity_cost", value: -45 },
          ],
        },
      ],
    });
    expect(
      await reopenedService.storageMaintenanceAiDecisionTraceIndex(
        untraced.matchId,
      ),
    ).toEqual([]);
    expect(JSON.stringify({ matches, index, details })).not.toMatch(
      /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privatePayload|privateDeckSnapshots|decklist|fullGameState|FullState|AIInput|C:\\Users/i,
    );

    const maintenance = await authenticatedMaintenanceServer(reopenedService);
    try {
      const matchesResponse = await maintenance.request(
        "/api/storage/maintenance/ai-decision-traces/matches",
      );
      expect(matchesResponse.status).toBe(200);
      const enableResponse = await maintenance.request(
        `/api/storage/maintenance/ai-decision-traces/matches/${encodeURIComponent(untraced.matchId)}/enable`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "detailed" }),
        },
      );
      expect(enableResponse.status).toBe(200);
      expect(await enableResponse.json()).toMatchObject({
        match: { matchId: untraced.matchId, aiTraceMode: "detailed" },
      });
      const indexResponse = await maintenance.request(
        `/api/storage/maintenance/ai-decision-traces/matches/${encodeURIComponent(traced.matchId)}`,
      );
      const httpIndex = (await indexResponse.json()) as {
        traces?: Array<{ traceId: string }>;
      };
      expect(indexResponse.status).toBe(200);
      expect(httpIndex.traces?.length).toBeGreaterThan(0);
      const cursorResponse = await maintenance.request(
        `/api/storage/maintenance/ai-decision-traces/matches/${encodeURIComponent(traced.matchId)}?afterDecisionIndex=${encodeURIComponent(String(index?.[0]?.decisionIndex ?? 0))}`,
      );
      const cursorBody = (await cursorResponse.json()) as {
        traces?: Array<{ traceId: string }>;
      };
      expect(cursorResponse.status).toBe(200);
      expect(
        cursorBody.traces?.some(
          (entry) => entry.traceId === httpIndex.traces?.[0]?.traceId,
        ),
      ).toBe(false);
      const detailResponse = await maintenance.request(
        `/api/storage/maintenance/ai-decision-traces/${encodeURIComponent(httpIndex.traces?.[0]?.traceId ?? "")}`,
      );
      expect(detailResponse.status).toBe(200);
      const httpDetail = (await detailResponse.json()) as {
        detail?: {
          actionAlternatives?: Array<{
            score?: number;
            scoreBreakdown?: Array<{ key?: string; value?: number }>;
          }>;
        };
      };
      expect(httpDetail.detail?.actionAlternatives?.[0]).toMatchObject({
        score: 205,
        scoreBreakdown: [
          { key: "run_route_raw_score", value: 250 },
          { key: "consumable_run_opportunity_cost", value: -45 },
        ],
      });
      expect(JSON.stringify(httpDetail)).not.toMatch(
        /<html|<div|sessionToken|reconnectToken|joinToken|cardInstances|privatePayload|decklist|AIInput/i,
      );
    } finally {
      await maintenance.handle.close();
    }
  });

  it("serves a read-only analysis bundle for active and finished SQLite matches", async () => {
    const dir = await tempStorageDir();
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir: join(dir, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "maintenance-match-analysis",
    });
    const active = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "maintenance-match-analysis-active",
      corpDifficulty: "normal",
      aiTraceMode: "detailed",
    });
    const setup = await submitChoice(
      service,
      active.matchId,
      {
        side: "runner",
        sessionToken: active.hostSessionToken,
        reconnectToken: active.hostReconnectToken,
      },
      "keep",
      "maintenance-match-analysis-setup",
    );
    const advanced = await service.advanceAi({
      matchId: active.matchId,
      side: "runner",
      sessionToken: active.hostSessionToken,
      knownStateVersion: setup.playerView.stateVersion,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(true);
    const before = await service.loadForTest(active.matchId);
    if (!before) throw new Error("Missing active analysis match");

    const finished = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      seed: "maintenance-match-analysis-finished",
    });
    const finishedRecord = await service.loadForTest(finished.matchId);
    if (!finishedRecord) throw new Error("Missing finished analysis match");
    finishedRecord.match.status = "finished";
    await storage.save(finishedRecord);

    const maintenance = await authenticatedMaintenanceServer(service);
    try {
      const activeResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/bundle?turn=1&side=corp&fromDecision=1&toDecision=1&includeBeliefState=true&includeOwnDeckSnapshot=true`,
      );
      const activeBundle = (await activeResponse.json()) as {
        schemaVersion?: string;
        match?: { matchId?: string; status?: string; stateVersion?: number };
        scope?: {
          turn?: number;
          side?: string;
          fromDecision?: number;
          toDecision?: number;
          afterEventIndex?: number;
          eventLimit?: number;
        };
        events?: Array<{ eventId: string }>;
        traces?: Array<{ detail: Record<string, unknown> }>;
        schemaVersions?: {
          decisionIndex?: string;
          historicalAudit?: string;
          beliefCapture?: string;
          ownDeckSnapshot?: string;
          checkpointCapture?: string;
        };
        eventCoverage?: {
          returnedEventCount?: number;
          terminalStateIncluded?: boolean;
          eventLimit?: number;
          hasMoreEvents?: boolean;
          nextAfterEventIndex?: number;
        };
        terminal?: { isTerminal?: boolean; status?: string };
        beliefStates?: Array<{
          decisionIndex?: number;
          provenance?: string;
          invariantSignature?: string;
          summary?: Record<string, unknown>;
          hqKnowledge?: Record<string, unknown>;
          delta?: Record<string, unknown>;
        }>;
        decisions?: Array<{
          decisionIndex: number;
          side: string;
          auditAvailability?: {
            historicalLegalActions?: { status?: string };
            engineEvidence?: { status?: string };
            analysisSnapshot?: { status?: string };
          };
        }>;
        ownDeckSnapshot?: {
          side?: string;
          provenance?: string;
          signature?: string;
          deckSnapshotId?: string;
          identityDefinitionId?: string;
          definitionCounts?: Array<{
            definitionId: string;
            quantity: number;
          }>;
          totalCards?: number;
          cardPoolSnapshotId?: string;
          formatProfileId?: string;
          deckHash?: string;
        };
      };
      expect(activeResponse.status).toBe(200);
      expect(activeBundle).toMatchObject({
        schemaVersion: "netgrid-match-analysis-bundle-v2",
        schemaVersions: {
          decisionIndex: "netgrid-decision-audit-availability-v1",
          historicalAudit: "ai-decision-historical-audit-v1",
          beliefCapture: "netgrid-ai-belief-capture-v1",
          ownDeckSnapshot: "netgrid-maintenance-own-deck-snapshot-v1",
          checkpointCapture: "netgrid-ai-decision-checkpoint-capture-v2",
        },
        match: {
          matchId: active.matchId,
          stateVersion: before.gameState.stateVersion,
        },
        scope: { turn: 1, side: "corp", fromDecision: 1, toDecision: 1 },
      });
      expect(activeBundle.events?.length).toBeGreaterThan(0);
      expect(activeBundle.eventCoverage).toMatchObject({
        returnedEventCount: activeBundle.events?.length,
        terminalStateIncluded: false,
        eventLimit: 500,
        hasMoreEvents: false,
      });
      expect(activeBundle.terminal).toMatchObject({
        isTerminal: false,
        status: "active",
      });
      expect(activeBundle.decisions).toEqual([
        expect.objectContaining({
          decisionIndex: 1,
          side: "corp",
          auditAvailability: expect.objectContaining({
            historicalLegalActions: expect.objectContaining({
              status: "persisted",
            }),
            engineEvidence: expect.objectContaining({ status: "persisted" }),
            analysisSnapshot: expect.objectContaining({ status: "persisted" }),
          }),
        }),
      ]);
      expect(activeBundle.traces).toHaveLength(1);
      expect(activeBundle.traces?.[0]?.detail).toMatchObject({
        appliedDecision: {
          actionId: expect.any(String),
          actionType: expect.any(String),
        },
        planFirstDecision: {
          executionOrigin: {
            rootPlanInstanceId: expect.any(String),
            leafPlanInstanceId: expect.any(String),
            side: "corp",
            stateVersion: expect.any(Number),
            timingPoint: expect.any(String),
          },
          selectedStep: {
            planInstanceId: expect.any(String),
            stepId: expect.any(String),
          },
        },
      });
      expect(activeBundle.beliefStates).toEqual([
        expect.objectContaining({
          decisionIndex: 1,
          provenance: "persisted",
          invariantSignature: expect.any(String),
          summary: expect.any(Object),
          hqKnowledge: expect.objectContaining({
            handCount: expect.any(Number),
            safeKnownCount: expect.any(Number),
            candidateKnownCount: expect.any(Number),
            unknownCount: expect.any(Number),
            knownFraction: expect.any(Number),
            allCardsKnown: expect.any(Boolean),
            invalidationReasons: expect.any(Array),
          }),
          delta: expect.any(Object),
        }),
      ]);
      expect(activeBundle.ownDeckSnapshot).toMatchObject({
        side: "corp",
        provenance: "persisted",
        signature: expect.any(String),
        deckSnapshotId: before.match.deckSetup.corpSnapshotId,
        identityDefinitionId: before.match.deckSetup.corp.identityCardId,
        cardPoolSnapshotId: before.match.deckSetup.corp.cardPoolSnapshotId,
        formatProfileId: before.match.deckSetup.corp.formatProfileId,
        deckHash: before.match.deckSetup.corp.deckHash,
      });
      expect(
        activeBundle.ownDeckSnapshot?.definitionCounts?.length,
      ).toBeGreaterThan(0);
      expect(
        activeBundle.ownDeckSnapshot?.definitionCounts?.reduce(
          (total, entry) => total + entry.quantity,
          0,
        ),
      ).toBe(activeBundle.ownDeckSnapshot?.totalCards);
      const assignment = before.match.deckSetup.assignment;
      if (!assignment) throw new Error("Missing analysis deck assignment");
      const ownCorpSnapshot =
        before.privateDeckSnapshots?.participants[assignment.corpPlayer].corp;
      const opponentRunnerSnapshot =
        before.privateDeckSnapshots?.participants[assignment.runnerPlayer]
          .runner;
      if (!ownCorpSnapshot || !opponentRunnerSnapshot)
        throw new Error("Missing persisted analysis deck snapshots");
      const ownCorpDefinitions = new Set(
        ownCorpSnapshot.cards.map((entry) => entry.cardId),
      );
      const opponentOnlyDefinition = opponentRunnerSnapshot.cards.find(
        (entry) => !ownCorpDefinitions.has(entry.cardId),
      )?.cardId;
      if (!opponentOnlyDefinition)
        throw new Error("Missing opponent-only deck definition fixture");
      expect(JSON.stringify(activeBundle)).not.toContain(
        opponentOnlyDefinition,
      );
      expect(JSON.stringify(activeBundle)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privatePayload|privateDeckSnapshots|decklist|AIInput/i,
      );
      expect(JSON.stringify(activeBundle.ownDeckSnapshot)).not.toMatch(
        /instanceId|stackPosition|order|shuffle/i,
      );

      const firstEventPageResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/bundle?includeDecisionTraces=false&eventLimit=1`,
      );
      const firstEventPage = (await firstEventPageResponse.json()) as {
        scope?: { eventLimit?: number; afterEventIndex?: number };
        events?: Array<{ eventIndex: number }>;
        eventCoverage?: {
          eventLimit?: number;
          hasMoreEvents?: boolean;
          nextAfterEventIndex?: number;
        };
      };
      expect(firstEventPageResponse.status).toBe(200);
      expect(firstEventPage.events).toHaveLength(1);
      expect(firstEventPage.scope).toMatchObject({ eventLimit: 1 });
      expect(firstEventPage.eventCoverage).toMatchObject({
        eventLimit: 1,
        hasMoreEvents: true,
        nextAfterEventIndex: firstEventPage.events?.[0]?.eventIndex,
      });
      const secondEventPageResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/bundle?includeDecisionTraces=false&eventLimit=1&afterEventIndex=${firstEventPage.eventCoverage?.nextAfterEventIndex ?? -1}`,
      );
      const secondEventPage = (await secondEventPageResponse.json()) as {
        scope?: { eventLimit?: number; afterEventIndex?: number };
        events?: Array<{ eventIndex: number }>;
      };
      expect(secondEventPageResponse.status).toBe(200);
      expect(secondEventPage.events?.[0]?.eventIndex).toBeGreaterThan(
        firstEventPage.events?.[0]?.eventIndex ?? -1,
      );
      expect(secondEventPage.scope).toMatchObject({
        eventLimit: 1,
        afterEventIndex: firstEventPage.events?.[0]?.eventIndex,
      });

      const defaultBundleResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/bundle?turn=1&side=corp&fromDecision=1&toDecision=1&includeEvents=false`,
      );
      const defaultBundle = await defaultBundleResponse.json();
      expect(defaultBundleResponse.status).toBe(200);
      expect(defaultBundle).not.toHaveProperty("beliefStates");
      expect(defaultBundle).not.toHaveProperty("ownDeckSnapshot");
      expect(JSON.stringify(defaultBundle)).not.toContain('"beliefState"');

      const decisionResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/decisions/1`,
      );
      const decisionContext = (await decisionResponse.json()) as {
        schemaVersion?: string;
        decision?: {
          decisionIndex?: number;
          side?: string;
          stateVersion?: number;
        };
        audit?: {
          capture?: string;
          legalActions?: {
            actions?: Array<{ actionId?: string; actionType?: string }>;
          };
          engineEvidence?: {
            stateHash?: string;
            rulesBaseline?: { engineSchemaVersion?: string };
          };
          analysisSnapshot?: { actorState?: unknown };
          checkpointCapture?: {
            schemaVersion?: string;
            provenance?: string;
            input?: {
              side?: string;
              playerView?: { side?: string; stateVersion?: number };
              legalActions?: Array<{ actionId?: string }>;
            };
            runtime?: { schemaVersion?: string };
            validation?: Record<string, boolean>;
          };
        };
        checkpointCapture?: {
          schemaVersion?: string;
          provenance?: string;
          inputProjection?: { side?: string };
          runtime?: { schemaVersion?: string };
        };
        surroundingEvents?: Array<{ eventId?: string }>;
        beliefState?: {
          schemaVersion?: string;
          provenance?: string;
          invariantSignature?: string;
          stateVersion?: number;
          lastEventIndex?: number;
        };
        turnPlanningAudit?: {
          schemaVersion?: string;
          provenance?: string;
          reason?: string;
          planning?: Record<string, unknown>;
        };
        deckConsumerAudit?: {
          schemaVersion?: string;
          provenance?: string;
          actor?: string;
          stateVersion?: number;
          deckCapabilities?: { schemaVersion?: string; side?: string };
          deckStrategyProfile?: { schemaVersion?: string; side?: string };
          deckDoctrineDiagnostic?: { schemaVersion?: string; side?: string };
          validation?: Record<string, boolean>;
        };
        provenance?: { persisted?: string[]; reconstructed?: unknown[] };
        ownDeckSnapshot?: {
          side?: string;
          provenance?: string;
          signature?: string;
          definitionCounts?: Array<{
            definitionId: string;
            quantity: number;
          }>;
          zoneBalance?: {
            provenance?: string;
            stateVersion?: number;
            hiddenDeckCount?: number;
            knownOutsideDeckDefinitionCounts?: Array<{
              definitionId: string;
              quantity: number;
            }>;
            remainingPossibleDefinitionCounts?: Array<{
              definitionId: string;
              quantity: number;
            }>;
          };
        };
      };
      expect(decisionResponse.status).toBe(200);
      expect(decisionContext).toMatchObject({
        schemaVersion: "netgrid-decision-analysis-context-v4",
        decision: { decisionIndex: 1, side: "corp" },
      });
      expect(decisionContext.audit?.capture).toBe("persisted");
      expect(
        decisionContext.audit?.legalActions?.actions?.length,
      ).toBeGreaterThan(0);
      expect(decisionContext.audit?.engineEvidence?.stateHash).toBeDefined();
      expect(
        decisionContext.audit?.engineEvidence?.rulesBaseline
          ?.engineSchemaVersion,
      ).toBeDefined();
      expect(decisionContext.audit?.analysisSnapshot?.actorState).toBeDefined();
      expect(decisionContext.checkpointCapture).toMatchObject({
        schemaVersion: "netgrid-ai-decision-checkpoint-capture-v2",
        provenance: "persisted_at_decision",
        inputProjection: {
          schemaVersion: "netgrid-ai-decision-input-projection-v1",
          side: "corp",
          stateVersion: expect.any(Number),
        },
        runtime: { schemaVersion: "ai-runtime-checkpoint-v1" },
      });
      expect(decisionContext.checkpointCapture).not.toHaveProperty("input");
      expect(decisionContext.audit?.checkpointCapture).toMatchObject({
        validation: {
          sideSafeInput: true,
          inputMatchesActor: true,
          inputMatchesStateVersion: true,
          legalActionSetMatchesHistoricalAudit: true,
          humanPrivateHandExcluded: true,
        },
      });
      expect(decisionContext.beliefState).toMatchObject({
        schemaVersion: "netgrid-ai-belief-capture-v1",
        provenance: "persisted",
        invariantSignature: expect.any(String),
        stateVersion: decisionContext.decision?.stateVersion,
        lastEventIndex: expect.any(Number),
      });
      expect(decisionContext.turnPlanningAudit).toEqual({
        schemaVersion: "netgrid-turn-planning-audit-v1",
        provenance: "unavailable",
        reason: "historical_turn_planning_audit_not_persisted",
      });
      expect(decisionContext.deckConsumerAudit).toMatchObject({
        schemaVersion: "netgrid-deck-consumer-audit-v1",
        provenance: "persisted_at_decision",
        actor: "corp",
        stateVersion: decisionContext.decision?.stateVersion,
        deckCapabilities: {
          schemaVersion: "deck-capability-profile-v1",
          side: "corp",
        },
        deckStrategyProfile: {
          schemaVersion: "ai-deck-strategy-profile-v1",
          side: "corp",
        },
        deckDoctrineDiagnostic: {
          schemaVersion: "deck-doctrine-v2-diagnostic-v1",
          side: "corp",
        },
        validation: {
          inputMatchesActor: true,
          consumerSidesMatchActor: true,
          allConsumersPersisted: true,
        },
      });
      expect(decisionContext.ownDeckSnapshot).toMatchObject({
        side: "corp",
        provenance: "persisted",
        signature: activeBundle.ownDeckSnapshot?.signature,
        zoneBalance: {
          provenance: "reconstructed",
          stateVersion: decisionContext.decision?.stateVersion,
        },
      });
      expect(
        decisionContext.ownDeckSnapshot?.zoneBalance?.remainingPossibleDefinitionCounts?.reduce(
          (total, entry) => total + entry.quantity,
          0,
        ),
      ).toBe(decisionContext.ownDeckSnapshot?.zoneBalance?.hiddenDeckCount);
      expect(decisionContext.surroundingEvents?.length).toBeGreaterThan(0);
      expect(decisionContext.provenance?.persisted).toContain(
        "historicalDecisionAudit",
      );
      expect(decisionContext.provenance?.persisted).toContain("beliefState");
      expect(decisionContext.provenance?.persisted).toContain(
        "ownDeckSnapshot",
      );
      expect(decisionContext.provenance?.persisted).toContain(
        "checkpointCapture",
      );
      expect(decisionContext.provenance?.persisted).toContain(
        "deckConsumerAudit",
      );
      expect(decisionContext.provenance?.reconstructed).toContain(
        "ownDeckZoneBalance",
      );
      expect(JSON.stringify(decisionContext)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|gameStateJson|cardInstances|privatePayload|privateDeckSnapshots|decklist|AIInput/i,
      );
      expect(JSON.stringify(decisionContext.ownDeckSnapshot)).not.toMatch(
        /instanceId|stackPosition|order|shuffle/i,
      );

      const after = await service.loadForTest(active.matchId);
      if (!after) throw new Error("Missing active analysis match after read");
      expect(after?.match.matchVersion).toBe(before.match.matchVersion);
      expect(after?.gameState.stateVersion).toBe(before.gameState.stateVersion);
      expect(hashState(after.gameState)).toBe(hashState(before.gameState));

      const deckBindingDatabase = new DatabaseSync(join(dir, "netgrid.sqlite"));
      const persistedDeckRow = deckBindingDatabase
        .prepare(
          "SELECT private_deck_snapshots_json AS privateDeckSnapshotsJson FROM private_deck_snapshots WHERE match_id = ?",
        )
        .get(active.matchId) as
        | { privateDeckSnapshotsJson?: string }
        | undefined;
      if (!persistedDeckRow?.privateDeckSnapshotsJson)
        throw new Error("Missing persisted private deck snapshot row");
      const mismatchedDeckSnapshots = JSON.parse(
        persistedDeckRow.privateDeckSnapshotsJson,
      ) as NonNullable<StoredMatch["privateDeckSnapshots"]>;
      mismatchedDeckSnapshots.participants[
        assignment.corpPlayer
      ].corp.deckHash = "sha256:maintenance-binding-mismatch";
      deckBindingDatabase
        .prepare(
          "UPDATE private_deck_snapshots SET private_deck_snapshots_json = ? WHERE match_id = ?",
        )
        .run(JSON.stringify(mismatchedDeckSnapshots), active.matchId);
      const mismatchedBindingResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/bundle?side=corp&includeOwnDeckSnapshot=true&includeEvents=false&includeDecisionTraces=false`,
      );
      expect(mismatchedBindingResponse.status).toBe(200);
      expect(await mismatchedBindingResponse.json()).toMatchObject({
        ownDeckSnapshot: {
          side: "corp",
          provenance: "unavailable",
          reason: "historical_deck_snapshot_binding_mismatch",
        },
        diagnostics: {
          unavailableSections: expect.arrayContaining(["ownDeckSnapshot"]),
        },
      });

      deckBindingDatabase
        .prepare("DELETE FROM private_deck_snapshots WHERE match_id = ?")
        .run(active.matchId);
      const missingDeckResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/bundle?side=corp&includeOwnDeckSnapshot=true&includeEvents=false&includeDecisionTraces=false`,
      );
      expect(missingDeckResponse.status).toBe(200);
      expect(await missingDeckResponse.json()).toMatchObject({
        ownDeckSnapshot: {
          side: "corp",
          provenance: "unavailable",
          reason: "historical_deck_snapshot_not_persisted",
        },
        diagnostics: {
          unavailableSections: expect.arrayContaining(["ownDeckSnapshot"]),
        },
      });
      deckBindingDatabase
        .prepare(
          "INSERT INTO private_deck_snapshots (match_id, private_deck_snapshots_json) VALUES (?, ?)",
        )
        .run(active.matchId, persistedDeckRow.privateDeckSnapshotsJson);
      deckBindingDatabase.close();

      // A pre-audit trace must remain visibly unavailable; the API may not
      // substitute current-engine reconstruction for missing historical data.
      const legacyTraceDatabase = new DatabaseSync(join(dir, "netgrid.sqlite"));
      legacyTraceDatabase
        .prepare(
          "UPDATE ai_decision_traces SET trace_json = ? WHERE match_id = ? AND decision_index = ?",
        )
        .run(
          JSON.stringify({ schemaVersion: "ai-decision-trace-v1" }),
          active.matchId,
          1,
        );
      legacyTraceDatabase.close();
      const unavailableResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(active.matchId)}/decisions/1`,
      );
      expect(unavailableResponse.status).toBe(200);
      expect(await unavailableResponse.json()).toMatchObject({
        audit: {
          capture: "unavailable",
          reason: "historical_audit_not_persisted",
          availability: {
            historicalLegalActions: {
              status: "unavailable",
              reason: "historical_audit_not_persisted",
            },
          },
        },
        provenance: {
          reconstructed: expect.arrayContaining(["ownDeckZoneBalance"]),
        },
        diagnostics: {
          unavailableSections: expect.arrayContaining([
            "historicalLegalActions",
            "engineEvidence",
            "analysisSnapshot",
            "runAndEncounterProjection",
            "beliefState",
            "checkpointCapture",
          ]),
        },
        checkpointCapture: {
          provenance: "unavailable",
          reason: "historical_checkpoint_capture_not_persisted",
        },
        beliefState: {
          provenance: "unavailable",
          reason: "historical_belief_capture_not_persisted",
        },
      });

      const finishedResponse = await maintenance.request(
        `/api/storage/maintenance/analysis/matches/${encodeURIComponent(finished.matchId)}/bundle?includeEvents=false&includeDecisionTraces=false`,
      );
      expect(finishedResponse.status).toBe(200);
      const finishedBundle = (await finishedResponse.json()) as {
        match?: { status?: string };
        events?: unknown;
        traces?: unknown;
        eventCoverage?: {
          returnedEventCount?: number;
          terminalStateIncluded?: boolean;
        };
        terminal?: {
          isTerminal?: boolean;
          status?: string;
          finalStateVersion?: number;
          finalStateHash?: string;
        };
        diagnostics?: { warnings?: string[] };
      };
      expect(finishedBundle.match?.status).toBe("finished");
      expect(finishedBundle.events).toBeUndefined();
      expect(finishedBundle.traces).toBeUndefined();
      expect(finishedBundle.eventCoverage).toEqual({
        returnedEventCount: 0,
        eventLimit: 500,
        hasMoreEvents: false,
        terminalStateIncluded: false,
      });
      expect(finishedBundle.terminal).toMatchObject({
        isTerminal: true,
        status: "finished",
        finalStateVersion: finishedRecord.gameState.stateVersion,
        finalStateHash: hashState(finishedRecord.gameState),
      });
      expect(finishedBundle.diagnostics?.warnings).toContain(
        "Für den gewählten Entscheidungsbereich sind keine KI-Traces gespeichert.",
      );

      const missingResponse = await maintenance.request(
        "/api/storage/maintenance/analysis/matches/missing/bundle",
      );
      expect(missingResponse.status).toBe(404);
    } finally {
      await maintenance.handle.close();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("stores compact and detailed decision chains in the same SQLite AI trace path", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "sqlite-ai-decision-chain-trace-levels",
      chooseAiAction: (input): AiDecision => {
        const runtimeDecision = chooseRuntimeAiAction(input);
        const action = input.legalActions.find(
          (candidate) => candidate.actionId === runtimeDecision.actionId,
        );
        if (!action)
          throw new Error("Missing legal action for decision-chain trace test");
        const alternative = input.legalActions[1] ?? action;
        return {
          ...runtimeDecision,
          decisionDebug: {
            ...(runtimeDecision.decisionDebug ?? {
              schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
              aiLevel: 2,
              fallbackUsed: runtimeDecision.fallbackUsed,
            }),
            decisionChain: {
              schemaVersion: AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION,
              legalActionCount: input.legalActions.length,
              legalActionIds: input.legalActions.map(
                (candidate) => candidate.actionId,
              ),
              exclusions: [
                { actionId: alternative.actionId, key: "test_exclusion" },
              ],
              rawScoreWinner: { actionId: alternative.actionId, score: 73 },
              planSelection: {
                planId: "test.plan",
                planKind: "test.plan_kind",
                mappedActionIds: [action.actionId],
                contributionMode: "diagnostic_only",
              },
              planArbitration: {
                outcome: "plan_mapping_selected",
                selectedActionId: action.actionId,
                mappedActionId: action.actionId,
                reason: "test_plan_mapping",
                scoreGap: 4,
                threshold: 10,
                policy: "score_gap",
              },
              priorityCandidates: [
                { route: "tactical_plan_mapping", actionId: action.actionId },
              ],
              initialSelection: {
                route: "tactical_plan_mapping",
                actionId: action.actionId,
              },
              adjustments: [],
              finalSelection: {
                actionId: action.actionId,
                selectedOptionCount: 1,
                choiceResolution: {
                  choiceId: "test_choice",
                  kind: "test_kind",
                  source: "test_source",
                  selectedOptionIds: ["test_option"],
                },
              },
            },
          },
        };
      },
    });

    const createAndAdvance = async (
      aiTraceMode: "off" | "summary" | "detailed",
    ): Promise<string> => {
      const created = await service.createMatch({
        mode: "human_runner_vs_corp_ai",
        hostSide: "runner",
        seed: `sqlite-ai-decision-chain-${aiTraceMode}`,
        corpDifficulty: "normal",
        aiTraceMode,
      });
      const setup = await submitChoice(
        service,
        created.matchId,
        {
          side: "runner",
          sessionToken: created.hostSessionToken,
          reconnectToken: created.hostReconnectToken,
        },
        "keep",
        `sqlite-ai-decision-chain-${aiTraceMode}-setup`,
      );
      const advanced = await service.advanceAi({
        matchId: created.matchId,
        side: "runner",
        sessionToken: created.hostSessionToken,
        knownStateVersion: setup.playerView.stateVersion,
        mode: "single_step",
      });
      if (!advanced.ok) throw new Error(advanced.error.message);
      return created.matchId;
    };

    const summaryMatchId = await createAndAdvance("summary");
    const detailedMatchId = await createAndAdvance("detailed");
    const untracedMatchId = await createAndAdvance("off");

    const detailedCorpReplay = await service.loadReplayDiagnostics(
      detailedMatchId,
      "corp",
    );
    const detailedRunnerReplay = await service.loadReplayDiagnostics(
      detailedMatchId,
      "runner",
    );
    const untracedReplay = await service.loadReplayDiagnostics(
      untracedMatchId,
      "corp",
    );
    expect(detailedCorpReplay.ok).toBe(true);
    expect(detailedRunnerReplay.ok).toBe(true);
    expect(untracedReplay.ok).toBe(true);
    if (
      !detailedCorpReplay.ok ||
      !detailedRunnerReplay.ok ||
      !untracedReplay.ok
    )
      throw new Error("Missing SQLite replay view");
    expect(
      detailedCorpReplay.replay.timeline.find((step) => step.decisionDebug)
        ?.decisionDebug,
    ).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      actor: "corp",
      planFirstDecision: {
        schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
        selectionAuthority: expect.stringMatching(
          /^(?:resident_plan_instance|engine_window)$/,
        ),
      },
    });
    expect(
      detailedRunnerReplay.replay.timeline.find((step) => step.decisionDebug)
        ?.decisionDebug,
    ).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      redacted: true,
    });
    expect(
      untracedReplay.replay.timeline.some((step) => step.decisionDebug),
    ).toBe(false);
    storage.close?.();

    const database = new DatabaseSync(dbPath);
    try {
      const rows = database
        .prepare(
          `SELECT match_id AS matchId, trace_json AS traceJson
           FROM ai_decision_traces
           ORDER BY decision_index ASC`,
        )
        .all() as Array<{ matchId: string; traceJson: string }>;
      const traceFor = (matchId: string): Record<string, unknown> => {
        const row = rows.find((candidate) => candidate.matchId === matchId);
        if (!row) throw new Error(`Missing persisted AI trace for ${matchId}`);
        return JSON.parse(row.traceJson) as Record<string, unknown>;
      };
      const persistedDebugEvents = database
        .prepare(
          "SELECT COUNT(*) AS count FROM events WHERE json_type(public_payload_json, '$.publicPayload.aiDecisionDebug') IS NOT NULL",
        )
        .get() as { count: number };
      const untracedRows = database
        .prepare(
          "SELECT COUNT(*) AS count FROM ai_decision_traces WHERE match_id = ?",
        )
        .get(untracedMatchId) as { count: number };
      expect(Number(persistedDebugEvents.count)).toBe(0);
      expect(Number(untracedRows.count)).toBe(0);

      const summaryTrace = traceFor(summaryMatchId);
      expect(summaryTrace).toMatchObject({
        schemaVersion: "ai-decision-trace-v1",
        traceMode: "summary",
        planFirstDecision: {
          schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
          selectionAuthority: expect.stringMatching(
            /^(?:resident_plan_instance|engine_window)$/,
          ),
          strategicContext: { authority: "diagnostic_only" },
        },
        decisionChain: {
          traceLevel: "summary",
          schemaVersion: AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION,
          rawScoreWinner: { score: 73 },
          planArbitration: { outcome: "plan_mapping_selected" },
          initialSelection: { route: "tactical_plan_mapping" },
          finalSelection: {
            selectedOptionCount: 1,
            choiceResolution: { selectedOptionCount: 1 },
          },
        },
      });
      const summaryChain = summaryTrace.decisionChain as Record<
        string,
        unknown
      >;
      expect(summaryChain).not.toHaveProperty("legalActionIds");
      expect(summaryChain).not.toHaveProperty("exclusions");
      expect(
        (summaryChain.finalSelection as Record<string, unknown>)
          .choiceResolution,
      ).not.toHaveProperty("selectedOptionIds");

      const detailedTrace = traceFor(detailedMatchId);
      expect(detailedTrace).toMatchObject({
        schemaVersion: "ai-decision-trace-v1",
        traceMode: "detailed",
        planFirstDecision: {
          schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
          selectionAuthority: expect.stringMatching(
            /^(?:resident_plan_instance|engine_window)$/,
          ),
          strategicContext: { authority: "diagnostic_only" },
        },
        decisionChain: {
          traceLevel: "detailed",
          schemaVersion: AI_DECISION_CHAIN_DEBUG_SCHEMA_VERSION,
          legalActionIds: expect.any(Array),
          exclusions: [{ key: "test_exclusion" }],
          priorityCandidates: [{ route: "tactical_plan_mapping" }],
          finalSelection: {
            choiceResolution: { selectedOptionIds: ["test_option"] },
          },
        },
      });
      expect(JSON.stringify({ summaryTrace, detailedTrace })).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privatePayload|privateDeckSnapshots|decklist|fullGameState|FullState|AIInput/i,
      );
    } finally {
      database.close();
    }
  });

  it("prunes SQLite AI decision traces when auto-accepted Human-vs-KI undo removes an AI event", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "sqlite-ai-undo-trace-prune",
    });
    let traceAuditDb: DatabaseSync | undefined;
    try {
      const created = await service.createMatch({
        mode: "human_corp_vs_runner_ai",
        hostSide: "corp",
        seed: "sqlite-ai-undo-trace-prune",
        runnerDifficulty: "normal",
        aiTraceMode: "detailed",
      });
      const corp = {
        side: "corp" as const,
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      };
      await submitChoice(
        service,
        created.matchId,
        corp,
        "keep",
        "sqlite-ai-undo-trace-setup",
      );
      await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "mandatory_draw",
        "sqlite-ai-undo-trace-mandatory",
      );
      const endTurn = await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "end_turn",
        "sqlite-ai-undo-trace-end-turn",
      );
      const humanReadyPayload = endTurn.actorPayload.playerView.pendingChoice
        ? await submitFirstChoice(
            service,
            created.matchId,
            corp,
            "sqlite-ai-undo-trace-discard",
          )
        : endTurn.actorPayload;

      traceAuditDb = new DatabaseSync(dbPath);
      traceAuditDb.exec(`
        CREATE TABLE trace_write_audit (op TEXT NOT NULL, trace_id TEXT NOT NULL);
        CREATE TRIGGER audit_ai_traces_insert AFTER INSERT ON ai_decision_traces BEGIN INSERT INTO trace_write_audit VALUES ('insert', NEW.trace_id); END;
        CREATE TRIGGER audit_ai_traces_update AFTER UPDATE ON ai_decision_traces BEGIN INSERT INTO trace_write_audit VALUES ('update', NEW.trace_id); END;
        CREATE TRIGGER audit_ai_traces_delete AFTER DELETE ON ai_decision_traces BEGIN INSERT INTO trace_write_audit VALUES ('delete', OLD.trace_id); END;
      `);
      const traceAuditCounts = (): Record<string, number> =>
        Object.fromEntries(
          (
            traceAuditDb!
              .prepare(
                "SELECT op, COUNT(*) AS count FROM trace_write_audit GROUP BY op ORDER BY op",
              )
              .all() as Array<{ op: string; count: number }>
          ).map((row) => [row.op, Number(row.count)]),
        );
      const clearTraceAudit = (): void => {
        traceAuditDb!.prepare("DELETE FROM trace_write_audit").run();
      };

      const advanced = await service.advanceAi({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        knownStateVersion: humanReadyPayload.playerView.stateVersion,
        mode: "single_step",
      });
      expect(advanced.ok).toBe(true);
      if (!advanced.ok) throw new Error(advanced.error.message);
      const aiEventId = advanced.publicEvent?.eventId;
      expect(aiEventId).toBeTruthy();
      if (!aiEventId) throw new Error("Missing AI event id");
      expect(traceAuditCounts()).toEqual({ insert: 1 });
      clearTraceAudit();
      const beforeUndo = await storage.load(created.matchId);
      expect(
        beforeUndo?.eventLog.some((event) => event.eventId === aiEventId),
      ).toBe(true);
      expect(
        beforeUndo?.aiDecisionTraces?.some(
          (trace) => trace.eventId === aiEventId,
        ),
      ).toBe(true);
      if (!beforeUndo) throw new Error("Missing AI trace record before undo");
      await storage.save(beforeUndo);
      expect(traceAuditCounts()).toEqual({});

      const undo = await service.requestUndo({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        targetEventId: aiEventId,
        reason: "KI-Zug zurücknehmen",
      });
      expect(undo.ok).toBe(true);
      if (!undo.ok) throw new Error(undo.error.message);

      const afterUndo = await storage.load(created.matchId);
      expect(
        afterUndo?.eventLog.some((event) => event.eventId === aiEventId),
      ).toBe(false);
      expect(
        afterUndo?.aiDecisionTraces?.some(
          (trace) => trace.eventId === aiEventId,
        ),
      ).toBe(false);
      expect(
        afterUndo?.aiDecisionTraces?.every((trace) =>
          afterUndo.eventLog.some((event) => event.eventId === trace.eventId),
        ),
      ).toBe(true);
      expect(traceAuditCounts()).toEqual({ delete: 1 });

      const db = new DatabaseSync(dbPath, { readOnly: true });
      try {
        const stored = db
          .prepare(
            `SELECT
              (SELECT COUNT(*) FROM events WHERE match_id = ? AND event_id = ?) AS removedEventRows,
              (SELECT COUNT(*) FROM ai_decision_traces WHERE match_id = ? AND event_id = ?) AS removedTraceRows,
              (SELECT COUNT(*)
               FROM ai_decision_traces t
               LEFT JOIN events e ON e.match_id = t.match_id AND e.event_id = t.event_id
               WHERE t.match_id = ? AND e.event_id IS NULL) AS orphanTraceRows`,
          )
          .get(
            created.matchId,
            aiEventId,
            created.matchId,
            aiEventId,
            created.matchId,
          ) as {
          removedEventRows: number;
          removedTraceRows: number;
          orphanTraceRows: number;
        };
        expect(Number(stored.removedEventRows)).toBe(0);
        expect(Number(stored.removedTraceRows)).toBe(0);
        expect(Number(stored.orphanTraceRows)).toBe(0);
      } finally {
        db.close();
      }

      clearTraceAudit();
      const replayed = await service.advanceAi({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        knownStateVersion: undo.requesterPayload.playerView.stateVersion,
        mode: "single_step",
      });
      expect(replayed.ok).toBe(true);
      if (!replayed.ok) throw new Error(replayed.error.message);
      expect(replayed.publicEvent?.eventId).toBe(aiEventId);
      expect(traceAuditCounts()).toEqual({ insert: 1 });
      const replayAuditDb = new DatabaseSync(dbPath, { readOnly: true });
      try {
        expect(
          replayAuditDb
            .prepare(
              "SELECT COUNT(*) AS count FROM state_snapshots WHERE match_id = ? AND snapshot_id = ?",
            )
            .get(
              created.matchId,
              `snap_before_${undo.requesterPayload.playerView.stateVersion + 1}`,
            ),
        ).toMatchObject({ count: 1 });
      } finally {
        replayAuditDb.close();
      }
    } finally {
      traceAuditDb?.close();
      service.closeStorage();
    }
  });

  it("issues a local recovery access from maintenance without listing raw token fields", async () => {
    const dir = await tempStorageDir();
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir: join(dir, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "backend-05-recovery-access",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Ludwig",
      seed: "backend-05-recovery",
    });

    const maintenance = await authenticatedMaintenanceServer(service);
    try {
      const response = await maintenance.request(
        `/api/storage/maintenance/matches/${encodeURIComponent(created.matchId)}/recovery-access`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ side: "runner" }),
        },
        { sensitive: true },
      );
      const recovery = (await response.json()) as {
        matchId?: string;
        side?: Side;
        access?: string;
        displayName?: string;
        matchVersion?: number;
      };
      expect(response.status).toBe(200);
      expect(recovery.matchId).toBe(created.matchId);
      expect(recovery.side).toBe("runner");
      expect(recovery.displayName).toBe("Ludwig");
      expect(recovery.access).toMatch(/^[A-Za-z0-9_-]{32,}$/);
      expect(JSON.stringify(recovery)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i,
      );

      const oldBootstrap = await service.bootstrap(
        created.matchId,
        "runner",
        created.hostSessionToken,
        { allowLobby: true },
      );
      expect("error" in oldBootstrap).toBe(true);
      const oldReconnect = await service.reconnectMatch(created.matchId, {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      });
      expect("error" in oldReconnect).toBe(true);

      const reconnectResponse = await fetch(
        `${maintenance.baseUrl}/api/matches/${encodeURIComponent(created.matchId)}/reconnect`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            side: "runner",
            reconnectToken: recovery.access,
            recovery: true,
          }),
        },
      );
      const reconnected = (await reconnectResponse.json()) as {
        matchId?: string;
        side?: Side;
        sessionToken?: string;
        reconnectToken?: string;
        matchVersion?: number;
      };
      expect(reconnectResponse.status).toBe(200);
      expect(reconnected.matchId).toBe(created.matchId);
      expect(reconnected.side).toBe("runner");
      expect(reconnected.sessionToken).toBeTruthy();
      expect(reconnected.reconnectToken).toBeTruthy();
      expect(reconnected.matchVersion).toBeGreaterThan(
        recovery.matchVersion ?? 0,
      );
    } finally {
      await maintenance.handle.close();
    }
  });

  it("previews only sufficiently old active cleanup candidates and keeps the result redacted", async () => {
    const dir = await tempStorageDir();
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir: join(dir, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "backend-05-cleanup-preview",
    });
    const oldActive = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Alt Aktiv",
      seed: "backend-05-old-active",
    });
    const freshActive = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Frisch Aktiv",
      seed: "backend-05-fresh-active",
    });
    const oldFinished = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Archiv",
      seed: "backend-05-old-finished",
    });
    const oldActiveRecord = await service.loadForTest(oldActive.matchId);
    const oldFinishedRecord = await service.loadForTest(oldFinished.matchId);
    if (!oldActiveRecord || !oldFinishedRecord)
      throw new Error("Missing cleanup fixtures");
    oldActiveRecord.match.updatedAt = new Date(
      Date.now() - 2 * 60 * 60 * 1000,
    ).toISOString();
    oldFinishedRecord.match.status = "finished";
    oldFinishedRecord.match.updatedAt = new Date(
      Date.now() - 3 * 60 * 60 * 1000,
    ).toISOString();
    await storage.save(oldActiveRecord);
    await storage.save(oldFinishedRecord);

    const maintenance = await authenticatedMaintenanceServer(service);
    try {
      const response = await maintenance.request(
        "/api/storage/maintenance/cleanup/preview",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            statuses: ["active", "finished"],
            olderThanMinutes: 60,
            limit: 100,
          }),
        },
      );
      const preview = (await response.json()) as {
        matchCount?: number;
        previewId?: string;
        matches?: Array<{ matchId: string; status: string }>;
        warnings?: string[];
      };
      expect(response.status).toBe(200);
      expect(preview.matchCount).toBe(2);
      expect(preview.previewId).toMatch(/^[a-f0-9]{16}$/);
      expect(preview.matches?.map((match) => match.matchId)).toEqual([
        oldActive.matchId,
        oldFinished.matchId,
      ]);
      expect(preview.matches?.map((match) => match.status)).toEqual([
        "active",
        "finished",
      ]);
      expect(preview.matches?.map((match) => match.matchId)).not.toContain(
        freshActive.matchId,
      );
      expect(preview.warnings?.join(" ")).toContain("Aktive Matches");
      expect(preview.warnings?.join(" ")).toContain("Finished-Matches");
      expect(JSON.stringify(preview)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i,
      );
    } finally {
      await maintenance.handle.close();
    }
  });

  it("deletes only whole previewed matches after creating a backup", async () => {
    const dir = await tempStorageDir();
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir,
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "backend-05-cleanup-apply",
    });
    const oldActive = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Alt Aktiv",
      seed: "backend-05-delete-old-active",
    });
    const freshActive = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Frisch Aktiv",
      seed: "backend-05-keep-fresh-active",
    });
    const oldRecord = await service.loadForTest(oldActive.matchId);
    if (!oldRecord) throw new Error("Missing old cleanup record");
    oldRecord.match.updatedAt = new Date(
      Date.now() - 2 * 60 * 60 * 1000,
    ).toISOString();
    await storage.save(oldRecord);

    const maintenance = await authenticatedMaintenanceServer(service);
    try {
      const previewResponse = await maintenance.request(
        "/api/storage/maintenance/cleanup/preview",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            statuses: ["active"],
            olderThanMinutes: 60,
            limit: 100,
          }),
        },
      );
      const preview = (await previewResponse.json()) as {
        previewId?: string;
        matchCount?: number;
      };
      expect(previewResponse.status).toBe(200);
      expect(preview.matchCount).toBe(1);
      if (!preview.previewId) throw new Error("Missing cleanup preview id");

      const applyResponse = await maintenance.request(
        "/api/storage/maintenance/cleanup/apply",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            statuses: ["active"],
            olderThanMinutes: 60,
            limit: 100,
            previewId: preview.previewId,
            createBackup: true,
          }),
        },
        { sensitive: true },
      );
      const result = (await applyResponse.json()) as {
        deletedCount?: number;
        deletedMatchIds?: string[];
        backup?: { backupId?: string; backupDir?: string };
        integrityCheck?: string;
      };
      expect(applyResponse.status).toBe(200);
      expect(result.deletedCount).toBe(1);
      expect(result.deletedMatchIds).toEqual([oldActive.matchId]);
      expect(result.backup?.backupId).toMatch(/^netgrid-storage-/);
      expect(result.backup?.backupDir).toContain(backupDir);
      expect(result.integrityCheck).toBe("ok");
      expect(await storage.load(oldActive.matchId)).toBeUndefined();
      expect(await storage.load(freshActive.matchId)).toBeTruthy();
      expect((await readdir(backupDir)).length).toBeGreaterThan(0);
      expect(JSON.stringify(result)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i,
      );
    } finally {
      await maintenance.handle.close();
    }
  });

  it("marks matches as protected and excludes them from automatic cleanup by default without requiring backup", async () => {
    const dir = await tempStorageDir();
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir,
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "backend-05-retention-policy",
    });
    const protectedMatch = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Aufheben",
      seed: "backend-05-protected",
    });
    const cleanupMatch = await service.createMatch({
      hostSide: "runner",
      playMode: "human_vs_ai",
      displayName: "Weg",
      seed: "backend-05-auto-delete",
    });
    const oldProtected = await service.loadForTest(protectedMatch.matchId);
    const oldCleanup = await service.loadForTest(cleanupMatch.matchId);
    if (!oldProtected || !oldCleanup)
      throw new Error("Missing retention fixtures");
    oldProtected.match.status = "abandoned";
    oldCleanup.match.status = "abandoned";
    oldProtected.match.updatedAt = new Date(
      Date.now() - 4 * 24 * 60 * 60 * 1000,
    ).toISOString();
    oldCleanup.match.updatedAt = new Date(
      Date.now() - 4 * 24 * 60 * 60 * 1000,
    ).toISOString();
    await storage.save(oldProtected);
    await storage.save(oldCleanup);

    const maintenance = await authenticatedMaintenanceServer(service);
    try {
      const protectResponse = await fetch(
        `${maintenance.baseUrl}/api/matches/${encodeURIComponent(protectedMatch.matchId)}/retention-protection`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${protectedMatch.hostSessionToken}`,
          },
          body: JSON.stringify({
            side: protectedMatch.hostSide,
            protected: true,
          }),
        },
      );
      const protection = (await protectResponse.json()) as {
        ok?: boolean;
        payload?: { retentionProtected?: boolean };
      };
      expect(protectResponse.status).toBe(200);
      expect(protection.ok).toBe(true);
      expect(protection.payload?.retentionProtected).toBe(true);

      const policyResponse = await maintenance.request(
        "/api/storage/maintenance/cleanup/policy",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            enabled: true,
            statuses: ["active", "abandoned"],
            olderThanDays: 3,
            limit: 100,
            includeProtected: false,
          }),
        },
        { sensitive: true },
      );
      const savedPolicy = (await policyResponse.json()) as {
        statuses?: string[];
      };
      expect(policyResponse.status).toBe(200);
      expect(savedPolicy.statuses).toEqual(["abandoned"]);

      const runResponse = await maintenance.request(
        "/api/storage/maintenance/cleanup/policy/run",
        { method: "POST" },
        { sensitive: true },
      );
      const run = (await runResponse.json()) as {
        applyResult?: {
          deletedCount?: number;
          deletedMatchIds?: string[];
          backupCreated?: boolean;
          backup?: { backupId?: string };
        };
        policy?: {
          lastRun?: { deletedCount?: number; backupCreated?: boolean };
        };
      };
      expect(runResponse.status).toBe(200);
      expect(run.applyResult?.deletedCount).toBe(1);
      expect(run.applyResult?.deletedMatchIds).toEqual([cleanupMatch.matchId]);
      expect(run.applyResult?.backupCreated).toBe(false);
      expect(run.applyResult?.backup).toBeUndefined();
      expect(run.policy?.lastRun?.deletedCount).toBe(1);
      expect(run.policy?.lastRun?.backupCreated).toBe(false);
      expect(await storage.load(cleanupMatch.matchId)).toBeUndefined();
      expect(
        (await storage.load(protectedMatch.matchId))?.match.retentionProtection
          ?.protected,
      ).toBe(true);
      expect(JSON.stringify(run)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|sha256:[a-f0-9]{64}|cardInstances|privateDeckSnapshots|privatePayload|decklist|game_state_json/i,
      );
    } finally {
      await maintenance.handle.close();
    }
  });

  it("blocks maintenance endpoints outside the local deployment profile", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "backend-05-private-block",
      publicWebBaseUrl: "https://netgrid.example",
      publicServerBaseUrl: "https://api.netgrid.example",
    });
    const handle = createNetgridHttpServer(service, {
      deploymentConfig: privateDeploymentConfig(),
    });
    const baseUrl = await listen(handle);
    try {
      const response = await fetch(
        `${baseUrl}/api/storage/maintenance/summary`,
        { headers: { origin: "https://netgrid.example" } },
      );
      const text = await response.text();
      expect(response.status).toBe(403);
      expect(text).toContain("maintenance_unavailable");
      expect(text).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|privatePayload|decklist/i,
      );
    } finally {
      await handle.close();
    }
  });
});

describe("V1.0.8 SQLite storage and backup hardening", () => {
  it("resolves default match and account storage to the same repository database", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const env = {} as NodeJS.ProcessEnv;

    expect(resolveConfiguredMatchSqlitePath(env)).toBe(
      join(root, "data", "runtime", "multiplayer", "netgrid.sqlite"),
    );
    expect(resolveConfiguredAccountSqlitePath(env)).toBe(
      resolveConfiguredMatchSqlitePath(env),
    );
  });

  it("resolves relative storage overrides from the repository root", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const env = {
      NETGRID_SQLITE_STORAGE_PATH: "data/runtime/custom-match.sqlite",
      NETGRID_ACCOUNT_SQLITE_PATH: "data/runtime/custom-account.sqlite",
    } as NodeJS.ProcessEnv;

    expect(resolveConfiguredMatchSqlitePath(env)).toBe(
      join(root, "data", "runtime", "custom-match.sqlite"),
    );
    expect(resolveConfiguredAccountSqlitePath(env)).toBe(
      join(root, "data", "runtime", "custom-account.sqlite"),
    );
  });

  it("uses SQLite as configurable default storage and reports only redacted health signals", async () => {
    const dir = await tempStorageDir();
    const previousSqlite = process.env.NETGRID_SQLITE_STORAGE_PATH;
    const previousBackup = process.env.NETGRID_STORAGE_BACKUP_DIR;
    process.env.NETGRID_SQLITE_STORAGE_PATH = join(dir, "configured.sqlite");
    process.env.NETGRID_STORAGE_BACKUP_DIR = join(dir, "backups");
    try {
      const storage = createConfiguredStorage();
      const service = new MultiplayerService(storage, {
        tokenSalt: "v108-default-storage",
      });
      const health = await service.storageHealth();
      expect(health.kind).toBe("sqlite");
      expect(health.schemaVersion).toBe(3);
      expect(health.storageFormat).toBe("netgrid_multiplayer_sqlite");
      expect(JSON.stringify(health)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|decklist/i,
      );
      service.closeStorage();
    } finally {
      restoreEnv("NETGRID_SQLITE_STORAGE_PATH", previousSqlite);
      restoreEnv("NETGRID_STORAGE_BACKUP_DIR", previousBackup);
    }
  });

  it("roundtrips full StoredMatch records through SQLite without persisting cleartext tokens", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-sqlite-roundtrip",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "v108-sqlite-roundtrip",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Corp",
    });
    expect("error" in joined).toBe(false);
    const before = await service.loadForTest(created.matchId);
    expect(
      before?.privateDeckSnapshots?.participants.player_a.runner.cards.length,
    ).toBeGreaterThan(0);
    service.closeStorage();

    const reopenedStorage = new SqliteMatchStorage({ dbPath, backupDir });
    const reopened = await reopenedStorage.load(created.matchId);
    expect(reopened?.match.matchId).toBe(created.matchId);
    expect(
      reopened?.tokens.every((token) => token.tokenHash.startsWith("sha256:")),
    ).toBe(true);
    expect(
      reopened?.sessions.every((session) =>
        session.sessionTokenHash.startsWith("sha256:"),
      ),
    ).toBe(true);
    expect(
      reopened?.privateDeckSnapshots?.participants.player_b.corp.cards.length,
    ).toBeGreaterThan(0);
    expect(reopened?.eventLog.at(0)?.publicPayload.type).toBe("game_created");
    const raw = await readFile(dbPath);
    expect(raw.toString("utf8")).not.toContain(created.hostSessionToken);
    expect(raw.toString("utf8")).not.toContain(created.hostReconnectToken);
    expect(raw.toString("utf8")).not.toContain(joinToken);
    reopenedStorage.close();
  });

  it("loads only bounded public payloads, tail traces and the requested action receipt", async () => {
    const fixture = await storedMatchFixture("v108-bounded-action-load");
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const storage = new SqliteMatchStorage({
      dbPath,
      backupDir: join(dir, "backups"),
    });
    const record = structuredClone(fixture.record) as StoredMatch;
    const firstPublicEvent = record.eventLog[0];
    const firstEngineEvent = record.gameState.eventLog[0];
    if (!firstPublicEvent || !firstEngineEvent)
      throw new Error("Missing initial event");
    const addedPublicEvents: EventRecord[] = [];
    const addedEngineEvents: GameEvent[] = [];
    const traces: NonNullable<StoredMatch["aiDecisionTraces"]> = [];
    for (let index = 1; index <= 120; index += 1) {
      const eventId = `evt_bounded_${index}`;
      const actor: Side = index % 2 === 0 ? "corp" : "runner";
      const actionType = index % 10 === 0 ? "end_turn" : "gain_credit";
      const publicPayload = {
        ...firstPublicEvent.publicPayload,
        eventId,
        type: "action_applied" as const,
        stateVersionBefore: index - 1,
        stateVersionAfter: index,
        publicPayload: {
          actor,
          actionType,
          marker:
            index === 1 ? "EARLY_PUBLIC_PAYLOAD_SENTINEL" : `event-${index}`,
        },
      };
      addedPublicEvents.push({
        ...firstPublicEvent,
        eventId,
        stateVersionBefore: index - 1,
        stateVersionAfter: index,
        publicPayload,
      });
      addedEngineEvents.push({
        ...firstEngineEvent,
        eventId,
        type: "action_applied",
        stateVersionBefore: index - 1,
        stateVersionAfter: index,
        publicPayload: { actor, actionType },
      } as GameEvent);
      traces.push({
        traceId: `trace_bounded_${index}`,
        matchId: record.match.matchId,
        eventId,
        stateVersion: index,
        matchVersion: record.match.matchVersion,
        side: actor,
        turn: Math.ceil(index / 2),
        decisionIndex: index,
        createdAt: `2026-07-19T00:00:${String(index % 60).padStart(2, "0")}.000Z`,
        schemaVersion: "ai-decision-trace-v1",
        traceJson: {
          marker: index === 1 ? "EARLY_TRACE_SENTINEL" : `trace-${index}`,
        },
      });
    }
    record.eventLog = [firstPublicEvent, ...addedPublicEvents];
    record.gameState.eventLog = [firstEngineEvent, ...addedEngineEvents];
    record.aiDecisionTraces = traces;
    record.actionReceipts = Array.from({ length: 12 }, (_, index) => ({
      idempotencyKey: `receipt-${index}`,
      matchId: record.match.matchId,
      side: index % 2 === 0 ? ("runner" as const) : ("corp" as const),
      accepted: true,
      stateVersionBefore: index,
      stateVersionAfter: index + 1,
      stateHashAfter: `hash-${index}`,
    }));
    await storage.save(record);

    const full = await storage.load(record.match.matchId);
    const legacyPartial = await storage.load(record.match.matchId, {
      includeStateSnapshots: false,
    });
    const bounded = await storage.loadForAction(record.match.matchId, {
      side: "runner",
      idempotencyKey: "receipt-4",
    });
    if (!full || !legacyPartial || !bounded)
      throw new Error("Missing bounded-load fixture");

    expect(bounded.eventLog).toHaveLength(full.eventLog.length);
    expect(bounded.eventLog.slice(-SIDE_PAYLOAD_EVENT_TAIL_LIMIT)).toEqual(
      full.eventLog.slice(-SIDE_PAYLOAD_EVENT_TAIL_LIMIT),
    );
    const fullChronicle = chronicleTurnContextByEventId(
      full.eventLog.map((event) => event.publicPayload),
    );
    const boundedChronicle = chronicleTurnContextByEventId(
      bounded.eventLog.map((event) => event.publicPayload),
    );
    for (const event of bounded.eventLog.slice(
      -SIDE_PAYLOAD_EVENT_TAIL_LIMIT,
    )) {
      expect(boundedChronicle[event.eventId]).toEqual(
        fullChronicle[event.eventId],
      );
    }
    expect(
      JSON.stringify(bounded.eventLog.slice(0, -SIDE_PAYLOAD_EVENT_TAIL_LIMIT)),
    ).not.toContain("EARLY_PUBLIC_PAYLOAD_SENTINEL");
    expect(bounded.gameState.eventLog).toEqual(full.gameState.eventLog);
    expect(bounded.aiDecisionTraces).toHaveLength(
      SIDE_PAYLOAD_EVENT_TAIL_LIMIT,
    );
    expect(JSON.stringify(bounded.aiDecisionTraces)).not.toContain(
      "EARLY_TRACE_SENTINEL",
    );
    expect(
      bounded.actionReceipts.map((receipt) => receipt.idempotencyKey),
    ).toEqual(["receipt-4"]);
    expect(bounded.stateSnapshots).toEqual([]);
    const previousActionHistoryBytes = JSON.stringify({
      events: legacyPartial.eventLog,
      traces: legacyPartial.aiDecisionTraces,
      receipts: legacyPartial.actionReceipts,
      snapshots: legacyPartial.stateSnapshots,
    }).length;
    const boundedHistoryBytes = JSON.stringify({
      events: bounded.eventLog,
      traces: bounded.aiDecisionTraces,
      receipts: bounded.actionReceipts,
      snapshots: bounded.stateSnapshots,
    }).length;
    expect(boundedHistoryBytes).toBeLessThan(previousActionHistoryBytes);
    expect(bounded.actionPersistenceBaseline).toMatchObject({
      expectedMatchVersion: record.match.matchVersion,
      expectedStateVersion: record.gameState.stateVersion,
      publicEventCount: 121,
      engineEventCount: 121,
      actionReceiptCount: 12,
      aiDecisionTraceCount: 120,
      loadedActionReceiptCount: 1,
      loadedAiDecisionTraceCount: SIDE_PAYLOAD_EVENT_TAIL_LIMIT,
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "fixture-v108-bounded-action-load",
      now: () => "2026-07-19T12:00:00.000Z",
    });
    const fullPayload = await service.bootstrap(
      record.match.matchId,
      "runner",
      fixture.hostSessionToken,
    );
    if ("error" in fullPayload) throw new Error(fullPayload.error.message);
    const duplicate = await service.submitAction({
      matchId: record.match.matchId,
      side: "runner",
      sessionToken: fixture.hostSessionToken,
      actionId:
        fullPayload.legalActions[0]?.actionId ?? "duplicate-short-circuit",
      clientKnownStateVersion: fullPayload.playerView.stateVersion,
      idempotencyKey: "receipt-4",
    });
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.actorPayload.eventTail).toEqual(fullPayload.eventTail);
    expect(JSON.stringify(duplicate.actorPayload)).not.toMatch(
      /EARLY_PUBLIC_PAYLOAD_SENTINEL|EARLY_TRACE_SENTINEL/,
    );
    console.info(
      `[delta-action-history-probe] ${JSON.stringify({ previousActionHistoryBytes, boundedHistoryBytes })}`,
    );
    storage.close();
  });

  it("appends action deltas without updating or deleting persisted history prefixes", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const storage = new SqliteMatchStorage({
      dbPath,
      backupDir: join(dir, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-delta-append-only",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "v108-delta-append-only",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    if ("error" in joined) throw new Error(joined.error.message);
    await forceSetupComplete(service, created.matchId);
    const beforePayload = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    if ("error" in beforePayload) throw new Error(beforePayload.error.message);
    const action = beforePayload.legalActions.find(
      (candidate) => candidate.type === "mandatory_draw",
    );
    if (!action) throw new Error("Missing mandatory draw");
    const auditDb = new DatabaseSync(dbPath);
    auditDb.exec(`
      CREATE TRIGGER reject_event_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT, 'event_update_forbidden'); END;
      CREATE TRIGGER reject_event_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT, 'event_delete_forbidden'); END;
      CREATE TRIGGER reject_engine_event_update BEFORE UPDATE ON engine_events BEGIN SELECT RAISE(ABORT, 'engine_event_update_forbidden'); END;
      CREATE TRIGGER reject_engine_event_delete BEFORE DELETE ON engine_events BEGIN SELECT RAISE(ABORT, 'engine_event_delete_forbidden'); END;
      CREATE TRIGGER reject_receipt_update BEFORE UPDATE ON action_receipts BEGIN SELECT RAISE(ABORT, 'receipt_update_forbidden'); END;
      CREATE TRIGGER reject_receipt_delete BEFORE DELETE ON action_receipts BEGIN SELECT RAISE(ABORT, 'receipt_delete_forbidden'); END;
      CREATE TRIGGER reject_trace_update BEFORE UPDATE ON ai_decision_traces BEGIN SELECT RAISE(ABORT, 'trace_update_forbidden'); END;
      CREATE TRIGGER reject_trace_delete BEFORE DELETE ON ai_decision_traces BEGIN SELECT RAISE(ABORT, 'trace_delete_forbidden'); END;
      CREATE TRIGGER reject_snapshot_update BEFORE UPDATE ON state_snapshots BEGIN SELECT RAISE(ABORT, 'snapshot_update_forbidden'); END;
      CREATE TRIGGER reject_snapshot_delete BEFORE DELETE ON state_snapshots BEGIN SELECT RAISE(ABORT, 'snapshot_delete_forbidden'); END;
    `);
    const countsBefore = actionHistoryCountsForTest(auditDb, created.matchId);

    const first = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: action.actionId,
      clientKnownStateVersion: beforePayload.playerView.stateVersion,
      idempotencyKey: "delta-append-only",
    });
    if (!first.ok) throw new Error(first.error.message);
    const duplicate = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: action.actionId,
      clientKnownStateVersion: beforePayload.playerView.stateVersion,
      idempotencyKey: "delta-append-only",
    });
    if (!duplicate.ok) throw new Error(duplicate.error.message);

    expect(duplicate.receipt).toEqual(first.receipt);
    expect(actionHistoryCountsForTest(auditDb, created.matchId)).toEqual({
      events: countsBefore.events + 1,
      engineEvents: countsBefore.engineEvents + 1,
      receipts: countsBefore.receipts + 1,
      snapshots: countsBefore.snapshots + 1,
      traces: countsBefore.traces,
    });
    const reopened = await storage.load(created.matchId);
    expect(
      reopened?.actionReceipts.filter(
        (receipt) => receipt.idempotencyKey === "delta-append-only",
      ),
    ).toHaveLength(1);
    expect(reopened?.gameState.stateVersion).toBe(
      first.receipt.stateVersionAfter,
    );
    auditDb.close();
    storage.close();
  });

  it("rolls back the complete action delta when a late history insert fails", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const storage = new SqliteMatchStorage({
      dbPath,
      backupDir: join(dir, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-delta-rollback",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "v108-delta-rollback",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    if ("error" in joined) throw new Error(joined.error.message);
    await forceSetupComplete(service, created.matchId);
    const payload = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    if ("error" in payload) throw new Error(payload.error.message);
    const action = payload.legalActions.find(
      (candidate) => candidate.type === "mandatory_draw",
    );
    if (!action) throw new Error("Missing mandatory draw");
    const auditDb = new DatabaseSync(dbPath);
    const before = {
      counts: actionHistoryCountsForTest(auditDb, created.matchId),
      match: auditDb
        .prepare(
          "SELECT match_version AS matchVersion, state_version AS stateVersion FROM matches WHERE match_id = ?",
        )
        .get(created.matchId),
    };
    auditDb.exec(`CREATE TRIGGER fail_delta_receipt BEFORE INSERT ON action_receipts
      WHEN NEW.idempotency_key = 'forced-delta-rollback'
      BEGIN SELECT RAISE(ABORT, 'forced_delta_receipt'); END;`);
    let observerCalls = 0;
    service.addPersistenceObserver(async () => {
      observerCalls += 1;
    });

    await expect(
      service.submitAction({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        actionId: action.actionId,
        clientKnownStateVersion: payload.playerView.stateVersion,
        idempotencyKey: "forced-delta-rollback",
      }),
    ).rejects.toThrow("forced_delta_receipt");

    expect(actionHistoryCountsForTest(auditDb, created.matchId)).toEqual(
      before.counts,
    );
    expect(
      auditDb
        .prepare(
          "SELECT match_version AS matchVersion, state_version AS stateVersion FROM matches WHERE match_id = ?",
        )
        .get(created.matchId),
    ).toEqual(before.match);
    expect(observerCalls).toBe(0);
    auditDb.close();
    storage.close();
  });

  it("rejects a delta baseline after concurrent history drift without partial writes", async () => {
    const fixture = await storedMatchFixture("v108-delta-drift");
    const dir = await tempStorageDir();
    const storage = new SqliteMatchStorage({
      dbPath: join(dir, "netgrid.sqlite"),
      backupDir: join(dir, "backups"),
    });
    await storage.save(fixture.record);
    const bounded = await storage.loadForAction(fixture.record.match.matchId, {
      side: "runner",
      idempotencyKey: "drift-target",
    });
    const concurrent = await storage.load(fixture.record.match.matchId);
    if (!bounded || !concurrent) throw new Error("Missing drift fixture");
    concurrent.actionReceipts.push({
      idempotencyKey: "concurrent-receipt",
      matchId: concurrent.match.matchId,
      side: "corp",
      accepted: false,
      stateVersionBefore: concurrent.gameState.stateVersion,
      stateVersionAfter: concurrent.gameState.stateVersion,
      stateHashAfter: hashState(concurrent.gameState),
      errorCode: "stale_state",
    });
    await storage.save(concurrent);
    bounded.actionReceipts.push({
      idempotencyKey: "drift-target",
      matchId: bounded.match.matchId,
      side: "runner",
      accepted: false,
      stateVersionBefore: bounded.gameState.stateVersion,
      stateVersionAfter: bounded.gameState.stateVersion,
      stateHashAfter: hashState(bounded.gameState),
      errorCode: "stale_state",
    });

    await expect(storage.saveActionDelta(bounded)).rejects.toMatchObject({
      code: "action_persistence_conflict",
    });
    const reopened = await storage.load(fixture.record.match.matchId);
    expect(
      reopened?.actionReceipts.map((receipt) => receipt.idempotencyKey),
    ).toContain("concurrent-receipt");
    expect(
      reopened?.actionReceipts.map((receipt) => receipt.idempotencyKey),
    ).not.toContain("drift-target");
    storage.close();
  });

  it("processes synthetic 1, 10 and 25 match action bursts through SQLite", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const storage = new SqliteMatchStorage({
      dbPath,
      backupDir: join(dir, "backups"),
    });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-delta-load-probe",
    });
    const matches: Array<{ matchId: string; sessionToken: string }> = [];
    for (let index = 0; index < 25; index += 1) {
      const created = await service.createMatch({
        hostSide: "corp",
        seed: `v108-delta-load-probe-${index}`,
      });
      const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
        "joinToken",
      );
      if (!joinToken) throw new Error("Missing join token");
      const joined = await service.joinMatch(created.matchId, {
        token: joinToken,
        displayName: `Runner ${index}`,
      });
      if ("error" in joined) throw new Error(joined.error.message);
      await forceSetupComplete(service, created.matchId);
      matches.push({
        matchId: created.matchId,
        sessionToken: created.hostSessionToken,
      });
    }

    const probe = async (size: 1 | 10 | 25, round: number): Promise<number> => {
      const startedAt = performance.now();
      const results = await Promise.all(
        matches.slice(0, size).map(async (match) => {
          const payload = await service.bootstrap(
            match.matchId,
            "corp",
            match.sessionToken,
          );
          if ("error" in payload) throw new Error(payload.error.message);
          const action = payload.legalActions.find(
            (candidate) =>
              candidate.type !== "end_turn" &&
              candidate.targetRequirements.length === 0 &&
              (candidate.choiceRequirements?.length ?? 0) === 0,
          );
          if (!action) throw new Error("Missing probe action");
          return service.submitAction({
            matchId: match.matchId,
            side: "corp",
            sessionToken: match.sessionToken,
            actionId: action.actionId,
            clientKnownStateVersion: payload.playerView.stateVersion,
            idempotencyKey: `delta-load-probe-${round}-${match.matchId}`,
          });
        }),
      );
      expect(results.every((result) => result.ok)).toBe(true);
      return performance.now() - startedAt;
    };

    const timings = {
      oneMatchMs: await probe(1, 1),
      tenMatchesMs: await probe(10, 2),
      twentyFiveMatchesMs: await probe(25, 3),
    };
    expect(
      Object.values(timings).every(
        (duration) => Number.isFinite(duration) && duration >= 0,
      ),
    ).toBe(true);
    const database = new DatabaseSync(dbPath, { readOnly: true });
    const receiptCount = database
      .prepare("SELECT COUNT(*) AS count FROM action_receipts")
      .get() as { count: number };
    expect(Number(receiptCount.count)).toBe(36);
    database.close();
    console.info(`[delta-action-load-probe] ${JSON.stringify(timings)}`);
    storage.close();
  });

  it("deduplicates repeated state snapshots before writing SQLite mirror tables", async () => {
    const fixture = await storedMatchFixture("v108-duplicate-state-snapshot");
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const record = structuredClone(fixture.record) as StoredMatch;
    const gameState = createGameAfterSetup({
      matchId: record.match.matchId,
      seed: "v108-duplicate-state-snapshot",
    });
    const snapshot = stateSnapshotForTest(
      record.match.matchId,
      gameState,
      record.match.matchVersion,
      "snap_duplicate",
    );
    record.gameState = gameState;
    record.stateSnapshots = [
      snapshot,
      { ...snapshot, matchVersion: snapshot.matchVersion + 1 },
    ];

    await expect(storage.save(record)).resolves.toBeUndefined();

    const reopened = await storage.load(record.match.matchId);
    expect(
      reopened?.stateSnapshots.map((candidate) => candidate.snapshotId),
    ).toEqual(["snap_duplicate"]);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    expect(
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM state_snapshots WHERE match_id = ? AND snapshot_id = ?",
        )
        .get(record.match.matchId, "snap_duplicate"),
    ).toMatchObject({ count: 1 });
    db.close();
    storage.close();
  });

  it("keeps SQLite snapshot history when normal transitions load without full snapshots", async () => {
    const fixture = await storedMatchFixture("v108-partial-snapshot-load");
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const record = structuredClone(fixture.record) as StoredMatch;
    const gameState = createGameAfterSetup({
      matchId: record.match.matchId,
      seed: "v108-partial-snapshot-load",
    });
    record.gameState = gameState;
    record.stateSnapshots = [
      stateSnapshotForTest(
        record.match.matchId,
        gameState,
        record.match.matchVersion,
        "snap_one",
      ),
      {
        ...stateSnapshotForTest(
          record.match.matchId,
          gameState,
          record.match.matchVersion + 1,
          "snap_two",
        ),
        stateVersion: gameState.stateVersion + 1,
      },
    ];
    await storage.save(record);

    const partial = await storage.load(record.match.matchId, {
      includeStateSnapshots: false,
    });
    expect(partial?.stateSnapshots).toEqual([]);
    if (!partial) throw new Error("Missing partial match");
    partial.stateSnapshots.push({
      ...stateSnapshotForTest(
        record.match.matchId,
        gameState,
        record.match.matchVersion + 2,
        "snap_three",
      ),
      stateVersion: gameState.stateVersion + 2,
    });
    await storage.save(partial);

    const reopened = await storage.load(record.match.matchId);
    expect(
      reopened?.stateSnapshots.map((candidate) => candidate.snapshotId),
    ).toEqual(["snap_one", "snap_two", "snap_three"]);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const sizes = db
      .prepare(
        `SELECT
          (SELECT LENGTH(record_json) FROM matches WHERE match_id = ?) AS recordBytes,
          (SELECT COALESCE(SUM(LENGTH(game_state_json)), 0) FROM state_snapshots WHERE match_id = ?) AS snapshotBytes`,
      )
      .get(record.match.matchId, record.match.matchId) as {
      recordBytes: number;
      snapshotBytes: number;
    };
    expect(sizes.recordBytes).toBeLessThan(sizes.snapshotBytes);
    db.close();
    storage.close();
  });

  it("keeps private replay events while storing SQLite game states without embedded event history", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-sqlite-engine-events",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "v108-sqlite-engine-events",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    await forceSetupComplete(service, created.matchId);
    await submit(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      (action) => action.type === "mandatory_draw",
      "v108-sqlite-engine-events-mandatory",
    );

    const db = new DatabaseSync(dbPath, { readOnly: true });
    const stored = db
      .prepare(
        `SELECT
          (SELECT record_json FROM matches WHERE match_id = ?) AS recordJson,
          (SELECT game_state_json FROM game_states WHERE match_id = ?) AS gameStateJson,
          (SELECT COUNT(*) FROM engine_events WHERE match_id = ?) AS engineEventCount,
          (SELECT COUNT(*) FROM engine_events WHERE match_id = ? AND event_json LIKE '%privatePayload%') AS privateEngineEventCount,
          (SELECT COUNT(*) FROM state_snapshots WHERE match_id = ? AND game_state_json LIKE '%"eventLog":[{%') AS snapshotsWithEmbeddedEvents`,
      )
      .get(
        created.matchId,
        created.matchId,
        created.matchId,
        created.matchId,
        created.matchId,
      ) as {
      recordJson: string;
      gameStateJson: string;
      engineEventCount: number;
      privateEngineEventCount: number;
      snapshotsWithEmbeddedEvents: number;
    };
    expect(
      (JSON.parse(stored.recordJson) as StoredMatch).gameState.eventLog,
    ).toEqual([]);
    expect((JSON.parse(stored.gameStateJson) as GameState).eventLog).toEqual(
      [],
    );
    expect(Number(stored.engineEventCount)).toBeGreaterThan(1);
    expect(Number(stored.privateEngineEventCount)).toBeGreaterThan(0);
    expect(Number(stored.snapshotsWithEmbeddedEvents)).toBe(0);
    db.close();
    service.closeStorage();

    const reopenedStorage = new SqliteMatchStorage({ dbPath, backupDir });
    const replayService = new MultiplayerService(reopenedStorage, {
      tokenSalt: "v108-sqlite-engine-events",
    });
    const reopened = await reopenedStorage.load(created.matchId);
    expect(
      reopened?.gameState.eventLog.some((event) =>
        Boolean(event.privatePayload),
      ),
    ).toBe(true);
    expect(
      reopened?.stateSnapshots.some(
        (snapshot) => snapshot.gameState.eventLog.length > 0,
      ),
    ).toBe(true);
    const replay = await replayService.replayMatch(created.matchId);
    expect(replay.ok).toBe(true);
    replayService.closeStorage();
  });

  it("compacts SQLite snapshots without losing private replay events, partial loads or undo", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-sqlite-legacy-compaction",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "v108-sqlite-legacy-compaction",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    await forceSetupComplete(service, created.matchId);
    const beforeMandatory = await storage.load(created.matchId);
    if (!beforeMandatory) throw new Error("Missing pre-action SQLite match");
    const mandatory = await submit(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      (action) => action.type === "mandatory_draw",
      "v108-sqlite-legacy-compaction-mandatory",
    );

    const current = await storage.load(created.matchId);
    if (!current) throw new Error("Missing current SQLite match");
    const legacyRecord = structuredClone(current) as StoredMatch;
    const replayBaseSnapshot = stateSnapshotForTest(
      created.matchId,
      beforeMandatory.gameState,
      beforeMandatory.match.matchVersion,
      `snap_before_${mandatory.receipt.stateVersionAfter}`,
    );
    const lastSnapshot = stateSnapshotForTest(
      created.matchId,
      current.gameState,
      current.match.matchVersion,
      "legacy_embedded_eventlog_current",
    );
    legacyRecord.stateSnapshots = [replayBaseSnapshot, lastSnapshot];
    for (let index = 0; index < 3; index += 1) {
      legacyRecord.stateSnapshots.push({
        ...structuredClone(lastSnapshot),
        snapshotId: `legacy_embedded_eventlog_${index}`,
        createdAt: `2026-05-21T00:00:0${index}.000Z`,
      });
    }
    service.closeStorage();

    const db = new DatabaseSync(dbPath);
    try {
      db.prepare("UPDATE matches SET record_json = ? WHERE match_id = ?").run(
        JSON.stringify(legacyRecord),
        created.matchId,
      );
      db.prepare(
        "UPDATE game_states SET game_state_json = ? WHERE match_id = ?",
      ).run(JSON.stringify(legacyRecord.gameState), created.matchId);
      db.prepare("DELETE FROM state_snapshots WHERE match_id = ?").run(
        created.matchId,
      );
      const insertSnapshot = db.prepare(
        `INSERT INTO state_snapshots
          (match_id, snapshot_id, state_version, match_version, state_hash, game_state_json, created_at, hidden_info_barrier)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const snapshot of legacyRecord.stateSnapshots) {
        insertSnapshot.run(
          created.matchId,
          snapshot.snapshotId,
          snapshot.stateVersion,
          snapshot.matchVersion,
          snapshot.stateHash,
          JSON.stringify(snapshot.gameState),
          snapshot.createdAt,
          snapshot.hiddenInfoBarrier ? 1 : 0,
        );
      }
      const legacyStats = db
        .prepare(
          `SELECT
            (SELECT COUNT(*) FROM engine_events WHERE match_id = ?) AS engineEventCount,
            (SELECT COUNT(*) FROM state_snapshots WHERE match_id = ? AND game_state_json LIKE '%"eventLog":[{%') AS embeddedSnapshotCount,
            (SELECT LENGTH(game_state_json) FROM game_states WHERE match_id = ?) AS gameStateBytes`,
        )
        .get(created.matchId, created.matchId, created.matchId) as {
        engineEventCount: number;
        embeddedSnapshotCount: number;
        gameStateBytes: number;
      };
      expect(Number(legacyStats.engineEventCount)).toBeGreaterThan(0);
      expect(Number(legacyStats.embeddedSnapshotCount)).toBe(
        legacyRecord.stateSnapshots.length,
      );
      expect(Number(legacyStats.gameStateBytes)).toBeGreaterThan(10_000);
    } finally {
      db.close();
    }

    const reopenedStorage = new SqliteMatchStorage({ dbPath, backupDir });
    const reopenedService = new MultiplayerService(reopenedStorage, {
      tokenSalt: "v108-sqlite-legacy-compaction",
    });
    const maintenance = await authenticatedMaintenanceServer(reopenedService);
    try {
      const response = await maintenance.request(
        "/api/storage/maintenance/snapshot-compaction/apply",
        { method: "POST" },
        { sensitive: true },
      );
      const result = (await response.json()) as {
        backupCreated?: boolean;
        backup?: { backupId?: string; backupDir?: string };
        matchesScanned?: number;
        compactedMatchCount?: number;
        gameStateRowsCompacted?: number;
        stateSnapshotRowsCompacted?: number;
        integrityCheck?: string;
        database?: { beforePayloadBytes?: number; afterPayloadBytes?: number };
      };
      expect(response.status).toBe(200);
      expect(result.backupCreated).toBe(true);
      expect(result.backup?.backupId).toMatch(/^netgrid-storage-/);
      expect(result.backup?.backupDir).toContain(backupDir);
      expect(result.matchesScanned).toBe(1);
      expect(result.compactedMatchCount).toBe(1);
      expect(result.gameStateRowsCompacted).toBe(1);
      expect(result.stateSnapshotRowsCompacted).toBe(
        legacyRecord.stateSnapshots.length,
      );
      expect(result.integrityCheck).toBe("ok");
      expect(result.database?.afterPayloadBytes).toBeLessThan(
        result.database?.beforePayloadBytes ?? 0,
      );
      expect(JSON.stringify(result)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privatePayload|decklist|game_state_json/i,
      );

      const manifests = await listBackupManifests(backupDir);
      expect(manifests[0]).toMatchObject({ reason: "pre_compaction" });

      const rawDb = new DatabaseSync(dbPath, { readOnly: true });
      try {
        const stored = rawDb
          .prepare(
            `SELECT
              (SELECT record_json FROM matches WHERE match_id = ?) AS recordJson,
              (SELECT game_state_json FROM game_states WHERE match_id = ?) AS gameStateJson,
              (SELECT COUNT(*) FROM engine_events WHERE match_id = ?) AS engineEventCount,
              (SELECT COUNT(*) FROM engine_events WHERE match_id = ? AND event_json LIKE '%privatePayload%') AS privateEngineEventCount,
              (SELECT COUNT(*) FROM state_snapshots WHERE match_id = ? AND game_state_json LIKE '%"eventLog":[{%') AS snapshotsWithEmbeddedEvents`,
          )
          .get(
            created.matchId,
            created.matchId,
            created.matchId,
            created.matchId,
            created.matchId,
          ) as {
          recordJson: string;
          gameStateJson: string;
          engineEventCount: number;
          privateEngineEventCount: number;
          snapshotsWithEmbeddedEvents: number;
        };
        expect(
          (JSON.parse(stored.recordJson) as StoredMatch).gameState.eventLog,
        ).toEqual([]);
        expect(
          (JSON.parse(stored.recordJson) as StoredMatch).stateSnapshots,
        ).toEqual([]);
        expect(
          (JSON.parse(stored.gameStateJson) as GameState).eventLog,
        ).toEqual([]);
        expect(Number(stored.engineEventCount)).toBeGreaterThan(0);
        expect(Number(stored.privateEngineEventCount)).toBeGreaterThan(0);
        expect(Number(stored.snapshotsWithEmbeddedEvents)).toBe(0);
      } finally {
        rawDb.close();
      }

      const full = await reopenedStorage.load(created.matchId);
      expect(
        full?.gameState.eventLog.some((event) => Boolean(event.privatePayload)),
      ).toBe(true);
      expect(full?.stateSnapshots.length).toBe(
        legacyRecord.stateSnapshots.length,
      );
      expect(
        full?.stateSnapshots.some(
          (snapshot) => snapshot.gameState.eventLog.length > 0,
        ),
      ).toBe(true);
      const partial = await reopenedStorage.load(created.matchId, {
        includeStateSnapshots: false,
      });
      expect(partial?.stateSnapshots).toEqual([]);
      const replay = await reopenedService.replayMatch(created.matchId);
      if (!replay.ok) throw new Error(replay.errors.join("\n"));
      expect(replay.ok).toBe(true);

      const undo = await reopenedService.requestUndo({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        targetEventId: `evt_${mandatory.receipt.stateVersionAfter}`,
        reason: "Legacy compaction undo",
      });
      if (!undo.ok || !undo.undoRequest)
        throw new Error(`Expected undo request: ${JSON.stringify(undo)}`);
      expect(undo.ok).toBe(true);
      const accepted = await reopenedService.acceptUndo({
        matchId: created.matchId,
        side: "runner",
        sessionToken: joined.sessionToken,
        undoRequestId: undo.undoRequest.undoRequestId,
      });
      expect(accepted.ok).toBe(true);
      if (!accepted.ok) throw new Error(accepted.error.message);
      expect(accepted.requesterPayload.playerView.stateVersion).toBe(0);
    } finally {
      await maintenance.handle.close();
    }
  });

  it("writes only appended SQLite events and truncates public and private event tails on undo", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-sqlite-incremental-events",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "v108-sqlite-incremental-events",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    await forceSetupComplete(service, created.matchId);
    await submit(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      (action) => action.type === "mandatory_draw",
      "v108-sqlite-incremental-mandatory",
    );

    const auditDb = new DatabaseSync(dbPath);
    const auditCounts = (): Record<string, number> =>
      Object.fromEntries(
        (
          auditDb
            .prepare(
              "SELECT table_name || ':' || op AS key, COUNT(*) AS count FROM event_write_audit GROUP BY key ORDER BY key",
            )
            .all() as Array<{ key: string; count: number }>
        ).map((row) => [row.key, Number(row.count)]),
      );
    const clearAudit = (): void => {
      auditDb.prepare("DELETE FROM event_write_audit").run();
    };
    try {
      auditDb.exec(`
        CREATE TABLE event_write_audit (table_name TEXT NOT NULL, op TEXT NOT NULL, event_id TEXT NOT NULL);
        CREATE TRIGGER audit_events_insert AFTER INSERT ON events BEGIN INSERT INTO event_write_audit VALUES ('events', 'insert', NEW.event_id); END;
        CREATE TRIGGER audit_events_update AFTER UPDATE ON events BEGIN INSERT INTO event_write_audit VALUES ('events', 'update', NEW.event_id); END;
        CREATE TRIGGER audit_events_delete AFTER DELETE ON events BEGIN INSERT INTO event_write_audit VALUES ('events', 'delete', OLD.event_id); END;
        CREATE TRIGGER audit_engine_events_insert AFTER INSERT ON engine_events BEGIN INSERT INTO event_write_audit VALUES ('engine_events', 'insert', NEW.event_id); END;
        CREATE TRIGGER audit_engine_events_update AFTER UPDATE ON engine_events BEGIN INSERT INTO event_write_audit VALUES ('engine_events', 'update', NEW.event_id); END;
        CREATE TRIGGER audit_engine_events_delete AFTER DELETE ON engine_events BEGIN INSERT INTO event_write_audit VALUES ('engine_events', 'delete', OLD.event_id); END;
        CREATE TRIGGER audit_action_receipts_insert AFTER INSERT ON action_receipts BEGIN INSERT INTO event_write_audit VALUES ('action_receipts', 'insert', NEW.idempotency_key); END;
        CREATE TRIGGER audit_action_receipts_update AFTER UPDATE ON action_receipts BEGIN INSERT INTO event_write_audit VALUES ('action_receipts', 'update', NEW.idempotency_key); END;
        CREATE TRIGGER audit_action_receipts_delete AFTER DELETE ON action_receipts BEGIN INSERT INTO event_write_audit VALUES ('action_receipts', 'delete', OLD.idempotency_key); END;
      `);
      clearAudit();

      const loaded = await storage.load(created.matchId);
      if (!loaded) throw new Error("Missing loaded SQLite match");
      await storage.save(loaded);
      expect(auditCounts()).toEqual({});

      clearAudit();
      const credit = await submit(
        service,
        created.matchId,
        {
          side: "corp",
          sessionToken: created.hostSessionToken,
          reconnectToken: created.hostReconnectToken,
        },
        (action) => action.type === "gain_credit",
        "v108-sqlite-incremental-credit",
      );
      expect(auditCounts()).toEqual({
        "action_receipts:insert": 1,
        "engine_events:insert": 1,
        "events:insert": 1,
      });

      clearAudit();
      const undo = await service.requestUndo({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        targetEventId: `evt_${credit.receipt.stateVersionAfter}`,
        reason: "Incremental event write regression",
      });
      expect(undo.ok).toBe(true);
      if (!undo.ok || !undo.undoRequest)
        throw new Error("Expected undo request");
      expect(auditCounts()).toEqual({});

      clearAudit();
      const accepted = await service.acceptUndo({
        matchId: created.matchId,
        side: "runner",
        sessionToken: joined.sessionToken,
        undoRequestId: undo.undoRequest.undoRequestId,
      });
      expect(accepted.ok).toBe(true);
      if (!accepted.ok) throw new Error(accepted.error.message);
      expect(auditCounts()).toEqual({
        "action_receipts:delete": 1,
        "engine_events:delete": 1,
        "events:delete": 1,
      });
      expect((await service.replayMatch(created.matchId)).ok).toBe(true);

      const queryPlan = (sql: string): string =>
        (
          auditDb
            .prepare(`EXPLAIN QUERY PLAN ${sql}`)
            .all(created.matchId) as Array<{ detail: string }>
        )
          .map((row) => row.detail)
          .join("\n");
      expect(
        queryPlan(
          "SELECT event_id FROM events WHERE match_id = ? ORDER BY event_index ASC",
        ),
      ).toContain("idx_events_match_event_index");
      expect(
        queryPlan(
          "SELECT event_id FROM engine_events WHERE match_id = ? ORDER BY event_index ASC",
        ),
      ).toContain("idx_engine_events_match_event_index");
      expect(
        queryPlan(
          "SELECT snapshot_id FROM state_snapshots WHERE match_id = ? ORDER BY state_version ASC",
        ),
      ).toContain("idx_state_snapshots_match_state");
    } finally {
      auditDb.close();
      service.closeStorage();
    }
  });

  it("keeps long-match SQLite records and snapshots free of embedded event history", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-long-match-guardrail",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "v108-long-match-guardrail",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    const corp = {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    };
    const runner = {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    };
    await forceSetupComplete(service, created.matchId);

    for (let turn = 0; turn < 2; turn += 1) {
      await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "mandatory_draw",
        `guardrail-corp-mandatory-${turn}`,
      );
      await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "gain_credit",
        `guardrail-corp-credit-a-${turn}`,
      );
      await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "gain_credit",
        `guardrail-corp-credit-b-${turn}`,
      );
      await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "end_turn",
        `guardrail-corp-end-${turn}`,
      );
      await resolveCorpDiscardIfPending(
        service,
        created.matchId,
        corp,
        `guardrail-corp-discard-${turn}`,
      );
      await submit(
        service,
        created.matchId,
        runner,
        (action) => action.type === "gain_credit",
        `guardrail-runner-credit-a-${turn}`,
      );
      await submit(
        service,
        created.matchId,
        runner,
        (action) => action.type === "gain_credit",
        `guardrail-runner-credit-b-${turn}`,
      );
      await submit(
        service,
        created.matchId,
        runner,
        (action) => action.type === "end_turn",
        `guardrail-runner-end-${turn}`,
      );
    }

    const hydrated = await storage.load(created.matchId);
    if (!hydrated) throw new Error("Missing hydrated long-match record");
    expect(hydrated.gameState.eventLog.length).toBeGreaterThan(12);
    expect((await service.replayMatch(created.matchId)).ok).toBe(true);

    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const stored = db
        .prepare(
          `SELECT
            (SELECT LENGTH(record_json) FROM matches WHERE match_id = ?) AS recordBytes,
            (SELECT LENGTH(game_state_json) FROM game_states WHERE match_id = ?) AS gameStateBytes,
            (SELECT COALESCE(MAX(LENGTH(game_state_json)), 0) FROM state_snapshots WHERE match_id = ?) AS maxSnapshotBytes,
            (SELECT COUNT(*) FROM state_snapshots WHERE match_id = ? AND game_state_json LIKE '%"eventLog":[{%') AS snapshotsWithEmbeddedEvents,
            (SELECT COUNT(*) FROM engine_events WHERE match_id = ?) AS engineEventCount`,
        )
        .get(
          created.matchId,
          created.matchId,
          created.matchId,
          created.matchId,
          created.matchId,
        ) as {
        recordBytes: number;
        gameStateBytes: number;
        maxSnapshotBytes: number;
        snapshotsWithEmbeddedEvents: number;
        engineEventCount: number;
      };
      const hydratedRecordBytes = JSON.stringify(hydrated).length;
      const hydratedGameStateBytes = JSON.stringify(hydrated.gameState).length;
      const hydratedMaxSnapshotBytes = Math.max(
        ...hydrated.stateSnapshots.map(
          (snapshot) => JSON.stringify(snapshot.gameState).length,
        ),
      );
      expect(Number(stored.engineEventCount)).toBe(
        hydrated.gameState.eventLog.length,
      );
      expect(Number(stored.snapshotsWithEmbeddedEvents)).toBe(0);
      expect(Number(stored.recordBytes)).toBeLessThan(hydratedRecordBytes / 2);
      expect(Number(stored.gameStateBytes)).toBeLessThan(
        hydratedGameStateBytes,
      );
      expect(Number(stored.maxSnapshotBytes)).toBeLessThan(
        hydratedMaxSnapshotBytes,
      );
    } finally {
      db.close();
      service.closeStorage();
    }
  });

  it("rejects newer schema versions and corrupted SQLite files with side-safe errors", async () => {
    const dir = await tempStorageDir();
    const newerPath = join(dir, "newer.sqlite");
    const newer = new DatabaseSync(newerPath);
    newer.exec(
      "CREATE TABLE storage_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)",
    );
    newer
      .prepare(
        "INSERT INTO storage_meta (key, value, updated_at) VALUES ('schema_version', '999', '2026-05-06T00:00:00.000Z')",
      )
      .run();
    newer.close();

    expect(
      () =>
        new SqliteMatchStorage({
          dbPath: newerPath,
          backupDir: join(dir, "backups"),
        }),
    ).toThrow(/neuer/);
    const corruptPath = join(dir, "corrupt.sqlite");
    await writeFile(corruptPath, "das ist keine sqlite datei", "utf8");
    expect(
      () =>
        new SqliteMatchStorage({
          dbPath: corruptPath,
          backupDir: join(dir, "backups"),
        }),
    ).toThrow(/Backup/);
  });

  it("creates validated backups and restores them after a pre-restore backup", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-backup-restore",
    });
    const first = await service.createMatch({
      hostSide: "runner",
      seed: "v108-backup-first",
    });
    const backup = await service.backupStorageForTest("manual");
    expect(backup.manifest.backupId).toMatch(/^netgrid-storage-/);
    expect(backup.manifest.files.map((file) => file.name)).toContain(
      "netgrid.sqlite",
    );
    const second = await service.createMatch({
      hostSide: "corp",
      seed: "v108-backup-second",
    });
    expect(
      (await storage.list()).map((record) => record.match.matchId),
    ).toEqual([first.matchId, second.matchId]);
    service.closeStorage();

    const restored = restoreSqliteStorageBackup({
      backupDir: backup.backupDir,
      targetPath: dbPath,
      backupRootDir: backupDir,
    });
    expect(restored.preRestoreBackupDir).toBeTruthy();
    const reopened = new SqliteMatchStorage({ dbPath, backupDir });
    expect(
      (await reopened.list()).map((record) => record.match.matchId),
    ).toEqual([first.matchId]);
    const health = inspectSqliteStorage(dbPath);
    expect(health).toMatchObject({
      kind: "sqlite",
      schemaVersion: 3,
      matchCount: 1,
    });
    const manifestText = await readFile(
      join(backup.backupDir, "manifest.json"),
      "utf8",
    );
    expect(manifestText).not.toMatch(
      /sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|decklist/i,
    );
    reopened.close();
  });

  it("creates compact backups and safely optimizes historical SQLite payloads", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-storage-optimize",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "v108-storage-optimize",
    });

    const setupDb = new DatabaseSync(dbPath);
    try {
      const legacyDebug = JSON.stringify({
        schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
        aiLevel: 2,
        summary: "legacy duplicate",
      });
      const updated = setupDb
        .prepare(
          `UPDATE events
           SET public_payload_json = json_set(public_payload_json, '$.publicPayload.aiDecisionDebug', json(?))
           WHERE event_id = (SELECT event_id FROM events WHERE match_id = ? ORDER BY event_index ASC LIMIT 1)`,
        )
        .run(legacyDebug, created.matchId);
      expect(Number(updated.changes)).toBe(1);

      setupDb.exec("CREATE TABLE optimize_padding (payload TEXT NOT NULL)");
      const insertPadding = setupDb.prepare(
        "INSERT INTO optimize_padding (payload) VALUES (?)",
      );
      const padding = "x".repeat(16 * 1024);
      for (let index = 0; index < 320; index += 1) insertPadding.run(padding);
      setupDb.exec("DROP TABLE optimize_padding");
      const freelist = setupDb.prepare("PRAGMA freelist_count").get() as {
        freelist_count: number;
      };
      expect(Number(freelist.freelist_count)).toBeGreaterThan(0);
    } finally {
      setupDb.close();
    }

    const beforeBytes = (await stat(dbPath)).size;
    const result = await service.storageMaintenanceOptimize();
    expect(result).toBeDefined();
    if (!result) throw new Error("Missing SQLite optimize result");
    expect(result).toMatchObject({
      backupCreated: true,
      normalizedAiDebugEventRows: 1,
      integrityCheck: "ok",
      database: { beforeBytes, freelistPagesAfter: 0 },
    });
    expect(result.database.afterBytes).toBeLessThan(
      result.database.beforeBytes,
    );
    expect(result.database.reclaimedBytes).toBe(
      result.database.beforeBytes - result.database.afterBytes,
    );

    const manifest = JSON.parse(
      await readFile(join(result.backup.backupDir, "manifest.json"), "utf8"),
    ) as { reason?: string; files: Array<{ name: string; sizeBytes: number }> };
    expect(manifest.reason).toBe("pre_optimization");
    expect(
      manifest.files.find((file) => file.name === "netgrid.sqlite")?.sizeBytes,
    ).toBeLessThan(beforeBytes);

    const optimizedDb = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const row = optimizedDb
        .prepare(
          "SELECT COUNT(*) AS count FROM events WHERE json_type(public_payload_json, '$.publicPayload.aiDecisionDebug') IS NOT NULL",
        )
        .get() as { count: number };
      expect(Number(row.count)).toBe(0);
      expect(
        (
          optimizedDb.prepare("PRAGMA integrity_check").get() as {
            integrity_check: string;
          }
        ).integrity_check,
      ).toBe("ok");
    } finally {
      optimizedDb.close();
      service.closeStorage();
    }

    const restoredPath = join(dir, "restored.sqlite");
    restoreSqliteStorageBackup({
      backupDir: result.backup.backupDir,
      targetPath: restoredPath,
      backupRootDir: backupDir,
    });
    expect(inspectSqliteStorage(restoredPath)).toMatchObject({
      kind: "sqlite",
      schemaVersion: 3,
      matchCount: 1,
    });
    const restoredDb = new DatabaseSync(restoredPath, { readOnly: true });
    try {
      const restoredLegacyRows = restoredDb
        .prepare(
          "SELECT COUNT(*) AS count FROM events WHERE json_type(public_payload_json, '$.publicPayload.aiDecisionDebug') IS NOT NULL",
        )
        .get() as { count: number };
      expect(Number(restoredLegacyRows.count)).toBe(1);
    } finally {
      restoredDb.close();
    }
  });

  it("rejects manipulated backups before restore", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-bad-backup",
    });
    await service.createMatch({ hostSide: "runner", seed: "v108-bad-backup" });
    const backup = await service.backupStorageForTest("manual");
    service.closeStorage();
    await writeFile(
      join(backup.backupDir, "netgrid.sqlite"),
      "tampered",
      "utf8",
    );
    expect(() =>
      restoreSqliteStorageBackup({
        backupDir: backup.backupDir,
        targetPath: dbPath,
        backupRootDir: backupDir,
      }),
    ).toThrow(/Prüfsumme/);
  });

  it("does not return a successful action when persistence fails", async () => {
    const storage = new FailingStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-persist-failure",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "v108-persist-failure",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Corp",
    });
    expect("error" in joined).toBe(false);
    const activeSide =
      (await service.loadForTest(created.matchId))?.gameState.activeSide ??
      "runner";
    const sessionToken =
      activeSide === "runner"
        ? created.hostSessionToken
        : "error" in joined
          ? ""
          : joined.sessionToken;
    const payload = await service.bootstrap(
      created.matchId,
      activeSide,
      sessionToken,
    );
    if ("error" in payload) throw new Error(payload.error.message);
    const action = payload.legalActions[0];
    if (!action) throw new Error("Missing legal action");
    storage.resetCounters();
    storage.failNextSave = true;
    await expect(
      service.submitAction({
        matchId: created.matchId,
        side: activeSide,
        sessionToken,
        actionId: action.actionId,
        clientKnownStateVersion: payload.playerView.stateVersion,
        idempotencyKey: "persist-fails",
      }),
    ).rejects.toThrow("forced_storage_failure");
    expect(storage.loadCount).toBe(1);
    expect(storage.saveCount).toBe(1);
  });

  it("uses the optional action delta capability and notifies observers after persistence", async () => {
    const order: string[] = [];
    const storage = new ActionDeltaTrackingStorage(order);
    const service = new MultiplayerService(storage, {
      tokenSalt: "v108-action-delta-capability",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "v108-action-delta-capability",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Corp",
    });
    if ("error" in joined) throw new Error(joined.error.message);
    await forceSetupComplete(service, created.matchId);
    const activeSide =
      (await service.loadForTest(created.matchId))?.gameState.activeSide ??
      "runner";
    const sessionToken =
      activeSide === "runner" ? created.hostSessionToken : joined.sessionToken;
    const payload = await service.bootstrap(
      created.matchId,
      activeSide,
      sessionToken,
    );
    if ("error" in payload) throw new Error(payload.error.message);
    const action = payload.legalActions[0];
    if (!action) throw new Error("Missing legal action");
    storage.resetCounters();
    service.addPersistenceObserver(async () => {
      order.push("observer");
    });

    const result = await service.submitAction({
      matchId: created.matchId,
      side: activeSide,
      sessionToken,
      actionId: action.actionId,
      clientKnownStateVersion: payload.playerView.stateVersion,
      idempotencyKey: "delta-capability",
    });

    if (!result.ok)
      throw new Error(
        `Unexpected delta capability result: ${JSON.stringify(result.error)}`,
      );
    expect(result.ok).toBe(true);
    expect(storage.actionLoadCount).toBe(1);
    expect(storage.deltaSaveCount).toBe(1);
    expect(storage.fullSaveCount).toBe(0);
    expect(order).toEqual(["delta-save", "observer"]);
  });
});

describe("MVP 0.2 multiplayer service", () => {
  it("starts V0.6 matches from validated immutable deck snapshots without exposing opponent decklists", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "deck-v06-service",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "deck-v06-match",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
        corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
        corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6",
      },
    });
    const stored = await service.loadForTest(created.matchId);

    expect(created.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(created.playerView.deckMetadata?.own.deckHash).toBe(
      "fnv1a:b6bc479a",
    );
    expect(created.playerView.deckMetadata?.opponent.deckHash).toBe(
      "fnv1a:d77d0873",
    );
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_004_snapshot_v0_6",
    );
    expect(stored?.match.settings.agendaPointsToWin).toBe(7);
    expect(stored?.match.settings.matchFormat).toBe("rules_match");
    expect(JSON.stringify(stored?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(created)).not.toContain("simple_priority_agenda");
    expect(JSON.stringify(created)).not.toContain("cardInstances");

    const invalidSnapshot = structuredClone(
      snapshotsData.snapshots.find(
        (snapshot) =>
          snapshot.deckSnapshotId === "demo_runner_004_snapshot_v0_6",
      ),
    ) as DeckSnapshot | undefined;
    if (!invalidSnapshot) throw new Error("Missing runner snapshot");
    invalidSnapshot.cards.push({
      cardId: "catalog_preview_resource_001",
      quantity: 1,
    });
    await expect(
      service.createMatch({
        hostSide: "runner",
        seed: "deck-v06-invalid",
        participantADecks: {
          runnerDeckSnapshot: invalidSnapshot,
          corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6",
        },
        participantBDecks: {
          runnerDeckSnapshot: invalidSnapshot,
          corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6",
        },
      }),
    ).rejects.toThrow("deck_snapshot_invalid");
  });

  it("starts private local O:NR matches from the shared runtime card pool when the overlay is present", async () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_015_codeslinger"]) return;
    expect(
      cardsById["onr_v1_079_bodyweight-synthetic-blood"]?.statuses.deck_legal,
    ).toBe(true);
    expect(cardsById["onr_v1_006_black-dahlia"]?.statuses.deck_legal).toBe(
      true,
    );
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.deck_legal).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.ai_supported).toBe(
      true,
    );

    const profile = (profilesData08.profiles as DeckFormatProfile[]).find(
      (candidate) => candidate.profileId === "local-demo-v0.8",
    );
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
        { cardId: "simple_economy_event", quantity: 2 },
      ],
      createdAt: now,
      updatedAt: now,
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
        { cardId: "simple_economy_operation", quantity: 2 },
      ],
      createdAt: now,
      updatedAt: now,
    };
    const runnerSnapshot = createDeckSnapshot(runnerDeck, context, {
      snapshotId: "local_onr_runner_match_smoke_snapshot",
      rulesBaselineId: "rules-baseline-mvp-0.94",
    });
    const corpSnapshot = createDeckSnapshot(corpDeck, context, {
      snapshotId: "local_onr_corp_match_smoke_snapshot",
      rulesBaselineId: "rules-baseline-mvp-0.94",
    });
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "onr-local-deck-service",
    });

    expect(runnerSnapshot.validation.ok).toBe(true);
    expect(corpSnapshot.validation.ok).toBe(true);

    const created = await service.createMatch({
      hostSide: "runner",
      seed: "onr-local-server-match",
      participantADecks: {
        runnerDeckSnapshot: runnerSnapshot,
        corpDeckSnapshot: corpSnapshot,
      },
      participantBDecks: {
        runnerDeckSnapshot: runnerSnapshot,
        corpDeckSnapshot: corpSnapshot,
      },
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" },
    });
    const stored = await service.loadForTest(created.matchId);

    expect(created.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(created.playerView.deckMetadata?.own.deckName).toBe(
      "O:NR Runner Match Smoke",
    );
    expect(created.playerView.deckMetadata?.opponent.deckName).toBe(
      "O:NR Corp Match Smoke",
    );
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe(
      "local_onr_runner_match_smoke_snapshot",
    );
    expect(stored?.match.deckSetup.corpSnapshotId).toBe(
      "local_onr_corp_match_smoke_snapshot",
    );
    expect(JSON.stringify(stored?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(created)).not.toContain(
      "onr_v1_203_hostile-takeover",
    );
    expect(JSON.stringify(created)).not.toContain("cardInstances");

    expect(created.joinUrl).toBeTruthy();
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing O:NR join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "O:NR Corp",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    expect(joined.playerView.deckMetadata?.own.deckName).toBe(
      "O:NR Corp Match Smoke",
    );
    expect(JSON.stringify(joined)).not.toContain("onr_v1_015_codeslinger");
    expect(JSON.stringify(joined)).not.toContain("cardInstances");

    const aiCreated = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "onr-local-ai-match",
      participantADecks: {
        runnerDeckSnapshot: runnerSnapshot,
        corpDeckSnapshot: corpSnapshot,
      },
      participantBDecks: {
        runnerDeckSnapshot: runnerSnapshot,
        corpDeckSnapshot: corpSnapshot,
      },
      aiDeckPolicy: "selected",
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" },
    });
    expect(aiCreated.mode).toBe("human_runner_vs_corp_ai");
    expect(aiCreated.playerView.deckMetadata?.own.deckName).toBe(
      "O:NR Runner Match Smoke",
    );
    expect(aiCreated.playerView.deckMetadata?.opponent.deckName).toBe(
      "O:NR Corp Match Smoke",
    );
    expect(JSON.stringify(aiCreated)).not.toContain("cardInstances");
  });

  it("V1.9.9 card release matchstart", async () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]) return;

    expect(
      cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]?.statuses
        .human_playable,
    ).toBe(true);
    expect(cardsById["onr_v1_007_blink"]?.statuses.human_playable).toBe(true);
    expect(
      cardsById["onr_v1_115_terrorist-reprisal"]?.statuses.human_playable,
    ).toBe(true);
    expect(cardsById["onr_v1_223_banpei"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_275_vacuum-link"]?.statuses.human_playable).toBe(
      true,
    );
    expect(
      cardsById["onr_v1_005_bartmoss-memorial-icebreaker"]?.statuses
        .ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_013_cockroach"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_034_incubator"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_030_grubb"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_013_cockroach"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_034_incubator"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_030_grubb"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_076_all-nighter"]?.statuses.human_playable).toBe(
      true,
    );
    expect(
      cardsById["onr_v1_096_kilroy-was-here"]?.statuses.human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_107_romp-through-hq"]?.statuses.human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_184_top-runners-conference"]?.statuses.human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_188_ai-chief-financial-officer"]?.statuses
        .human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_211_polymer-breakthrough"]?.statuses.human_playable,
    ).toBe(true);
    expect(cardsById["onr_v1_235_data-naga"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_076_all-nighter"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_096_kilroy-was-here"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_107_romp-through-hq"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(
      cardsById["onr_v1_184_top-runners-conference"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_188_ai-chief-financial-officer"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_211_polymer-breakthrough"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_235_data-naga"]?.statuses.ai_supported).toBe(true);
    expect(
      cardsById["onr_v1_207_netwatch-operations-office"]?.statuses
        .human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_213_private-cybernet-police"]?.statuses.human_playable,
    ).toBe(true);
    expect(cardsById["onr_v1_251_jack-attack"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_271_tko-2-0"]?.statuses.human_playable).toBe(true);
    expect(
      cardsById["onr_v1_207_netwatch-operations-office"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_213_private-cybernet-police"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_251_jack-attack"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_271_tko-2-0"]?.statuses.ai_supported).toBe(true);
    expect(
      cardsById["onr_v1_208_on-call-solo-team"]?.statuses.human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_217_strike-force-kali"]?.statuses.human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_208_on-call-solo-team"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_217_strike-force-kali"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_219_superior-net-barriers"]?.statuses.human_playable,
    ).toBe(true);
    expect(
      cardsById["onr_v1_308_acme-savings-and-loan"]?.statuses.human_playable,
    ).toBe(true);
    expect(cardsById["onr_v1_236_data-raven"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_001_afreet"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_019_dropp"]?.statuses.human_playable).toBe(true);
    expect(
      cardsById["onr_v1_219_superior-net-barriers"]?.statuses.ai_supported,
    ).toBe(true);
    expect(
      cardsById["onr_v1_308_acme-savings-and-loan"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_236_data-raven"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_001_afreet"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_018_dogcatcher"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_019_dropp"]?.statuses.ai_supported).toBe(true);
    expect(cardsById["onr_v1_349_aardvark"]?.statuses.human_playable).toBe(
      true,
    );
    expect(
      cardsById["onr_v1_351_bizarre-encryption-scheme"]?.statuses
        .human_playable,
    ).toBe(true);
    expect(cardsById["onr_v1_352_chester-mix"]?.statuses.human_playable).toBe(
      true,
    );
    expect(cardsById["onr_v1_353_chimera"]?.statuses.human_playable).toBe(true);
    expect(cardsById["onr_v1_349_aardvark"]?.statuses.ai_supported).toBe(true);
    expect(
      cardsById["onr_v1_351_bizarre-encryption-scheme"]?.statuses.ai_supported,
    ).toBe(true);
    expect(cardsById["onr_v1_352_chester-mix"]?.statuses.ai_supported).toBe(
      true,
    );
    expect(cardsById["onr_v1_353_chimera"]?.statuses.ai_supported).toBe(true);
  });

  it("creates private matches with hashed tokens and side-filtered bootstrap payloads", async () => {
    const { service, created, runner, matchId, joinToken } =
      await joinedMatch();
    const stored = await service.loadForTest(matchId);

    expect(stored?.match.status).toBe("active");
    expect(stored?.match.baseline.multiplayerSchemaVersion).toBe("0.99.0");
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_008_snapshot_v0_8",
    );
    expect(stored?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_008_snapshot_v0_8",
    );
    expect(
      stored?.tokens.every((token) => token.tokenHash.startsWith("sha256:")),
    ).toBe(true);
    expect(created.hostSessionToken.length).toBeGreaterThanOrEqual(32);
    expect(created.hostReconnectToken.length).toBeGreaterThanOrEqual(32);
    expect(joinToken.length).toBeGreaterThanOrEqual(32);
    const serializedStorage = JSON.stringify(stored);
    expect(serializedStorage).not.toContain(created.hostSessionToken);
    expect(serializedStorage).not.toContain(created.hostReconnectToken);
    expect(serializedStorage).not.toContain(joinToken);

    const bootstrap = await service.bootstrap(
      matchId,
      runner.side,
      runner.sessionToken,
    );
    expect("error" in bootstrap).toBe(false);
    const payload = bootstrap as SidePayload;
    expect(payload.side).toBe("runner");
    expect(JSON.stringify(payload)).not.toContain("Simple Agenda");
    expect(JSON.stringify(created.playerView)).not.toContain(
      "Simple Economy Event",
    );

    const runnerHosted = await service.createMatch({
      hostSide: "runner",
      seed: "runner-host",
    });
    expect(runnerHosted.hostSide).toBe("runner");
    const randomHosted = await service.createMatch({
      hostSide: "random",
      seed: "random-host",
    });
    expect(["runner", "corp"]).toContain(randomHosted.hostSide);
    const invalidJoin = await service.joinMatch(runnerHosted.matchId, {
      token: "definitely-wrong",
    });
    expect("error" in invalidJoin).toBe(true);
    if (!("error" in invalidJoin))
      throw new Error("Expected invalid token rejection");
    expect(invalidJoin.error.message).not.toContain("runner");
    expect(invalidJoin.error.message).not.toContain("corp");
  });

  it("defaults new matches to public and preserves an explicit private choice", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "public-match-default",
    });
    const publicMatch = await service.createMatch({
      hostSide: "runner",
      seed: "public-match-default-true",
    });
    const privateMatch = await service.createMatch({
      hostSide: "corp",
      seed: "public-match-explicit-false",
      isPublic: false,
    });

    expect(publicMatch.isPublic).toBe(true);
    expect(privateMatch.isPublic).toBe(false);
    expect(
      (await service.loadForTest(publicMatch.matchId))?.match.isPublic,
    ).toBe(true);
    expect(
      (await service.loadForTest(privateMatch.matchId))?.match.isPublic,
    ).toBe(false);

    const recreated = await service.recreateMatch(privateMatch.matchId, {
      side: privateMatch.hostSide,
      sessionToken: privateMatch.hostSessionToken,
    });
    expect(recreated.ok).toBe(true);
    if (!recreated.ok || !recreated.newMatch)
      throw new Error("Expected recreated match");
    expect(recreated.newMatch.isPublic).toBe(false);
    expect(
      (await service.loadForTest(recreated.newMatch.matchId))?.match.isPublic,
    ).toBe(false);
  });

  it("V23A-T002 V23A-T003 V23A-T004 V23A-T005 lists only pending public matches with safe metadata", async () => {
    let now = "2026-05-10T12:00:00.000Z";
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "v23a-open-list",
      now: () => now,
    });
    const listed = await service.createMatch({
      hostSide: "runner",
      seed: "v23a-listed",
      mode: "human_vs_human",
      displayName: "Host A",
      isPublic: true,
    });
    await service.createMatch({
      hostSide: "runner",
      seed: "v23a-hidden",
      mode: "human_vs_human",
      displayName: "Hidden Host",
      isPublic: false,
    });
    const consumed = await service.createMatch({
      hostSide: "corp",
      seed: "v23a-consumed",
      mode: "human_vs_human",
      displayName: "Consumed Host",
      isPublic: true,
    });
    await service.createMatch({
      hostSide: "runner",
      seed: "v23a-ai",
      mode: "human_runner_vs_corp_ai",
      displayName: "AI Host",
      isPublic: true,
    });
    const consumedToken = new URL(consumed.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!consumedToken) throw new Error("Missing consumed join token");
    const consumedJoin = await service.joinMatch(consumed.matchId, {
      token: consumedToken,
      displayName: "Joiner",
    });
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
      ageSeconds: 90,
    });
    expect(Object.keys(open[0] ?? {}).sort()).toEqual([
      "ageSeconds",
      "createdAt",
      "hostDisplayName",
      "matchId",
      "mode",
      "status",
    ]);
    const serialized = JSON.stringify(open);
    expect(serialized).not.toMatch(
      /joinToken|sessionToken|reconnectToken|tokenHash|deckHash|deckSnapshot|privateDeck|cardInstances/i,
    );
  });

  it("V23A-T008 V23A-T009 exposes GET /api/matches/open and honors isPublic at create time", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "v23a-open-http",
    });
    const handle = createNetgridHttpServer(service);
    const baseUrl = await listen(handle);
    try {
      const visibleResponse = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hostSide: "runner",
          mode: "human_vs_human",
          seed: "v23a-http-visible",
        }),
      });
      const hiddenResponse = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hostSide: "runner",
          mode: "human_vs_human",
          seed: "v23a-http-hidden",
          isPublic: false,
        }),
      });
      expect(visibleResponse.status).toBe(201);
      expect(hiddenResponse.status).toBe(201);
      const visible = (await visibleResponse.json()) as { matchId: string };
      const hidden = (await hiddenResponse.json()) as { matchId: string };
      const openResponse = await fetch(`${baseUrl}/api/matches/open`);
      expect(openResponse.status).toBe(200);
      const openBody = (await openResponse.json()) as {
        matches?: Array<{ matchId: string }>;
      };
      const listedIds = (openBody.matches ?? []).map((entry) => entry.matchId);
      expect(listedIds).toContain(visible.matchId);
      expect(listedIds).not.toContain(hidden.matchId);
      const serialized = JSON.stringify(openBody);
      expect(serialized).not.toMatch(
        /joinToken|sessionToken|reconnectToken|tokenHash|deckHash|deckSnapshot|privateDeck|cardInstances/i,
      );
    } finally {
      await handle.close();
    }
  });

  it("lists public open, active and finished matches while excluding private matches", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "public-directory",
    });
    const open = await service.createMatch({
      hostSide: "runner",
      mode: "human_vs_human",
      displayName: "Offener Host",
      seed: "public-directory-open",
      isPublic: true,
      settings: {
        matchFormat: "two_game_side_swap",
        cardPool: "originalset_classic_proteus",
      },
    });
    const active = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      displayName: "Aktiver Runner",
      seed: "public-directory-active",
      isPublic: true,
    });
    const privateMatch = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "public-directory-private",
      isPublic: false,
    });
    const finished = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      displayName: "Fertige Corp",
      seed: "public-directory-finished",
      isPublic: true,
    });
    const finishedRecord = await storage.load(finished.matchId);
    if (!finishedRecord) throw new Error("Missing finished record");
    finishedRecord.match.status = "finished";
    finishedRecord.match.winner = "corp";
    finishedRecord.gameState.winner = "corp";
    await storage.save(finishedRecord);

    const entries = await service.listPublicMatches();

    expect(entries.map((entry) => entry.status)).toEqual([
      "open",
      "active",
      "finished",
    ]);
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          matchId: open.matchId,
          status: "open",
          hostDisplayName: "Offener Host",
          hostSide: "runner",
          availableSide: "corp",
          matchFormat: "two_game_side_swap",
          cardPool: "originalset_classic_proteus",
          seriesGamesPlanned: 2,
        }),
        expect.objectContaining({ matchId: active.matchId, status: "active" }),
        expect.objectContaining({
          matchId: finished.matchId,
          status: "finished",
          winner: "corp",
          result: expect.objectContaining({
            schemaVersion: "netgrid-match-result-v1",
            matchId: finished.matchId,
            winner: "corp",
          }),
        }),
      ]),
    );
    expect(
      (await storage.load(finished.matchId))?.resultSnapshot,
    ).toBeDefined();
    expect(
      entries.some((entry) => entry.matchId === privateMatch.matchId),
    ).toBe(false);
    expect(JSON.stringify(entries)).not.toMatch(
      /joinToken|sessionToken|reconnectToken|tokenHash|deckHash|deckSnapshot|privateDeck|cardInstances|legalActions/i,
    );
  });

  it("exposes only the safe public projection for active public spectators", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "public-spectator-http",
    });
    const publicMatch = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "public-spectator-visible",
      isPublic: true,
    });
    const privateMatch = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "public-spectator-hidden",
      isPublic: false,
    });
    const stored = await storage.load(publicMatch.matchId);
    if (!stored) throw new Error("Missing public spectator match");
    const hiddenCardId = stored.gameState.corp.hq[0];
    const hiddenDefinitionId = hiddenCardId
      ? stored.gameState.cardInstances[hiddenCardId]?.definitionId
      : undefined;
    const hiddenTitle = hiddenDefinitionId
      ? CARD_DEFINITIONS_BY_ID[hiddenDefinitionId]?.title
      : undefined;

    const handle = createNetgridHttpServer(service);
    const baseUrl = await listen(handle);
    try {
      const directoryResponse = await fetch(`${baseUrl}/api/public/matches`);
      expect(directoryResponse.status).toBe(200);
      const directoryText = await directoryResponse.text();
      expect(directoryText).toContain(publicMatch.matchId);
      expect(directoryText).not.toContain(privateMatch.matchId);

      const spectatorResponse = await fetch(
        `${baseUrl}/api/public/matches/${publicMatch.matchId}/spectator`,
      );
      expect(spectatorResponse.status).toBe(200);
      const spectatorText = await spectatorResponse.text();
      expect(spectatorText).toContain("SpectatorProjectionV1");
      expect(spectatorText).toContain("public_live_v1");
      expect(spectatorText).not.toMatch(
        /playerView|legalActions|pendingChoice|joinToken|sessionToken|reconnectToken|tokenHash|cardInstances|privateDeck/i,
      );
      if (hiddenDefinitionId)
        expect(spectatorText).not.toContain(hiddenDefinitionId);
      if (hiddenTitle) expect(spectatorText).not.toContain(hiddenTitle);

      const privateResponse = await fetch(
        `${baseUrl}/api/public/matches/${privateMatch.matchId}/spectator`,
      );
      expect(privateResponse.status).toBe(404);
    } finally {
      await handle.close();
    }
  });

  it("V23A-T011 V23A-T016 rejects stale tokenless LAN joins after status changes", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "v23a-race",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "v23a-race-match",
      mode: "human_vs_human",
      isPublic: true,
    });
    const initiallyListed = await service.listOpenMatches();
    expect(
      initiallyListed.some((entry) => entry.matchId === created.matchId),
    ).toBe(true);
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing race join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Teilnehmer B",
    });
    expect("error" in joined).toBe(false);
    const staleJoin = await service.joinMatch(created.matchId, {
      displayName: "Später Join",
    });
    expect("error" in staleJoin).toBe(true);
    if (!("error" in staleJoin))
      throw new Error("Expected stale join rejection");
    expect(staleJoin.error.message).not.toContain("runner");
    expect(staleJoin.error.message).not.toContain("corp");
    const listedAfter = await service.listOpenMatches();
    expect(listedAfter.some((entry) => entry.matchId === created.matchId)).toBe(
      false,
    );
    const stored = await service.loadForTest(created.matchId);
    expect(stored?.match.status).toBe("active");
    expect(stored?.sessions).toHaveLength(2);
  });

  it("V23A-T019 keeps open-list reads responsive in small LAN setups", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "v23a-performance",
    });
    for (let index = 0; index < 12; index += 1) {
      await service.createMatch({
        hostSide: index % 2 === 0 ? "runner" : "corp",
        seed: `v23a-perf-${index}`,
        mode: "human_vs_human",
        isPublic: index % 3 !== 0,
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
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "join-deck-handshake",
      now: () => now,
    });
    const created = await service.createMatch({
      hostSide: "random",
      seed: "join-deck-handshake",
      mode: "human_vs_human",
      countdownSeconds: 5,
      settings: { matchFormat: "single_game" },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6",
      },
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const pending = await service.loadForTest(created.matchId);

    expect(created.matchStatus).toBe("pending");
    expect(created.pendingDeckHandshake).toBe(true);
    expect(created.lobby?.hostReady).toBe(false);
    expect(created.lobby?.joinerReady).toBe(false);
    expect(created.lobby?.sideAssignmentMode).toBe("random_pending");
    expect(created.lobby?.participants.player_a.side).toBeUndefined();
    expect(created.lobby?.participants.player_b.side).toBeUndefined();
    expect(created.lobby?.participants.player_a.runnerDeckReady).toBe(true);
    expect(created.lobby?.participants.player_a.corpDeckReady).toBe(true);
    expect(created.lobby?.participants.player_b.connected).toBe(false);
    expect(created.lobby?.participants.player_b.runnerDeckReady).toBe(false);
    expect(created.lobby?.participants.player_b.corpDeckReady).toBe(false);
    expect(pending?.match.status).toBe("pending");
    expect(pending?.gameState).toBeFalsy();
    expect(JSON.stringify(pending?.match.deckSetup)).not.toContain("cards");
    expect(pending?.startLobby?.countdownSeconds).toBe(5);

    const missingDecks = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Joiner",
    });
    expect("error" in missingDecks).toBe(true);
    if (!("error" in missingDecks))
      throw new Error("Expected deck requirement error");
    expect(missingDecks.error.code).toBe("join_runner_deck_missing");

    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Joiner",
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
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
    expect(joined.lobby?.sideAssignmentMode).toBe("random_pending");
    expect(joined.lobby?.participants.player_a.side).toBeUndefined();
    expect(joined.lobby?.participants.player_b.side).toBeUndefined();
    expect(joined.lobby?.participants.player_a.runnerDeckReady).toBe(true);
    expect(joined.lobby?.participants.player_b.corpDeckReady).toBe(true);
    expect(JSON.stringify(joined.lobby)).not.toContain("deckName");
    expect(JSON.stringify(joined.lobby)).not.toContain("deckHash");
    expect(JSON.stringify(joined)).not.toContain("Simple Priority Agenda");
    expect(JSON.stringify(joined)).not.toContain("cardInstances");

    const chat = await service.sendLobbyChat({
      matchId: created.matchId,
      side: created.hostSide,
      sessionToken: created.hostSessionToken,
      text: "  Hallo zum Start <b>  ",
    });
    expect(chat.ok).toBe(true);
    if (!chat.ok) throw new Error(chat.error.message);
    expect(
      "startLobby" in chat.actorPayload
        ? chat.actorPayload.startLobby?.chatMessages.at(-1)?.text
        : "",
    ).toBe("Hallo zum Start <b>");
    expect(JSON.stringify(chat.actorPayload)).not.toContain("sessionToken");
    expect(JSON.stringify(chat.actorPayload)).not.toContain("deckHash");

    const hostReady = await service.setLobbyReady({
      matchId: created.matchId,
      side: created.hostSide,
      sessionToken: created.hostSessionToken,
      ready: true,
    });
    expect(hostReady.ok).toBe(true);
    if (!hostReady.ok) throw new Error(hostReady.error.message);
    const joinerReady = await service.setLobbyReady({
      matchId: created.matchId,
      side: joined.side,
      sessionToken: joined.sessionToken,
      ready: true,
    });
    expect(joinerReady.ok).toBe(true);
    if (!joinerReady.ok) throw new Error(joinerReady.error.message);
    expect(joinerReady.actorPayload.matchStatus).toBe("countdown");

    const countdown = await service.loadForTest(created.matchId);
    expect(countdown?.match.status).toBe("countdown");
    const cancelled = await service.cancelLobbyCountdown({
      matchId: created.matchId,
      side: joined.side,
      sessionToken: joined.sessionToken,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) throw new Error(cancelled.error.message);
    expect(cancelled.actorPayload.matchStatus).toBe("ready_check");
    const restarted = await service.setLobbyReady({
      matchId: created.matchId,
      side: joined.side,
      sessionToken: joined.sessionToken,
      ready: true,
    });
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
      sessionToken: pending.created.hostSessionToken,
    });
    expect(pendingCancel.ok).toBe(true);
    if (!pendingCancel.ok) throw new Error(pendingCancel.error.message);
    expect(pendingCancel.actorPayload.matchStatus).toBe("cancelled");
    expect(pendingCancel.actorPayload.lifecycleResult).toMatchObject({
      status: "cancelled",
      reason: "cancel",
      actorSide: pending.created.hostSide,
    });
    expectLifecyclePayloadSafe(pendingCancel.actorPayload);
    await expectOldTokensRejected(
      pending.service,
      pending.created.matchId,
      pending.created.hostSide,
      pending.created.hostSessionToken,
      pending.created.hostReconnectToken,
    );
    const pendingJoinAfterCancel = await pending.service.joinMatch(
      pending.created.matchId,
      { token: pending.joinToken },
    );
    expect("error" in pendingJoinAfterCancel).toBe(true);

    const ready = await readyLobby("v104-cancel-ready");
    const readyCancel = await ready.service.cancelMatch({
      matchId: ready.created.matchId,
      side: ready.created.hostSide,
      sessionToken: ready.created.hostSessionToken,
    });
    expect(readyCancel.ok).toBe(true);
    if (!readyCancel.ok) throw new Error(readyCancel.error.message);
    expect(readyCancel.actorPayload.matchStatus).toBe("cancelled");
    expect(readyCancel.opponentPayload?.matchStatus).toBe("cancelled");
    expect(
      (await ready.service.loadForTest(ready.created.matchId))?.gameState,
    ).toBeFalsy();
    await expectOldTokensRejected(
      ready.service,
      ready.created.matchId,
      ready.created.hostSide,
      ready.created.hostSessionToken,
      ready.created.hostReconnectToken,
    );
    await expectOldTokensRejected(
      ready.service,
      ready.created.matchId,
      ready.joined.side,
      ready.joined.sessionToken,
      ready.joined.reconnectToken,
    );

    const countdown = await countdownLobby("v104-cancel-countdown");
    const countdownCancel = await countdown.service.cancelMatch({
      matchId: countdown.created.matchId,
      side: countdown.created.hostSide,
      sessionToken: countdown.created.hostSessionToken,
    });
    expect(countdownCancel.ok).toBe(true);
    if (!countdownCancel.ok) throw new Error(countdownCancel.error.message);
    expect(countdownCancel.actorPayload.matchStatus).toBe("cancelled");
    expect(countdownCancel.opponentPayload?.matchStatus).toBe("cancelled");
    const activateAfterCancel = await countdown.service.activateLobbyCountdown(
      countdown.created.matchId,
    );
    expect(activateAfterCancel.ok).toBe(false);
    expect(
      (await countdown.service.loadForTest(countdown.created.matchId))
        ?.gameState,
    ).toBeFalsy();
  });

  it("keeps the host lobby open when the joiner leaves before game start", async () => {
    const pending = await pendingDeckMatch("v104-leave-pending");
    const noServerSessionLeave = await pending.service.leaveMatch({
      matchId: pending.created.matchId,
      side: otherSide(pending.created.hostSide),
      sessionToken: "",
    });
    expect(noServerSessionLeave.ok).toBe(false);
    expect(
      (await pending.service.loadForTest(pending.created.matchId))?.match
        .status,
    ).toBe("pending");

    const ready = await readyLobby("v104-leave-ready");
    const readyLeave = await ready.service.leaveMatch({
      matchId: ready.created.matchId,
      side: ready.joined.side,
      sessionToken: ready.joined.sessionToken,
    });
    expect(readyLeave.ok).toBe(true);
    if (!readyLeave.ok) throw new Error(readyLeave.error.message);
    expect(readyLeave.actorPayload.matchStatus).toBe("pending");
    expect(readyLeave.opponentPayload?.matchStatus).toBe("pending");
    if (
      !readyLeave.opponentPayload ||
      !("startLobby" in readyLeave.opponentPayload)
    )
      throw new Error("Expected host lobby payload");
    expect(
      readyLeave.opponentPayload.startLobby?.participants.player_b.connected,
    ).toBe(false);
    expect(readyLeave.opponentPayload.startLobby?.hostReady).toBe(false);
    expect(readyLeave.actorPayload.lifecycleResult).toBeUndefined();
    expectLifecyclePayloadSafe(readyLeave.actorPayload);
    await expectOldTokensRejected(
      ready.service,
      ready.created.matchId,
      ready.joined.side,
      ready.joined.sessionToken,
      ready.joined.reconnectToken,
    );
    const readyRejoin = await ready.service.joinMatch(ready.created.matchId, {
      token: ready.joinToken,
      displayName: "Joiner mit neuem Deck",
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
    });
    expect("error" in readyRejoin).toBe(false);
    if ("error" in readyRejoin) throw new Error(readyRejoin.error.message);
    expect(readyRejoin.matchStatus).toBe("ready_check");

    const countdown = await countdownLobby("v104-leave-countdown");
    const countdownLeave = await countdown.service.leaveMatch({
      matchId: countdown.created.matchId,
      side: countdown.joined.side,
      sessionToken: countdown.joined.sessionToken,
    });
    expect(countdownLeave.ok).toBe(true);
    if (!countdownLeave.ok) throw new Error(countdownLeave.error.message);
    expect(countdownLeave.actorPayload.matchStatus).toBe("pending");
    expect(countdownLeave.opponentPayload?.matchStatus).toBe("pending");
    if (
      !countdownLeave.opponentPayload ||
      !("startLobby" in countdownLeave.opponentPayload)
    )
      throw new Error("Expected host lobby payload");
    expect(
      countdownLeave.opponentPayload.startLobby?.countdownEndsAt,
    ).toBeUndefined();
    const activateAfterLeave = await countdown.service.activateLobbyCountdown(
      countdown.created.matchId,
    );
    expect(activateAfterLeave.ok).toBe(false);
    expect(
      (await countdown.service.loadForTest(countdown.created.matchId))
        ?.gameState,
    ).toBeFalsy();
  });

  it("exposes player-clock settings in start lobby payloads", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "player-clock-lobby",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:8787",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "player-clock-lobby",
      mode: "human_vs_human",
      settings: {
        playerClock: {
          mode: "player_clock",
          startingTimeMs: 20 * 60_000,
          gracePeriodMs: 15_000,
        },
      },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6",
      },
    });
    expect(created.playerClock).toMatchObject({
      schemaVersion: "player-clock-v1",
      mode: "player_clock",
      startingTimeMs: 20 * 60_000,
      gracePeriodMs: 15_000,
      warningLevel: "none",
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Joiner",
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    expect(joined.playerClock).toMatchObject({
      mode: "player_clock",
      startingTimeMs: 20 * 60_000,
      gracePeriodMs: 15_000,
      warningLevel: "none",
    });
    expect(JSON.stringify(joined.playerClock)).not.toMatch(
      /cardInstances|privatePayload|decklist|AIInput|DecisionDebug|FullState/i,
    );
  });

  it("records V1.0.4 forfeit without faking an Engine win or changing replay StateHash", async () => {
    const runnerMatch = await joinedMatch("v104-forfeit-runner");
    const runnerBefore = await runnerMatch.service.loadForTest(
      runnerMatch.matchId,
    );
    if (!runnerBefore?.gameState)
      throw new Error("Missing runner forfeit state");
    const runnerHash = hashState(runnerBefore.gameState);
    const runnerForfeit = await runnerMatch.service.forfeitMatch({
      matchId: runnerMatch.matchId,
      side: "runner",
      sessionToken: runnerMatch.runner.sessionToken,
    });
    expect(runnerForfeit.ok).toBe(true);
    if (!runnerForfeit.ok) throw new Error(runnerForfeit.error.message);
    const runnerForfeitPayload = expectSidePayload(runnerForfeit.actorPayload);
    expect(runnerForfeitPayload.matchStatus).toBe("forfeited");
    expect(runnerForfeitPayload.resultSummary).toMatchObject({
      reason: "forfeit",
      winner: "corp",
      winnerSide: "corp",
      loserSide: "runner",
      finalEngineStateHash: runnerHash,
    });
    expect(runnerForfeitPayload.finalStateHash).toBe(runnerHash);
    const runnerStored = await runnerMatch.service.loadForTest(
      runnerMatch.matchId,
    );
    expect(runnerStored?.gameState.winner).toBeFalsy();
    expect(runnerStored?.match.winner).toBe("corp");
    expect(runnerStored?.resultSnapshot).toMatchObject({
      matchStatus: "forfeited",
      reason: "forfeit",
      winnerSide: "corp",
      loserSide: "runner",
    });
    const runnerReplay = await runnerMatch.service.replayMatch(
      runnerMatch.matchId,
    );
    expect(runnerReplay.ok).toBe(true);
    expect(runnerReplay.finalStateHash).toBe(runnerHash);
    expectLifecyclePayloadSafe(runnerForfeitPayload);

    const corpMatch = await joinedMatch("v104-forfeit-corp");
    const corpBefore = await corpMatch.service.loadForTest(corpMatch.matchId);
    if (!corpBefore?.gameState) throw new Error("Missing corp forfeit state");
    const corpHash = hashState(corpBefore.gameState);
    const corpForfeit = await corpMatch.service.forfeitMatch({
      matchId: corpMatch.matchId,
      side: "corp",
      sessionToken: corpMatch.corp.sessionToken,
    });
    expect(corpForfeit.ok).toBe(true);
    if (!corpForfeit.ok) throw new Error(corpForfeit.error.message);
    expect(
      expectSidePayload(corpForfeit.actorPayload).resultSummary,
    ).toMatchObject({
      reason: "forfeit",
      winner: "runner",
      winnerSide: "runner",
      loserSide: "corp",
      finalEngineStateHash: corpHash,
    });
    expect(
      (await corpMatch.service.replayMatch(corpMatch.matchId)).finalStateHash,
    ).toBe(corpHash);
  });

  it("allows Human-vs-KI forfeit only from the human side and stops AI advance afterwards", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "v104-ai-forfeit",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "v104-ai-forfeit",
      corpDifficulty: "normal",
    });
    const beforeHash = hashState(
      (await service.loadForTest(created.matchId))!.gameState,
    );
    const aiForfeit = await service.forfeitMatch({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
    });
    expect(aiForfeit.ok).toBe(false);
    if (aiForfeit.ok) throw new Error("Expected AI forfeit rejection");
    expect(aiForfeit.error.code).toBe("unauthorized");

    const humanForfeit = await service.forfeitMatch({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
    });
    expect(humanForfeit.ok).toBe(true);
    if (!humanForfeit.ok) throw new Error(humanForfeit.error.message);
    const humanForfeitPayload = expectSidePayload(humanForfeit.actorPayload);
    expect(humanForfeitPayload.matchStatus).toBe("forfeited");
    expect(humanForfeitPayload.aiTurnPresentation?.canAdvanceAi).toBe(false);
    expect(humanForfeitPayload.resultSummary).toMatchObject({
      reason: "forfeit",
      winnerSide: "corp",
      loserSide: "runner",
      finalEngineStateHash: beforeHash,
    });
    const advanceAfterForfeit = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: created.playerView.stateVersion,
      knownMatchVersion: humanForfeitPayload.matchVersion,
      mode: "single_step",
    });
    expect(advanceAfterForfeit.ok).toBe(false);
    if (advanceAfterForfeit.ok)
      throw new Error("Expected advance_ai rejection");
    expect(advanceAfterForfeit.error.code).toBe("match_not_active");
  });

  it("tracks player clock grace, reconnect snapshots and terminal time expiry without changing Engine win state", async () => {
    const startMs = Date.parse("2026-05-19T08:00:00.000Z");
    let nowMs = startMs;
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "player-clock-grace",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:8787",
      now: () => new Date(nowMs).toISOString(),
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "player-clock-grace",
      settings: {
        playerClock: {
          mode: "player_clock",
          startingTimeMs: 120_000,
          gracePeriodMs: 5_000,
        },
      },
    });
    expect(created.joinUrl).toBeTruthy();
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    const corp = {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    };
    await forceSetupComplete(service, created.matchId);

    const before = await bootstrap(service, created.matchId, corp);
    const beforeHash = hashState(
      (await service.loadForTest(created.matchId))!.gameState,
    );
    expect(before.playerClock).toMatchObject({
      schemaVersion: "player-clock-v1",
      mode: "player_clock",
      decisionOwnerSide: "corp",
      remainingMs: { runner: 120_000, corp: 120_000 },
      gracePeriodMs: 5_000,
      warningLevel: "grace",
    });
    const mandatoryDraw = mustAction(
      before,
      (action) => action.type === "mandatory_draw",
    );

    nowMs = startMs + 7_000;
    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "corp",
      sessionToken: corp.sessionToken,
      reconnectToken: corp.reconnectToken,
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerClock).toMatchObject({
      mode: "player_clock",
      decisionOwnerSide: "corp",
      remainingMs: { runner: 120_000, corp: 118_000 },
      graceRemainingMs: 0,
      warningLevel: "charging",
    });
    expect(JSON.stringify(reconnected.playerClock)).not.toMatch(
      /cardInstances|privatePayload|decklist|AIInput|DecisionDebug|FullState/i,
    );

    nowMs = startMs + 126_000;
    const expired = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: reconnected.sessionToken,
      actionId: mandatoryDraw.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "player-clock-expire",
    });
    expect(expired.ok).toBe(false);
    if (expired.ok) throw new Error("Expected time expiry");
    expect(expired.error.code).toBe("time_expired");
    const payload = expectSidePayload(expired.payload);
    expect(payload.matchStatus).toBe("finished");
    expect(payload.playerClock).toMatchObject({
      mode: "player_clock",
      expiredSide: "corp",
      warningLevel: "expired",
    });
    expect(payload.resultSummary).toMatchObject({
      reason: "time_expired",
      winner: "runner",
      winnerSide: "runner",
      loserSide: "corp",
      finalEngineStateHash: beforeHash,
    });
    expect(payload.eventTail.at(-1)?.publicPayload.type).toBe("time_expired");
    expectLifecyclePayloadSafe(payload);
    expect(
      (await service.loadForTest(created.matchId))?.gameState.winner,
    ).toBeFalsy();
    expect((await service.replayMatch(created.matchId)).finalStateHash).toBe(
      beforeHash,
    );
  });

  it("moves the displayed player time to the Runner as soon as paced Corp AI finishes", async () => {
    const startMs = Date.parse("2026-07-13T08:00:00.000Z");
    let nowMs = startMs;
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "player-clock-paced-corp-ai",
      now: () => new Date(nowMs).toISOString(),
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "player-clock-paced-corp-ai",
      corpDifficulty: "normal",
      aiPacingMode: "paced",
    });
    const runner = {
      side: "runner" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    };
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      runner,
      "keep",
      "player-clock-paced-corp-ai-setup",
    );
    expect(afterSetup.playerClock).toMatchObject({
      mode: "none",
      decisionOwnerSide: "corp",
      consumedMs: { runner: 0, corp: 0 },
    });

    nowMs = startMs + 2_000;
    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "until_human",
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(advanced.requesterPayload.playerView.activeSide).toBe("runner");
    expect(advanced.requesterPayload.playerClock).toMatchObject({
      mode: "none",
      decisionOwnerSide: "runner",
      activityStartedAtMs: nowMs,
      consumedMs: { runner: 0, corp: 2_000 },
    });

    nowMs = startMs + 5_000;
    const runnerTurn = await bootstrap(service, created.matchId, runner);
    expect(runnerTurn.playerClock).toMatchObject({
      decisionOwnerSide: "runner",
      consumedMs: { runner: 3_000, corp: 2_000 },
    });
  });

  it("tracks no-limit consumed player time without time-expiry losses", async () => {
    const startMs = Date.parse("2026-05-21T08:00:00.000Z");
    let nowMs = startMs;
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "player-clock-none",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:8787",
      now: () => new Date(nowMs).toISOString(),
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "player-clock-none",
    });
    expect(created.joinUrl).toBeTruthy();
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    const matchId = created.matchId;
    const corp = {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    };
    await forceSetupComplete(service, matchId);

    const before = await bootstrap(service, matchId, corp);
    expect(before.playerClock).toMatchObject({
      schemaVersion: "player-clock-v1",
      mode: "none",
      decisionOwnerSide: "corp",
      consumedMs: { runner: 0, corp: 0 },
      warningLevel: "none",
    });
    const mandatoryDraw = mustAction(
      before,
      (action) => action.type === "mandatory_draw",
    );

    nowMs = startMs + 6_000;
    const reconnected = await service.reconnectMatch(matchId, {
      side: "corp",
      sessionToken: corp.sessionToken,
      reconnectToken: corp.reconnectToken,
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerClock).toMatchObject({
      mode: "none",
      decisionOwnerSide: "corp",
      consumedMs: { runner: 0, corp: 6_000 },
      warningLevel: "none",
    });
    expect(JSON.stringify(reconnected.playerClock)).not.toMatch(
      /cardInstances|privatePayload|decklist|AIInput|DecisionDebug|FullState/i,
    );

    nowMs = startMs + 126_000;
    const submitted = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: reconnected.sessionToken,
      actionId: mandatoryDraw.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "player-clock-none-action",
    });
    expect(submitted.ok).toBe(true);
    if (!submitted.ok) throw new Error(submitted.error.message);
    expect(submitted.actorPayload.playerClock).toMatchObject({
      mode: "none",
      consumedMs: { runner: 0, corp: 126_000 },
      warningLevel: "none",
    });
    expect(submitted.actorPayload.matchStatus).toBe("active");
    expect(submitted.actorPayload.resultSummary).toBeUndefined();
  });

  it("recreates V1.0.4 matches with new identity, links, seed and tokens while old tokens stop working", async () => {
    const pending = await pendingDeckMatch("v104-recreate-pending");
    const oldStored = await pending.service.loadForTest(
      pending.created.matchId,
    );
    const recreated = await pending.service.recreateMatch(
      pending.created.matchId,
      {
        side: pending.created.hostSide,
        sessionToken: pending.created.hostSessionToken,
        displayName: "Host Recreate",
      },
    );
    expect(recreated.ok).toBe(true);
    if (!recreated.ok || !recreated.newMatch)
      throw new Error("Expected recreated match");
    expect(recreated.actorPayload.matchStatus).toBe("cancelled");
    expect(recreated.newMatch.matchId).not.toBe(pending.created.matchId);
    expect(recreated.newMatch.joinUrl).toBeTruthy();
    expect(recreated.newMatch.joinUrl).not.toBe(pending.created.joinUrl);
    expect(recreated.newMatch.hostSessionToken).not.toBe(
      pending.created.hostSessionToken,
    );
    expect(recreated.newMatch.hostReconnectToken).not.toBe(
      pending.created.hostReconnectToken,
    );
    const newStored = await pending.service.loadForTest(
      recreated.newMatch.matchId,
    );
    expect(newStored?.match.seed).toBeTruthy();
    expect(newStored?.match.seed).not.toBe(oldStored?.match.seed);
    expect(
      (await pending.service.loadForTest(pending.created.matchId))?.match
        .status,
    ).toBe("cancelled");
    await expectOldTokensRejected(
      pending.service,
      pending.created.matchId,
      pending.created.hostSide,
      pending.created.hostSessionToken,
      pending.created.hostReconnectToken,
    );
    const staleJoin = await pending.service.joinMatch(pending.created.matchId, {
      token: pending.joinToken,
    });
    expect("error" in staleJoin).toBe(true);

    const cancelledRecreate = await pending.service.recreateMatch(
      pending.created.matchId,
      {
        side: pending.created.hostSide,
        sessionToken: pending.created.hostSessionToken,
        displayName: "Host Again",
      },
    );
    expect(cancelledRecreate.ok).toBe(true);
    if (!cancelledRecreate.ok || !cancelledRecreate.newMatch)
      throw new Error("Expected terminal recreate");
    expect(cancelledRecreate.newMatch.matchId).not.toBe(
      recreated.newMatch.matchId,
    );
  });

  it("delivers V1.1.0 setup mulligan choices side-safely through multiplayer and reconnect", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "v110-setup-server",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "v110-setup-server",
    });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const runner = {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    };
    const corp = {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    };
    const runnerView = await bootstrap(service, created.matchId, runner);
    const corpView = await bootstrap(service, created.matchId, corp);
    expect(runnerView.playerView.phase).toBe("setup");
    expect(runnerView.pendingChoice?.source).toBe("setup.mulligan");
    expect(
      runnerView.pendingChoice?.options.map((option) => option.id),
    ).toEqual(["keep", "mulligan"]);
    expect(corpView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpView)).not.toContain("Starthand behalten");
    expect(runnerView.playerView.agendaPointsToWin).toBe(7);

    await submitChoice(
      service,
      created.matchId,
      runner,
      "keep",
      "v110-runner-keep",
    );
    const corpReconnect = await service.reconnectMatch(created.matchId, {
      side: "corp",
      sessionToken: corp.sessionToken,
      reconnectToken: corp.reconnectToken,
    });
    expect("error" in corpReconnect).toBe(false);
    if ("error" in corpReconnect) throw new Error(corpReconnect.error.message);
    expect(corpReconnect.pendingChoice?.source).toBe("setup.mulligan");
    expect(
      corpReconnect.pendingChoice?.options.map((option) => option.id),
    ).toEqual(["keep", "mulligan"]);

    const reconnectedCorp = {
      ...corp,
      sessionToken: corpReconnect.sessionToken,
      reconnectToken: corpReconnect.reconnectToken,
    };
    await submitChoice(
      service,
      created.matchId,
      reconnectedCorp,
      "keep",
      "v110-corp-keep",
    );
    const after = await bootstrap(service, created.matchId, reconnectedCorp);
    expect(after.playerView.phase).toBe("corp_draw_phase");
    expect(
      after.legalActions.some((action) => action.type === "mandatory_draw"),
    ).toBe(true);
  });

  it("runs actions only through the server pipeline with idempotency and stale-state rejection", async () => {
    const { service, corp, matchId } = await joinedMatch();
    const before = await bootstrap(service, matchId, corp);
    const mandatory = mustAction(
      before,
      (action) => action.type === "mandatory_draw",
    );

    const first = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-1",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error.message);

    const duplicate = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-1",
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(
      first.receipt.stateVersionAfter,
    );

    const stale = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-stale",
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
    const concurrentBoot = await bootstrap(
      concurrent.service,
      concurrent.matchId,
      concurrent.corp,
    );
    const concurrentMandatory = mustAction(
      concurrentBoot,
      (action) => action.type === "mandatory_draw",
    );
    const [firstConcurrent, secondConcurrent] = await Promise.all([
      concurrent.service.submitAction({
        matchId: concurrent.matchId,
        side: "corp",
        sessionToken: concurrent.corp.sessionToken,
        actionId: concurrentMandatory.actionId,
        clientKnownStateVersion: 0,
        idempotencyKey: "concurrent-a",
      }),
      concurrent.service.submitAction({
        matchId: concurrent.matchId,
        side: "corp",
        sessionToken: concurrent.corp.sessionToken,
        actionId: concurrentMandatory.actionId,
        clientKnownStateVersion: 0,
        idempotencyKey: "concurrent-b",
      }),
    ]);
    expect(
      [firstConcurrent.ok, secondConcurrent.ok].filter(Boolean),
    ).toHaveLength(1);
  });

  it("reconnects a side and restores view, legal actions and event tail", async () => {
    const { service, runner, matchId } = await joinedMatch();
    const reconnected = await service.reconnectMatch(matchId, {
      side: runner.side,
      sessionToken: runner.sessionToken,
      reconnectToken: runner.reconnectToken,
    });

    expect("error" in reconnected).toBe(false);
    const result = reconnected as JoinMatchResult & { eventTail: unknown[] };
    expect(result.side).toBe("runner");
    expect(result.sessionToken).toBe(runner.sessionToken);
    expect(result.reconnectToken).toBe(runner.reconnectToken);
    expect(result.playerView.side).toBe("runner");
    expect(result.legalActions).toEqual(result.playerView.legalActions);
    expect(result.eventTail.length).toBeGreaterThan(0);

    const repeatedReconnect = await service.reconnectMatch(matchId, {
      side: runner.side,
      sessionToken: runner.sessionToken,
      reconnectToken: runner.reconnectToken,
    });
    expect("error" in repeatedReconnect).toBe(false);
    if ("error" in repeatedReconnect)
      throw new Error(repeatedReconnect.error.message);
    expect(repeatedReconnect.sessionToken).toBe(runner.sessionToken);
    expect(repeatedReconnect.reconnectToken).toBe(runner.reconnectToken);

    const accessMatch = await joinedMatch("mp-win-1");
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.corp,
      (action) => action.type === "end_turn",
      "end-turn",
    );
    await submitFirstChoice(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.corp,
      "discard",
    );
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "run-rd",
    );
    const accessReconnect = await accessMatch.service.reconnectMatch(
      accessMatch.matchId,
      {
        side: "runner",
        sessionToken: accessMatch.runner.sessionToken,
        reconnectToken: accessMatch.runner.reconnectToken,
      },
    );
    expect("error" in accessReconnect).toBe(false);
    if ("error" in accessReconnect)
      throw new Error(accessReconnect.error.message);
    expect(accessReconnect.playerView.run?.phase).toBe("access");

    const encounterMatch = await joinedMatch("mp-enc-1");
    await submit(
      encounterMatch.service,
      encounterMatch.matchId,
      encounterMatch.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    await submit(
      encounterMatch.service,
      encounterMatch.matchId,
      encounterMatch.corp,
      (action) =>
        action.type === "install_card" &&
        action.payload?.serverId === "rd" &&
        String(action.source).includes("ice"),
      "install-ice",
    );
    await submit(
      encounterMatch.service,
      encounterMatch.matchId,
      encounterMatch.corp,
      (action) => action.type === "end_turn",
      "end-turn",
    );
    await submit(
      encounterMatch.service,
      encounterMatch.matchId,
      encounterMatch.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "run-rd",
    );
    await submit(
      encounterMatch.service,
      encounterMatch.matchId,
      encounterMatch.corp,
      (action) => action.type === "rez_ice",
      "rez",
    );
    const encounterReconnect = await encounterMatch.service.reconnectMatch(
      encounterMatch.matchId,
      {
        side: "runner",
        sessionToken: encounterMatch.runner.sessionToken,
        reconnectToken: encounterMatch.runner.reconnectToken,
      },
    );
    expect("error" in encounterReconnect).toBe(false);
    if ("error" in encounterReconnect)
      throw new Error(encounterReconnect.error.message);
    expect(encounterReconnect.playerView.run?.phase).toBe("encounter_ice");
  });

  it("allows undo before hidden information and blocks undo after access", async () => {
    const first = await joinedMatch("undo-safe");
    const firstAction = await submit(
      first.service,
      first.matchId,
      first.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    const undo = await first.service.requestUndo({
      matchId: first.matchId,
      side: "corp",
      sessionToken: first.corp.sessionToken,
      targetEventId: firstAction.receipt.stateVersionAfter === 1 ? "evt_1" : "",
      reason: "Misclick",
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok || !undo.undoRequest) throw new Error("Expected undo request");
    const accepted = await first.service.acceptUndo({
      matchId: first.matchId,
      side: "runner",
      sessionToken: first.runner.sessionToken,
      undoRequestId: undo.undoRequest.undoRequestId,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new Error(accepted.error.message);
    expect(accepted.requesterPayload.pendingUndo).toBeUndefined();
    expect(accepted.opponentPayload.pendingUndo).toBeUndefined();
    const restored = await bootstrap(first.service, first.matchId, first.corp);
    expect(restored.playerView.stateVersion).toBe(0);
    expect(restored.pendingUndo).toBeUndefined();
    const acceptedReconnect = await first.service.reconnectMatch(
      first.matchId,
      {
        side: "runner",
        sessionToken: first.runner.sessionToken,
        reconnectToken: first.runner.reconnectToken,
      },
    );
    expect("error" in acceptedReconnect).toBe(false);
    if ("error" in acceptedReconnect)
      throw new Error(acceptedReconnect.error.message);
    expect(acceptedReconnect.pendingUndo).toBeUndefined();

    const declineMatch = await joinedMatch("undo-decline");
    const declineAction = await submit(
      declineMatch.service,
      declineMatch.matchId,
      declineMatch.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    const declineRequest = await declineMatch.service.requestUndo({
      matchId: declineMatch.matchId,
      side: "corp",
      sessionToken: declineMatch.corp.sessionToken,
      targetEventId: `evt_${declineAction.receipt.stateVersionAfter}`,
    });
    expect(declineRequest.ok).toBe(true);
    if (!declineRequest.ok || !declineRequest.undoRequest)
      throw new Error("Expected undo request");
    const declined = await declineMatch.service.declineUndo({
      matchId: declineMatch.matchId,
      side: "runner",
      sessionToken: declineMatch.runner.sessionToken,
      undoRequestId: declineRequest.undoRequest.undoRequestId,
    });
    expect(declined.ok).toBe(true);
    if (!declined.ok) throw new Error(declined.error.message);
    expect(declined.requesterPayload.pendingUndo).toBeUndefined();
    expect(declined.opponentPayload.pendingUndo).toBeUndefined();
    const declinedRequester = await bootstrap(
      declineMatch.service,
      declineMatch.matchId,
      declineMatch.corp,
    );
    const declinedResponder = await declineMatch.service.reconnectMatch(
      declineMatch.matchId,
      {
        side: "runner",
        sessionToken: declineMatch.runner.sessionToken,
        reconnectToken: declineMatch.runner.reconnectToken,
      },
    );
    expect(declinedRequester.pendingUndo).toBeUndefined();
    expect("error" in declinedResponder).toBe(false);
    if ("error" in declinedResponder)
      throw new Error(declinedResponder.error.message);
    expect(declinedResponder.pendingUndo).toBeUndefined();

    const invalidMatch = await joinedMatch("undo-invalid-cleanup");
    const invalidAction = await submit(
      invalidMatch.service,
      invalidMatch.matchId,
      invalidMatch.corp,
      (action) => action.type === "mandatory_draw",
      "invalid-mandatory",
    );
    const invalidRequest = await invalidMatch.service.requestUndo({
      matchId: invalidMatch.matchId,
      side: "corp",
      sessionToken: invalidMatch.corp.sessionToken,
      targetEventId: `evt_${invalidAction.receipt.stateVersionAfter}`,
    });
    expect(invalidRequest.ok).toBe(true);
    if (!invalidRequest.ok || !invalidRequest.undoRequest)
      throw new Error("Expected undo request");
    const invalidRecord = await invalidMatch.service.loadForTest(
      invalidMatch.matchId,
    );
    if (!invalidRecord) throw new Error("Missing invalid cleanup match");
    invalidRecord.undoSnapshots = [];
    await (
      invalidMatch.service as unknown as { storage: MultiplayerStorage }
    ).storage.save(invalidRecord);
    const invalidResponse = await invalidMatch.service.acceptUndo({
      matchId: invalidMatch.matchId,
      side: "runner",
      sessionToken: invalidMatch.runner.sessionToken,
      undoRequestId: invalidRequest.undoRequest.undoRequestId,
    });
    expect(invalidResponse.ok).toBe(false);
    if (invalidResponse.ok) throw new Error("Expected invalid undo response");
    expect(invalidResponse.payload?.pendingUndo).toBeUndefined();
    expect(
      (await invalidMatch.service.loadForTest(invalidMatch.matchId))
        ?.pendingUndo,
    ).toBeUndefined();

    const second = await joinedMatch("undo-blocked");
    await submit(
      second.service,
      second.matchId,
      second.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    await submit(
      second.service,
      second.matchId,
      second.corp,
      (action) => action.type === "end_turn",
      "end-turn",
    );
    await submitFirstChoice(
      second.service,
      second.matchId,
      second.corp,
      "discard",
    );
    const run = await submit(
      second.service,
      second.matchId,
      second.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "run-rd",
    );
    await submit(
      second.service,
      second.matchId,
      second.runner,
      (action) => action.type === "access_card",
      "access",
    );

    const blocked = await second.service.requestUndo({
      matchId: second.matchId,
      side: "runner",
      sessionToken: second.runner.sessionToken,
      targetEventId: `evt_${run.receipt.stateVersionAfter}`,
      reason: "Undo after access",
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
    expect(JSON.stringify(blocked.error)).not.toContain("Simple Agenda");
  });

  it("allows undo across hidden information when the local debug option is enabled", async () => {
    const match = await joinedMatch("undo-local-hidden-debug", undefined, {
      allowHiddenInfoUndo: true,
    });
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "local-debug-mandatory",
    );
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "end_turn",
      "local-debug-end-turn",
    );
    await submitFirstChoice(
      match.service,
      match.matchId,
      match.corp,
      "local-debug-discard",
    );
    const run = await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "local-debug-run-rd",
    );
    const access = await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) => action.type === "access_card",
      "local-debug-access",
    );

    const requested = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      targetEventId: `evt_${run.receipt.stateVersionAfter}`,
      reason: "Lokale Debug-Zurücknahme über Access hinweg",
    });
    expect(requested.ok).toBe(true);
    if (!requested.ok || !requested.undoRequest)
      throw new Error("Expected local hidden-info undo request");
    const storedWithRequest = await match.service.loadForTest(match.matchId);
    expect(storedWithRequest?.pendingUndo?.undoRequestId).toBe(
      requested.undoRequest.undoRequestId,
    );
    expect(
      storedWithRequest?.undoSnapshots.find(
        (snapshot) =>
          snapshot.undoRequestId === requested.undoRequest?.undoRequestId,
      )?.hiddenInfoSafe,
    ).toBe(false);

    const accepted = await match.service.acceptUndo({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      undoRequestId: requested.undoRequest.undoRequestId,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new Error(accepted.error.message);

    const afterUndo = await match.service.loadForTest(match.matchId);
    expect(
      afterUndo?.eventLog.some(
        (event) => event.eventId === `evt_${run.receipt.stateVersionAfter}`,
      ),
    ).toBe(false);
    expect(
      afterUndo?.eventLog.some(
        (event) => event.eventId === `evt_${access.receipt.stateVersionAfter}`,
      ),
    ).toBe(false);
  });

  it("keeps undo snapshots free of embedded engine event history", async () => {
    const match = await joinedMatch("undo-snapshot-eventlog-free");
    const mandatory = await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "snapshot-free-mandatory",
    );
    const credit = await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "gain_credit",
      "snapshot-free-credit",
    );
    const storedBeforeUndo = await match.service.loadForTest(match.matchId);
    expect(storedBeforeUndo?.gameState.eventLog.length).toBeGreaterThan(2);
    expect(
      storedBeforeUndo?.stateSnapshots.find(
        (snapshot) =>
          snapshot.snapshotId ===
          `snap_before_${credit.receipt.stateVersionAfter}`,
      )?.gameState.eventLog,
    ).toEqual([]);

    const undo = await match.service.requestUndo({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      targetEventId: `evt_${credit.receipt.stateVersionAfter}`,
      reason: "Snapshot event history regression",
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok || !undo.undoRequest) throw new Error("Expected undo request");
    const accepted = await match.service.acceptUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      undoRequestId: undo.undoRequest.undoRequestId,
    });
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) throw new Error(accepted.error.message);

    const storedAfterUndo = await match.service.loadForTest(match.matchId);
    expect(storedAfterUndo?.gameState.stateVersion).toBe(
      mandatory.receipt.stateVersionAfter,
    );
    expect(
      storedAfterUndo?.gameState.eventLog.map((event) => event.eventId),
    ).toEqual(["evt_0", `evt_${mandatory.receipt.stateVersionAfter}`]);
    expect(
      storedAfterUndo?.stateSnapshots
        .filter((snapshot) => snapshot.snapshotId.startsWith("snap_before_"))
        .every((snapshot) => snapshot.gameState.eventLog.length === 0),
    ).toBe(true);
    expect((await match.service.replayMatch(match.matchId)).ok).toBe(true);
  });

  it("auto-accepts undo in Human-vs-KI matches", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "undo-ai-auto-accept",
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "undo-ai-auto",
      runnerDifficulty: "normal",
    });

    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "undo-ai-setup",
    );
    const mandatory = mustAction(
      afterSetup,
      (action) => action.type === "mandatory_draw",
    );
    const mandatoryResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: afterSetup.playerView.stateVersion,
      idempotencyKey: "undo-ai-mandatory",
    });
    expect(mandatoryResult.ok).toBe(true);
    if (!mandatoryResult.ok) throw new Error(mandatoryResult.error.message);

    const undo = await service.requestUndo({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      targetEventId: `evt_${mandatoryResult.receipt.stateVersionAfter}`,
      reason: "Misclick",
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok) throw new Error(undo.error.message);
    expect(undo.requesterPayload.pendingUndo).toBeUndefined();
    expect(undo.requesterPayload.playerView.stateVersion).toBe(
      afterSetup.playerView.stateVersion,
    );

    const stored = await service.loadForTest(created.matchId);
    expect(stored?.pendingUndo).toBeUndefined();
    expect(stored?.undoSnapshots.at(-1)?.status).toBe("accepted");
  });

  it("handles V1.2.0 Event Modification pending choices through submit, reconnect, idempotency and undo barriers", async () => {
    const match = await joinedV120EventModificationMatch(
      "mp-v120-event-modification",
    );
    const beforeOperation = await bootstrap(
      match.service,
      match.matchId,
      match.corp,
    );
    const operation = mustAction(
      beforeOperation,
      (action) =>
        action.type === "play_operation" &&
        action.label.includes("Scorched Earth"),
    );

    const opened = await match.service.submitAction({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      actionId: operation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v120-open-window",
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) throw new Error(opened.error.message);
    expect(opened.actorPayload.pendingChoice).toBeUndefined();
    expect(opened.opponentPayload.pendingChoice?.source).toBe(
      "v120.event_modification.prevent",
    );
    expect(opened.publicEvent?.publicPayload).toMatchObject({
      eventModificationWindowOpened: true,
      imminentEventType: "damage",
    });
    expect(JSON.stringify(opened.actorPayload)).not.toContain(
      "v120_damage_prevent",
    );

    const duplicateOpen = await match.service.submitAction({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      actionId: operation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v120-open-window",
    });
    expect(duplicateOpen.ok).toBe(true);
    if (!duplicateOpen.ok) throw new Error(duplicateOpen.error.message);
    expect(duplicateOpen.receipt.stateVersionAfter).toBe(
      opened.receipt.stateVersionAfter,
    );

    const reconnectedRunner = await match.service.reconnectMatch(
      match.matchId,
      {
        side: "runner",
        sessionToken: match.runner.sessionToken,
        reconnectToken: match.runner.reconnectToken,
      },
    );
    expect("error" in reconnectedRunner).toBe(false);
    if ("error" in reconnectedRunner)
      throw new Error(reconnectedRunner.error.message);
    expect(reconnectedRunner.pendingChoice?.source).toBe(
      "v120.event_modification.prevent",
    );
    expect(JSON.stringify(reconnectedRunner)).not.toContain(
      "Test-only Damage Prevention",
    );

    const staleChoice = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion - 1,
      selectedChoices: {
        choiceId: reconnectedRunner.pendingChoice?.choiceId,
        selectedOptionIds: ["pass"],
      },
      idempotencyKey: "v120-stale-choice",
    });
    expect(staleChoice.ok).toBe(false);
    if (staleChoice.ok) throw new Error("Expected stale choice rejection");
    expect(staleChoice.error.code).toBe("stale_state");

    const preventOption = reconnectedRunner.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    if (!preventOption) throw new Error("Missing prevent option");
    const prevented = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: {
        choiceId: reconnectedRunner.pendingChoice?.choiceId,
        selectedOptionIds: [preventOption],
      },
      idempotencyKey: "v120-prevent",
    });
    expect(prevented.ok).toBe(true);
    if (!prevented.ok) throw new Error(prevented.error.message);
    expect(prevented.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(prevented.publicEvent?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      damageAmount: 0,
    });
    expect(prevented.actorPayload.playerView.own.coreDamage).toBe(0);
    expect(prevented.opponentPayload.playerView.opponent.coreDamage).toBe(0);

    const duplicatePrevent = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: {
        choiceId: reconnectedRunner.pendingChoice?.choiceId,
        selectedOptionIds: [preventOption],
      },
      idempotencyKey: "v120-prevent",
    });
    expect(duplicatePrevent.ok).toBe(true);
    if (!duplicatePrevent.ok) throw new Error(duplicatePrevent.error.message);
    expect(duplicatePrevent.receipt.stateVersionAfter).toBe(
      prevented.receipt.stateVersionAfter,
    );

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      targetEventId: `evt_${prevented.receipt.stateVersionAfter}`,
      reason: "Event modification undo",
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok)
      throw new Error("Expected Event Modification hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("handles V1.2.1 Replacement pending choices without applying original damage twice", async () => {
    const match = await joinedV121ReplacementMatch("mp-v121-replacement");
    const beforeOperation = await bootstrap(
      match.service,
      match.matchId,
      match.corp,
    );
    const operation = mustAction(
      beforeOperation,
      (action) =>
        action.type === "play_operation" &&
        action.label.includes("Scorched Earth"),
    );

    const opened = await match.service.submitAction({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
      actionId: operation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v121-open-window",
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) throw new Error(opened.error.message);
    expect(opened.actorPayload.pendingChoice).toBeUndefined();
    expect(opened.opponentPayload.pendingChoice?.source).toBe(
      "v121.replacement.damage",
    );
    expect(opened.publicEvent?.publicPayload).toMatchObject({
      replacementWindowOpened: true,
      originalEventType: "damage",
    });

    const reconnectedRunner = await match.service.reconnectMatch(
      match.matchId,
      {
        side: "runner",
        sessionToken: match.runner.sessionToken,
        reconnectToken: match.runner.reconnectToken,
      },
    );
    expect("error" in reconnectedRunner).toBe(false);
    if ("error" in reconnectedRunner)
      throw new Error(reconnectedRunner.error.message);
    expect(reconnectedRunner.pendingChoice?.source).toBe(
      "v121.replacement.damage",
    );
    expect(JSON.stringify(reconnectedRunner)).not.toContain(
      "Test-only Damage Replacement",
    );

    const replaceOption = reconnectedRunner.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    if (!replaceOption) throw new Error("Missing replacement option");
    const replaced = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: {
        choiceId: reconnectedRunner.pendingChoice?.choiceId,
        selectedOptionIds: [replaceOption],
      },
      idempotencyKey: "v121-replace",
    });
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) throw new Error(replaced.error.message);
    expect(replaced.publicEvent?.publicPayload).toMatchObject({
      replacementDecision: "apply",
      replacementOutcome: "replaced",
      originalEventType: "damage",
      replacementEventType: "add_tag",
      tagsAdded: 1,
    });
    expect(replaced.actorPayload.playerView.own.coreDamage).toBe(0);
    expect(replaced.actorPayload.playerView.own.tags).toBe(2);
    expect(replaced.opponentPayload.playerView.opponent.coreDamage).toBe(0);
    expect(replaced.opponentPayload.playerView.opponent.tags).toBe(2);

    const duplicateReplace = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      actionId: reconnectedRunner.legalActions[0]?.actionId ?? "",
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: {
        choiceId: reconnectedRunner.pendingChoice?.choiceId,
        selectedOptionIds: [replaceOption],
      },
      idempotencyKey: "v121-replace",
    });
    expect(duplicateReplace.ok).toBe(true);
    if (!duplicateReplace.ok) throw new Error(duplicateReplace.error.message);
    expect(duplicateReplace.receipt.stateVersionAfter).toBe(
      replaced.receipt.stateVersionAfter,
    );
  });

  it("handles V1.2.2 Special Zone submit, reconnect, idempotency, stale rejection and undo barrier side-safely", async () => {
    const match = await joinedV122SpecialZoneMatch("mp-v122-special-zone");
    const before = await bootstrap(match.service, match.matchId, match.runner);
    const special = mustAction(
      before,
      (action) => action.type === "move_to_set_aside",
    );

    const moved = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      actionId: special.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v122-set-aside",
    });
    expect(moved.ok).toBe(true);
    if (!moved.ok) throw new Error(moved.error.message);
    expect(moved.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(moved.publicEvent?.publicPayload).toMatchObject({
      actionType: "move_to_set_aside",
      specialZone: "set_aside",
      redactedKind: "special_zone",
    });
    expect(JSON.stringify(moved.publicEvent?.publicPayload)).not.toContain(
      "Simple Economy Event",
    );
    expect(
      moved.actorPayload.playerView.specialZones?.setAside[0],
    ).toMatchObject({
      definitionId: "simple_economy_event",
      controller: "runner",
    });
    expect(
      moved.opponentPayload.playerView.specialZones?.setAside[0],
    ).toMatchObject({ known: false });
    expect(JSON.stringify(moved.opponentPayload)).not.toContain(
      "Simple Economy Event",
    );

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      actionId: special.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v122-set-aside",
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(
      moved.receipt.stateVersionAfter,
    );

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      actionId: special.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v122-stale-set-aside",
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnectedCorp = await match.service.reconnectMatch(match.matchId, {
      side: "corp",
      sessionToken: match.corp.sessionToken,
      reconnectToken: match.corp.reconnectToken,
    });
    expect("error" in reconnectedCorp).toBe(false);
    if ("error" in reconnectedCorp)
      throw new Error(reconnectedCorp.error.message);
    expect(reconnectedCorp.playerView.specialZones?.setAside[0]).toMatchObject({
      known: false,
    });
    expect(JSON.stringify(reconnectedCorp)).not.toContain(
      "Simple Economy Event",
    );

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      targetEventId: `evt_${moved.receipt.stateVersionAfter}`,
      reason: "Special zone undo",
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok)
      throw new Error("Expected Special Zone hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("starts V1.2.3 decks from snapshots and handles MIT West Tier through reconnect, idempotency and undo barrier", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "mp-v123-card-release",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "mp-v123-mit-west-tier",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_123_snapshot_v1_2_3",
        corpDeckSnapshotId: "demo_corp_123_snapshot_v1_2_3",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_123_snapshot_v1_2_3",
        corpDeckSnapshotId: "demo_corp_123_snapshot_v1_2_3",
      },
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" },
    });
    expect(created.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(created.playerView.deckMetadata?.opponent.deckName).toBe(
      "Runner Demo Deck 1.2.3 - Mechanic Unlock 1",
    );
    expect(JSON.stringify(created)).not.toContain("onr_v1_101_mit-west-tier");
    expect(created.joinUrl).toBeTruthy();
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    await prepareV123MitRunnerTurn(service, created.matchId);
    const runner = {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    };
    const before = await bootstrap(service, created.matchId, runner);
    expect(before.playerView.deckMetadata?.own.deckHash).toBe("fnv1a:f57f1d98");
    const mit = mustAction(
      before,
      (action) =>
        action.type === "play_event" && action.label.includes("MIT West Tier"),
    );

    const played = await service.submitAction({
      matchId: created.matchId,
      side: "runner",
      sessionToken: runner.sessionToken,
      actionId: mit.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v123-mit-west-tier",
    });
    expect(played.ok).toBe(true);
    if (!played.ok) throw new Error(played.error.message);
    expect(played.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(played.publicEvent?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_101_mit-west-tier",
      hiddenZoneBarrier: true,
    });
    expect(JSON.stringify(played.publicEvent?.publicPayload)).not.toContain(
      "runner_",
    );
    expect(
      played.actorPayload.playerView.specialZones?.removedFromGame[0],
    ).toMatchObject({
      definitionId: "onr_v1_101_mit-west-tier",
      controller: "runner",
    });
    expect(
      played.opponentPayload.playerView.specialZones?.removedFromGame[0],
    ).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });

    const duplicate = await service.submitAction({
      matchId: created.matchId,
      side: "runner",
      sessionToken: runner.sessionToken,
      actionId: mit.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v123-mit-west-tier",
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(
      played.receipt.stateVersionAfter,
    );

    const reconnectedCorp = await service.reconnectMatch(created.matchId, {
      side: "corp",
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    });
    expect("error" in reconnectedCorp).toBe(false);
    if ("error" in reconnectedCorp)
      throw new Error(reconnectedCorp.error.message);
    expect(
      reconnectedCorp.playerView.specialZones?.removedFromGame[0],
    ).toMatchObject({ definitionId: "onr_v1_101_mit-west-tier" });
    expect(JSON.stringify(reconnectedCorp)).not.toContain("Dwarf");
    expect(JSON.stringify(reconnectedCorp)).not.toContain("Krash");

    const blocked = await service.requestUndo({
      matchId: created.matchId,
      side: "runner",
      sessionToken: runner.sessionToken,
      targetEventId: `evt_${played.receipt.stateVersionAfter}`,
      reason: "V1.2.3 hidden-zone shuffle undo",
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected MIT hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("starts V1.3.0 private local format snapshots and revalidates invalid or AI-unsupported decks server-side", async () => {
    const cardsById = createRuntimeCardsById();
    if (!cardsById["onr_v1_021_dwarf"]) return;
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "mp-v130-format-foundation",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "mp-v130-private-local",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
      },
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" },
    });

    expect(created.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(created.playerView.deckMetadata?.opponent.formatProfileId).toBe(
      "netgrid_private_local_v1",
    );
    expect(created.playerView.deckMetadata?.opponent.formatProfileVersion).toBe(
      "1.3.0",
    );
    expect(JSON.stringify(created)).not.toContain("onr_v1_021_dwarf");
    expect(JSON.stringify(created)).not.toContain("decklist");

    const record = await service.loadForTest(created.matchId);
    expect(record?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_130_snapshot_v1_3_0",
    );
    expect(JSON.stringify(record?.match.deckSetup)).not.toContain("cards");

    const invalidRunner = structuredClone(
      (snapshotsData08.snapshots as DeckSnapshot[]).find(
        (snapshot) =>
          snapshot.deckSnapshotId === "demo_runner_130_snapshot_v1_3_0",
      ),
    );
    if (!invalidRunner) throw new Error("Missing V1.3.0 runner snapshot");
    invalidRunner.cards.push({ cardId: "onr_v1_018_dogcatcher", quantity: 1 });
    await expect(
      service.createMatch({
        hostSide: "runner",
        seed: "mp-v130-invalid-runner",
        participantADecks: {
          runnerDeckSnapshot: invalidRunner,
          corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
        },
        participantBDecks: {
          runnerDeckSnapshot: invalidRunner,
          corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
        },
      }),
    ).rejects.toThrow("deck_snapshot_invalid");

    const aiCreated = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "mp-v130-ai-supported",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
      },
      aiDeckPolicy: "selected",
    });
    expect(aiCreated.mode).toBe("human_corp_vs_runner_ai");
    expect(aiCreated.playerView.deckMetadata?.opponent.formatProfileId).toBe(
      "netgrid_private_local_v1",
    );
    expect(
      aiCreated.playerView.deckMetadata?.opponent.formatProfileVersion,
    ).toBe("1.3.0");
    expect(JSON.stringify(aiCreated)).not.toContain("cardInstances");
  });

  it("enforces the selected match card pool for Proteus playtest snapshots", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "mp-proteus-card-pool",
    });
    const cardsById = createRuntimeCardsById();
    expect(
      cardsById["onr_proteus_001_ai-board-member"]?.statuses,
    ).toMatchObject({
      human_playable: true,
      deck_legal: true,
      format_legal: true,
      ai_supported: true,
    });

    await expect(
      service.createMatch({
        hostSide: "corp",
        seed: "mp-proteus-blocked-originalset",
        participantADecks: {
          runnerDeckSnapshotId:
            "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
          corpDeckSnapshotId:
            "proteus_corp_region_fast_score_snapshot_v2026_05_25",
        },
        participantBDecks: {
          runnerDeckSnapshotId:
            "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
          corpDeckSnapshotId:
            "proteus_corp_region_fast_score_snapshot_v2026_05_25",
        },
        settings: {
          agendaPointsToWin: 7,
          matchFormat: "rules_match",
          cardPool: "originalset",
        },
      }),
    ).rejects.toThrow("deck_snapshot_card_pool_mismatch");

    await expect(
      service.createMatch({
        hostSide: "corp",
        seed: "mp-proteus-blocked-classic-only",
        participantADecks: {
          runnerDeckSnapshotId:
            "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
          corpDeckSnapshotId:
            "proteus_corp_region_fast_score_snapshot_v2026_05_25",
        },
        participantBDecks: {
          runnerDeckSnapshotId:
            "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
          corpDeckSnapshotId:
            "proteus_corp_region_fast_score_snapshot_v2026_05_25",
        },
        settings: {
          agendaPointsToWin: 7,
          matchFormat: "rules_match",
          cardPool: "originalset_classic",
        },
      }),
    ).rejects.toThrow("deck_snapshot_card_pool_mismatch");

    const classicPoolCreated = await service.createMatch({
      hostSide: "corp",
      seed: "mp-classic-pool-default-decks",
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "rules_match",
        cardPool: "originalset_classic",
      },
    });
    expect(
      (await service.loadForTest(classicPoolCreated.matchId))?.match.settings
        .cardPool,
    ).toBe("originalset_classic");

    const created = await service.createMatch({
      hostSide: "corp",
      seed: "mp-proteus-allowed",
      participantADecks: {
        runnerDeckSnapshotId:
          "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
        corpDeckSnapshotId:
          "proteus_corp_region_fast_score_snapshot_v2026_05_25",
      },
      participantBDecks: {
        runnerDeckSnapshotId:
          "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
        corpDeckSnapshotId:
          "proteus_corp_region_fast_score_snapshot_v2026_05_25",
      },
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "rules_match",
        cardPool: "originalset_proteus",
      },
    });

    expect(created.playerView.deckMetadata?.opponent.formatProfileId).toBe(
      "netgrid_private_local_proteus_playtest_v1",
    );
    expect(created.playerView.deckMetadata?.opponent.formatProfileVersion).toBe(
      "1.0.0",
    );
    expect(JSON.stringify(created)).not.toContain("onr_proteus_084_crumble");
    const record = await service.loadForTest(created.matchId);
    expect(record?.match.settings.cardPool).toBe("originalset_proteus");

    const combinedCreated = await service.createMatch({
      hostSide: "corp",
      seed: "mp-classic-proteus-allowed",
      participantADecks: {
        runnerDeckSnapshotId:
          "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
        corpDeckSnapshotId:
          "proteus_corp_region_fast_score_snapshot_v2026_05_25",
      },
      participantBDecks: {
        runnerDeckSnapshotId:
          "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
        corpDeckSnapshotId:
          "proteus_corp_region_fast_score_snapshot_v2026_05_25",
      },
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "rules_match",
        cardPool: "originalset_classic_proteus",
      },
    });
    expect(
      (await service.loadForTest(combinedCreated.matchId))?.match.settings
        .cardPool,
    ).toBe("originalset_classic_proteus");

    const proteusAiCreated = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "mp-proteus-ai-selected",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
      },
      participantBDecks: {
        runnerDeckSnapshotId:
          "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
        corpDeckSnapshotId:
          "proteus_corp_region_fast_score_snapshot_v2026_05_25",
      },
      aiDeckPolicy: "selected",
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "rules_match",
        cardPool: "originalset_proteus",
      },
    });
    const proteusAiRecord = await service.loadForTest(proteusAiCreated.matchId);
    expect(proteusAiRecord?.match.deckSetup.aiDeckPolicy).toBe("selected");
    expect(proteusAiRecord?.match.deckSetup.runnerSnapshotId).toBe(
      "proteus_runner_hq_virus_derez_snapshot_v2026_05_25",
    );
    expect(proteusAiRecord?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_130_snapshot_v1_3_0",
    );
    expect(proteusAiCreated.playerView.deckMetadata?.opponent.deckName).toBe(
      "Proteus Runner - HQ Virus & Derez",
    );
    expect(JSON.stringify(proteusAiCreated)).not.toMatch(
      /cardInstances|privatePayload|joinToken|tokenHash/,
    );
  });

  it("keeps V1.1.2 Archives breach reconnect and payloads side-safe", async () => {
    const match = await joinedV112ArchivesMatch("mp-v112-archives");
    const before = await bootstrap(match.service, match.matchId, match.runner);

    expect(before.playerView.opponent.discardCount).toBe(3);
    expect(JSON.stringify(before)).toContain("Simple Economy Operation");
    expect(JSON.stringify(before)).not.toContain("Simple Economy Asset");
    expect(JSON.stringify(before)).not.toContain("Simple Agenda");

    const started = await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
      "v112-run-archives",
    );
    expect(started.actorPayload.playerView.run?.breach).toMatchObject({
      serverId: "archives",
      remainingCount: 1,
    });
    expect(JSON.stringify(started.actorPayload)).toContain(
      "Simple Economy Asset",
    );
    expect(JSON.stringify(started.actorPayload)).toContain("Simple Agenda");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      sessionToken: match.runner.sessionToken,
      reconnectToken: match.runner.reconnectToken,
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerView.run?.breach?.remainingCount).toBe(1);
    expect(JSON.stringify(reconnected)).toContain("Simple Economy Operation");
    expect(JSON.stringify(reconnected)).toContain("Simple Economy Asset");
    expect(JSON.stringify(reconnected)).toContain("Simple Agenda");

    const firstAccess = await submit(
      match.service,
      match.matchId,
      { ...match.runner, sessionToken: reconnected.sessionToken },
      (action) => action.type === "access_card",
      "v112-access-agenda",
    );
    expect(firstAccess.publicEvent?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_agenda",
      serverLabel: "Archives",
    });
    expect(JSON.stringify(firstAccess.actorPayload)).toContain(
      "Simple Economy Asset",
    );
    expect(JSON.stringify(firstAccess.actorPayload)).toContain("Simple Agenda");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnected.sessionToken,
      actionId: firstAccess.receipt.idempotencyKey,
      clientKnownStateVersion: firstAccess.receipt.stateVersionBefore,
      idempotencyKey: "v112-access-agenda",
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(
      firstAccess.receipt.stateVersionAfter,
    );

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${started.receipt.stateVersionAfter}`,
      reason: "Archives reveal undo",
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected undo_blocked");
    expect(blocked.error.code).toBe("undo_blocked");
    expect(JSON.stringify(blocked.error)).not.toContain("Simple Agenda");
  });

  it("handles Off-Site Backups Archives-to-HQ choices through submit and reconnect without hidden leaks", async () => {
    const match = await joinedOffSiteBackupsMatch("mp-off-site-backups");
    const before = await bootstrap(match.service, match.matchId, match.corp);
    const operation = mustAction(
      before,
      (action) =>
        action.type === "play_operation" &&
        action.label.includes("Off-Site Backups"),
    );

    const started = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: operation.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "off-site-backups-start",
    });

    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.error.message);
    expect(started.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(started.actorPayload.pendingChoice?.source).toContain(
      "v1922.corp_archives_to_hq",
    );
    expect(
      started.actorPayload.pendingChoice?.options
        .map((option) => option.label)
        .sort(),
    ).toEqual(["Simple Agenda", "Simple Economy Operation"]);
    expect(
      started.actorPayload.legalActions.some(
        (action) => action.type === "resolve_choice",
      ),
    ).toBe(true);
    expect(started.opponentPayload.pendingChoice).toBeUndefined();
    expect(JSON.stringify(started.opponentPayload)).not.toContain(
      "Simple Agenda",
    );
    expect(JSON.stringify(started.publicEvent?.publicPayload)).not.toMatch(
      /Simple Agenda|cardInstances|privatePayload/,
    );

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "corp",
      sessionToken: match.corp.sessionToken,
      reconnectToken: match.corp.reconnectToken,
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(
      reconnected.pendingChoice?.options.some(
        (option) => option.label === "Simple Agenda",
      ),
    ).toBe(true);

    const choiceAction = reconnected.legalActions.find(
      (action) => action.type === "resolve_choice",
    );
    const agendaOption = reconnected.pendingChoice?.options.find(
      (option) => option.label === "Simple Agenda",
    );
    expect(choiceAction).toBeDefined();
    expect(agendaOption).toBeDefined();
    if (!choiceAction || !agendaOption)
      throw new Error("Missing Off-Site Backups Archives option");
    const resolved = await match.service.submitAction({
      matchId: match.matchId,
      side: "corp",
      sessionToken: reconnected.sessionToken,
      actionId: choiceAction.actionId,
      clientKnownStateVersion: reconnected.playerView.stateVersion,
      selectedChoices: {
        choiceId: reconnected.pendingChoice?.choiceId,
        selectedOptionIds: [agendaOption.id],
      },
      idempotencyKey: "off-site-backups-resolve",
    });

    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error(resolved.error.message);
    expect(resolved.actorPayload.pendingChoice).toBeUndefined();
    expect(
      resolved.actorPayload.playerView.own.gripOrHq.some(
        (card) => card.definitionId === "simple_agenda",
      ),
    ).toBe(true);
    expect(resolved.actorPayload.playerView.own.heapOrArchives).toHaveLength(2);
    expect(resolved.opponentPayload.playerView.opponent.handCount).toBe(
      resolved.actorPayload.playerView.own.gripOrHq.length,
    );
    expect(JSON.stringify(resolved.opponentPayload)).not.toContain(
      "Simple Agenda",
    );
    expect(resolved.publicEvent?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "v1922_corp_archives_to_hq",
    });
    expect(JSON.stringify(resolved.publicEvent?.publicPayload)).not.toMatch(
      /Simple Agenda|cardInstances|privatePayload/,
    );
  });

  it("accepts the current Corporate Shuffle PlayerView action and continues the full draw transaction", async () => {
    const exactTwo = await joinedCorporateShuffleMatch(
      "mp-corporate-shuffle-exact-two",
      { clicks: 2, strategicPlanningGroup: false },
    );
    const beforeExactTwo = await bootstrap(
      exactTwo.service,
      exactTwo.matchId,
      exactTwo.corp,
    );
    const exactTwoAction = mustAction(
      beforeExactTwo,
      (action) =>
        action.type === "play_operation" &&
        action.source === exactTwo.operationId,
    );
    expect(exactTwoAction).toMatchObject({
      side: "corp",
      source: exactTwo.operationId,
      costs: [{ clicks: 2, credits: 0 }],
      payload: { cardId: exactTwo.operationId },
      expiresAtStateVersion: beforeExactTwo.playerView.stateVersion,
    });

    const exactTwoStarted = await exactTwo.service.submitAction({
      matchId: exactTwo.matchId,
      side: exactTwo.corp.side,
      sessionToken: exactTwo.corp.sessionToken,
      actionId: exactTwoAction.actionId,
      clientKnownStateVersion: beforeExactTwo.playerView.stateVersion,
      idempotencyKey: "corporate-shuffle-exact-two",
    });
    expect(exactTwoStarted.ok).toBe(true);
    if (!exactTwoStarted.ok) throw new Error(exactTwoStarted.error.message);
    expect(exactTwoStarted.actorPayload.pendingChoice?.source).toContain(
      "classic.corporate_shuffle_hq_to_rd:",
    );
    expect(exactTwoStarted.publicEvent?.publicPayload).toMatchObject({
      actionType: "play_operation",
      actionCostClicks: 2,
      drawnCards: 5,
      hiddenZoneAction: "classic_corporate_shuffle_hq_to_rd",
    });
    const exactTwoRecord = await exactTwo.service.loadForTest(exactTwo.matchId);
    expect(exactTwoRecord?.gameState?.corp.clicks).toBe(0);
    expect(exactTwoRecord?.gameState?.corp.hq.length).toBe(
      exactTwo.hqBeforePlay - 1 + 5,
    );

    const withSpg = await joinedCorporateShuffleMatch(
      "mp-corporate-shuffle-with-spg",
      { clicks: 3, strategicPlanningGroup: true },
    );
    const beforeSpg = await bootstrap(
      withSpg.service,
      withSpg.matchId,
      withSpg.corp,
    );
    const withSpgAction = mustAction(
      beforeSpg,
      (action) =>
        action.type === "play_operation" &&
        action.source === withSpg.operationId,
    );
    expect(withSpgAction.costs).toEqual([{ clicks: 2, credits: 0 }]);

    const spgStarted = await withSpg.service.submitAction({
      matchId: withSpg.matchId,
      side: withSpg.corp.side,
      sessionToken: withSpg.corp.sessionToken,
      actionId: withSpgAction.actionId,
      clientKnownStateVersion: beforeSpg.playerView.stateVersion,
      idempotencyKey: "corporate-shuffle-with-spg",
    });
    expect(spgStarted.ok).toBe(true);
    if (!spgStarted.ok) throw new Error(spgStarted.error.message);
    expect(spgStarted.actorPayload.pendingChoice?.source).toContain(
      "card_implementation.strategic_planning_group_draw:",
    );
    expect(spgStarted.actorPayload.pendingChoice?.options).toHaveLength(6);
    expect(spgStarted.opponentPayload.pendingChoice).toBeUndefined();

    const afterSpg = await submitFirstChoice(
      withSpg.service,
      withSpg.matchId,
      withSpg.corp,
      "corporate-shuffle-spg-bottom",
    );
    expect(afterSpg.pendingChoice?.source).toContain(
      "classic.corporate_shuffle_hq_to_rd:",
    );
    expect(afterSpg.eventTail.at(-1)?.publicPayload).toMatchObject({
      strategicPlanningGroupBaseDrawCount: 5,
      strategicPlanningGroupAdditionalDrawCount: 1,
      strategicPlanningGroupDrawnCardCount: 6,
      strategicPlanningGroupNetDrawCount: 5,
      bottomedCardCount: 1,
    });
    const afterSpgRecord = await withSpg.service.loadForTest(withSpg.matchId);
    expect(afterSpgRecord?.gameState?.corp.clicks).toBe(1);
    expect(afterSpgRecord?.gameState?.corp.hq.length).toBe(
      withSpg.hqBeforePlay - 1 + 5,
    );

    const afterHqChoice = await submitFirstChoice(
      withSpg.service,
      withSpg.matchId,
      withSpg.corp,
      "corporate-shuffle-hq-to-rd",
    );
    expect(afterHqChoice.pendingChoice).toBeUndefined();
    expect(afterHqChoice.eventTail.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "classic_corporate_shuffle_hq_to_rd",
      sourceDefinitionId: "onr_classic_017_corporate-shuffle",
      movedCount: 1,
    });
    expect(
      JSON.stringify(afterHqChoice.eventTail.at(-1)?.publicPayload),
    ).not.toMatch(/movedCardId|selectedOptionIds|privatePayload/);

    const staleMatch = await joinedCorporateShuffleMatch(
      "mp-corporate-shuffle-stale",
      { clicks: 3, strategicPlanningGroup: false },
    );
    const beforeStale = await bootstrap(
      staleMatch.service,
      staleMatch.matchId,
      staleMatch.corp,
    );
    const staleOperation = mustAction(
      beforeStale,
      (action) =>
        action.type === "play_operation" &&
        action.source === staleMatch.operationId,
    );
    await submit(
      staleMatch.service,
      staleMatch.matchId,
      staleMatch.corp,
      (action) => action.type === "gain_credit",
      "corporate-shuffle-stale-version-advance",
    );
    const stale = await staleMatch.service.submitAction({
      matchId: staleMatch.matchId,
      side: staleMatch.corp.side,
      sessionToken: staleMatch.corp.sessionToken,
      actionId: staleOperation.actionId,
      clientKnownStateVersion: beforeStale.playerView.stateVersion,
      idempotencyKey: "corporate-shuffle-stale-submit",
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale Corporate Shuffle rejection");
    expect(stale.error.code).toBe("stale_state");
  });

  it("projects Bad-Publicity-7+ game end as a side-safe result reason on reconnect", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "mp-bad-publicity-result",
    });
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
      sessionToken: created.hostSessionToken,
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
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "gain_credit",
      "credit",
    );

    const replay = await match.service.replayMatch(match.matchId);
    expect(replay.ok).toBe(true);
    expect(replay.finalStateHash).toMatch(/^fnv1a:/);
  });

  it("builds V1.5.0 private replay views with timeline checks and redacted export", async () => {
    const match = await joinedMatch("v150-private-replay");
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "v150-mandatory",
    );
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "install_card",
      "v150-install",
    );
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "end_turn",
      "v150-end-turn",
    );
    await resolveCorpDiscardIfPending(
      match.service,
      match.matchId,
      match.corp,
      "v150-corp-discard",
    );
    await putTopCorpAgendaForMatch(match.service, match.matchId);
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "v150-rd-run-1",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) => action.type === "access_card",
      "v150-rd-access",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) => action.type === "steal_agenda",
      "v150-rd-steal",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "v150-rd-run-2",
    );

    const index = await match.service.listReplayIndex();
    const entry = index.find(
      (candidate) => candidate.matchId === match.matchId,
    );
    expect(entry).toBeDefined();
    if (!entry) throw new Error("Missing replay index entry");
    expect(entry.finalStateHash).toMatch(/^fnv1a:/);
    expect(entry.replayCheckStatus).toBe("unchecked");
    expect(entry.replayOk).toBeUndefined();
    expect(JSON.stringify(entry)).not.toMatch(
      /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist/i,
    );
    const stored = await match.service.loadForTest(match.matchId);
    expect(
      stored?.gameState.eventLog.some((event) => Boolean(event.privatePayload)),
    ).toBe(true);
    expect(stored?.eventLog.some((event) => "privatePayload" in event)).toBe(
      false,
    );
    expect(
      stored?.eventLog.every(
        (event) => typeof event.privatePayloadLocalOnly === "boolean",
      ),
    ).toBe(true);
    expect(stored?.eventLog.map((event) => event.eventId)).toEqual(
      stored?.gameState.eventLog.map((event) => event.eventId),
    );

    const runnerLoaded = await match.service.loadReplayDiagnostics(
      match.matchId,
      "runner",
    );
    expect(runnerLoaded.ok).toBe(true);
    if (!runnerLoaded.ok) throw new Error(runnerLoaded.error.message);
    const runnerReplay = runnerLoaded.replay;
    expect(runnerReplay.perspective).toBe("runner");
    expect(runnerReplay.localAnalysis).toBe(false);
    expect(runnerReplay.metadata.replayCheckStatus).toBe("verified");
    expect(typeof runnerReplay.metadata.replayOk).toBe("boolean");
    expect(runnerReplay.timeline.length).toBeGreaterThan(0);
    expect(
      runnerReplay.timeline.every(
        (step) =>
          typeof step.stateVersionBefore === "number" &&
          typeof step.stateVersionAfter === "number" &&
          typeof step.timingPoint === "string",
      ),
    ).toBe(true);
    expect(
      runnerReplay.timeline.every((step) =>
        step.stateHashCheck.expected.startsWith("fnv1a:"),
      ),
    ).toBe(true);
    expect(runnerReplay.timeline.some((step) => step.hiddenInfoBarrier)).toBe(
      true,
    );
    expect(runnerReplay.randomDrawRecords.length).toBeGreaterThan(0);
    expect(
      runnerReplay.randomDrawRecords.every((entry) =>
        entry.valueHash.startsWith("fnv1a:"),
      ),
    ).toBe(true);
    expect(JSON.stringify(runnerReplay)).not.toMatch(
      /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist|[A-Za-z]:\\\\/i,
    );

    const localLoaded = await match.service.loadReplayDiagnostics(
      match.matchId,
      "local_analysis",
    );
    expect(localLoaded.ok).toBe(true);
    if (!localLoaded.ok) throw new Error(localLoaded.error.message);
    expect(localLoaded.replay.localAnalysis).toBe(true);
    expect(
      localLoaded.replay.exploitSuggestions.every(
        (candidate) => candidate.status === "review_suggestion",
      ),
    ).toBe(true);

    const exported = await match.service.exportReplayDiagnostics(
      match.matchId,
      "runner",
    );
    expect(exported.ok).toBe(true);
    if (!exported.ok) throw new Error(exported.error.message);
    expect(exported.artifact.version).toBe("1.5.0");
    expect(exported.artifact.perspective).toBe("runner");
    expect(exported.artifact.baseline.engineSchemaVersion).toBe(
      exported.artifact.replay.metadata.baseline.engineSchemaVersion,
    );
    expect(exported.artifact.replay.localAnalysis).toBe(false);
    expect(exported.artifact.replay.perspective).toBe("runner");
    expect(JSON.stringify(exported.artifact)).not.toMatch(
      /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist|[A-Za-z]:\\\\/i,
    );

    const localExport = await match.service.exportReplayDiagnostics(
      match.matchId,
      "local_analysis",
    );
    expect(localExport.ok).toBe(false);
    if (localExport.ok)
      throw new Error("Expected local_analysis export to be rejected");
    expect(localExport.error.code).toBe("bad_request");
  });

  it("keeps replay DecisionDebug side-safe across runner/corp/local perspectives", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "v150-decision-debug",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "v150-decision-debug",
      corpDifficulty: "normal",
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "v150-setup-keep",
    );
    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);

    const runnerReplayLoaded = await service.loadReplayDiagnostics(
      created.matchId,
      "runner",
    );
    const corpReplayLoaded = await service.loadReplayDiagnostics(
      created.matchId,
      "corp",
    );
    const localReplayLoaded = await service.loadReplayDiagnostics(
      created.matchId,
      "local_analysis",
    );
    expect(runnerReplayLoaded.ok).toBe(true);
    expect(corpReplayLoaded.ok).toBe(true);
    expect(localReplayLoaded.ok).toBe(true);
    if (!runnerReplayLoaded.ok || !corpReplayLoaded.ok || !localReplayLoaded.ok)
      throw new Error("Replay load failed");

    const runnerDebugStep = runnerReplayLoaded.replay.timeline.find(
      (step) => step.decisionDebug,
    );
    const corpDebugStep = corpReplayLoaded.replay.timeline.find(
      (step) => step.decisionDebug,
    );
    const localDebugStep = localReplayLoaded.replay.timeline.find(
      (step) => step.decisionDebug,
    );
    expect(runnerDebugStep).toBeDefined();
    expect(corpDebugStep).toBeDefined();
    expect(localDebugStep).toBeDefined();
    if (!runnerDebugStep || !corpDebugStep || !localDebugStep)
      throw new Error("Missing decision debug step");

    expect(runnerDebugStep.side).toBe("corp");
    expect(runnerDebugStep.decisionDebug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      redacted: true,
      reason: "side_private_ai_debug",
    });
    expect(corpDebugStep.decisionDebug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      actor: "corp",
    });
    expect(
      (corpDebugStep.decisionDebug as { redacted?: boolean })?.redacted,
    ).toBeUndefined();
    expect(localDebugStep.decisionDebug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      actor: "corp",
    });
    expect(
      (localDebugStep.decisionDebug as { redacted?: boolean })?.redacted,
    ).toBeUndefined();

    const stored = await storage.load(created.matchId);
    expect(stored).toBeDefined();
    if (!stored) throw new Error("Missing stored match");
    const debugRecord = stored.eventLog.find(
      (event) => event.publicPayload.publicPayload.aiDecisionDebug,
    );
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
        sessionToken: "runner-session-secret",
      },
    };
    await storage.save(stored);

    const redactedCorpReplayLoaded = await service.loadReplayDiagnostics(
      created.matchId,
      "corp",
    );
    expect(redactedCorpReplayLoaded.ok).toBe(true);
    if (!redactedCorpReplayLoaded.ok)
      throw new Error(redactedCorpReplayLoaded.error.message);
    const redactedDebugStep = redactedCorpReplayLoaded.replay.timeline.find(
      (step) => step.decisionDebug,
    );
    expect(redactedDebugStep?.decisionDebug).toMatchObject({
      schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
      actor: "corp",
      facts: ["public_fact:ok", "[redacted-debug-value]"],
    });
    expect(JSON.stringify(redactedCorpReplayLoaded.replay)).not.toMatch(
      /runner-session-secret|privatePayload|FullState|Hidden Priority Agenda|hidden-deck-card|decklist|sessionToken|reconnectToken|joinToken/i,
    );
  });

  it("classifies V1.5.0 replay event families for access, damage, trace, replacement and special-zone flows", async () => {
    const accessMatch = await joinedMatch("v150-family-access");
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.corp,
      (action) => action.type === "mandatory_draw",
      "v150-family-access-draw",
    );
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.corp,
      (action) => action.type === "install_card",
      "v150-family-access-install",
    );
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.corp,
      (action) => action.type === "end_turn",
      "v150-family-access-end",
    );
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "v150-family-access-run",
    );
    await submit(
      accessMatch.service,
      accessMatch.matchId,
      accessMatch.runner,
      (action) =>
        action.type === "access_card" || action.type === "steal_agenda",
      "v150-family-access-access",
    );
    const accessReplay = await accessMatch.service.loadReplayDiagnostics(
      accessMatch.matchId,
      "local_analysis",
    );
    expect(accessReplay.ok).toBe(true);
    if (!accessReplay.ok) throw new Error(accessReplay.error.message);
    expect(
      accessReplay.replay.timeline.some(
        (step) => step.eventFamily === "run_and_access",
      ),
    ).toBe(true);

    const damageMatch = await joinedCanonicalDamageMatch("v150-family-damage");
    const damageBefore = await bootstrap(
      damageMatch.service,
      damageMatch.matchId,
      damageMatch.runner,
    );
    const damageAction = mustAction(
      damageBefore,
      (action) =>
        action.type === "play_event" && action.label.includes("Faked Hit"),
    );
    const damageResolved = await damageMatch.service.submitAction({
      matchId: damageMatch.matchId,
      side: damageMatch.runner.side,
      sessionToken: damageMatch.runner.sessionToken,
      actionId: damageAction.actionId,
      clientKnownStateVersion: damageBefore.playerView.stateVersion,
      idempotencyKey: "v150-family-damage-resolve",
    });
    expect(damageResolved.ok).toBe(true);
    const damageReplay = await damageMatch.service.loadReplayDiagnostics(
      damageMatch.matchId,
      "local_analysis",
    );
    expect(damageReplay.ok).toBe(true);
    if (!damageReplay.ok) throw new Error(damageReplay.error.message);
    expect(
      damageReplay.replay.timeline.some(
        (step) => step.eventFamily === "damage_and_survival",
      ),
    ).toBe(true);

    const traceMatch = await joinedCanonicalTraceMatch("v150-family-trace");
    const corpChoice = await bootstrap(
      traceMatch.service,
      traceMatch.matchId,
      traceMatch.corp,
    );
    const corpBidAction = mustAction(
      corpChoice,
      (action) => action.type === "resolve_choice",
    );
    await traceMatch.service.submitAction({
      matchId: traceMatch.matchId,
      side: traceMatch.corp.side,
      sessionToken: traceMatch.corp.sessionToken,
      actionId: corpBidAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: {
        choiceId: corpChoice.pendingChoice?.choiceId,
        selectedOptionIds: ["bid_1"],
      },
      idempotencyKey: "v150-family-trace-bid",
    });
    const traceReplay = await traceMatch.service.loadReplayDiagnostics(
      traceMatch.matchId,
      "local_analysis",
    );
    expect(traceReplay.ok).toBe(true);
    if (!traceReplay.ok) throw new Error(traceReplay.error.message);
    expect(
      traceReplay.replay.timeline.some(
        (step) => step.eventFamily === "trace_and_tags",
      ),
    ).toBe(true);

    const replacementMatch = await joinedV121ReplacementMatch(
      "v150-family-replacement",
    );
    const beforeOperation = await bootstrap(
      replacementMatch.service,
      replacementMatch.matchId,
      replacementMatch.corp,
    );
    const replacementOperation = mustAction(
      beforeOperation,
      (action) =>
        action.type === "play_operation" &&
        action.label.includes("Scorched Earth"),
    );
    await replacementMatch.service.submitAction({
      matchId: replacementMatch.matchId,
      side: replacementMatch.corp.side,
      sessionToken: replacementMatch.corp.sessionToken,
      actionId: replacementOperation.actionId,
      clientKnownStateVersion: beforeOperation.playerView.stateVersion,
      idempotencyKey: "v150-family-replacement-open",
    });
    const replacementReplay =
      await replacementMatch.service.loadReplayDiagnostics(
        replacementMatch.matchId,
        "local_analysis",
      );
    expect(replacementReplay.ok).toBe(true);
    if (!replacementReplay.ok) throw new Error(replacementReplay.error.message);
    expect(
      replacementReplay.replay.timeline.some(
        (step) => step.eventFamily === "replacement_and_prevention",
      ),
    ).toBe(true);

    const specialMatch = await joinedV122SpecialZoneMatch(
      "v150-family-special-zone",
    );
    const specialBefore = await bootstrap(
      specialMatch.service,
      specialMatch.matchId,
      specialMatch.runner,
    );
    const specialAction = mustAction(
      specialBefore,
      (action) => action.type === "move_to_set_aside",
    );
    await specialMatch.service.submitAction({
      matchId: specialMatch.matchId,
      side: specialMatch.runner.side,
      sessionToken: specialMatch.runner.sessionToken,
      actionId: specialAction.actionId,
      clientKnownStateVersion: specialBefore.playerView.stateVersion,
      idempotencyKey: "v150-family-special-zone",
    });
    const specialReplay = await specialMatch.service.loadReplayDiagnostics(
      specialMatch.matchId,
      "local_analysis",
    );
    expect(specialReplay.ok).toBe(true);
    if (!specialReplay.ok) throw new Error(specialReplay.error.message);
    expect(
      specialReplay.replay.timeline.some(
        (step) => step.eventFamily === "special_zones_and_control",
      ),
    ).toBe(true);
  });

  it("plays a private two-player match through to a Runner win", async () => {
    const match = await joinedMatch("mp-win-1", {
      agendaPointsToWin: 2,
      matchFormat: "single_game",
    });
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    await putTopCorpAgendaForMatch(match.service, match.matchId);
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "end_turn",
      "end-turn",
    );
    await resolveCorpDiscardIfPending(
      match.service,
      match.matchId,
      match.corp,
      "corp-discard-before-run",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "run-rd",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) => action.type === "access_card",
      "access-rd",
    );
    const steal = await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) => action.type === "steal_agenda",
      "steal",
    );

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
      scoredAgendaCount: 0,
    });
    expect(
      steal.actorPayload.resultSummary?.actionCount,
    ).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(steal.actorPayload.resultSummary)).not.toContain(
      "Simple Agenda",
    );
    expect(JSON.stringify(steal.actorPayload.resultSummary)).not.toContain(
      "cardInstances",
    );

    const corpPayload = await bootstrap(
      match.service,
      match.matchId,
      match.corp,
    );
    expect(corpPayload.resultSummary?.viewerOutcome).toBe("lost");
    expect(corpPayload.legalActions).toEqual([]);
  });

  it("counts a multiaccess breach as one successful run", () => {
    const accessEvent = (eventId: string, accessIndex: number): EventRecord =>
      ({
        eventId,
        matchId: "multiaccess-result-test",
        stateVersionBefore: accessIndex,
        stateVersionAfter: accessIndex + 1,
        stateHashAfter: `fnv1a:${eventId}`,
        publicPayload: {
          eventId,
          type: "access_card",
          stateVersionBefore: accessIndex,
          stateVersionAfter: accessIndex + 1,
          stateHashAfter: `fnv1a:${eventId}`,
          publicPayload: { accessIndex },
        },
        privatePayloadLocalOnly: false,
        hiddenInfoBarrier: true,
      }) as EventRecord;

    expect(
      successfulRunCountForResult([
        accessEvent("first-run-0", 0),
        accessEvent("first-run-1", 1),
        accessEvent("first-run-2", 2),
        accessEvent("second-run-0", 0),
      ]),
    ).toBe(2);
  });

  it("applies the selected, same-as-player, fixed and deterministic random KI deck policies without exposing decklists", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-deck-policy",
    });
    const participantADecks = {
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6",
    };
    const participantBDecks = {
      runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
      corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6",
    };

    const selected = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-selected",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "selected",
    });
    const selectedRecord = await service.loadForTest(selected.matchId);
    expect(selectedRecord?.match.deckSetup.aiDeckPolicy).toBe("selected");
    expect(selectedRecord?.match.deckSetup.assignment).toEqual({
      runnerPlayer: "player_b",
      corpPlayer: "player_a",
    });
    expect(selectedRecord?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_004_snapshot_v0_6",
    );
    expect(selectedRecord?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_004_snapshot_v0_6",
    );

    const sameAsParticipantA = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-same-as-participant-a",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "same_as_participant_a",
    });
    const sameAsParticipantARecord = await service.loadForTest(
      sameAsParticipantA.matchId,
    );
    expect(sameAsParticipantARecord?.match.deckSetup.aiDeckPolicy).toBe(
      "same_as_participant_a",
    );
    expect(sameAsParticipantARecord?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_008_snapshot_v0_8",
    );
    expect(sameAsParticipantARecord?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_004_snapshot_v0_6",
    );
    expect(
      sameAsParticipantARecord?.match.deckSetup.participants?.player_b,
    ).toMatchObject({
      runnerSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpSnapshotId: "demo_corp_004_snapshot_v0_6",
    });
    expect(JSON.stringify(sameAsParticipantA)).not.toContain("cardInstances");

    const fixed = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-fixed",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "fixed",
    });
    const fixedRecord = await service.loadForTest(fixed.matchId);
    expect(fixedRecord?.match.deckSetup.aiDeckPolicy).toBe("fixed");
    expect(fixedRecord?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_008_snapshot_v0_8",
    );
    expect(fixedRecord?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_004_snapshot_v0_6",
    );
    expect(fixedRecord?.match.deckSetup.participants?.player_b).toMatchObject({
      runnerSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpSnapshotId: "demo_corp_008_snapshot_v0_8",
    });

    const randomOne = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-random-seed",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "seeded_random",
    });
    const randomTwo = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "ai-policy-random-seed",
      participantADecks,
      participantBDecks,
      aiDeckPolicy: "seeded_random",
    });
    const randomRecordOne = await service.loadForTest(randomOne.matchId);
    const randomRecordTwo = await service.loadForTest(randomTwo.matchId);
    const validRunnerIds = (snapshotsData08.snapshots as DeckSnapshot[])
      .filter(
        (snapshot) => snapshot.side === "runner" && snapshot.validation.ok,
      )
      .map((snapshot) => snapshot.deckSnapshotId);
    const validCorpIds = (snapshotsData08.snapshots as DeckSnapshot[])
      .filter((snapshot) => snapshot.side === "corp" && snapshot.validation.ok)
      .map((snapshot) => snapshot.deckSnapshotId);
    expect(randomRecordOne?.match.deckSetup.aiDeckPolicy).toBe("seeded_random");
    expect(randomRecordOne?.match.deckSetup.participants?.player_b).toEqual(
      randomRecordTwo?.match.deckSetup.participants?.player_b,
    );
    expect(validRunnerIds).toContain(
      randomRecordOne?.match.deckSetup.participants?.player_b.runnerSnapshotId,
    );
    expect(validCorpIds).toContain(
      randomRecordOne?.match.deckSetup.participants?.player_b.corpSnapshotId,
    );
    expect(randomRecordOne?.match.deckSetup.runnerSnapshotId).toBe(
      randomRecordOne?.match.deckSetup.participants?.player_b.runnerSnapshotId,
    );
    expect(JSON.stringify(randomRecordOne?.match.deckSetup)).not.toContain(
      "cards",
    );
    expect(JSON.stringify(randomOne)).not.toContain("cardInstances");
  });

  it("starts Human-Korp-vs-Runner-KI with the King of the Road Runner AI snapshot", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "kotr-runner-ai-start",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "kotr-runner-ai-start",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "king_of_the_road_runner_ai_snapshot_v1",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      aiDeckPolicy: "selected",
      settings: { agendaPointsToWin: 7, matchFormat: "rules_match" },
    });
    const record = await service.loadForTest(created.matchId);

    expect(created.hostSide).toBe("corp");
    expect(created.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(record?.match.deckSetup.aiDeckPolicy).toBe("selected");
    expect(record?.match.deckSetup.assignment).toEqual({
      runnerPlayer: "player_b",
      corpPlayer: "player_a",
    });
    expect(record?.match.deckSetup.runnerSnapshotId).toBe(
      "king_of_the_road_runner_ai_snapshot_v1",
    );
    expect(record?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_008_snapshot_v0_8",
    );
    expect(
      record?.match.deckSetup.participants?.player_b.runnerSnapshotId,
    ).toBe("king_of_the_road_runner_ai_snapshot_v1");
    expect(record?.match.deckSetup.participants?.player_b.corpSnapshotId).toBe(
      "demo_corp_008_snapshot_v0_8",
    );
    expect(created.playerView.deckMetadata?.opponent.deckName).toBe(
      "King of the Road",
    );
    expect(JSON.stringify(record?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(created)).not.toMatch(
      /onr_v1_006_black-dahlia|onr_v1_108_score|cardInstances|privatePayload|joinToken|tokenHash/,
    );
  });

  it("accepts O:NR origins AI runner and corp snapshots in selected KI deck mode", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "onr-origins-ai-start",
    });

    const runnerAiCreated = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "onr-origins-runner-ai",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "onr_origin_runner_ai_snapshot_v1",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      aiDeckPolicy: "selected",
    });
    const runnerAiRecord = await service.loadForTest(runnerAiCreated.matchId);
    expect(runnerAiRecord?.match.deckSetup.runnerSnapshotId).toBe(
      "onr_origin_runner_ai_snapshot_v1",
    );
    expect(runnerAiCreated.playerView.deckMetadata?.opponent.deckName).toBe(
      "Runner Origins AI - Probe Pressure",
    );

    const corpAiCreated = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "onr-origins-corp-ai",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "onr_origin_corp_ai_snapshot_v1",
      },
      aiDeckPolicy: "selected",
    });
    const corpAiRecord = await service.loadForTest(corpAiCreated.matchId);
    expect(corpAiRecord?.match.deckSetup.corpSnapshotId).toBe(
      "onr_origin_corp_ai_snapshot_v1",
    );
    expect(corpAiCreated.playerView.deckMetadata?.opponent.deckName).toBe(
      "Corp Origins AI - Tax & Punish",
    );
    expect(JSON.stringify(corpAiCreated)).not.toMatch(
      /onr_v1_203_hostile-takeover|onr_v1_297_overtime-incentives|cardInstances|privatePayload|joinToken|tokenHash/,
    );

    const runnerVariantCreated = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "onr-origins-runner-ai-variant",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "onr_origin_runner_ai_event_pressure_snapshot_v1",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      aiDeckPolicy: "selected",
    });
    expect(
      runnerVariantCreated.playerView.deckMetadata?.opponent.deckName,
    ).toBe("Runner Origins AI - Event Pressure");

    const corpVariantCreated = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "onr-origins-corp-ai-variant",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "onr_origin_corp_ai_tag_ops_snapshot_v1",
      },
      aiDeckPolicy: "selected",
    });
    expect(corpVariantCreated.playerView.deckMetadata?.opponent.deckName).toBe(
      "Corp Origins AI - Tag Ops Control",
    );
  });

  it("derives Human-vs-KI random side assignment server-side from the seed", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-random-side",
    });
    const first = await service.createMatch({
      hostSide: "random",
      playMode: "human_vs_ai",
      humanSide: "random",
      seed: "human-ai-random-side",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      aiDeckPolicy: "fixed",
    });
    const second = await service.createMatch({
      hostSide: "random",
      playMode: "human_vs_ai",
      humanSide: "random",
      seed: "human-ai-random-side",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      aiDeckPolicy: "fixed",
    });

    expect(first.hostSide).toBe(second.hostSide);
    expect(first.mode).toBe(second.mode);
    expect(["human_runner_vs_corp_ai", "human_corp_vs_runner_ai"]).toContain(
      first.mode,
    );
    expect(first.matchStatus).toBe("active");
    expect(first.aiTurnPresentation?.pacingMode).toBe("paced");
    expect(JSON.stringify(first)).not.toContain("cardInstances");
  });

  it("creates match series with a validated length between two and six games", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "series-length-selection",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "series-length-five",
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "two_game_side_swap",
        seriesGamesPlanned: 5,
      },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      aiDeckPolicy: "fixed",
    });
    const stored = await storage.load(created.matchId);

    expect(stored?.match.settings.seriesGamesPlanned).toBe(5);
    expect(stored?.match.series).toMatchObject({
      gameNumber: 1,
      gamesPlanned: 5,
      status: "active",
    });

    const bounded = await service.createMatch({
      hostSide: "runner",
      mode: "human_runner_vs_corp_ai",
      seed: "series-length-bounded",
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "two_game_side_swap",
        seriesGamesPlanned: 99,
      },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
      aiDeckPolicy: "fixed",
    });
    expect(
      (await storage.load(bounded.matchId))?.match.series?.gamesPlanned,
    ).toBe(6);

    const httpStorage = new InMemoryMatchStorage();
    const httpService = new MultiplayerService(httpStorage, {
      tokenSalt: "series-length-http",
    });
    const handle = createNetgridHttpServer(httpService);
    const baseUrl = await listen(handle);
    try {
      const response = await fetch(`${baseUrl}/api/matches`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hostSide: "runner",
          mode: "human_runner_vs_corp_ai",
          seed: "series-length-http-four",
          settings: {
            matchFormat: "two_game_side_swap",
            seriesGamesPlanned: 4,
          },
          participantADecks: {
            runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
            corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
          },
          aiDeckPolicy: "fixed",
        }),
      });
      expect(response.status).toBe(201);
      const body = (await response.json()) as { matchId: string };
      expect(
        (await httpStorage.load(body.matchId))?.match.series?.gamesPlanned,
      ).toBe(4);
    } finally {
      await handle.close();
    }
  });

  it("creates the next private series game with a side swap and side-safe standings", async () => {
    const match = await joinedMatch("series-side-swap", {
      agendaPointsToWin: 2,
      matchFormat: "two_game_side_swap",
    });
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    await putTopCorpAgendaForMatch(match.service, match.matchId);
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "end_turn",
      "end-turn",
    );
    await resolveCorpDiscardIfPending(
      match.service,
      match.matchId,
      match.corp,
      "corp-discard-before-run",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "run-rd",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) => action.type === "access_card",
      "access-rd",
    );
    const steal = await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) => action.type === "steal_agenda",
      "steal",
    );

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
      nextAvailable: true,
    });

    const next = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      displayName: "Runner im Seitenwechsel",
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
    expect(nextRecord?.match.isPublic).toBe(oldRecord?.match.isPublic);
    expect(nextRecord?.match.series).toMatchObject({
      seriesId: oldRecord?.match.series?.seriesId,
      status: "active",
      gameNumber: 2,
      gamesPlanned: 2,
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
      previousMatchId: match.matchId,
    });
    expect(nextRecord?.match.series?.results).toHaveLength(1);

    const duplicate = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
    });
    expect("error" in duplicate).toBe(false);
    if ("error" in duplicate) throw new Error(duplicate.error.message);
    expect(duplicate.matchId).toBe(next.matchId);
    expect(duplicate.hostSide).toBe(next.hostSide);
    expect(duplicate.hostSessionToken).not.toBe(next.hostSessionToken);
    expect(duplicate.hostReconnectToken).not.toBe(next.hostReconnectToken);
    expect(duplicate.joinUrl).toBeTruthy();
    expect(
      await match.service.bootstrap(
        duplicate.matchId,
        duplicate.hostSide,
        duplicate.hostSessionToken,
        { allowLobby: true },
      ),
    ).not.toHaveProperty("error");
    expect(
      await match.service.bootstrap(
        next.matchId,
        next.hostSide,
        next.hostSessionToken,
        { allowLobby: true },
      ),
    ).toMatchObject({ error: { code: "unauthorized" } });
  });

  it.each([
    { requested: "summary" as const, stored: "summary" },
    { requested: "detailed" as const, stored: "detailed" },
    { requested: "off" as const, stored: undefined },
  ])(
    "preserves AI trace mode $requested across a private side-swap series",
    async ({ requested, stored }) => {
      const storage = new InMemoryMatchStorage();
      const service = new MultiplayerService(storage, {
        tokenSalt: `series-ai-trace-${requested}`,
      });
      const created = await service.createMatch({
        hostSide: "corp",
        playMode: "human_vs_ai",
        humanSide: "corp",
        seed: `series-ai-trace-${requested}`,
        runnerDifficulty: "hard",
        aiTraceMode: requested,
        settings: { agendaPointsToWin: 7, matchFormat: "two_game_side_swap" },
      });
      const firstRecord = await service.loadForTest(created.matchId);
      if (!firstRecord?.gameState)
        throw new Error("Missing first AI series game");
      firstRecord.match.status = "finished";
      firstRecord.gameState.winner = "corp";
      firstRecord.gameState.gameEndReason = "agenda_points";
      await storage.save(firstRecord);

      const next = await service.startNextSeriesGame(created.matchId, {
        side: "corp",
        sessionToken: created.hostSessionToken,
        displayName: "Trace-Modus-Seitenwechsel",
      });

      expect("error" in next).toBe(false);
      if ("error" in next) throw new Error(next.error.message);
      const nextRecord = await service.loadForTest(next.matchId);
      expect(next.mode).toBe("human_runner_vs_corp_ai");
      expect(nextRecord?.match.aiControllers?.corp?.difficulty).toBe("hard");
      expect(nextRecord?.match.aiTraceMode).toBe(stored);
    },
  );

  it("treats forfeit in game 1 of a private series as a single-game result and keeps series-next available", async () => {
    const match = await joinedMatch("series-forfeit-game-1", {
      agendaPointsToWin: 7,
      matchFormat: "two_game_side_swap",
    });
    const beforeRecord = await match.service.loadForTest(match.matchId);
    if (!beforeRecord?.gameState) throw new Error("Missing series game state");
    const beforeHash = hashState(beforeRecord.gameState);

    const forfeited = await match.service.forfeitMatch({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
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
        nextAvailable: true,
      },
    });

    const stored = await match.service.loadForTest(match.matchId);
    expect(stored?.gameState.winner).toBeFalsy();
    expect(stored?.match.series?.results[0]).toMatchObject({
      matchId: match.matchId,
      gameNumber: 1,
      winner: "corp",
      reason: "forfeit",
      finalStateHash: beforeHash,
    });
    expect(
      (await match.service.replayMatch(match.matchId)).finalStateHash,
    ).toBe(beforeHash);

    const next = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      displayName: "Runner nach Aufgabe",
    });
    expect("error" in next).toBe(false);
    if ("error" in next) throw new Error(next.error.message);
    expect(next.hostSide).toBe("corp");
    expect(next.matchId).not.toBe(match.matchId);
    expect(
      (await match.service.loadForTest(match.matchId))?.match.series
        ?.nextMatchId,
    ).toBe(next.matchId);
  });

  it("closes a private series when the last planned game ends by forfeit", async () => {
    const match = await joinedMatch("series-forfeit-final-game", {
      agendaPointsToWin: 7,
      matchFormat: "two_game_side_swap",
    });
    const record = await match.service.loadForTest(match.matchId);
    if (!record?.gameState || !record.match.series)
      throw new Error("Missing active series record");
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
          finalStateHash: "fnv1a:game1",
        },
      ],
    };
    await (
      match.service as unknown as { storage: MultiplayerStorage }
    ).storage.save(record);

    const beforeHash = hashState(record.gameState);
    const forfeited = await match.service.forfeitMatch({
      matchId: match.matchId,
      side: "corp",
      sessionToken: match.corp.sessionToken,
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
        nextAvailable: false,
      },
    });
    const stored = await match.service.loadForTest(match.matchId);
    expect(stored?.match.series?.status).toBe("finished");
    expect(stored?.match.series?.results).toHaveLength(2);
    const next = await match.service.startNextSeriesGame(match.matchId, {
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
    });
    expect("error" in next).toBe(true);
    if (!("error" in next))
      throw new Error("Expected finished series rejection");
    expect(next.error.code).toBe("series_finished");
  });

  it("uses 10-point game wins and loser agenda points for private series scoring", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "series-agenda-tiebreak",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      mode: "human_corp_vs_runner_ai",
      seed: "series-agenda-tiebreak",
      settings: { agendaPointsToWin: 7, matchFormat: "two_game_side_swap" },
    });
    const record = await storage.load(created.matchId);
    if (!record?.gameState || !record.match.series)
      throw new Error("Expected active series record");

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
          finalStateHash: "hash-game-1",
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
          finalStateHash: hashState(record.gameState),
        },
      ],
    };
    await storage.save(record);

    const payload = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
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
      seriesDecision: "match_points",
    });
  });

  it("keeps personal Runner/Corp deck pairs across a private side-swap series", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "series-personal-decks",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:8787",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "series-personal-decks",
      settings: { agendaPointsToWin: 2, matchFormat: "two_game_side_swap" },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
        corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
      },
    });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Corp B",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const firstRecord = await service.loadForTest(created.matchId);
    expect(firstRecord?.match.deckSetup.assignment).toEqual({
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
    });
    expect(firstRecord?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_008_snapshot_v0_8",
    );
    expect(firstRecord?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_008_snapshot_v0_8",
    );
    expect(firstRecord?.match.deckSetup.participants?.player_a).toMatchObject({
      runnerSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpSnapshotId: "demo_corp_004_snapshot_v0_6",
    });
    expect(firstRecord?.match.deckSetup.participants?.player_b).toMatchObject({
      runnerSnapshotId: "demo_runner_004_snapshot_v0_6",
      corpSnapshotId: "demo_corp_008_snapshot_v0_8",
    });
    expect(JSON.stringify(firstRecord?.match.deckSetup)).not.toContain("cards");

    const runner = {
      side: "runner" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    };
    const corp = {
      side: "corp" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    };
    await forceSetupComplete(service, created.matchId);
    await submit(
      service,
      created.matchId,
      corp,
      (action) => action.type === "mandatory_draw",
      "mandatory",
    );
    await putTopCorpAgendaForMatch(service, created.matchId);
    await submit(
      service,
      created.matchId,
      corp,
      (action) => action.type === "end_turn",
      "end-turn",
    );
    await resolveCorpDiscardIfPending(
      service,
      created.matchId,
      corp,
      "corp-discard-before-run",
    );
    await submit(
      service,
      created.matchId,
      runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "run-rd",
    );
    await submit(
      service,
      created.matchId,
      runner,
      (action) => action.type === "access_card",
      "access-rd",
    );
    const steal = await submit(
      service,
      created.matchId,
      runner,
      (action) => action.type === "steal_agenda",
      "steal",
    );
    expect(steal.actorPayload.resultSummary?.series).toMatchObject({
      viewerPlayer: "player_a",
      viewerWins: 1,
      opponentWins: 0,
      viewerAgendaPoints: 2,
      opponentAgendaPoints: 0,
    });

    const next = await service.startNextSeriesGame(created.matchId, {
      side: runner.side,
      sessionToken: runner.sessionToken,
      displayName: "Teilnehmer A",
    });
    expect("error" in next).toBe(false);
    if ("error" in next) throw new Error(next.error.message);
    const nextRecord = await service.loadForTest(next.matchId);
    expect(next.hostSide).toBe("corp");
    expect(next.playerView.deckMetadata?.own.deckHash).toBe(
      firstRecord?.match.deckSetup.participants?.player_a.corp.deckHash,
    );
    expect(next.playerView.deckMetadata?.opponent.deckHash).toBe(
      firstRecord?.match.deckSetup.participants?.player_b.runner.deckHash,
    );
    expect(nextRecord?.match.deckSetup.assignment).toEqual({
      runnerPlayer: "player_b",
      corpPlayer: "player_a",
    });
    expect(nextRecord?.match.deckSetup.runnerSnapshotId).toBe(
      "demo_runner_004_snapshot_v0_6",
    );
    expect(nextRecord?.match.deckSetup.corpSnapshotId).toBe(
      "demo_corp_004_snapshot_v0_6",
    );
    expect(
      nextRecord?.privateDeckSnapshots?.participants?.player_a.corp
        .deckSnapshotId,
    ).toBe("demo_corp_004_snapshot_v0_6");
    expect(
      nextRecord?.privateDeckSnapshots?.participants?.player_b.runner
        .deckSnapshotId,
    ).toBe("demo_runner_004_snapshot_v0_6");
    expect(nextRecord?.match.series?.results[0]).toMatchObject({
      winner: "runner",
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
      runnerAgendaPoints: 2,
      corpAgendaPoints: 0,
    });
    expect(JSON.stringify(next)).not.toContain("cardInstances");
    expect(JSON.stringify(nextRecord?.match.deckSetup)).not.toContain("cards");
  });

  it("sends side-filtered bootstrap messages over WebSocket", async () => {
    const auditEvents: ConnectionAuditEvent[] = [];
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-test",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:0",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "ws-bootstrap",
    });
    const handle = createNetgridHttpServer(service, {
      connectionAudit: { record: (event) => auditEvents.push(event) },
    });
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server address");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: created.hostSessionToken,
            side: created.hostSide,
          },
        }),
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
          payload: {
            matchId: created.matchId,
            sessionToken: created.hostSessionToken,
            side: created.hostSide,
          },
        }),
      );
      await waitForMessage(replacement, "lobby_update");
      const oldMessage = await oldClosed;
      expect(JSON.stringify(oldMessage)).toContain("reconnected_elsewhere");
      socket.close();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const stored = await service.loadForTest(created.matchId);
      expect(
        stored?.sessions.find((session) => session.side === created.hostSide)
          ?.connected,
      ).toBe(true);
      replacement.close();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(auditEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ event: "ws_open" }),
          expect.objectContaining({
            event: "ws_join_ok",
            matchId: created.matchId,
            side: created.hostSide,
          }),
          expect.objectContaining({
            event: "ws_replaced_by_reconnect",
            matchId: created.matchId,
            side: created.hostSide,
            code: 4000,
          }),
          expect.objectContaining({
            event: "ws_close",
            matchId: created.matchId,
            side: created.hostSide,
            ignoredAsReplaced: true,
          }),
        ]),
      );
      expect(JSON.stringify(auditEvents)).not.toContain(
        created.hostSessionToken,
      );
      expect(JSON.stringify(auditEvents)).not.toContain(
        created.hostReconnectToken,
      );
      expect(JSON.stringify(auditEvents)).not.toMatch(
        /Simple Agenda|cardInstances|privatePayload|decklist/i,
      );
    } finally {
      socket.close();
      await handle.close();
    }
  });

  it("keeps the WebSocket server alive when an AI operation throws", async () => {
    const auditEvents: ConnectionAuditEvent[] = [];
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-ai-failure-boundary",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:0",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ws-ai-failure-boundary",
    });
    service.advanceAi = async () => {
      throw new Error("private test failure details");
    };
    const handle = createNetgridHttpServer(service, {
      connectionAudit: { record: (event) => auditEvents.push(event) },
    });
    const baseUrl = await listen(handle);
    const socket = new WebSocket(`${baseUrl.replace("http", "ws")}/ws`);

    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: created.hostSessionToken,
            side: created.hostSide,
          },
        }),
      );
      await waitForMessage(socket, "state_update");

      const operationError = waitForMessage(socket, "error");
      socket.send(
        JSON.stringify({
          type: "advance_ai",
          payload: {
            knownStateVersion: 0,
            knownMatchVersion: 0,
            mode: "single_step",
          },
        }),
      );
      expect(await operationError).toEqual({
        type: "error",
        payload: {
          code: "server_operation_failed",
          message:
            "Die Serveraktion konnte nicht verarbeitet werden. Bitte versuche es erneut.",
        },
      });

      const pong = waitForMessage(socket, "pong");
      socket.send(
        JSON.stringify({
          type: "ping",
          payload: { clientTime: 123 },
        }),
      );
      expect(await pong).toMatchObject({
        type: "pong",
        payload: { clientTime: 123 },
      });
      expect((await fetch(`${baseUrl}/health`)).status).toBe(200);
      expect(auditEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            event: "ws_error",
            matchId: created.matchId,
            side: created.hostSide,
            errorCode: "Error",
          }),
        ]),
      );
      expect(JSON.stringify(auditEvents)).not.toContain(
        "private test failure details",
      );
    } finally {
      socket.close();
      await handle.close();
    }
  });

  it("clears pending undo prompts over WebSocket after a response", async () => {
    const match = await joinedMatch("ws-undo-clear");
    const mandatory = await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "ws-undo-clear-mandatory",
    );
    const targetEventId = `evt_${mandatory.receipt.stateVersionAfter}`;
    const handle = createNetgridHttpServer(match.service);
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server address");
    const corpSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    const runnerSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await Promise.all([waitForOpen(corpSocket), waitForOpen(runnerSocket)]);
      corpSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: match.matchId,
            sessionToken: match.corp.sessionToken,
            side: "corp",
          },
        }),
      );
      runnerSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: match.matchId,
            sessionToken: match.runner.sessionToken,
            side: "runner",
          },
        }),
      );
      await Promise.all([
        waitForMessage(corpSocket, "state_update"),
        waitForMessage(runnerSocket, "state_update"),
      ]);

      const corpPendingUpdate = waitForMessage(corpSocket, "state_update");
      const runnerPendingUpdate = waitForMessage(runnerSocket, "state_update");
      const corpUndoRequest = waitForMessage(corpSocket, "undo_request");
      const runnerUndoRequest = waitForMessage(runnerSocket, "undo_request");
      corpSocket.send(
        JSON.stringify({
          type: "request_undo",
          payload: { targetEventId, reason: "Misclick" },
        }),
      );

      expect(
        (
          messagePayload(await corpPendingUpdate) as {
            pendingUndo?: { needsResponse?: boolean };
          }
        ).pendingUndo?.needsResponse,
      ).toBe(false);
      expect(
        (
          messagePayload(await runnerPendingUpdate) as {
            pendingUndo?: { needsResponse?: boolean };
          }
        ).pendingUndo?.needsResponse,
      ).toBe(true);
      const runnerUndoMessage = (await runnerUndoRequest) as {
        payload?: { undoRequestId?: string; needsResponse?: boolean };
      };
      const runnerUndoPayload = runnerUndoMessage.payload;
      expect(runnerUndoPayload?.needsResponse).toBe(true);
      expect(JSON.stringify(await corpUndoRequest)).not.toMatch(
        /Simple Agenda|cardInstances|privatePayload|decklist/i,
      );
      expect(runnerUndoPayload?.undoRequestId).toBeTruthy();

      const corpClearedUpdate = waitForMessage(corpSocket, "state_update");
      const runnerClearedUpdate = waitForMessage(runnerSocket, "state_update");
      runnerSocket.send(
        JSON.stringify({
          type: "accept_undo",
          payload: { undoRequestId: runnerUndoPayload!.undoRequestId },
        }),
      );

      expect(
        (messagePayload(await corpClearedUpdate) as { pendingUndo?: unknown })
          .pendingUndo,
      ).toBeNull();
      expect(
        (messagePayload(await runnerClearedUpdate) as { pendingUndo?: unknown })
          .pendingUndo,
      ).toBeNull();
      const corpBootstrap = await match.service.bootstrap(
        match.matchId,
        "corp",
        match.corp.sessionToken,
      );
      expect("error" in corpBootstrap).toBe(false);
      if ("error" in corpBootstrap)
        throw new Error(corpBootstrap.error.message);
      expect(corpBootstrap.pendingUndo).toBeUndefined();
      const reconnected = await match.service.reconnectMatch(match.matchId, {
        side: "runner",
        sessionToken: match.runner.sessionToken,
        reconnectToken: match.runner.reconnectToken,
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
      publicServerBaseUrl: "http://127.0.0.1:0",
    });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "ws-choice",
    });
    expect(created.joinUrl).toBeTruthy();
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Corp",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const stored = await storage.load(created.matchId);
    expect(stored).toBeDefined();
    if (!stored) throw new Error("Missing stored match");
    stored.gameState.pendingChoice = choiceRequest(stored.gameState, "runner");
    await storage.save(stored);

    const runnerBootstrap = await service.bootstrap(
      created.matchId,
      "runner",
      created.hostSessionToken,
    );
    const corpBootstrap = await service.bootstrap(
      created.matchId,
      "corp",
      joined.sessionToken,
    );
    expect("error" in runnerBootstrap).toBe(false);
    expect("error" in corpBootstrap).toBe(false);
    if ("error" in runnerBootstrap || "error" in corpBootstrap)
      throw new Error("Bootstrap failed");
    expect(runnerBootstrap.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(corpBootstrap.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpBootstrap)).not.toContain(
      "Runner private option",
    );

    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "runner",
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.pendingChoice?.choiceId).toBe("choice_v093_runner");

    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server address");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: reconnected.sessionToken,
            side: "runner",
          },
        }),
      );
      const choiceMessage = await waitForMessage(socket, "choice_request");
      const choice = (
        choiceMessage as {
          payload?: {
            choice?: {
              choiceId?: string;
              options?: Array<{ label?: string }>;
            } | null;
          };
        }
      ).payload?.choice;
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
      publicServerBaseUrl: "http://127.0.0.1:0",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "ws-status",
    });
    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server address");
    const hostSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    let runnerSocket: WebSocket | undefined;

    try {
      await waitForOpen(hostSocket);
      hostSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: created.hostSessionToken,
            side: "corp",
          },
        }),
      );
      const waitingUpdate = await waitForMessage(hostSocket, "lobby_update");
      expect(messagePayload(waitingUpdate).matchStatus).toBe("pending");

      expect(created.joinUrl).toBeTruthy();
      if (!created.joinUrl) throw new Error("Missing join URL");
      const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
      if (!joinToken) throw new Error("Missing join token");
      const joined = await service.joinMatch(created.matchId, {
        token: joinToken,
        displayName: "Runner",
      });
      if ("error" in joined) throw new Error(joined.error.message);

      runnerSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
      await waitForOpen(runnerSocket);
      runnerSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: joined.sessionToken,
            side: "runner",
          },
        }),
      );
      const activeUpdate = await waitForMessage(hostSocket, "state_update");
      expect(messagePayload(activeUpdate).matchStatus).toBe("active");
    } finally {
      hostSocket.close();
      runnerSocket?.close();
      await handle.close();
    }
  });

  it("refreshes the opponent with a terminal forfeit payload when the forfeiting tab leaves immediately", async () => {
    const match = await joinedMatch("ws-forfeit-close-refresh");
    const handle = createNetgridHttpServer(match.service);
    const baseUrl = await listen(handle);
    const wsUrl = baseUrl.replace(/^http:/, "ws:") + "/ws";
    const corpSocket = new WebSocket(wsUrl);
    const runnerSocket = new WebSocket(wsUrl);

    try {
      await Promise.all([waitForOpen(corpSocket), waitForOpen(runnerSocket)]);
      corpSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: match.matchId,
            sessionToken: match.corp.sessionToken,
            side: "corp",
          },
        }),
      );
      runnerSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: match.matchId,
            sessionToken: match.runner.sessionToken,
            side: "runner",
          },
        }),
      );
      await Promise.all([
        waitForMessage(corpSocket, "state_update"),
        waitForMessage(runnerSocket, "state_update"),
      ]);

      const firstTerminal = waitForMessage(runnerSocket, "match_finished");
      const response = await fetch(
        `${baseUrl}/api/matches/${encodeURIComponent(match.matchId)}/forfeit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            side: "corp",
            sessionToken: match.corp.sessionToken,
          }),
        },
      );
      expect(response.status).toBe(200);
      const firstTerminalPayload = messagePayload(await firstTerminal) as {
        matchStatus?: string;
        winner?: Side | "draw";
        resultSummary?: {
          reason?: string;
          winnerSide?: Side;
          loserSide?: Side;
        };
      };
      expect(firstTerminalPayload).toMatchObject({
        matchStatus: "forfeited",
        winner: "runner",
        resultSummary: {
          reason: "forfeit",
          winnerSide: "runner",
          loserSide: "corp",
        },
      });

      const refreshedTerminal = waitForMessage(runnerSocket, "match_finished");
      corpSocket.close();
      const refreshedPayload = messagePayload(await refreshedTerminal) as {
        matchStatus?: string;
        winner?: Side | "draw";
        resultSummary?: {
          reason?: string;
          winnerSide?: Side;
          loserSide?: Side;
        };
      };
      expect(refreshedPayload).toMatchObject({
        matchStatus: "forfeited",
        winner: "runner",
        resultSummary: {
          reason: "forfeit",
          winnerSide: "runner",
          loserSide: "corp",
        },
      });
    } finally {
      corpSocket.close();
      runnerSocket.close();
      await handle.close();
    }
  });

  it("keeps both browser tabs in the ready lobby after the joiner submits decks", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-join-deck-lobby",
      publicWebBaseUrl: "http://127.0.0.1:3100",
      publicServerBaseUrl: "http://127.0.0.1:0",
    });
    const created = await service.createMatch({
      mode: "human_vs_human",
      hostSide: "runner",
      seed: "ws-join-deck-lobby",
      countdownSeconds: 5,
      settings: { matchFormat: "single_game" },
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
        corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6",
      },
    });
    const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
      "joinToken",
    );
    if (!joinToken) throw new Error("Missing join token");

    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server address");
    const hostSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    let joinerSocket: WebSocket | undefined;

    try {
      await waitForOpen(hostSocket);
      hostSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: {
            matchId: created.matchId,
            sessionToken: created.hostSessionToken,
            side: created.hostSide,
          },
        }),
      );
      const waitingUpdate = await waitForMessage(hostSocket, "lobby_update");
      const waitingPayload = messagePayload(waitingUpdate) as {
        matchStatus?: string;
        startLobby?: {
          participants?: {
            player_b?: { connected?: boolean; runnerDeckReady?: boolean };
          };
        };
      };
      expect(waitingPayload.matchStatus).toBe("pending");
      expect(waitingPayload.startLobby?.participants?.player_b?.connected).toBe(
        false,
      );
      expect(
        waitingPayload.startLobby?.participants?.player_b?.runnerDeckReady,
      ).toBe(false);

      const joinedResponse = await fetch(
        `http://127.0.0.1:${address.port}/api/matches/${encodeURIComponent(created.matchId)}/join`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token: joinToken,
            displayName: "Teilnehmer B",
            runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
            corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
          }),
        },
      );
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
          payload: {
            matchId: created.matchId,
            sessionToken: joined.sessionToken,
            side: joined.side,
          },
        }),
      );
      const hostReadyUpdate = await waitForMessage(hostSocket, "lobby_update");
      const hostPayload = messagePayload(hostReadyUpdate) as {
        matchStatus?: string;
        startLobby?: {
          participants?: {
            player_b?: { runnerDeckReady?: boolean; corpDeckReady?: boolean };
          };
        };
      };
      expect(hostPayload.matchStatus).toBe("ready_check");
      expect(
        hostPayload.startLobby?.participants?.player_b?.runnerDeckReady,
      ).toBe(true);
      expect(
        hostPayload.startLobby?.participants?.player_b?.corpDeckReady,
      ).toBe(true);
      expect(JSON.stringify(hostPayload)).not.toContain("deckHash");
      expect(JSON.stringify(hostPayload)).not.toContain("cardInstances");
    } finally {
      hostSocket.close();
      joinerSocket?.close();
      await handle.close();
    }
  });

  it("runs Human Runner vs Corp AI matches without a second player", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-runner-service",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai",
      corpDifficulty: "normal",
    });

    expect(created.mode).toBe("human_runner_vs_corp_ai");
    expect(created.joinUrl).toBeUndefined();
    expect(created.playerView.side).toBe("runner");
    expect(created.playerView.activeSide).toBe("runner");
    expect(created.pendingChoice?.source).toBe("setup.mulligan");
    expect(created.matchVersion).toBe(1);
    expect(created.aiTurnPresentation).toEqual({
      canAdvanceAi: false,
      pacingMode: "paced",
    });
    expect(
      created.legalActions.some((action) => action.type === "resolve_choice"),
    ).toBe(true);

    const stored = await service.loadForTest(created.matchId);
    expect(stored?.match.aiControllers?.corp?.type).toBe("ai");
    expect(
      stored?.privateDeckSnapshots?.participants.player_b.corp.deckSnapshotId,
    ).toBe(stored?.match.deckSetup.corpSnapshotId);
    expect(
      stored?.privateDeckSnapshots?.participants.player_b.corp.cards.length,
    ).toBeGreaterThan(0);
    expect(JSON.stringify(created)).not.toContain("cardInstances");
    expect(JSON.stringify(created)).not.toContain("Simple Agenda");

    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "runner-ai-mode-setup",
    );
    expect(afterSetup.aiTurnPresentation).toEqual({
      activeAiSide: "corp",
      canAdvanceAi: true,
      pacingMode: "paced",
    });

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(advanced.requesterPayload.playerView.stateVersion).toBe(
      afterSetup.playerView.stateVersion + 1,
    );
    expect(advanced.requesterPayload.aiTurnPresentation?.activeAiSide).toBe(
      "corp",
    );
    expect(advanced.publicEvent?.publicPayload.aiExplanation).toBeTruthy();
    expect(JSON.stringify(advanced.requesterPayload)).not.toContain(
      "cardInstances",
    );
    expect(JSON.stringify(advanced.requesterPayload)).not.toContain(
      "Simple Agenda",
    );
  });

  it("runs observable AI-vs-AI matches one persisted step at a time and allows host cancellation", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "observable-ai-vs-ai-service",
    });
    const created = await service.createMatch({
      mode: "ai_vs_ai",
      hostSide: "runner",
      displayName: "Beobachter",
      seed: "observable-ai-vs-ai",
      runnerDifficulty: "normal",
      corpDifficulty: "normal",
      aiDeckPolicy: "fixed",
      aiTraceMode: "detailed",
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "two_game_side_swap",
        playerClock: {
          mode: "player_clock",
          startingTimeMs: 10 * 60_000,
          gracePeriodMs: 10_000,
        },
      },
    });

    expect(created).toMatchObject({
      mode: "ai_vs_ai",
      matchStatus: "active",
      hostSide: "runner",
      legalActions: [],
      aiTurnPresentation: {
        activeAiSide: "runner",
        canAdvanceAi: true,
        pacingMode: "paced",
      },
    });
    expect(created.joinUrl).toBeUndefined();

    const before = await service.loadForTest(created.matchId);
    if (!before?.gameState)
      throw new Error("Missing observable AI-vs-AI state");
    expect(before.match.settings.matchFormat).toBe("two_game_side_swap");
    expect(before.match.playerClock?.mode).toBe("none");
    expect(before.match.aiControllers?.runner?.type).toBe("ai");
    expect(before.match.aiControllers?.corp?.type).toBe("ai");
    expect(before.match.deckSetup.assignment).toEqual({
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
    });
    expect(before.eventLog).toHaveLength(
      created.playerView.publicEvents.length,
    );
    const initialStateVersion = before.gameState.stateVersion;
    const initialEventCount = before.eventLog.length;

    const forbiddenAction = await service.submitAction({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      actionId: "observer-must-not-act",
      clientKnownStateVersion: initialStateVersion,
      idempotencyKey: "observer-must-not-act",
    });
    expect(forbiddenAction.ok).toBe(false);
    if (forbiddenAction.ok)
      throw new Error("Expected observer PlayerAction rejection");
    expect(forbiddenAction.error.code).toBe("ai_action_forbidden");

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: initialStateVersion,
      knownMatchVersion: created.matchVersion,
      mode: "until_human",
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(advanced.requesterPayload.legalActions).toEqual([]);

    const afterStep = await service.loadForTest(created.matchId);
    if (!afterStep?.gameState)
      throw new Error("Missing stepped observable AI-vs-AI state");
    expect(afterStep.gameState.stateVersion).toBe(initialStateVersion + 1);
    expect(afterStep.eventLog).toHaveLength(initialEventCount + 1);
    expect(afterStep.aiDecisionTraces).toHaveLength(1);
    const hashBeforeCancel = hashState(afterStep.gameState);

    const cancelled = await service.cancelMatch({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) throw new Error(cancelled.error.message);
    const cancelledPayload = expectSidePayload(cancelled.actorPayload);
    expect(cancelledPayload.matchStatus).toBe("cancelled");
    expect(cancelledPayload.winner).toBeUndefined();
    expect(cancelledPayload.lifecycleResult).toMatchObject({
      status: "cancelled",
      reason: "cancel",
    });

    const afterCancel = await service.loadForTest(created.matchId);
    if (!afterCancel?.gameState)
      throw new Error("Missing cancelled observable AI-vs-AI state");
    expect(hashState(afterCancel.gameState)).toBe(hashBeforeCancel);
    expect(afterCancel.match.winner).toBeUndefined();
    expect(afterCancel.tokens.every((token) => Boolean(token.revokedAt))).toBe(
      true,
    );
  });

  it("creates the second observable AI-vs-AI series game with side-swapped AI identities", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "observable-ai-vs-ai-series",
    });
    const created = await service.createMatch({
      mode: "ai_vs_ai",
      hostSide: "runner",
      seed: "observable-ai-vs-ai-series",
      runnerDifficulty: "hard",
      corpDifficulty: "easy",
      aiDeckPolicy: "seeded_random",
      aiTraceMode: "detailed",
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "two_game_side_swap",
        playerClock: { mode: "none" },
      },
    });
    const firstRecord = await service.loadForTest(created.matchId);
    if (!firstRecord?.gameState)
      throw new Error("Missing first observable AI-vs-AI series game");
    const firstParticipants = firstRecord.match.deckSetup.participants;
    if (!firstParticipants)
      throw new Error("Missing AI-vs-AI participant deck pairs");
    firstRecord.match.status = "finished";
    firstRecord.gameState.winner = "runner";
    firstRecord.gameState.gameEndReason = "agenda_points";
    await storage.save(firstRecord);

    const next = await service.startNextSeriesGame(created.matchId, {
      side: "runner",
      sessionToken: created.hostSessionToken,
      displayName: "Beobachter",
    });

    expect("error" in next).toBe(false);
    if ("error" in next) throw new Error(next.error.message);
    expect(next).toMatchObject({
      mode: "ai_vs_ai",
      hostSide: "runner",
      matchStatus: "active",
      legalActions: [],
      aiTurnPresentation: { canAdvanceAi: true },
    });
    expect(next.joinUrl).toBeUndefined();
    const nextRecord = await service.loadForTest(next.matchId);
    expect(nextRecord?.match.settings.matchFormat).toBe("two_game_side_swap");
    expect(nextRecord?.match.deckSetup.assignment).toEqual({
      runnerPlayer: "player_b",
      corpPlayer: "player_a",
    });
    expect(nextRecord?.match.aiControllers?.runner?.difficulty).toBe("easy");
    expect(nextRecord?.match.aiControllers?.corp?.difficulty).toBe("hard");
    expect(nextRecord?.match.deckSetup.runnerSnapshotId).toBe(
      firstParticipants.player_b.runnerSnapshotId,
    );
    expect(nextRecord?.match.deckSetup.corpSnapshotId).toBe(
      firstParticipants.player_a.corpSnapshotId,
    );
    expect(nextRecord?.match.deckSetup.aiDeckPolicy).toBe("seeded_random");
    expect(nextRecord?.match.series).toMatchObject({
      gameNumber: 2,
      gamesPlanned: 2,
      runnerPlayer: "player_b",
      corpPlayer: "player_a",
      previousMatchId: created.matchId,
    });
    expect(nextRecord?.match.series?.results).toHaveLength(1);
  });

  it("runs an observable AI-vs-AI match beyond 120 actions to a regular replayable ending", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "observable-ai-vs-ai-long-run-service",
    });
    const created = await service.createMatch({
      mode: "ai_vs_ai",
      hostSide: "runner",
      seed: "seed08",
      runnerDifficulty: "normal",
      corpDifficulty: "normal",
      aiDeckPolicy: "fixed",
      aiTraceMode: "detailed",
      settings: {
        agendaPointsToWin: 7,
        matchFormat: "rules_match",
        playerClock: { mode: "none" },
      },
    });

    let sessionToken = created.hostSessionToken;
    let reconnectToken = created.hostReconnectToken;
    let stateVersion = created.playerView.stateVersion;
    let matchVersion = created.matchVersion;
    let actions = 0;
    let lastPayload: { winner?: Side | "draw"; matchStatus?: string } = created;
    const initial = await service.loadForTest(created.matchId);
    if (!initial?.gameState)
      throw new Error("Missing initial observable AI-vs-AI state");
    const initialEventCount = initial.eventLog.length;

    while (!lastPayload.winner && actions < 400) {
      const advanced = await service.advanceAi({
        matchId: created.matchId,
        side: "runner",
        sessionToken,
        knownStateVersion: stateVersion,
        knownMatchVersion: matchVersion,
        mode: "until_human",
      });
      expect(advanced.ok).toBe(true);
      if (!advanced.ok) throw new Error(advanced.error.message);
      actions += 1;
      expect(advanced.requesterPayload.playerView.stateVersion).toBe(
        stateVersion + 1,
      );
      expect(advanced.requesterPayload.legalActions).toEqual([]);
      stateVersion = advanced.requesterPayload.playerView.stateVersion;
      matchVersion = advanced.requesterPayload.matchVersion;
      lastPayload = advanced.requesterPayload;

      if (actions === 121) {
        expect(lastPayload.matchStatus).toBe("active");
        expect(lastPayload.winner).toBeUndefined();
        const reconnected = await service.reconnectMatch(created.matchId, {
          side: "runner",
          sessionToken,
          reconnectToken,
        });
        expect("error" in reconnected).toBe(false);
        if ("error" in reconnected) throw new Error(reconnected.error.message);
        expect(reconnected.playerView?.stateVersion).toBe(stateVersion);
        expect(reconnected.legalActions).toEqual([]);
        expect(reconnected.aiTurnPresentation).toMatchObject({
          canAdvanceAi: true,
        });
        sessionToken = reconnected.sessionToken;
        reconnectToken = reconnected.reconnectToken;
        matchVersion = reconnected.matchVersion;
      }
    }

    expect(actions).toBeGreaterThan(120);
    expect(actions).toBeLessThan(400);
    expect(lastPayload.matchStatus).toBe("finished");
    expect(["runner", "corp"]).toContain(lastPayload.winner);
    const finished = await service.loadForTest(created.matchId);
    if (!finished?.gameState)
      throw new Error("Missing completed observable AI-vs-AI state");
    expect(finished.gameState.stateVersion).toBe(
      created.playerView.stateVersion + actions,
    );
    expect(finished.eventLog).toHaveLength(initialEventCount + actions);
    expect(finished.aiDecisionTraces).toHaveLength(actions);
    expect(finished.lifecycleResult).toBeUndefined();
    expect(["agenda_points", "corp_deck_empty"]).toContain(
      finished.gameState.gameEndReason,
    );

    const replay = await service.replayMatch(created.matchId);
    expect(replay).toEqual({
      ok: true,
      finalStateHash: hashState(finished.gameState),
      errors: [],
    });
  }, 120_000);

  it("rejects AI match start when the selected AI snapshot is internally invalid", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-invalid-runtime-snapshot-start",
    });
    const invalidCorpSnapshot = deckSnapshotByIdForTest(
      "demo_corp_008_snapshot_v0_8",
    );
    invalidCorpSnapshot.publicMetadata = {
      ...invalidCorpSnapshot.publicMetadata,
      cardPoolSnapshotId: `${invalidCorpSnapshot.publicMetadata.cardPoolSnapshotId}:stale`,
    };
    const invalidHash = computeDeckHash(invalidCorpSnapshot);
    invalidCorpSnapshot.deckHash = invalidHash;
    invalidCorpSnapshot.publicMetadata.deckHash = invalidHash;

    await expect(
      service.createMatch({
        mode: "human_runner_vs_corp_ai",
        hostSide: "runner",
        seed: "ai-invalid-runtime-snapshot-start",
        participantADecks: {
          runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
          corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
        },
        participantBDecks: {
          runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
          corpDeckSnapshot: invalidCorpSnapshot,
        },
        aiDeckPolicy: "selected",
        corpDifficulty: "normal",
      }),
    ).rejects.toThrow(/ai_deck_snapshot_invalid/);
  });

  it("rejects AI advance when the stored ownDeckSnapshot is missing", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-missing-runtime-snapshot-advance",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ai-missing-runtime-snapshot-advance",
      corpDifficulty: "normal",
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "ai-missing-runtime-snapshot-setup",
    );
    const record = await storage.load(created.matchId);
    if (!record?.privateDeckSnapshots || !record.gameState)
      throw new Error("Missing stored AI match");
    const beforeEventCount = record.eventLog.length;
    const beforeStateVersion = record.gameState.stateVersion;
    delete (
      record.privateDeckSnapshots.participants.player_b as Partial<
        typeof record.privateDeckSnapshots.participants.player_b
      >
    ).corp;
    await storage.save(record);

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "single_step",
    });

    expect(advanced.ok).toBe(false);
    if (advanced.ok) throw new Error("Expected missing snapshot rejection");
    expect(advanced.error.code).toBe("ai_deck_snapshot_missing");
    const afterAdvance = await storage.load(created.matchId);
    expect(afterAdvance?.eventLog).toHaveLength(beforeEventCount);
    expect(afterAdvance?.gameState?.stateVersion).toBe(beforeStateVersion);
  });

  it("rejects AI advance when the stored ownDeckSnapshot is stale", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-stale-runtime-snapshot-advance",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ai-stale-runtime-snapshot-advance",
      corpDifficulty: "normal",
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "ai-stale-runtime-snapshot-setup",
    );
    const record = await storage.load(created.matchId);
    if (
      !record?.privateDeckSnapshots?.participants.player_b.corp ||
      !record.gameState
    )
      throw new Error("Missing stored AI match");
    const beforeEventCount = record.eventLog.length;
    const beforeStateVersion = record.gameState.stateVersion;
    record.privateDeckSnapshots.participants.player_b.corp.deckSnapshotId = `${record.privateDeckSnapshots.participants.player_b.corp.deckSnapshotId}:stale`;
    await storage.save(record);

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "single_step",
    });

    expect(advanced.ok).toBe(false);
    if (advanced.ok) throw new Error("Expected stale snapshot rejection");
    expect(advanced.error.code).toBe("ai_deck_snapshot_stale");
    const afterAdvance = await storage.load(created.matchId);
    expect(afterAdvance?.eventLog).toHaveLength(beforeEventCount);
    expect(afterAdvance?.gameState?.stateVersion).toBe(beforeStateVersion);
  });

  it("runs Human Corp vs Runner AI through the same action pipeline", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-corp-service",
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai",
      runnerDifficulty: "normal",
    });

    const before = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    expect(before.pendingChoice?.source).toBe("setup.mulligan");
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "corp-ai-mode-setup",
    );
    const mandatory = mustAction(
      afterSetup,
      (action) => action.type === "mandatory_draw",
    );
    const mandatoryResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: afterSetup.playerView.stateVersion,
      idempotencyKey: "corp-ai-mode-mandatory",
    });
    expect(mandatoryResult.ok).toBe(true);
    if (!mandatoryResult.ok) throw new Error(mandatoryResult.error.message);

    const afterMandatory = mandatoryResult.actorPayload;
    const endTurn = mustAction(
      afterMandatory,
      (action) => action.type === "end_turn",
    );
    const endTurnResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: endTurn.actionId,
      clientKnownStateVersion: afterMandatory.playerView.stateVersion,
      idempotencyKey: "corp-ai-mode-end",
    });
    expect(endTurnResult.ok).toBe(true);
    if (!endTurnResult.ok) throw new Error(endTurnResult.error.message);

    expect(endTurnResult.actorPayload.playerView.stateVersion).toBe(
      afterMandatory.playerView.stateVersion + 1,
    );
    expect(endTurnResult.actorPayload.pendingChoice?.source).toBe(
      "discard_phase",
    );
    const afterDiscard = await submitFirstChoice(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "corp-ai-mode-discard",
    );
    expect(afterDiscard.aiTurnPresentation).toEqual({
      activeAiSide: "runner",
      canAdvanceAi: true,
      pacingMode: "paced",
    });
    expect(afterDiscard.opponentStatus.connected).toBe(true);
    expect(JSON.stringify(afterDiscard)).not.toContain("Simple Fracter");

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterDiscard.playerView.stateVersion,
      knownMatchVersion: afterDiscard.matchVersion,
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(advanced.requesterPayload.playerView.stateVersion).toBeGreaterThan(
      afterDiscard.playerView.stateVersion,
    );
    expect(JSON.stringify(advanced.requesterPayload)).not.toContain(
      "Simple Fracter",
    );
  });

  it("waits for an explicit Human Corp rez decision during Runner AI runs", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-runner-rez-window",
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai-rez-window",
      runnerDifficulty: "normal",
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    let gameState = createGameAfterSetup({
      matchId: created.matchId,
      seed: "server-runner-ai-rez-window",
    });
    expectCurrentRulesBaseline(gameState);
    gameState = applyEngineAction(
      gameState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    gameState = applyEngineAction(
      gameState,
      "corp",
      (action) => action.type === "end_turn",
    );
    if (gameState.pendingChoice?.source === "discard_phase")
      gameState = applyEngineChoice(gameState, "corp", [
        String(gameState.pendingChoice.options[0]?.id),
      ]);
    putCorpIceOnServerForTest(gameState, "rd", "simple_barrier_ice");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(gameState.activeSide).toBe("corp");
    expect(gameState.timingPoint).toBe("run.approach_ice");

    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.stateSnapshots = [
      stateSnapshotForTest(
        created.matchId,
        gameState,
        record.match.matchVersion,
        "snap_ai_rez_window",
      ),
    ];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const before = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    expect(before.aiTurnPresentation).toEqual({
      canAdvanceAi: false,
      pacingMode: "paced",
    });
    expect(before.legalActions.map((action) => action.type).sort()).toEqual([
      "decline_rez",
      "rez_ice",
    ]);

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: before.playerView.stateVersion,
      knownMatchVersion: before.matchVersion,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(false);
    if (advanced.ok)
      throw new Error(
        "Expected advance_ai to wait for the human Corp rez decision",
      );
    expect(advanced.error.code).toBe("ai_not_active");

    const declineRez = before.legalActions.find(
      (action) => action.type === "decline_rez",
    );
    if (!declineRez) throw new Error("Missing decline rez action");
    const declined = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: declineRez.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "human-corp-decline-rez",
    });
    expect(declined.ok).toBe(true);
    if (!declined.ok) throw new Error(declined.error.message);
    expect(declined.actorPayload.playerView.activeSide).toBe("runner");
    expect(declined.actorPayload.playerView.timingPoint).toBe(
      "run.jack_out_window",
    );
    expect(declined.actorPayload.aiTurnPresentation).toEqual({
      activeAiSide: "runner",
      canAdvanceAi: true,
      pacingMode: "paced",
    });
    expect(declined.publicEvent?.publicPayload).toMatchObject({
      actionType: "decline_rez",
    });
    expect(declined.publicEvent?.publicPayload).not.toHaveProperty(
      "autoPacedPass",
    );

    const continued = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: declined.actorPayload.playerView.stateVersion,
      knownMatchVersion: declined.actorPayload.matchVersion,
      mode: "single_step",
    });
    expect(continued.ok).toBe(true);
    if (!continued.ok) throw new Error(continued.error.message);
    expect(continued.requesterPayload.playerView.stateVersion).toBeGreaterThan(
      declined.actorPayload.playerView.stateVersion,
    );
  });

  it("waits for Human Corp Forged Activation Orders response during Runner AI turns", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-runner-forged-response",
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai-forged-response",
      runnerDifficulty: "normal",
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    const runnerDeck: DeckDefinition = {
      ...DEMO_DECKS.demo_runner_001,
      id: "server_runner_ai_forged_runner",
      name: "Server Runner AI Forged Runner",
      cards: [
        { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
        ...DEMO_DECKS.demo_runner_001.cards,
      ],
    };
    const corpDeck: DeckDefinition = {
      ...DEMO_DECKS.demo_corp_004,
      id: "server_runner_ai_forged_corp",
      name: "Server Runner AI Forged Corp",
      cards: DEMO_DECKS.demo_corp_004.cards.some(
        (card) => card.id === "simple_barrier_ice",
      )
        ? DEMO_DECKS.demo_corp_004.cards
        : [
            { id: "simple_barrier_ice", quantity: 1 },
            ...DEMO_DECKS.demo_corp_004.cards,
          ],
    };
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "server-runner-ai-forged-response-engine",
        runnerDeck,
        corpDeck,
      }),
    );
    gameState.runner.credits = 5;
    gameState.corp.credits = 0;
    const targetIceId = putCorpIceOnServerForTest(
      gameState,
      "hq",
      "simple_barrier_ice",
    );
    moveRunnerCardToGripForTest(
      gameState,
      "onr_v1_086_forged-activation-orders",
    );
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinitionForServerTest(gameState, action) ===
          "onr_v1_086_forged-activation-orders",
    );
    const targetOptionId = gameState.pendingChoice?.options.find(
      (option) => option.value === targetIceId,
    )?.id;
    if (!targetOptionId)
      throw new Error("Missing Forged Activation Orders target option");
    gameState = applyEngineChoice(gameState, "runner", [targetOptionId]);
    expect(gameState.activeSide).toBe("runner");
    expect(gameState.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining(
        "card_implementation.corp_choice_rez_or_trash_ice_decision",
      ),
    });
    expect(getLegalActions(gameState, "runner")).toEqual([]);
    expect(
      getLegalActions(gameState, "corp").map((action) => action.type),
    ).toEqual(["resolve_choice"]);

    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.stateSnapshots = [
      stateSnapshotForTest(
        created.matchId,
        gameState,
        record.match.matchVersion,
        "snap_ai_forged_response",
      ),
    ];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const before = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    expect(before.playerView.activeSide).toBe("runner");
    expect(before.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining(
        "card_implementation.corp_choice_rez_or_trash_ice_decision",
      ),
    });
    expect(before.pendingChoice?.options.map((option) => option.id)).toEqual([
      "trash_ice",
    ]);
    expect(before.aiTurnPresentation).toEqual({
      canAdvanceAi: false,
      pacingMode: "paced",
    });
    expect(before.legalActions.map((action) => action.type)).toEqual([
      "resolve_choice",
    ]);

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: before.playerView.stateVersion,
      knownMatchVersion: before.matchVersion,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(false);
    if (advanced.ok)
      throw new Error(
        "Expected advance_ai to wait for Human Corp Forged response",
      );
    expect(advanced.error.code).toBe("ai_not_active");

    const action = mustAction(
      before,
      (candidate) => candidate.type === "resolve_choice",
    );
    const resolved = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: action.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      selectedChoices: {
        choiceId: before.pendingChoice?.choiceId,
        selectedOptionIds: ["trash_ice"],
      },
      idempotencyKey: "human-corp-forged-trash",
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) throw new Error(resolved.error.message);
    expect(resolved.actorPayload.pendingChoice).toBeUndefined();
    expect(resolved.actorPayload.aiTurnPresentation).toEqual({
      activeAiSide: "runner",
      canAdvanceAi: true,
      pacingMode: "paced",
    });
    expect(resolved.publicEvent?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      actor: "corp",
      corpDecision: "trash_ice",
    });
    expect(resolved.publicEvent?.publicPayload).not.toHaveProperty(
      "v1922RunnerEventAbility",
    );
    expect(JSON.stringify(resolved.actorPayload)).not.toContain(
      "cardInstances",
    );
  });

  it("does not stall Runner AI on Forged Activation Orders without unrezzed ICE", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-runner-forged-no-unrezzed",
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai-forged-no-unrezzed",
      runnerDifficulty: "hard",
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    const runnerDeck: DeckDefinition = {
      ...DEMO_DECKS.demo_runner_001,
      id: "server_runner_ai_forged_no_unrezzed_runner",
      name: "Server Runner AI Forged No Unrezzed Runner",
      cards: [
        { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
        ...DEMO_DECKS.demo_runner_001.cards,
      ],
    };
    const corpDeck: DeckDefinition = {
      ...DEMO_DECKS.demo_corp_004,
      id: "server_runner_ai_forged_no_unrezzed_corp",
      name: "Server Runner AI Forged No Unrezzed Corp",
      cards: [
        { id: "onr_v1_263_reinforced-wall", quantity: 1 },
        ...DEMO_DECKS.demo_corp_004.cards,
      ],
    };
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "server-runner-ai-forged-no-unrezzed-engine",
        runnerDeck,
        corpDeck,
      }),
    );
    gameState.runner.credits = 1;
    gameState.corp.credits = 5;
    const rezzedIceId = putCorpIceOnServerForTest(
      gameState,
      "hq",
      "onr_v1_263_reinforced-wall",
    );
    gameState.cardInstances[rezzedIceId] = {
      ...gameState.cardInstances[rezzedIceId]!,
      rezzed: true,
      faceup: true,
    };
    moveRunnerCardToGripForTest(
      gameState,
      "onr_v1_086_forged-activation-orders",
    );
    expect(
      getLegalActions(gameState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinitionForServerTest(gameState, action) ===
            "onr_v1_086_forged-activation-orders",
      ),
    ).toBe(false);

    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.stateSnapshots = [
      stateSnapshotForTest(
        created.matchId,
        gameState,
        record.match.matchVersion,
        "snap_ai_forged_no_unrezzed",
      ),
    ];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const before = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    expect(before.aiTurnPresentation).toEqual({
      activeAiSide: "runner",
      canAdvanceAi: true,
      pacingMode: "paced",
    });

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: before.playerView.stateVersion,
      knownMatchVersion: before.matchVersion,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(JSON.stringify(advanced.publicEvent)).not.toContain(
      "onr_v1_086_forged-activation-orders",
    );
    expect(advanced.requesterPayload.playerView.stateVersion).toBeGreaterThan(
      before.playerView.stateVersion,
    );
  });

  it("waits for Human Corp Mystery Box review before Runner AI installs a shown program", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-runner-mystery-box-review",
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai-mystery-box-review",
      runnerDifficulty: "normal",
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    const runnerDeck: DeckDefinition = {
      id: "server_runner_ai_mystery_box_runner",
      name: "Server Runner AI Mystery Box Runner",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_043_mystery-box", quantity: 1 },
        { id: "simple_decoder", quantity: 1 },
        { id: "simple_economy_event", quantity: 8 },
      ],
    };
    const corpDeck: DeckDefinition = {
      id: "server_runner_ai_mystery_box_corp",
      name: "Server Runner AI Mystery Box Corp",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: "simple_agenda", quantity: 3 },
        { id: "simple_economy_operation", quantity: 6 },
      ],
    };
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "server-runner-ai-mystery-box-review-engine",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    expectCurrentRulesBaseline(gameState);
    gameState.runner.credits = 20;
    gameState.runner.memoryLimit = 8;
    moveRunnerCardToGripForTest(gameState, "onr_v1_043_mystery-box");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinitionForServerTest(gameState, action) ===
          "onr_v1_043_mystery-box",
    );
    putRunnerCardOnTopOfStackForTest(gameState, "simple_economy_event");
    const decoderId = putRunnerCardOnTopOfStackForTest(
      gameState,
      "simple_decoder",
    );
    putCorpCardOnTopOfRdForTest(gameState, "simple_agenda");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinitionForServerTest(gameState, action) ===
          "onr_v1_043_mystery-box",
    );
    expect(gameState.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining(
        "p3_38.revealed_stack_program_install_corp_review",
      ),
    });

    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.stateSnapshots = [
      stateSnapshotForTest(
        created.matchId,
        gameState,
        record.match.matchVersion,
        "snap_ai_mystery_box_review",
      ),
    ];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const beforeReview = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in beforeReview).toBe(false);
    if ("error" in beforeReview) throw new Error(beforeReview.error.message);
    expect(beforeReview.pendingChoice?.source).toContain(
      "p3_38.revealed_stack_program_install_corp_review",
    );
    expect(
      beforeReview.pendingChoice?.options.some(
        (option) => option.value === decoderId,
      ),
    ).toBe(true);
    expect(beforeReview.aiTurnPresentation).toEqual({
      canAdvanceAi: false,
      pacingMode: "paced",
    });

    const blocked = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: beforeReview.playerView.stateVersion,
      knownMatchVersion: beforeReview.matchVersion,
      mode: "single_step",
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok)
      throw new Error("Expected advance_ai to wait for the human Corp review");
    expect(blocked.error.code).toBe("ai_not_active");

    const afterReview = await submitChoice(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "done",
      "human-corp-mystery-box-review",
    );
    expect(afterReview.pendingChoice).toBeUndefined();
    expect(afterReview.aiTurnPresentation).toEqual({
      activeAiSide: "runner",
      canAdvanceAi: true,
      pacingMode: "paced",
    });

    const runnerChoice = await service.advanceAi({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterReview.playerView.stateVersion,
      knownMatchVersion: afterReview.matchVersion,
      mode: "single_step",
    });
    expect(runnerChoice.ok).toBe(true);
    if (!runnerChoice.ok) throw new Error(runnerChoice.error.message);
    expect(runnerChoice.publicEvent?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction:
        "p3_38_look_top_stack_show_to_corp_then_install_matching",
      installedProgramDefinitionId: "simple_decoder",
      selfTrashed: true,
    });
    expect(JSON.stringify(runnerChoice.requesterPayload)).not.toContain(
      "cardInstances",
    );
  });

  it("advances Runner AI through Krash breaking Filter into R&D access without post-pass jack-out", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-runner-krash-filter-access",
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai-krash-filter-access",
      runnerDifficulty: "normal",
      participantADecks: {
        runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
      },
      participantBDecks: {
        runnerDeckSnapshotId: "demo_runner_130_snapshot_v1_3_0",
        corpDeckSnapshotId: "demo_corp_130_snapshot_v1_3_0",
      },
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
        { id: "simple_economy_event", quantity: 8 },
      ],
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
        { id: "simple_agenda", quantity: 3 },
      ],
    };
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "server-runner-ai-krash-filter-access-engine",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    expectCurrentRulesBaseline(gameState);
    gameState.runner.credits = 5;
    gameState.corp.credits = 5;
    moveRunnerCardToGripForTest(gameState, "onr_v1_039_krash");
    gameState = applyEngineAction(gameState, "runner", (action) => {
      const cardId = String(action.payload?.cardId ?? "");
      return (
        action.type === "install_card" &&
        gameState.cardInstances[cardId]?.definitionId === "onr_v1_039_krash"
      );
    });
    putCorpIceOnServerForTest(gameState, "rd", "onr_v1_244_filter");
    putCorpCardOnTopOfRdForTest(gameState, "simple_draw_operation");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(gameState.activeSide).toBe("corp");
    expect(gameState.timingPoint).toBe("run.approach_ice");

    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.stateSnapshots = [
      stateSnapshotForTest(
        created.matchId,
        gameState,
        record.match.matchVersion,
        "snap_ai_krash_filter_access",
      ),
    ];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const beforeRez = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in beforeRez).toBe(false);
    if ("error" in beforeRez) throw new Error(beforeRez.error.message);
    expect(beforeRez.legalActions.map((action) => action.type).sort()).toEqual([
      "decline_rez",
      "rez_ice",
    ]);

    const rezAction = beforeRez.legalActions.find(
      (action) => action.type === "rez_ice",
    );
    if (!rezAction) throw new Error("Missing rez action");
    const rezzed = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: rezAction.actionId,
      clientKnownStateVersion: beforeRez.playerView.stateVersion,
      idempotencyKey: "human-corp-rez-filter-for-runner-ai",
    });
    expect(rezzed.ok).toBe(true);
    if (!rezzed.ok) throw new Error(rezzed.error.message);
    expect(rezzed.publicEvent?.publicPayload).toMatchObject({
      actionType: "rez_ice",
    });

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
        mode: "single_step",
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
      aiReasonCode: "plan_first.runner.convert_run_window",
    });

    const passIceStep = await advanceRunnerAiStep(
      "continue after broken Filter",
    );
    expect(passIceStep.publicEvent?.publicPayload).toMatchObject({
      actionType: "continue_run",
      encounterContinue: true,
    });

    const accessWindowStep = await advanceRunnerAiStep(
      "continue from server movement to access",
    );
    expect(accessWindowStep.publicEvent?.publicPayload.actionType).toBe(
      "continue_run",
    );
    expect(accessWindowStep.publicEvent?.publicPayload.aiReasonCode).toBe(
      "plan_first.runner.convert_run_window",
    );
    expect(
      JSON.stringify(accessWindowStep.publicEvent?.publicPayload),
    ).not.toMatch(
      /ambush|simple_economy_operation|privatePayload|cardInstances/i,
    );

    const accessStep = await advanceRunnerAiStep("access R&D");
    expect(accessStep.publicEvent?.publicPayload).toMatchObject({
      actionType: "access_card",
      aiReasonCode: "plan_first.runner.convert_run_window",
    });
    expect(actionTypes).toEqual([
      "break_subroutine",
      "continue_run",
      "continue_run",
      "access_card",
    ]);
    expect(reasonCodes).not.toContain(
      "runner.run.jack_out_before_access_low_value",
    );
    expect(actionTypes).not.toContain("jack_out");
    expect(JSON.stringify(accessStep.requesterPayload)).not.toMatch(
      /Simple Draw Operation|simple_draw_operation|privatePayload|cardInstances/i,
    );
  });

  it("redacts R&D access card identities from Corp payloads", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "central-access-redaction",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "central-access-redaction",
    });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });

    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing record");
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "central-access-redaction-engine",
      }),
    );
    putCorpCardOnTopOfRdForTest(gameState, "simple_agenda");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) => action.type === "access_card",
    );
    record.gameState = gameState;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.match.matchVersion += 1;
    await storage.save(record);

    const corpPayload = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in corpPayload).toBe(false);
    if ("error" in corpPayload) throw new Error(corpPayload.error.message);
    expect(JSON.stringify(corpPayload.eventTail)).not.toContain(
      "Simple Agenda",
    );
    expect(JSON.stringify(corpPayload.playerView.publicEvents)).not.toContain(
      "Simple Agenda",
    );
    expect(corpPayload.eventTail.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      serverLabel: "R&D",
      redactedKind: "accessed_card",
    });
  });

  it("redacts active R&D trash choices from Corp live and reconnect payloads", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "rd-upgrade-trash-redaction",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "rd-upgrade-trash-redaction",
    });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);
    const runner = {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    };

    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing record");
    const gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "rd-upgrade-trash-redaction-engine",
        runnerDeckId: "demo_runner_004",
        corpDeckId: "demo_corp_004",
      }),
    );
    gameState.runner.credits = 10;
    const accessedId = putCorpCardOnTopOfRdForTest(gameState, "simple_upgrade");
    for (const [cardId, card] of Object.entries(gameState.cardInstances)) {
      if (cardId !== accessedId && card.definitionId === "simple_upgrade") {
        removeEverywhereForTest(gameState, cardId);
        gameState.corp.rd.push(cardId as CardInstanceId);
        gameState.cardInstances[cardId] = {
          ...card,
          zone: { side: "corp", zone: "rd" },
          faceup: false,
          rezzed: false,
        };
      }
    }
    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.match.matchVersion += 1;
    await storage.save(record);

    await submit(
      service,
      created.matchId,
      runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "rd-upgrade-trash-redaction-start",
    );
    const accessed = await submit(
      service,
      created.matchId,
      runner,
      (action) => action.type === "access_card",
      "rd-upgrade-trash-redaction-access",
    );

    expect(accessed.actorPayload.playerView.run?.accessedCard).toMatchObject({
      known: true,
      definitionId: "simple_upgrade",
      title: "Simple Upgrade",
    });
    expect(
      accessed.actorPayload.legalActions.map((action) => action.type),
    ).toEqual(expect.arrayContaining(["trash_accessed_card", "decline_trash"]));

    const corpLivePayload = accessed.opponentPayload;
    expect(corpLivePayload.playerView.run?.accessedCard).toMatchObject({
      known: false,
    });
    expect(corpLivePayload.playerView.run?.accessedCard).not.toHaveProperty(
      "definitionId",
    );
    expect(corpLivePayload.playerView.run?.accessedCard).not.toHaveProperty(
      "title",
    );
    expect(corpLivePayload.playerView.run?.accessedCard).not.toHaveProperty(
      "type",
    );
    expect(corpLivePayload.playerView.run?.accessedCard).not.toHaveProperty(
      "trashCost",
    );
    expect(corpLivePayload.pendingChoice).toBeUndefined();
    expect(corpLivePayload.legalActions).toEqual([]);
    expect(JSON.stringify(corpLivePayload)).not.toMatch(
      /Simple Upgrade|simple_upgrade|trash_accessed_card|decline_trash/i,
    );
    expect(corpLivePayload.eventTail.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      serverLabel: "R&D",
      redactedKind: "accessed_card",
    });

    const corpBootstrap = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in corpBootstrap).toBe(false);
    if ("error" in corpBootstrap) throw new Error(corpBootstrap.error.message);
    const corpReconnect = await service.reconnectMatch(created.matchId, {
      side: "corp",
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    });
    expect("error" in corpReconnect).toBe(false);
    if ("error" in corpReconnect) throw new Error(corpReconnect.error.message);
    for (const payload of [corpBootstrap, corpReconnect]) {
      expect(payload.playerView.run?.accessedCard).toMatchObject({
        known: false,
      });
      expect(payload.pendingChoice).toBeUndefined();
      expect(payload.legalActions).toEqual([]);
      expect(JSON.stringify(payload)).not.toMatch(
        /Simple Upgrade|simple_upgrade|trash_accessed_card|decline_trash/i,
      );
    }

    const declined = await submit(
      service,
      created.matchId,
      runner,
      (action) => action.type === "decline_trash",
      "rd-upgrade-trash-redaction-decline",
    );
    expect(JSON.stringify(declined.opponentPayload)).not.toMatch(
      /Simple Upgrade|simple_upgrade/i,
    );
    expect(
      JSON.stringify(declined.opponentPayload.eventTail.at(-1)?.publicPayload),
    ).not.toMatch(/Simple Upgrade|simple_upgrade|upgrade|trashCost/i);
  });

  it("keeps HQ access card identities visible in Corp payloads", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "hq-access-visible",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "hq-access-visible",
    });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });

    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing record");
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "hq-access-visible-engine",
      }),
    );
    moveCorpCardToHqForTest(gameState, "simple_economy_operation");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) => action.type === "access_card",
    );
    record.gameState = gameState;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.match.matchVersion += 1;
    await storage.save(record);

    const corpPayload = await service.bootstrap(
      created.matchId,
      "corp",
      created.hostSessionToken,
    );
    expect("error" in corpPayload).toBe(false);
    if ("error" in corpPayload) throw new Error(corpPayload.error.message);
    const eventTailPayload = corpPayload.eventTail.at(-1)?.publicPayload;
    const playerViewPayload =
      corpPayload.playerView.publicEvents.at(-1)?.publicPayload;
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
    const service = new MultiplayerService(storage, {
      tokenSalt: "belief-reconnect-rd",
    });
    const created = await service.createMatch({
      hostSide: "corp",
      seed: "belief-reconnect-rd",
    });
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, {
      token: joinToken,
      displayName: "Runner",
    });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing record");
    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "belief-reconnect-rd-engine",
      }),
    );
    putCorpCardOnTopOfRdForTest(gameState, "simple_economy_operation");
    putCorpCardOnTopOfRdForTest(gameState, "simple_agenda");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) => action.type === "access_card",
    );
    record.gameState = gameState;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.match.matchVersion += 1;
    await storage.save(record);

    const storedWithHiddenDecoy = await storage.load(created.matchId);
    expect(JSON.stringify(storedWithHiddenDecoy?.gameState)).toContain(
      "simple_economy_operation",
    );

    const livePayload = await service.bootstrap(
      created.matchId,
      "runner",
      joined.sessionToken,
    );
    expect("error" in livePayload).toBe(false);
    if ("error" in livePayload) throw new Error(livePayload.error.message);
    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "runner",
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);

    const liveBelief = reconstructBeliefState(
      sidePayloadBeliefInput(livePayload, "runner", "live"),
    );
    const reconnectBelief = reconstructBeliefState(
      sidePayloadBeliefInput(reconnected, "runner", "reconnect"),
    );
    const reconnectSerialized = JSON.stringify(reconnected);
    const beliefSerialized = JSON.stringify(reconnectBelief);

    expect(beliefStateInvariantSignature(reconnectBelief)).toBe(
      beliefStateInvariantSignature(liveBelief),
    );
    expect(reconnectBelief.knownPositionMemory?.[0]).toMatchObject({
      zone: "rd",
      positionKey: "top",
      definitionId: "simple_agenda",
    });
    expect(reconnectSerialized).not.toMatch(
      /privatePayload|cardInstances|privateDeckSnapshots|simple_economy_operation/i,
    );
    expect(beliefSerialized).not.toMatch(
      /privatePayload|cardInstances|privateDeckSnapshots|simple_economy_operation/i,
    );
  });

  it("rejects advance_ai when the session or version is wrong", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-advance-auth",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai-auth",
      corpDifficulty: "normal",
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "ai-auth-setup",
    );

    const stale = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion + 1,
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale rejection");
    expect(stale.error.code).toBe("stale_state");
    expect(stale.payload?.side).toBe("runner");

    const wrongToken = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: "wrong",
      knownStateVersion: afterSetup.playerView.stateVersion,
    });
    expect(wrongToken.ok).toBe(false);
    if (wrongToken.ok) throw new Error("Expected token rejection");
    expect(wrongToken.error.code).toBe("unauthorized");

    const first = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      mode: "until_human",
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error.message);
    expect(first.requesterPayload.playerView.activeSide).toBe("runner");
    expect(first.requesterPayload.aiTurnPresentation?.canAdvanceAi).toBe(false);
  });

  it("keeps randomized Corp ICE selection actor-private, atomic, and replayable", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-randomized-ice-selection",
      chooseAiAction: (input, options): AiDecision => {
        const hqIce = input.legalActions.find(
          (action) =>
            action.type === "install_card" &&
            action.payload?.placement === "ice" &&
            action.payload.serverId === "hq" &&
            typeof action.payload.cardId === "string",
        );
        const rdIce = input.legalActions.find(
          (action) =>
            action.type === "install_card" &&
            action.payload?.placement === "ice" &&
            action.payload.serverId === "rd" &&
            action.payload.cardId === hqIce?.payload?.cardId,
        );
        if (hqIce && rdIce) {
          if (!input.matchId)
            throw new Error("Randomized AI input is missing match binding.");
          const quote = options?.quoteRandomizedIceInstallSelection?.({
            schemaVersion:
              ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
            matchId: input.matchId,
            side: "corp",
            stateVersion: input.playerView.stateVersion,
            timingPoint: input.playerView.timingPoint,
            planStepId: "plan:corp.defend_servers:test-near-tie",
            candidates: [
              { actionId: hqIce.actionId, targetServerId: "hq" },
              { actionId: rdIce.actionId, targetServerId: "rd" },
            ],
          });
          if (!quote?.ok)
            throw new Error(
              quote?.error.message ?? "Randomized Engine quote is missing.",
            );
          return {
            selectionKind: "engine_randomized_ice_install_selection",
            engineCommand: {
              kind: "engine_randomized_ice_install_selection",
              quote: quote.quote,
            },
            reasonCode: "test.randomized_ice_near_tie",
            explanation:
              "Select one of two Engine-certified central ICE installs.",
            consideredActionIds: [hqIce.actionId, rdIce.actionId],
            fallbackUsed: false,
            evidence: ["test_randomized_ice_near_tie"],
            decisionDebug: {
              schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
              aiLevel: 2,
              summary: "Engine-certified randomized central ICE selection.",
              planKind: "corp.defend_servers",
              selectedActionType: "install_card",
              fallbackUsed: false,
            },
            timeoutUsed: false,
            profileId: input.profileId,
            difficulty: input.difficulty,
            confidence: 1,
            reason: "test.randomized_ice_near_tie",
          };
        }
        return chooseRuntimeAiAction(input, options);
      },
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "near-0",
      corpDifficulty: "normal",
      aiTraceMode: "detailed",
    });
    await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "randomized-ice-setup",
    );

    let before = await service.loadForTest(created.matchId);
    for (let step = 0; step < 4; step += 1) {
      if (!before?.gameState)
        throw new Error("Missing randomized ICE test state.");
      const iceActions = getLegalActions(before.gameState, "corp").filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          (action.payload.serverId === "hq" ||
            action.payload.serverId === "rd"),
      );
      if (iceActions.length >= 2) break;
      const advanced = await service.advanceAi({
        matchId: created.matchId,
        side: "runner",
        sessionToken: created.hostSessionToken,
        mode: "single_step",
      });
      expect(advanced.ok ? "ok" : advanced.error.code).toBe("ok");
      before = await service.loadForTest(created.matchId);
    }
    if (!before?.gameState)
      throw new Error("Missing Corp action state for randomized selection.");
    expect(
      getLegalActions(before.gameState, "corp").filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.placement === "ice" &&
          (action.payload.serverId === "hq" ||
            action.payload.serverId === "rd"),
      ).length,
    ).toBeGreaterThanOrEqual(2);

    const stateVersionBefore = before.gameState.stateVersion;
    const randomCounterBefore = before.gameState.randomCounter;
    const eventCountBefore = before.gameState.eventLog.length;
    const preview = await service.previewAi({
      matchId: created.matchId,
      requesterSide: "runner",
      targetSide: "corp",
      sessionToken: created.hostSessionToken,
    });
    expect(preview.ok).toBe(false);
    if (preview.ok)
      throw new Error("Randomized selection preview must not draw.");
    expect(preview.error.code).toBe("preview_side_forbidden");
    expect(JSON.stringify(preview)).not.toMatch(
      /candidateFingerprint|test-near-tie|engine_randomized_ice_install_selection/,
    );
    const afterPreview = await service.loadForTest(created.matchId);
    expect(afterPreview?.gameState.stateVersion).toBe(stateVersionBefore);
    expect(afterPreview?.gameState.randomCounter).toBe(randomCounterBefore);
    expect(afterPreview?.gameState.eventLog).toHaveLength(eventCountBefore);

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(true);
    const after = await service.loadForTest(created.matchId);
    if (!after?.gameState)
      throw new Error("Missing state after randomized ICE selection.");
    expect(after.gameState.stateVersion).toBe(stateVersionBefore + 1);
    expect(after.gameState.randomCounter).toBe(randomCounterBefore + 1);
    const event = after.gameState.eventLog.at(-1);
    expect(event?.privatePayload?.corp?.action).toMatchObject({
      kind: "engine_randomized_ice_install_selection",
      quote: {
        visibility: "private_to_actor",
        planStepId: "plan:corp.defend_servers:test-near-tie",
      },
    });
    const receipt = event?.privatePayload?.corp
      ?.randomizedIceInstallSelectionReceipt as
      | { selectedLegalAction?: LegalAction }
      | undefined;
    expect(receipt?.selectedLegalAction?.type).toBe("install_card");
    expect(receipt?.selectedLegalAction?.payload?.placement).toBe("ice");
    expect(JSON.stringify(after.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /candidateFingerprint|candidates|test-near-tie/,
    );
    expect(after.aiDecisionTraces?.at(-1)?.selectedActionId).toBe(
      receipt?.selectedLegalAction?.actionId,
    );

    const replay = await service.loadReplayDiagnostics(
      created.matchId,
      "runner",
    );
    expect(replay.ok).toBe(true);
    if (!replay.ok) throw new Error(replay.error.message);
    expect(replay.replay.metadata.replayOk).toBe(true);
    const randomStep = replay.replay.timeline.find(
      (step) => step.eventId === event?.eventId,
    );
    expect(randomStep?.stateHashCheck.ok).toBe(true);
    expect(randomStep?.randomDrawCounters).toEqual([randomCounterBefore]);
    expect(
      replay.replay.randomDrawRecords.find(
        (entry) => entry.counter === randomCounterBefore,
      )?.purpose,
    ).toBe("engine_randomized_ice_install_selection");
    expect(JSON.stringify(replay.replay)).not.toMatch(
      /candidateFingerprint|test-near-tie|corp\.install_card\..*\.(?:hq|rd)\./,
    );
  });

  it("rejects foreign-side Punish previews while binding live Corp quotes without exposing them", async () => {
    const quoteBindings: {
      matchId: string;
      stateVersion: number;
      timingPoint: string;
      complete: boolean;
    }[] = [];
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-state-bound-punish-quote",
      chooseAiAction: (input, options): AiDecision => {
        if (
          input.playerView.activeSide !== "corp" ||
          input.playerView.timingPoint !== "corp_action.main"
        ) {
          return chooseRuntimeAiAction(input, options);
        }
        const action = input.legalActions[0];
        if (!action || !input.matchId)
          throw new Error("Missing legal state-bound Punish test input.");
        const quote = options?.quoteCorpPunishRoute?.({
          schemaVersion: CORP_PUNISH_ROUTE_QUOTE_SCHEMA_VERSION,
          matchId: input.matchId,
          side: "corp",
          stateVersion: input.playerView.stateVersion,
          timingPoint: input.playerView.timingPoint,
          campaignId: "test:server-state-bound-punish",
          routeId: "test:server-missing-source-route",
          steps: [
            {
              stepId: "test:server-missing-source-step",
              order: 0,
              kind: "meat_damage",
              sourceCardInstanceId: "missing-server-source",
              sourceCapabilityId:
                "missing_server_definition:missing_capability",
              sourceCapabilityBindingKind: "card_spec_capability_key",
            },
          ],
        });
        if (!quote?.ok)
          throw new Error(
            quote?.error.message ??
              "Server did not provide a state-bound Punish quote.",
          );
        expect(quote.quote.incompleteReasons).toEqual(["source_unavailable"]);
        quoteBindings.push({
          matchId: quote.quote.matchId,
          stateVersion: quote.quote.stateVersion,
          timingPoint: quote.quote.timingPoint,
          complete: quote.quote.complete,
        });
        return {
          actionId: action.actionId,
          reasonCode: "test.state_bound_punish_quote",
          explanation:
            "Select a LegalAction after reading a state-bound Engine quote.",
          consideredActionIds: [action.actionId],
          fallbackUsed: false,
          evidence: ["test_state_bound_punish_quote"],
          timeoutUsed: false,
          profileId: input.profileId,
          difficulty: input.difficulty,
          confidence: 1,
          reason: "test.state_bound_punish_quote",
        };
      },
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ai-state-bound-punish-quote",
      corpDifficulty: "normal",
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "state-bound-punish-setup",
    );
    const corpMulligan = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      knownMatchVersion: afterSetup.matchVersion,
      mode: "single_step",
    });
    if (!corpMulligan.ok) throw new Error(corpMulligan.error.message);
    expect(corpMulligan.ok).toBe(true);
    quoteBindings.length = 0;
    const before = await service.loadForTest(created.matchId);
    if (!before?.gameState)
      throw new Error("Missing state-bound Punish test state.");
    expect(before.gameState.timingPoint).toBe("corp_action.main");

    const preview = await service.previewAi({
      matchId: created.matchId,
      requesterSide: "runner",
      targetSide: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: before.gameState.stateVersion,
      knownMatchVersion: before.match.matchVersion,
    });

    expect(preview).toMatchObject({
      ok: false,
      error: { code: "preview_side_forbidden" },
    });
    expect(quoteBindings).toEqual([]);
    const afterPreview = await service.loadForTest(created.matchId);
    expect(afterPreview?.gameState.stateVersion).toBe(
      before.gameState.stateVersion,
    );
    expect(afterPreview?.gameState.eventLog).toHaveLength(
      before.gameState.eventLog.length,
    );
    expect(afterPreview?.gameState.randomCounter).toBe(
      before.gameState.randomCounter,
    );
    expect(afterPreview?.gameState.randomDrawRecords).toEqual(
      before.gameState.randomDrawRecords,
    );
    expect(afterPreview?.gameState.winner).toBe(before.gameState.winner);

    quoteBindings.length = 0;
    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: before.gameState.stateVersion,
      knownMatchVersion: before.match.matchVersion,
      mode: "single_step",
    });

    expect(advanced.ok).toBe(true);
    expect(quoteBindings).toEqual([
      {
        matchId: created.matchId,
        stateVersion: before.gameState.stateVersion,
        timingPoint: before.gameState.timingPoint,
        complete: false,
      },
    ]);
    const after = await service.loadForTest(created.matchId);
    expect(after?.gameState.stateVersion).toBe(
      before.gameState.stateVersion + 1,
    );
    expect(
      JSON.stringify(after?.gameState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(
      /server-state-bound-punish|server-missing-source-route|requestEcho|missing-server-source/,
    );
  });

  it("does not preview or execute a substitute action when the AI decision action is unknown", async () => {
    let rejectAiDecision = false;
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-invalid-decision-no-substitute",
      chooseAiAction: (input, options): AiDecision =>
        rejectAiDecision
          ? {
              actionId: "missing-ai-action",
              reasonCode: "test.invalid_ai_action",
              explanation:
                "Test decision references an action outside current LegalActions.",
              consideredActionIds: input.legalActions.map(
                (action) => action.actionId,
              ),
              fallbackUsed: false,
              evidence: ["test_invalid_ai_action"],
              timeoutUsed: false,
              profileId: input.profileId,
              difficulty: input.difficulty,
              confidence: 0,
              reason: "test.invalid_ai_action",
            }
          : chooseRuntimeAiAction(input, options),
    });
    const previewMatch = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ai-invalid-decision-preview-no-substitute",
      corpDifficulty: "normal",
    });
    const runner = {
      side: "runner" as const,
      sessionToken: previewMatch.hostSessionToken,
      reconnectToken: previewMatch.hostReconnectToken,
    };
    await submitChoice(
      service,
      previewMatch.matchId,
      runner,
      "keep",
      "invalid-ai-action-preview-setup",
    );
    const previewRecord = await storage.load(previewMatch.matchId);
    if (!previewRecord?.gameState)
      throw new Error("Missing preview match state");
    if (previewRecord.gameState.pendingChoice?.side === "corp") {
      const optionId =
        previewRecord.gameState.pendingChoice.options.find(
          (option) => option.id === "keep",
        )?.id ?? previewRecord.gameState.pendingChoice.options[0]?.id;
      if (!optionId) throw new Error("Missing Corp setup choice");
      previewRecord.gameState = applyEngineChoice(
        previewRecord.gameState,
        "corp",
        [String(optionId)],
      );
    }
    previewRecord.gameState = toRunnerTurnEngine(previewRecord.gameState);
    await storage.save(previewRecord);
    const runnerPreviewTurn = await bootstrap(
      service,
      previewMatch.matchId,
      runner,
    );
    expect(runnerPreviewTurn.playerView.activeSide).toBe("runner");
    rejectAiDecision = true;
    const beforePreview = await service.loadForTest(previewMatch.matchId);

    const preview = await service.previewAi({
      matchId: previewMatch.matchId,
      requesterSide: "runner",
      targetSide: "runner",
      sessionToken: previewMatch.hostSessionToken,
      knownStateVersion: runnerPreviewTurn.playerView.stateVersion,
      knownMatchVersion: runnerPreviewTurn.matchVersion,
    });

    expect(preview.ok).toBe(false);
    if (preview.ok) throw new Error("Expected preview rejection");
    expect(preview.error.code).toBe("ai_decision_action_not_legal");
    const afterPreview = await service.loadForTest(previewMatch.matchId);
    expect(afterPreview).toEqual(beforePreview);

    const executionMatch = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ai-invalid-decision-execution-no-substitute",
      corpDifficulty: "normal",
      aiPacingMode: "paced",
    });
    const executionTurn = await submitChoice(
      service,
      executionMatch.matchId,
      {
        side: "runner",
        sessionToken: executionMatch.hostSessionToken,
        reconnectToken: executionMatch.hostReconnectToken,
      },
      "keep",
      "invalid-ai-action-execution-setup",
    );
    const beforeAdvance = await service.loadForTest(executionMatch.matchId);
    if (!beforeAdvance?.gameState)
      throw new Error("Missing state before invalid AI execution");

    const advanced = await service.advanceAi({
      matchId: executionMatch.matchId,
      side: "runner",
      sessionToken: executionMatch.hostSessionToken,
      knownStateVersion: executionTurn.playerView.stateVersion,
      knownMatchVersion: executionTurn.matchVersion,
      mode: "single_step",
    });

    expect(advanced.ok).toBe(false);
    if (advanced.ok) throw new Error("Expected advance rejection");
    expect(advanced.error.code).toBe("ai_decision_action_not_legal");
    const afterAdvance = await service.loadForTest(executionMatch.matchId);
    expect(afterAdvance?.eventLog).toHaveLength(beforeAdvance.eventLog.length);
    expect(afterAdvance?.gameState?.stateVersion).toBe(
      beforeAdvance.gameState.stateVersion,
    );
  });

  it("persists a failed AI choose attempt after successful steps for maintenance analysis", async () => {
    const dir = await tempStorageDir();
    const dbPath = join(dir, "netgrid.sqlite");
    const backupDir = join(dir, "backups");
    const storage = new SqliteMatchStorage({ dbPath, backupDir });
    let runnerMainChoices = 0;
    let failedLegalActions: LegalAction[] = [];
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-choose-failure-attempt",
      chooseAiAction: (input, options): AiDecision => {
        if (input.playerView.pendingChoice?.source === "setup.mulligan")
          return chooseRuntimeAiAction(input, options);
        runnerMainChoices += 1;
        if (runnerMainChoices === 3) {
          failedLegalActions = structuredClone(input.legalActions);
          const failure = Object.assign(
            new Error("private runner hand detail belongs only in maintenance"),
            {
              code: "test.choose_exception",
              planKind: "runner.develop_board_and_hand",
              step: "fund",
              route: "basic_credit",
              context: {
                side: "runner",
                stateVersion: input.playerView.stateVersion,
                timingPoint: input.playerView.timingPoint,
                legalActionTypes: input.legalActions.map(
                  (action) => action.type,
                ),
                unresolvedActionIds: input.legalActions
                  .filter((action) => action.type !== "end_turn")
                  .map((action) => action.actionId),
                owner: "scheduler",
                removalCondition:
                  "Provide at least one ready assessed plan for the legal voluntary actions.",
                candidateCount: input.legalActions.length,
              },
            },
          );
          throw failure;
        }
        const action = input.legalActions.find(
          (candidate) => candidate.type === "gain_credit",
        );
        if (!action)
          throw new Error(
            "Missing gain_credit LegalAction for choose failure test",
          );
        return {
          actionId: action.actionId,
          reasonCode: "test.choose_failure_setup",
          explanation: "Take the current basic credit action.",
          consideredActionIds: [action.actionId],
          fallbackUsed: false,
          evidence: ["test_choose_failure_setup"],
          timeoutUsed: false,
          profileId: input.profileId,
          difficulty: input.difficulty,
          confidence: 1,
          reason: "test.choose_failure_setup",
        };
      },
    });
    try {
      const created = await service.createMatch({
        mode: "human_corp_vs_runner_ai",
        hostSide: "corp",
        seed: "ai-choose-failure-attempt",
        runnerDifficulty: "normal",
        aiTraceMode: "detailed",
      });
      const corp = {
        side: "corp" as const,
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      };
      await submitChoice(
        service,
        created.matchId,
        corp,
        "keep",
        "ai-choose-failure-corp-setup",
      );
      await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "mandatory_draw",
        "ai-choose-failure-corp-mandatory",
      );
      const endTurn = await submit(
        service,
        created.matchId,
        corp,
        (action) => action.type === "end_turn",
        "ai-choose-failure-corp-end",
      );
      let payload = endTurn.actorPayload.playerView.pendingChoice
        ? await submitFirstChoice(
            service,
            created.matchId,
            corp,
            "ai-choose-failure-corp-discard",
          )
        : endTurn.actorPayload;

      for (let step = 0; step < 2; step += 1) {
        const advanced = await service.advanceAi({
          matchId: created.matchId,
          side: "corp",
          sessionToken: created.hostSessionToken,
          knownStateVersion: payload.playerView.stateVersion,
          knownMatchVersion: payload.matchVersion,
          mode: "single_step",
        });
        expect(advanced.ok).toBe(true);
        if (!advanced.ok) throw new Error(advanced.error.message);
        payload = advanced.requesterPayload;
      }

      const beforeFailure = await service.loadForTest(created.matchId);
      if (!beforeFailure?.gameState)
        throw new Error("Missing match before failed AI choose attempt");
      const eventAnchorId = beforeFailure.eventLog.at(-1)?.eventId;
      if (!eventAnchorId) throw new Error("Missing failure event anchor");
      const failureDecisionIndex =
        (beforeFailure.aiDecisionTraces?.length ?? 0) + 1;
      const failed = await service.advanceAi({
        matchId: created.matchId,
        side: "corp",
        sessionToken: created.hostSessionToken,
        knownStateVersion: payload.playerView.stateVersion,
        knownMatchVersion: payload.matchVersion,
        mode: "single_step",
      });

      expect(failed.ok).toBe(false);
      if (failed.ok) throw new Error("Expected AI choose failure");
      expect(failed.error).toMatchObject({
        code: "ai_decision_failed",
        diagnosticCode: `ai_attempt_${created.matchId}_${failureDecisionIndex}`,
      });
      expect(JSON.stringify(failed.error)).not.toContain(
        "private runner hand detail",
      );

      const afterFailure = await service.loadForTest(created.matchId);
      expect(afterFailure?.gameState?.stateVersion).toBe(
        beforeFailure.gameState.stateVersion,
      );
      expect(afterFailure?.eventLog).toHaveLength(
        beforeFailure.eventLog.length,
      );

      const bundle = await service.storageMaintenanceMatchAnalysis(
        created.matchId,
        { includeEvents: false, includeDecisionTraces: true },
      );
      expect(bundle?.decisions).toHaveLength(failureDecisionIndex);
      expect(bundle?.decisions.at(-1)).toMatchObject({
        traceId: `ai_attempt_${created.matchId}_${failureDecisionIndex}`,
        eventId: eventAnchorId,
        stateVersion: beforeFailure.gameState.stateVersion,
        decisionIndex: failureDecisionIndex,
        schemaVersion: "ai-decision-failure-attempt-v1",
        meta: {
          attempt: {
            outcome: "failed",
            phase: "choose",
            code: "ai_decision_exception",
            plan: {
              kind: "runner.develop_board_and_hand",
              step: "fund",
              route: "basic_credit",
            },
            error: {
              code: "test.choose_exception",
              message: "private runner hand detail belongs only in maintenance",
            },
            planResolution: {
              code: "test.choose_exception",
              side: "runner",
              stateVersion: beforeFailure.gameState.stateVersion,
              owner: "scheduler",
              removalCondition:
                "Provide at least one ready assessed plan for the legal voluntary actions.",
            },
          },
        },
      });
      expect(bundle?.decisions.at(-1)?.auditAvailability).toMatchObject({
        historicalLegalActions: { status: "persisted" },
        engineEvidence: { status: "persisted" },
        analysisSnapshot: { status: "persisted" },
        checkpointCapture: { status: "persisted" },
      });
      expect(bundle?.traces?.at(-1)?.detail).toMatchObject({
        attempt: {
          diagnosticCode: `ai_attempt_${created.matchId}_${failureDecisionIndex}`,
          eventAnchorId,
        },
        historicalAudit: {
          capture: "persisted",
          actor: "runner",
          legalActions: {
            schemaVersion: "netgrid-historical-legal-actions-v1",
          },
          engineEvidence: {
            outcome: "failed_before_apply",
            eventAnchorId,
            validation: {
              actionWasInHistoricalLegalActions: "not_applicable",
              engineApplyActionValidated: false,
            },
          },
        },
      });
      const decisionContext = await service.storageMaintenanceDecisionAnalysis(
        created.matchId,
        failureDecisionIndex,
      );
      expect(decisionContext).toMatchObject({
        schemaVersion: "netgrid-decision-analysis-context-v4",
        audit: {
          capture: "persisted",
          actor: "runner",
          legalActions: {
            actions: expect.arrayContaining([
              expect.objectContaining({
                actionId: expect.any(String),
                actionType: expect.any(String),
                timingPoint: expect.any(String),
                costs: expect.any(Array),
                targetRequirements: expect.any(Array),
                bindings: expect.any(Object),
              }),
            ]),
          },
          analysisSnapshot: {
            stateVersion: beforeFailure.gameState.stateVersion,
            verification: { status: "verified_at_capture" },
          },
          checkpointCapture: {
            provenance: "persisted_at_decision",
            actor: "runner",
            stateVersion: beforeFailure.gameState.stateVersion,
            inputProjection: {
              schemaVersion: "netgrid-ai-decision-input-projection-v1",
              side: "runner",
              stateVersion: beforeFailure.gameState.stateVersion,
            },
            runtime: {
              schemaVersion: "ai-runtime-checkpoint-v1",
            },
          },
        },
      });
      const capturedActions = (
        (
          decisionContext?.audit as {
            legalActions?: {
              actions?: Array<{ actionId: string; payload?: unknown }>;
            };
          }
        )?.legalActions?.actions ?? []
      ).map((action) => ({
        actionId: action.actionId,
        payload: action.payload,
      }));
      expect(capturedActions).toStrictEqual(
        failedLegalActions.map((action) => ({
          actionId: action.actionId,
          payload: action.payload,
        })),
      );
    } finally {
      storage.close?.();
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("reports an engine rejection of an AI LegalAction without exposing its private message", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-engine-action-rejected",
      chooseAiAction: (input): AiDecision => {
        const action = input.legalActions[0];
        if (!action)
          throw new Error("Missing legal AI action for rejection test");
        return {
          actionId: action.actionId,
          reasonCode: "test.engine_rejection",
          explanation: "Select the first LegalAction for the rejection path.",
          consideredActionIds: [action.actionId],
          fallbackUsed: false,
          evidence: ["test_engine_rejection"],
          timeoutUsed: false,
          profileId: input.profileId,
          difficulty: input.difficulty,
          confidence: 1,
          reason: "test.engine_rejection",
        };
      },
      applyAction: (state) => ({
        ok: false,
        error: {
          code: "ERR_INVALID_TARGET",
          message: "Private target detail must not reach the opponent.",
        },
        state,
      }),
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ai-engine-action-rejected",
      corpDifficulty: "normal",
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "ai-engine-action-rejected-setup",
    );
    const before = await service.loadForTest(created.matchId);
    if (!before?.gameState)
      throw new Error("Missing active match before rejection");

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: afterSetup.playerView.stateVersion,
      knownMatchVersion: afterSetup.matchVersion,
      mode: "single_step",
    });

    expect(advanced.ok).toBe(false);
    if (advanced.ok) throw new Error("Expected AI engine rejection");
    expect(advanced.error.code).toBe("ai_engine_action_rejected");
    expect(advanced.error.message).toContain("ERR_INVALID_TARGET");
    expect(advanced.error.message).not.toContain("Private target detail");
    const after = await service.loadForTest(created.matchId);
    expect(after?.eventLog).toHaveLength(before.eventLog.length);
    expect(after?.gameState?.stateVersion).toBe(before.gameState.stateVersion);
  });

  it("keeps the structured plan-first authority contract in AI previews", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ai-preview-plan-first-contract",
      chooseAiAction: (input): AiDecision => {
        const action = input.legalActions[0];
        if (!action)
          throw new Error("Missing legal action for AI preview test");
        return {
          actionId: action.actionId,
          reasonCode: "test.preview_plan_first_contract",
          explanation: "Test decision with structured plan-first diagnostics.",
          consideredActionIds: input.legalActions.map(
            (candidate) => candidate.actionId,
          ),
          fallbackUsed: false,
          evidence: ["test_preview_plan_first_contract"],
          timeoutUsed: false,
          profileId: input.profileId,
          confidence: 0.9,
          decisionDebug: {
            schemaVersion: AI_DECISION_DEBUG_SCHEMA_VERSION,
            aiLevel: 2,
            planKind: "runner.economy",
            selectedActionType: action.type,
            planFirstDecision: {
              schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
              stateVersion: input.playerView.stateVersion,
              lane: "plan",
              selectionAuthority: "resident_plan_instance",
              rootPlanInstanceId: "plan:runner.pressure_central:rd",
              leafExecutorInstanceId: "plan:runner.economy:fund-rd",
              executionOrigin: {
                rootPlanInstanceId: "plan:runner.pressure_central:rd",
                leafPlanInstanceId: "plan:runner.economy:fund-rd",
                side: "runner",
                windowKind: "main_action",
                windowId: `${input.playerView.timingPoint}:${input.playerView.stateVersion}`,
                stateVersion: input.playerView.stateVersion,
                timingPoint: input.playerView.timingPoint,
              },
              selectedStep: {
                planInstanceId: "plan:runner.economy:fund-rd",
                stepId: "fund_run",
                parentInstanceId: "plan:runner.pressure_central:rd",
                needId: "run-funding:rd",
              },
              selectedPlan: {
                instanceId: "plan:runner.economy:fund-rd",
                dedupeKey: "fund-rd",
                moduleId: "runner.economy",
                moduleVersion: "1",
                viability: "ready",
                portfolioRole: "foreground",
                executionState: "executor",
                persistencePolicy: "flexible_support",
                phase: "fund_parent_need",
                milestone: "open",
                parentInstanceId: "plan:runner.pressure_central:rd",
                parentNeedId: "run-funding:rd",
                openNeedIds: [],
                blockers: [],
                evidenceCodes: ["exact_parent_funding_need"],
              },
              priority: {
                requestedClass: "P5",
                effectiveClass: "P5",
                reasonCode: "required_parent_support",
                horizon: "current_turn",
                readiness: "executable_now",
                intentFit: "aligned",
                validationReasonCodes: ["priority_claim_accepted"],
                delegatedFromPlanInstanceId: "plan:runner.pressure_central:rd",
                parentNeedId: "run-funding:rd",
              },
              route: {
                planInstanceId: "plan:runner.economy:fund-rd",
                stepId: "fund_run",
                capabilityId: "gain_credits",
                purpose: "Fund the exact R&D route.",
                actionId: action.actionId,
                actionType: action.type,
                semanticActionType: "economy.gain_credit",
                stateVersion: input.playerView.stateVersion,
              },
              strategicContext: {
                authority: "diagnostic_only",
                primaryStrategyId: "runner.rnd_pressure",
                phase: "develop",
                intentFit: "aligned",
                signals: [],
              },
              engineQuoteEvidence: {
                status: "certified",
                evidenceCodes: ["engine_certified_basic_liquidity"],
              },
              assessmentEvidenceCodes: ["exact_parent_funding_need"],
              dispositions: [],
              portfolio: [],
            },
            actionAlternatives: [
              {
                rank: 1,
                actionId: action.actionId,
                actionType: action.type,
                label: action.label,
                selected: true,
                whyChosen: ["selected_by_plan:plan:runner.economy:fund-rd"],
              },
            ],
          },
        };
      },
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "ai-preview-plan-first-contract",
      corpDifficulty: "normal",
    });
    await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "preview-plan-first-contract-setup",
    );
    const record = await storage.load(created.matchId);
    if (!record?.gameState) throw new Error("Missing AI preview test state");
    if (record.gameState.pendingChoice?.side === "corp") {
      const optionId =
        record.gameState.pendingChoice.options.find(
          (option) => option.id === "keep",
        )?.id ?? record.gameState.pendingChoice.options[0]?.id;
      if (!optionId) throw new Error("Missing Corp setup choice");
      record.gameState = applyEngineChoice(record.gameState, "corp", [
        String(optionId),
      ]);
    }
    record.gameState = toRunnerTurnEngine(record.gameState);
    await storage.save(record);
    const runnerTurn = await bootstrap(service, created.matchId, {
      side: "runner",
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    });

    const preview = await service.previewAi({
      matchId: created.matchId,
      requesterSide: "runner",
      targetSide: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: runnerTurn.playerView.stateVersion,
      knownMatchVersion: runnerTurn.matchVersion,
    });

    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error(preview.error.message);
    expect(preview.preview.detail.planFirstDecision).toMatchObject({
      schemaVersion: AI_PLAN_FIRST_DECISION_DEBUG_SCHEMA_VERSION,
      selectionAuthority: "resident_plan_instance",
      rootPlanInstanceId: "plan:runner.pressure_central:rd",
      leafExecutorInstanceId: "plan:runner.economy:fund-rd",
      selectedPlan: {
        parentInstanceId: "plan:runner.pressure_central:rd",
        parentNeedId: "run-funding:rd",
      },
      route: {
        actionId: expect.any(String),
        stepId: "fund_run",
      },
      strategicContext: { authority: "diagnostic_only" },
    });
    expect(JSON.stringify(preview.preview.detail)).not.toMatch(
      /Tactical Plan|plan_rank\||raw action score/i,
    );
  });

  it("restores the resident plan portfolio before preparing an AI decision after a server restart", async () => {
    resetResidentPlanPortfolioMemory();
    try {
      const storage = new InMemoryMatchStorage();
      const restoredBeforeChoice: boolean[] = [];
      const portfolioBeforeChoice: Array<
        ReturnType<typeof residentPlanPortfolioSnapshot>
      > = [];
      const choose = (
        input: Parameters<typeof chooseRuntimeAiAction>[0],
        options?: Parameters<typeof chooseRuntimeAiAction>[1],
      ) => {
        const portfolio = residentPlanPortfolioSnapshot(input);
        restoredBeforeChoice.push(Boolean(portfolio));
        portfolioBeforeChoice.push(portfolio);
        return chooseRuntimeAiAction(input, options);
      };
      const service = new MultiplayerService(storage, {
        tokenSalt: "resident-portfolio-restart",
        chooseAiAction: choose,
      });
      const created = await service.createMatch({
        mode: "human_runner_vs_corp_ai",
        hostSide: "runner",
        seed: "resident-portfolio-restart",
        corpDifficulty: "normal",
        aiPacingMode: "paced",
      });
      const runner = {
        side: "runner" as const,
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      };
      await forceSetupComplete(service, created.matchId);
      let current = await bootstrap(service, created.matchId, runner);
      expect(current.playerView.activeSide).toBe("corp");
      const mandatory = await service.advanceAi({
        matchId: created.matchId,
        side: "runner",
        sessionToken: created.hostSessionToken,
        knownStateVersion: current.playerView.stateVersion,
        knownMatchVersion: current.matchVersion,
        mode: "single_step",
      });
      expect(mandatory.ok).toBe(true);
      if (!mandatory.ok) throw new Error(mandatory.error.message);
      current = mandatory.requesterPayload;
      expect(current.playerView.timingPoint).toBe("corp_action.main");

      const first = await service.prepareAiDecisionDebug({
        matchId: created.matchId,
        requesterSide: "runner",
        sessionToken: created.hostSessionToken,
        knownStateVersion: current.playerView.stateVersion,
        knownMatchVersion: current.matchVersion,
      });
      expect(first.ok).toBe(true);
      if (!first.ok) throw new Error(first.error.message);
      const planFirstDecision = first.prepared.detail
        .planFirstDecision as AiPlanFirstDecisionDebug;
      expect(planFirstDecision).toMatchObject({
        selectionAuthority: "turn_plan_commitment",
        turnPlanning: {
          schemaVersion: "ai-turn-planning-debug-v1",
          mode: "cutover",
          commitment: {
            status: "active",
            rematerialization: {
              status: "executable",
              actionId: first.prepared.actionId,
            },
          },
        },
      });
      expect(planFirstDecision.turnPlanning?.selectedLine.phases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nodes: expect.arrayContaining([
              expect.objectContaining({ nodeId: expect.any(String) }),
            ]),
          }),
        ]),
      );
      expect(planFirstDecision.turnPlanning?.heads).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actionId: first.prepared.actionId,
            witnessValid: true,
          }),
        ]),
      );
      const persisted = await storage.load(created.matchId);
      if (!persisted) throw new Error("Missing persisted match");
      const privateHand = first.prepared.detail.aiPrivateHandPreview as {
        schemaVersion: string;
        side: "corp" | "runner";
        cards: Array<{
          instanceId: string;
          definitionId: string;
          title: string;
        }>;
      };
      expect(privateHand.schemaVersion).toBe("developer-ai-hand-v1");
      expect(privateHand.side).toBe("corp");
      const expectedInstanceId = persisted.gameState.corp.hq[0];
      if (!expectedInstanceId)
        throw new Error("Missing corp hand card in test fixture");
      const expectedDefinitionId =
        persisted.gameState.cardInstances[expectedInstanceId]?.definitionId;
      if (!expectedDefinitionId)
        throw new Error("Missing corp hand card definition");
      expect(
        privateHand.cards.find(
          (card) => card.instanceId === expectedInstanceId,
        ),
      ).toMatchObject({
        instanceId: expectedInstanceId,
        definitionId: expectedDefinitionId,
        title: CARD_DEFINITIONS_BY_ID[expectedDefinitionId]?.title,
      });
      expect(first.prepared.detail).not.toHaveProperty(
        "developerPrivateHandsPreview",
      );
      expect(
        persisted?.aiPlanRuntime?.residentPlanPortfolioBySide?.corp?.instances
          .length,
      ).toBeGreaterThan(0);
      expect(restoredBeforeChoice.at(-1)).toBe(false);

      // A new service stands in for a process restart: prepared decisions and
      // process-local memory are gone, while the match record remains.
      resetResidentPlanPortfolioMemory();
      const restarted = new MultiplayerService(storage, {
        tokenSalt: "resident-portfolio-restart",
        chooseAiAction: choose,
      });
      const afterRestart = await restarted.prepareAiDecisionDebug({
        matchId: created.matchId,
        requesterSide: "runner",
        sessionToken: created.hostSessionToken,
        knownStateVersion: current.playerView.stateVersion,
        knownMatchVersion: current.matchVersion,
      });
      expect(afterRestart.ok).toBe(true);
      if (!afterRestart.ok) throw new Error(afterRestart.error.message);
      expect(restoredBeforeChoice.at(-1)).toBe(true);
      const restoredPortfolio = portfolioBeforeChoice.at(-1);
      expect(restoredPortfolio?.instances).toEqual(
        persisted.aiPlanRuntime?.residentPlanPortfolioBySide?.corp?.instances,
      );
      expect(restoredPortfolio?.turnPlanCommitment).toBeUndefined();
      expect(restoredPortfolio?.turnPlanExecutionLease).toBeUndefined();
      const afterRestartPlanFirst = afterRestart.prepared.detail
        .planFirstDecision as AiPlanFirstDecisionDebug;
      expect(afterRestart.prepared.actionId).toBe(first.prepared.actionId);
      expect(afterRestartPlanFirst).toMatchObject({
        selectionAuthority: "turn_plan_commitment",
        rootPlanInstanceId: planFirstDecision.rootPlanInstanceId,
        leafExecutorInstanceId: planFirstDecision.leafExecutorInstanceId,
        selectedPlan: {
          instanceId: planFirstDecision.selectedPlan?.instanceId,
          moduleId: planFirstDecision.selectedPlan?.moduleId,
        },
        route: {
          planInstanceId: planFirstDecision.route?.planInstanceId,
          stepId: planFirstDecision.route?.stepId,
          actionId: planFirstDecision.route?.actionId,
        },
        turnPlanning: {
          schemaVersion: "ai-turn-planning-debug-v1",
          mode: "cutover",
          commitment: {
            status: "active",
            rematerialization: {
              status: "executable",
              actionId: first.prepared.actionId,
            },
          },
        },
      });
    } finally {
      resetResidentPlanPortfolioMemory();
    }
  });

  it("binds session AI previews to the human side without leaking hidden opponent cards or mutating the match", async () => {
    const runnerPreviewMemoryFlags: Array<boolean | undefined> = [];
    const runnerStorage = new InMemoryMatchStorage();
    const runnerService = new MultiplayerService(runnerStorage, {
      tokenSalt: "runner-own-side-ai-preview-redaction",
      chooseAiAction: (input, options) => {
        runnerPreviewMemoryFlags.push(options?.persistTacticalPlanMemory);
        return chooseRuntimeAiAction(input, options);
      },
    });
    const runnerMatch = await runnerService.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "runner-own-side-ai-preview-redaction",
      corpDifficulty: "normal",
    });
    const runnerAfterSetup = await submitChoice(
      runnerService,
      runnerMatch.matchId,
      {
        side: "runner",
        sessionToken: runnerMatch.hostSessionToken,
        reconnectToken: runnerMatch.hostReconnectToken,
      },
      "keep",
      "runner-own-side-ai-preview-setup",
    );
    const runnerTurn = await runnerService.advanceAi({
      matchId: runnerMatch.matchId,
      side: "runner",
      sessionToken: runnerMatch.hostSessionToken,
      knownStateVersion: runnerAfterSetup.playerView.stateVersion,
      knownMatchVersion: runnerAfterSetup.matchVersion,
      mode: "until_human",
    });
    expect(runnerTurn.ok).toBe(true);
    if (!runnerTurn.ok) throw new Error(runnerTurn.error.message);
    let runnerRecordBefore = await runnerService.loadForTest(
      runnerMatch.matchId,
    );
    if (!runnerRecordBefore?.gameState)
      throw new Error("Missing Runner preview state");
    const runnerPayloadJson = JSON.stringify(runnerTurn.requesterPayload);
    const hiddenCorpCardId = runnerRecordBefore.gameState.corp.hq[0];
    const hiddenCorpSentinelDefinition = Object.entries(
      CARD_DEFINITIONS_BY_ID,
    ).find(
      ([definitionId, definition]) =>
        definition.side === "corp" &&
        !runnerPayloadJson.includes(definitionId) &&
        !runnerPayloadJson.includes(definition.title),
    );
    if (!hiddenCorpCardId || !hiddenCorpSentinelDefinition)
      throw new Error("Missing hidden Corp sentinel card");
    const hiddenCorpCard = {
      instanceId: hiddenCorpCardId,
      definitionId: hiddenCorpSentinelDefinition[0],
      title: hiddenCorpSentinelDefinition[1].title,
    };
    runnerRecordBefore.gameState.cardInstances[hiddenCorpCardId]!.definitionId =
      hiddenCorpCard.definitionId;
    await runnerStorage.save(runnerRecordBefore);
    runnerRecordBefore = await runnerService.loadForTest(runnerMatch.matchId);
    if (!runnerRecordBefore?.gameState)
      throw new Error("Missing stored Runner preview sentinel state");
    runnerPreviewMemoryFlags.length = 0;

    const runnerPreview = await runnerService.previewAi({
      matchId: runnerMatch.matchId,
      requesterSide: "runner",
      targetSide: "runner",
      sessionToken: runnerMatch.hostSessionToken,
      knownStateVersion: runnerTurn.requesterPayload.playerView.stateVersion,
      knownMatchVersion: runnerTurn.requesterPayload.matchVersion,
    });

    expect(runnerPreview.ok).toBe(true);
    if (!runnerPreview.ok) throw new Error(runnerPreview.error.message);
    expect(runnerPreview.preview).toMatchObject({
      requestedBy: "runner",
      side: "runner",
      actionId: expect.any(String),
      actionType: expect.any(String),
      advisorProfileId: "runner-human-advisor-v0.9-normal",
      advisorDifficulty: "normal",
      advisorMode: "fresh_human_side_takeover",
    });
    expect(
      runnerTurn.requesterPayload.legalActions.map((action) => action.actionId),
    ).toContain(runnerPreview.preview.actionId);
    const runnerPreviewJson = JSON.stringify(runnerPreview);
    expect(runnerPreviewJson).not.toContain(hiddenCorpCard.instanceId);
    expect(runnerPreviewJson).not.toContain(hiddenCorpCard.definitionId);
    expect(runnerPreviewJson).not.toContain(hiddenCorpCard.title);
    expect(runnerPreviewJson).not.toMatch(
      /aiPrivateHandPreview|developerPrivateHandsPreview|privateDeckSnapshots|cardInstances/,
    );
    const repeatedRunnerPreview = await runnerService.previewAi({
      matchId: runnerMatch.matchId,
      requesterSide: "runner",
      targetSide: "runner",
      sessionToken: runnerMatch.hostSessionToken,
      knownStateVersion: runnerTurn.requesterPayload.playerView.stateVersion,
      knownMatchVersion: runnerTurn.requesterPayload.matchVersion,
    });
    expect(repeatedRunnerPreview.ok).toBe(true);
    if (!repeatedRunnerPreview.ok)
      throw new Error(repeatedRunnerPreview.error.message);
    expect(repeatedRunnerPreview.preview.actionId).toBe(
      runnerPreview.preview.actionId,
    );
    expect(repeatedRunnerPreview.preview.actionType).toBe(
      runnerPreview.preview.actionType,
    );
    expect(repeatedRunnerPreview.preview.selectedChoices).toEqual(
      runnerPreview.preview.selectedChoices,
    );
    expect(repeatedRunnerPreview.preview.detail).toEqual(
      runnerPreview.preview.detail,
    );
    expect(runnerPreviewMemoryFlags).toEqual([false, false]);
    const staleStatePreview = await runnerService.previewAi({
      matchId: runnerMatch.matchId,
      requesterSide: "runner",
      targetSide: "runner",
      sessionToken: runnerMatch.hostSessionToken,
      knownStateVersion:
        runnerTurn.requesterPayload.playerView.stateVersion - 1,
      knownMatchVersion: runnerTurn.requesterPayload.matchVersion,
    });
    expect(staleStatePreview.ok).toBe(false);
    if (staleStatePreview.ok)
      throw new Error("Expected stale-state preview rejection");
    expect(staleStatePreview.error.code).toBe("stale_state");
    const staleMatchPreview = await runnerService.previewAi({
      matchId: runnerMatch.matchId,
      requesterSide: "runner",
      targetSide: "runner",
      sessionToken: runnerMatch.hostSessionToken,
      knownStateVersion: runnerTurn.requesterPayload.playerView.stateVersion,
      knownMatchVersion: runnerTurn.requesterPayload.matchVersion - 1,
    });
    expect(staleMatchPreview.ok).toBe(false);
    if (staleMatchPreview.ok)
      throw new Error("Expected stale-match preview rejection");
    expect(staleMatchPreview.error.code).toBe("stale_match");
    const runnerRecordAfter = await runnerService.loadForTest(
      runnerMatch.matchId,
    );
    expect(runnerRecordAfter).toEqual(runnerRecordBefore);
    expect(hashState(runnerRecordAfter!.gameState)).toBe(
      hashState(runnerRecordBefore.gameState),
    );

    const foreignSidePreview = await runnerService.previewAi({
      matchId: runnerMatch.matchId,
      requesterSide: "runner",
      targetSide: "corp",
      sessionToken: runnerMatch.hostSessionToken,
    });
    expect(foreignSidePreview.ok).toBe(false);
    if (foreignSidePreview.ok)
      throw new Error("Expected foreign-side preview rejection");
    expect(foreignSidePreview.error.code).toBe("preview_side_forbidden");

    const corpPreviewMemoryFlags: Array<boolean | undefined> = [];
    const corpStorage = new InMemoryMatchStorage();
    const corpService = new MultiplayerService(corpStorage, {
      tokenSalt: "corp-own-side-ai-preview-redaction",
      chooseAiAction: (input, options) => {
        corpPreviewMemoryFlags.push(options?.persistTacticalPlanMemory);
        return chooseRuntimeAiAction(input, options);
      },
    });
    const corpMatch = await corpService.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "corp-own-side-ai-preview-redaction",
      runnerDifficulty: "normal",
    });
    const corpTurn = await submitChoice(
      corpService,
      corpMatch.matchId,
      {
        side: "corp",
        sessionToken: corpMatch.hostSessionToken,
        reconnectToken: corpMatch.hostReconnectToken,
      },
      "keep",
      "corp-own-side-ai-preview-setup",
    );
    let corpRecordBefore = await corpService.loadForTest(corpMatch.matchId);
    if (!corpRecordBefore?.gameState)
      throw new Error("Missing Corp preview state");
    const corpPayloadJson = JSON.stringify(corpTurn);
    const hiddenRunnerCardIds = [
      corpRecordBefore.gameState.runner.grip[0],
      corpRecordBefore.gameState.runner.stack[0],
    ];
    const hiddenRunnerSentinelDefinitions = Object.entries(
      CARD_DEFINITIONS_BY_ID,
    )
      .filter(
        ([definitionId, definition]) =>
          definition.side === "runner" &&
          !corpPayloadJson.includes(definitionId) &&
          !corpPayloadJson.includes(definition.title),
      )
      .slice(0, hiddenRunnerCardIds.length);
    if (
      hiddenRunnerCardIds.some((instanceId) => !instanceId) ||
      hiddenRunnerSentinelDefinitions.length !== hiddenRunnerCardIds.length
    )
      throw new Error("Missing hidden Runner sentinel cards");
    const hiddenRunnerCards = hiddenRunnerCardIds.map((instanceId, index) => ({
      instanceId: instanceId!,
      definitionId: hiddenRunnerSentinelDefinitions[index]![0],
      title: hiddenRunnerSentinelDefinitions[index]![1].title,
    }));
    for (const hiddenRunnerCard of hiddenRunnerCards) {
      corpRecordBefore.gameState.cardInstances[
        hiddenRunnerCard.instanceId
      ]!.definitionId = hiddenRunnerCard.definitionId;
    }
    await corpStorage.save(corpRecordBefore);
    corpRecordBefore = await corpService.loadForTest(corpMatch.matchId);
    if (!corpRecordBefore?.gameState)
      throw new Error("Missing stored Corp preview sentinel state");
    corpPreviewMemoryFlags.length = 0;

    const corpPreview = await corpService.previewAi({
      matchId: corpMatch.matchId,
      requesterSide: "corp",
      targetSide: "corp",
      sessionToken: corpMatch.hostSessionToken,
      knownStateVersion: corpTurn.playerView.stateVersion,
      knownMatchVersion: corpTurn.matchVersion,
    });

    expect(corpPreview.ok).toBe(true);
    if (!corpPreview.ok) throw new Error(corpPreview.error.message);
    expect(corpPreview.preview).toMatchObject({
      requestedBy: "corp",
      side: "corp",
      actionId: expect.any(String),
      actionType: expect.any(String),
      advisorProfileId: "corp-human-advisor-v0.9-normal",
      advisorDifficulty: "normal",
      advisorMode: "fresh_human_side_takeover",
    });
    const corpPreviewJson = JSON.stringify(corpPreview);
    for (const hiddenRunnerCard of hiddenRunnerCards) {
      expect(corpPreviewJson).not.toContain(hiddenRunnerCard.instanceId);
      expect(corpPreviewJson).not.toContain(hiddenRunnerCard.definitionId);
      expect(corpPreviewJson).not.toContain(hiddenRunnerCard.title);
    }
    expect(corpPreviewJson).not.toMatch(
      /aiPrivateHandPreview|developerPrivateHandsPreview|privateDeckSnapshots|cardInstances/,
    );
    expect(corpPreviewMemoryFlags).toEqual([false]);
    const corpRecordAfter = await corpService.loadForTest(corpMatch.matchId);
    expect(corpRecordAfter).toEqual(corpRecordBefore);
    expect(hashState(corpRecordAfter!.gameState)).toBe(
      hashState(corpRecordBefore.gameState),
    );

    const observerService = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-vs-ai-preview-redaction",
    });
    const observerMatch = await observerService.createMatch({
      mode: "ai_vs_ai",
      hostSide: "runner",
      seed: "ai-vs-ai-preview-redaction",
      runnerDifficulty: "normal",
      corpDifficulty: "normal",
    });
    const observerPreview = await observerService.previewAi({
      matchId: observerMatch.matchId,
      requesterSide: "runner",
      targetSide: "runner",
      sessionToken: observerMatch.hostSessionToken,
    });
    expect(observerPreview.ok).toBe(false);
    if (observerPreview.ok)
      throw new Error("Expected observer preview rejection");
    expect(observerPreview.error.code).toBe("preview_mode_forbidden");
    expect(JSON.stringify(observerPreview)).not.toMatch(
      /aiPrivateHandPreview|developerPrivateHandsPreview|privateDeckSnapshots|cardInstances/,
    );
  });

  it("does not resolve an Engine-randomized selection or consume randomness for a human-side advisor preview", async () => {
    const storage = new InMemoryMatchStorage();
    const previewMemoryFlags: Array<boolean | undefined> = [];
    const service = new MultiplayerService(storage, {
      tokenSalt: "human-advisor-randomized-selection",
      chooseAiAction: (input, options): AiDecision => {
        previewMemoryFlags.push(options?.persistTacticalPlanMemory);
        if (input.side !== "corp") return chooseRuntimeAiAction(input, options);
        return {
          selectionKind: "engine_randomized_ice_install_selection",
          engineCommand: {
            kind: "engine_randomized_ice_install_selection",
            quote: {
              schemaVersion:
                ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
              visibility: "private_to_actor",
              complete: true,
              matchId: input.matchId ?? "human-advisor-randomized-selection",
              side: "corp",
              stateVersion: input.playerView.stateVersion,
              timingPoint: input.playerView.timingPoint,
              planStepId: "plan:human-advisor:test-randomized-selection",
              candidates: [],
              candidateFingerprint: "test-preview-must-not-execute",
              legalActions: [],
            },
          },
          reasonCode: "test.human_advisor_randomized_selection",
          explanation:
            "The Engine must resolve this randomized selection only during execution.",
          consideredActionIds: input.legalActions.map(
            (action) => action.actionId,
          ),
          fallbackUsed: false,
          evidence: ["test_human_advisor_randomized_selection"],
          timeoutUsed: false,
          profileId: input.profileId,
          difficulty: input.difficulty,
          confidence: 1,
          reason: "test.human_advisor_randomized_selection",
        };
      },
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "human-advisor-randomized-selection",
      runnerDifficulty: "normal",
    });
    const corpTurn = await submitChoice(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "human-advisor-randomized-selection-setup",
    );
    const before = await service.loadForTest(created.matchId);
    if (!before?.gameState)
      throw new Error("Missing randomized advisor preview state");
    previewMemoryFlags.length = 0;

    const preview = await service.previewAi({
      matchId: created.matchId,
      requesterSide: "corp",
      targetSide: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: corpTurn.playerView.stateVersion,
      knownMatchVersion: corpTurn.matchVersion,
    });

    expect(preview.ok).toBe(false);
    if (preview.ok) throw new Error("Expected randomized preview rejection");
    expect(preview.error.code).toBe(
      "ai_randomized_selection_requires_execution",
    );
    expect(previewMemoryFlags).toEqual([false]);
    expect(await service.loadForTest(created.matchId)).toEqual(before);
  });

  it("returns a current own-side resolve_choice LegalAction and selected choices without applying them", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "human-advisor-choice-preview",
      chooseAiAction: (input): AiDecision => {
        const action = input.legalActions[0];
        if (!action)
          throw new Error("Missing LegalAction for advisor choice preview");
        const pendingChoice = input.playerView.pendingChoice;
        return {
          actionId: action.actionId,
          ...(action.type === "resolve_choice" && pendingChoice
            ? {
                selectedChoices: {
                  choiceId: pendingChoice.choiceId,
                  selectedOptionIds: [
                    String(pendingChoice.options[0]?.id ?? ""),
                  ],
                },
              }
            : {}),
          reasonCode: "test.human_advisor_choice",
          explanation: "Choose the first visible option from the own choice.",
          consideredActionIds: input.legalActions.map(
            (candidate) => candidate.actionId,
          ),
          fallbackUsed: false,
          evidence: ["test_human_advisor_choice"],
          timeoutUsed: false,
          profileId: input.profileId,
          difficulty: input.difficulty,
          confidence: 1,
          reason: "test.human_advisor_choice",
        };
      },
    });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "human-advisor-choice-preview",
      runnerDifficulty: "normal",
    });
    await submitChoice(
      service,
      created.matchId,
      {
        side: "corp",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "human-advisor-choice-preview-setup",
    );
    const record = await storage.load(created.matchId);
    if (!record?.gameState)
      throw new Error("Missing advisor choice preview state");
    const ownChoice = choiceRequest(record.gameState, "corp");
    record.gameState.pendingChoice = ownChoice;
    await storage.save(record);
    const corpChoice = await bootstrap(service, created.matchId, {
      side: "corp",
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    });
    const before = await service.loadForTest(created.matchId);

    const preview = await service.previewAi({
      matchId: created.matchId,
      requesterSide: "corp",
      targetSide: "corp",
      sessionToken: created.hostSessionToken,
      knownStateVersion: corpChoice.playerView.stateVersion,
      knownMatchVersion: corpChoice.matchVersion,
    });

    expect(preview.ok).toBe(true);
    if (!preview.ok) throw new Error(preview.error.message);
    expect(preview.preview.actionType).toBe("resolve_choice");
    expect(preview.preview.selectedChoices).toEqual({
      choiceId: ownChoice.choiceId,
      selectedOptionIds: ["keep"],
    });
    expect(corpChoice.legalActions.map((action) => action.actionId)).toContain(
      preview.preview.actionId,
    );
    expect(await service.loadForTest(created.matchId)).toEqual(before);
  });

  it("advances Corp AI in the post-jack-out root-rez window", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "server-corp-ai-root-rez-active-runner",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai-root-rez-active-runner",
      corpDifficulty: "normal",
      aiTraceMode: "detailed",
    });
    const record = await storage.load(created.matchId);
    if (!record) throw new Error("Missing stored match");

    let gameState = toRunnerTurnEngine(
      createGameAfterSetup({
        matchId: created.matchId,
        seed: "server-corp-ai-root-rez-active-runner-engine",
      }),
    );
    gameState.corp.credits = 5;
    putCorpRootInRemoteForTest(gameState, "simple_economy_asset");
    putCorpIceOnServerForTest(gameState, "remote_1", "simple_barrier_ice");
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    gameState = applyEngineAction(
      gameState,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass !== true,
    );
    expect(gameState.activeSide).toBe("runner");
    expect(gameState.timingPoint).toBe("run.jack_out_window");
    expect(
      getLegalActions(gameState, "runner")
        .map((action) => action.type)
        .sort(),
    ).toEqual(["continue_run", "jack_out"]);
    gameState = applyEngineAction(
      gameState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(gameState.activeSide).toBe("corp");
    expect(gameState.timingPoint).toBe("run.movement_rez_window");
    expect(getLegalActions(gameState, "runner")).toEqual([]);
    expect(
      getLegalActions(gameState, "corp")
        .map((action) => action.type)
        .sort(),
    ).toEqual(["decline_rez", "rez_card"]);
    record.gameState = gameState;
    record.match.baseline = gameState.baseline;
    record.eventLog = gameState.eventLog.map((event) =>
      toEventRecordForTest(created.matchId, event),
    );
    record.stateSnapshots = [
      stateSnapshotForTest(
        created.matchId,
        gameState,
        record.match.matchVersion,
        "snap_ai_root_rez_active_runner",
      ),
    ];
    record.actionReceipts = [];
    record.undoSnapshots = [];
    delete record.pendingUndo;
    await storage.save(record);

    const before = await service.bootstrap(
      created.matchId,
      "runner",
      created.hostSessionToken,
    );
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    expect(before.aiTurnPresentation).toEqual({
      activeAiSide: "corp",
      canAdvanceAi: true,
      pacingMode: "paced",
    });

    const advanced = await service.advanceAi({
      matchId: created.matchId,
      side: "runner",
      sessionToken: created.hostSessionToken,
      knownStateVersion: before.playerView.stateVersion,
      knownMatchVersion: before.matchVersion,
      mode: "single_step",
    });
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) throw new Error(advanced.error.message);
    expect(advanced.publicEvent?.publicPayload).toMatchObject({
      actionType: "rez_card",
      aiReasonCode: "plan_first.corp.economy",
    });
    expect(advanced.requesterPayload.playerView.stateVersion).toBe(
      before.playerView.stateVersion + 1,
    );
    expect(JSON.stringify(advanced.requesterPayload)).not.toContain(
      "cardInstances",
    );
    expect(JSON.stringify(advanced.publicEvent?.publicPayload)).not.toContain(
      "rootRezCreditOutcomeQuote",
    );

    const after = await service.loadForTest(created.matchId);
    if (!after?.gameState)
      throw new Error("Missing state after Corp Economy root rez.");
    expect(after.gameState.corp.credits).toBe(7);
    expect(after.aiDecisionTraces?.at(-1)).toMatchObject({
      selectedActionType: "rez_card",
      planKind: "corp.economy",
    });
    expect(JSON.stringify(after.aiDecisionTraces?.at(-1)?.traceJson)).toContain(
      "plan_module:corp.economy",
    );
    expect(JSON.stringify(after.aiDecisionTraces?.at(-1)?.traceJson)).toContain(
      "plan_priority_class:P3",
    );

    const replay = await service.loadReplayDiagnostics(
      created.matchId,
      "runner",
    );
    expect(replay.ok).toBe(true);
    if (!replay.ok) throw new Error(replay.error.message);
    expect(replay.replay.metadata.replayCheckStatus).toBe("verified");
    expect(
      replay.replay.timeline.find(
        (step) => step.eventId === advanced.publicEvent?.eventId,
      )?.stateHashCheck.ok,
    ).toBe(true);
  });

  it("keeps REST ai-advance responses limited to the requesting human side", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-advance-rest",
    });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai-rest",
      corpDifficulty: "normal",
    });
    const afterSetup = await submitChoice(
      service,
      created.matchId,
      {
        side: "runner",
        sessionToken: created.hostSessionToken,
        reconnectToken: created.hostReconnectToken,
      },
      "keep",
      "ai-rest-setup",
    );
    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server address");

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/matches/${encodeURIComponent(created.matchId)}/ai-advance`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            side: "runner",
            sessionToken: created.hostSessionToken,
            knownStateVersion: afterSetup.playerView.stateVersion,
            mode: "single_step",
          }),
        },
      );
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

  it("exposes finished public replay REST endpoints with verified full-information frames", async () => {
    const match = await joinedMatch("v150-replay-rest");
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "mandatory_draw",
      "v150-rest-mandatory",
    );
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "install_card",
      "v150-rest-install",
    );
    await submit(
      match.service,
      match.matchId,
      match.corp,
      (action) => action.type === "end_turn",
      "v150-rest-end-turn",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
      "v150-rest-run",
    );
    await submit(
      match.service,
      match.matchId,
      match.runner,
      (action) =>
        action.type === "access_card" || action.type === "steal_agenda",
      "v150-rest-access",
    );
    const beforeFinish = await match.service.loadReplayView(
      match.matchId,
      "runner",
    );
    expect(beforeFinish.ok).toBe(false);
    const forfeited = await match.service.forfeitMatch({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
    });
    expect(forfeited.ok).toBe(true);

    const handle = createNetgridHttpServer(match.service);
    const baseUrl = await listen(handle);
    try {
      const indexResponse = await fetch(`${baseUrl}/api/replays`);
      const indexPayload = (await indexResponse.json()) as {
        replays?: Array<{ matchId: string; finalStateHash: string }>;
      };
      expect(indexResponse.status).toBe(200);
      expect(
        indexPayload.replays?.some((entry) => entry.matchId === match.matchId),
      ).toBe(true);
      expect(JSON.stringify(indexPayload)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist/i,
      );

      const replayResponse = await fetch(
        `${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}?perspective=runner`,
      );
      const replayPayload = (await replayResponse.json()) as {
        perspective?: string;
        localAnalysis?: boolean;
        metadata?: { participantSides?: { player_a?: Side; player_b?: Side } };
        timeline?: Array<{ hiddenInfoBarrier?: boolean }>;
        publicEvents?: Array<{
          eventId?: string;
          stateVersionAfter?: number;
        }>;
        frames?: Array<{
          stateVersion?: number;
          stateHashVerified?: boolean;
          playerViews?: {
            runner?: {
              side?: Side;
              own?: { gripOrHq?: Array<{ title?: string }> };
              legalActions?: unknown[];
            };
            corp?: {
              side?: Side;
              own?: { gripOrHq?: Array<{ title?: string }> };
              legalActions?: unknown[];
            };
          };
        }>;
      };
      expect(replayResponse.status).toBe(200);
      expect(replayPayload.perspective).toBe("runner");
      expect(replayPayload.localAnalysis).toBe(false);
      expect(
        replayPayload.timeline?.some((entry) => entry.hiddenInfoBarrier),
      ).toBe(true);
      expect(replayPayload.publicEvents?.length).toBeGreaterThan(0);
      expect(replayPayload.publicEvents?.at(-1)?.stateVersionAfter).toBe(
        replayPayload.frames?.at(-1)?.stateVersion,
      );
      expect(replayPayload.metadata?.participantSides?.player_a).toMatch(
        /runner|corp/,
      );
      expect(replayPayload.frames?.length).toBeGreaterThan(1);
      expect(
        replayPayload.frames?.every((frame) => frame.stateHashVerified),
      ).toBe(true);
      expect(replayPayload.frames?.[0]?.playerViews?.runner?.side).toBe(
        "runner",
      );
      expect(replayPayload.frames?.[0]?.playerViews?.corp?.side).toBe("corp");
      expect(
        replayPayload.frames?.[0]?.playerViews?.runner?.own?.gripOrHq?.length,
      ).toBeGreaterThan(0);
      expect(
        replayPayload.frames?.[0]?.playerViews?.corp?.own?.gripOrHq?.length,
      ).toBeGreaterThan(0);
      expect(
        replayPayload.frames?.every(
          (frame) =>
            frame.playerViews?.runner?.legalActions?.length === 0 &&
            frame.playerViews?.corp?.legalActions?.length === 0,
        ),
      ).toBe(true);
      expect(
        new Set(
          replayPayload.frames?.map(
            (frame) => frame.playerViews?.corp?.own?.gripOrHq?.length,
          ),
        ).size,
      ).toBeGreaterThan(1);
      expect(JSON.stringify(replayPayload)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist/i,
      );

      const badPerspective = await fetch(
        `${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}?perspective=invalid`,
      );
      expect(badPerspective.status).toBe(400);

      const localExportResponse = await fetch(
        `${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}/export?perspective=local_analysis`,
      );
      const localExportPayload = (await localExportResponse.json()) as {
        error?: { code?: string };
      };
      expect(localExportResponse.status).toBe(400);
      expect(localExportPayload.error?.code).toBe("bad_request");

      const exportResponse = await fetch(
        `${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}/export?perspective=runner`,
      );
      const exportPayload = (await exportResponse.json()) as {
        version?: string;
        perspective?: string;
      };
      expect(exportResponse.status).toBe(200);
      expect(exportPayload.version).toBe("1.5.0");
      expect(exportPayload.perspective).toBe("runner");
      expect(JSON.stringify(exportPayload)).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist|[A-Za-z]:\\\\/i,
      );

      const gamebookResponse = await fetch(
        `${baseUrl}/api/replays/${encodeURIComponent(match.matchId)}/gamebook`,
      );
      const gamebook = await gamebookResponse.text();
      expect(gamebookResponse.status).toBe(200);
      expect(gamebookResponse.headers.get("content-type")).toContain(
        "text/markdown",
      );
      expect(gamebookResponse.headers.get("content-disposition")).toContain(
        ".md",
      );
      expect(gamebook).toContain("# Spielprotokoll");
      expect(gamebook).toContain("## Spielvorbereitung");
      expect(gamebook).toContain("Hand zu Zugbeginn");
      expect(gamebook).not.toMatch(
        /sessionToken|reconnectToken|joinToken|tokenHash|privatePayload|cardInstances|decklist|[A-Za-z]:\\\\/i,
      );
    } finally {
      await handle.close();
    }
  });

  it("blocks full-information frames before match end and protects private finished replays", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "finished-replay-access",
    });
    const publicActive = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "public-active-no-replay",
      isPublic: true,
    });
    const privateFinished = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "private-finished-replay",
      isPublic: false,
    });
    const forfeited = await service.forfeitMatch({
      matchId: privateFinished.matchId,
      side: privateFinished.hostSide,
      sessionToken: privateFinished.hostSessionToken,
    });
    expect(forfeited.ok).toBe(true);

    const handle = createNetgridHttpServer(service);
    const baseUrl = await listen(handle);
    try {
      const activeResponse = await fetch(
        `${baseUrl}/api/replays/${publicActive.matchId}?perspective=runner`,
      );
      expect(activeResponse.status).toBe(404);

      const indexResponse = await fetch(`${baseUrl}/api/replays`);
      const indexText = await indexResponse.text();
      expect(indexText).not.toContain(publicActive.matchId);
      expect(indexText).not.toContain(privateFinished.matchId);

      const anonymousPrivate = await fetch(
        `${baseUrl}/api/replays/${privateFinished.matchId}?perspective=runner`,
      );
      expect(anonymousPrivate.status).toBe(404);

      const wrongToken = await fetch(
        `${baseUrl}/api/replays/${privateFinished.matchId}?perspective=runner&side=${privateFinished.hostSide}`,
        { headers: { authorization: "Bearer wrong-token" } },
      );
      expect(wrongToken.status).toBe(404);

      const participantResponse = await fetch(
        `${baseUrl}/api/replays/${privateFinished.matchId}?perspective=runner&side=${privateFinished.hostSide}`,
        {
          headers: {
            authorization: `Bearer ${privateFinished.hostSessionToken}`,
          },
        },
      );
      expect(participantResponse.status).toBe(200);
      const participantPayload = (await participantResponse.json()) as {
        frames?: Array<{
          playerViews?: {
            runner?: { own?: { gripOrHq?: unknown[] } };
            corp?: { own?: { gripOrHq?: unknown[] } };
          };
        }>;
      };
      expect(
        participantPayload.frames?.[0]?.playerViews?.runner?.own?.gripOrHq
          ?.length,
      ).toBeGreaterThan(0);
      expect(
        participantPayload.frames?.[0]?.playerViews?.corp?.own?.gripOrHq
          ?.length,
      ).toBeGreaterThan(0);
    } finally {
      await handle.close();
    }
  });

  it("exposes a side-safe AI-vs-AI simulation API", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ai-api-service",
    });
    const handle = createNetgridHttpServer(service);
    await new Promise<void>((resolve) =>
      handle.server.listen(0, "127.0.0.1", resolve),
    );
    const address = handle.server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server address");

    try {
      const response = await fetch(
        `http://127.0.0.1:${address.port}/api/simulations/ai-vs-ai`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ seed: "server-ai-sim", maxActions: 60 }),
        },
      );
      const payload = (await response.json()) as {
        summary?: {
          finalStateHash?: string;
          replayOk?: boolean;
          errors?: string[];
        };
      };
      expect(response.status).toBe(200);
      expect(payload.summary?.finalStateHash).toMatch(/^fnv1a:/);
      expect(payload.summary?.replayOk).toBe(true);
      expect(payload.summary?.errors).toEqual([]);
      expect(JSON.stringify(payload)).not.toContain("cardInstances");
      expect(JSON.stringify(payload)).not.toContain("sessionToken");
    } finally {
      await handle.close();
    }
  }, 15_000);
});

type PlayerSession = {
  side: Side;
  sessionToken: string;
  reconnectToken: string;
};

const CORPORATE_SHUFFLE_CORP_DECK: DeckDefinition = {
  id: "server_corporate_shuffle_corp",
  name: "Server Corporate Shuffle Integration Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 3 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "onr_classic_017_corporate-shuffle", quantity: 1 },
    { id: "onr_classic_025_strategic-planning-group", quantity: 1 },
  ],
};

const SERVER_DAMAGE_CORP_DECK: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_008,
  id: "server_card_spec_damage_corp",
  name: "Server CardSpec Damage Harness",
  cards: [
    ...DEMO_DECKS.demo_corp_008.cards,
    { id: "onr_v1_302_scorched-earth", quantity: 1 },
  ],
};

const SERVER_TRACE_CORP_DECK: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_008,
  id: "server_card_spec_trace_corp",
  name: "Server CardSpec Trace Harness",
  cards: [
    ...DEMO_DECKS.demo_corp_008.cards,
    { id: "onr_v1_236_data-raven", quantity: 1 },
  ],
};

const SERVER_DAMAGE_RUNNER_DECK: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_008,
  id: "server_card_spec_damage_runner",
  name: "Server CardSpec Damage Runner Harness",
  cards: [
    ...DEMO_DECKS.demo_runner_008.cards,
    { id: "onr_proteus_108_faked-hit", quantity: 1 },
  ],
};

async function joinedMatch(
  seed = "service-test",
  settings?: Partial<MatchSettings>,
  serviceOptions?: ConstructorParameters<typeof MultiplayerService>[1],
) {
  const service = new MultiplayerService(new InMemoryMatchStorage(), {
    tokenSalt: "test-salt",
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
    ...serviceOptions,
  });
  const created = await service.createMatch({
    hostSide: "corp",
    seed,
    ...(settings ? { settings } : {}),
  });
  expect(created.joinUrl).toBeTruthy();
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  expect(joinToken).toBeTruthy();
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);
  const runner = {
    side: "runner" as const,
    sessionToken: joined.sessionToken,
    reconnectToken: joined.reconnectToken,
  };
  const corp = {
    side: "corp" as const,
    sessionToken: created.hostSessionToken,
    reconnectToken: created.hostReconnectToken,
  };
  await forceSetupComplete(service, created.matchId);
  return {
    service,
    created,
    joinToken,
    matchId: created.matchId,
    corp,
    runner,
  };
}

async function joinedCorporateShuffleMatch(
  seed: string,
  options: { clicks: 2 | 3; strategicPlanningGroup: boolean },
) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored Corporate Shuffle match");
  const gameState = createGameAfterSetup({
    matchId: created.matchId,
    seed,
    runnerDeck: DEMO_DECKS.demo_runner_008,
    corpDeck: CORPORATE_SHUFFLE_CORP_DECK,
    agendaPointsToWin: 7,
  });
  gameState.activeSide = "corp";
  gameState.phase = "corp_action_phase";
  gameState.timingPoint = "corp_action.main";
  gameState.corp.clicks = options.clicks;
  gameState.corp.credits = 5;
  delete gameState.pendingChoice;
  delete gameState.pendingCorpDraw;
  const operationId = moveCorpCardToHqForTest(
    gameState,
    "onr_classic_017_corporate-shuffle",
  );
  if (options.strategicPlanningGroup) {
    const strategicPlanningGroupId = putCorpRootInRemoteForTest(
      gameState,
      "onr_classic_025_strategic-planning-group",
    );
    gameState.cardInstances[strategicPlanningGroupId] = {
      ...gameState.cardInstances[strategicPlanningGroupId]!,
      faceup: true,
      rezzed: true,
    };
  }
  const hqBeforePlay = gameState.corp.hq.length;
  record.gameState = gameState;
  record.match.status = "active";
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      gameState,
      record.match.matchVersion,
      "snap_corporate_shuffle_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    operationId,
    hqBeforePlay,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
  };
}

async function forceSetupComplete(
  service: MultiplayerService,
  matchId: string,
): Promise<void> {
  const record = await service.loadForTest(matchId);
  if (!record?.gameState) throw new Error("Missing active game state");
  const gameState = structuredClone(record.gameState);
  record.match.status = "active";
  gameState.stateVersion = 0;
  gameState.activeSide = "corp";
  gameState.phase = "corp_draw_phase";
  gameState.timingPoint = "corp_draw.mandatory_draw";
  gameState.setup = {
    status: "complete",
    initialHandSize: 5,
    resolved: { runner: "keep", corp: "keep" },
    mulligansTaken: {},
  };
  delete gameState.pendingChoice;
  gameState.winner = null;
  delete gameState.gameEndReason;
  const event = {
    ...gameState.eventLog[0]!,
    stateHashAfter: hashState({ ...gameState, eventLog: [] } as GameState),
    publicPayload: {
      ...gameState.eventLog[0]!.publicPayload,
      setupStatus: "complete",
    },
  };
  gameState.eventLog = [event];
  event.stateHashAfter = hashState(gameState);
  gameState.eventLog = [{ ...event, stateHashAfter: hashState(gameState) }];
  record.gameState = gameState;
  record.eventLog = gameState.eventLog.map((entry) =>
    toEventRecordForTest(matchId, entry),
  );
  record.actionReceipts = [];
  record.undoSnapshots = [];
  record.stateSnapshots = [
    stateSnapshotForTest(
      matchId,
      gameState,
      record.match.matchVersion,
      "snap_initial",
    ),
  ];
  delete record.pendingUndo;
  await (service as unknown as { storage: MultiplayerStorage }).storage.save(
    record,
  );
}

async function putTopCorpAgendaForMatch(
  service: MultiplayerService,
  matchId: string,
): Promise<void> {
  const record = await service.loadForTest(matchId);
  if (!record?.gameState) throw new Error("Missing active game state");
  const gameState = structuredClone(record.gameState);
  const agenda = Object.values(gameState.cardInstances).find((card) => {
    const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
    return (
      card.zone.side === "corp" &&
      definition?.side === "corp" &&
      definition.type === "agenda"
    );
  });
  if (!agenda) throw new Error("Missing corp agenda");
  putCorpCardOnTopOfRdForTest(gameState, agenda.definitionId);
  const latestEventIndex = gameState.eventLog.length - 1;
  const event =
    latestEventIndex >= 0 ? gameState.eventLog[latestEventIndex] : undefined;
  if (event)
    gameState.eventLog[latestEventIndex] = {
      ...event,
      stateHashAfter: hashState(gameState),
    };
  record.gameState = gameState;
  record.eventLog = gameState.eventLog.map((entry) =>
    toEventRecordForTest(matchId, entry),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      matchId,
      gameState,
      record.match.matchVersion,
      "snap_setup_agenda_top",
    ),
  ];
  delete record.pendingUndo;
  await (service as unknown as { storage: MultiplayerStorage }).storage.save(
    record,
  );
}

async function pendingDeckMatch(
  seed: string,
  countdownSeconds: 3 | 5 | 10 = 5,
) {
  const service = new MultiplayerService(new InMemoryMatchStorage(), {
    tokenSalt: `v104-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({
    hostSide: "runner",
    seed,
    mode: "human_vs_human",
    countdownSeconds,
    settings: { matchFormat: "single_game" },
    participantADecks: {
      runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
      corpDeckSnapshotId: "demo_corp_001_snapshot_v0_6",
    },
  });
  const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
    "joinToken",
  );
  if (!joinToken) throw new Error("Missing join token");
  return { service, created, joinToken };
}

async function readyLobby(seed: string, countdownSeconds: 3 | 5 | 10 = 5) {
  const pending = await pendingDeckMatch(seed, countdownSeconds);
  const joined = await pending.service.joinMatch(pending.created.matchId, {
    token: pending.joinToken,
    displayName: "Joiner",
    runnerDeckSnapshotId: "demo_runner_008_snapshot_v0_8",
    corpDeckSnapshotId: "demo_corp_008_snapshot_v0_8",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);
  expect(joined.matchStatus).toBe("ready_check");
  return { ...pending, joined };
}

async function countdownLobby(seed: string) {
  const lobby = await readyLobby(seed, 5);
  const hostReady = await lobby.service.setLobbyReady({
    matchId: lobby.created.matchId,
    side: lobby.created.hostSide,
    sessionToken: lobby.created.hostSessionToken,
    ready: true,
  });
  expect(hostReady.ok).toBe(true);
  if (!hostReady.ok) throw new Error(hostReady.error.message);
  const joinerReady = await lobby.service.setLobbyReady({
    matchId: lobby.created.matchId,
    side: lobby.joined.side,
    sessionToken: lobby.joined.sessionToken,
    ready: true,
  });
  expect(joinerReady.ok).toBe(true);
  if (!joinerReady.ok) throw new Error(joinerReady.error.message);
  expect(joinerReady.actorPayload.matchStatus).toBe("countdown");
  return lobby;
}

async function expectOldTokensRejected(
  service: MultiplayerService,
  matchId: string,
  side: Side,
  sessionToken: string,
  reconnectToken: string,
) {
  const bootstrapResult = await service.bootstrap(matchId, side, sessionToken, {
    allowLobby: true,
  });
  expect("error" in bootstrapResult).toBe(true);
  const reconnectResult = await service.reconnectMatch(matchId, {
    side,
    sessionToken,
    reconnectToken,
  });
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
  if (
    !payload ||
    typeof payload !== "object" ||
    !("playerView" in payload) ||
    !(payload as { playerView?: unknown }).playerView
  )
    throw new Error("Expected side payload");
  return payload as SidePayload;
}

function otherSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

async function joinedV120EventModificationMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = createGameAfterSetup({
    matchId: created.matchId,
    seed,
    runnerDeck: DEMO_DECKS.demo_runner_008,
    corpDeck: SERVER_DAMAGE_CORP_DECK,
    agendaPointsToWin: 7,
  });
  let ready = applyEngineAction(
    gameState,
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  ready.eventModificationHarness = {
    damagePrevention: { side: "runner", preventAmount: 4 },
  };
  moveCorpCardToHqForTest(ready, "onr_v1_302_scorched-earth");
  ready.runner.tags = 1;
  ready.corp.credits = 10;
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      ready,
      record.match.matchVersion,
      "snap_v120_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
    runner: {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    },
  };
}

async function joinedCanonicalDamageMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const ready = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeck: SERVER_DAMAGE_RUNNER_DECK,
      corpDeck: DEMO_DECKS.demo_corp_008,
      agendaPointsToWin: 7,
    }),
  );
  moveRunnerCardToGripForTest(ready, "onr_proteus_108_faked-hit");
  ready.runner.credits = 10;
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      ready,
      record.match.matchVersion,
      "snap_damage_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
    runner: {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    },
  };
}

async function joinedCanonicalTraceMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let ready = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeck: DEMO_DECKS.demo_runner_008,
      corpDeck: SERVER_TRACE_CORP_DECK,
      agendaPointsToWin: 7,
    }),
  );
  putCorpIceOnServerForTest(ready, "rd", "onr_v1_236_data-raven");
  ready.corp.credits = 20;
  ready.runner.credits = 10;
  ready = applyEngineAction(
    ready,
    "runner",
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  ready = applyEngineAction(
    ready,
    "corp",
    (action) =>
      action.type === "rez_ice" && action.label.includes("Data Raven"),
  );
  ready = applyEngineAction(
    ready,
    "runner",
    (action) => action.type === "continue_run",
  );
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      ready,
      record.match.matchVersion,
      "snap_trace_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
    runner: {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    },
  };
}

async function joinedV121ReplacementMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = createGameAfterSetup({
    matchId: created.matchId,
    seed,
    runnerDeck: DEMO_DECKS.demo_runner_008,
    corpDeck: SERVER_DAMAGE_CORP_DECK,
    agendaPointsToWin: 7,
  });
  let ready = applyEngineAction(
    gameState,
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  ready.eventModificationHarness = {
    damageReplacement: { side: "runner", tagAmount: 1 },
  };
  moveCorpCardToHqForTest(ready, "onr_v1_302_scorched-earth");
  ready.runner.tags = 1;
  ready.corp.credits = 10;
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      ready,
      record.match.matchVersion,
      "snap_v121_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
    runner: {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    },
  };
}

async function joinedV122SpecialZoneMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let ready = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      agendaPointsToWin: 7,
    }),
  );
  const cardId = moveRunnerCardToGripForTest(ready, "simple_economy_event");
  ready.specialZoneHarness = {
    actor: "runner",
    cardInstanceId: cardId,
    setAside: {
      visibility: "side_private",
      visibilitySide: "runner",
      reason: "mp_v122_side_private_set_aside",
    },
  };
  record.gameState = ready;
  record.match.baseline = ready.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = ready.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      ready,
      record.match.matchVersion,
      "snap_v122_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
    runner: {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    },
  };
}

async function prepareV123MitRunnerTurn(
  service: MultiplayerService,
  matchId: string,
): Promise<void> {
  const record = await service.loadForTest(matchId);
  if (!record?.gameState) throw new Error("Missing stored V1.2.3 match");
  const gameState = structuredClone(record.gameState);
  record.match.status = "active";
  gameState.activeSide = "runner";
  gameState.phase = "runner_action_phase";
  gameState.timingPoint = "runner_action.main";
  gameState.runner.clicks = 4;
  gameState.runner.credits = 5;
  gameState.setup = {
    status: "complete",
    initialHandSize: 5,
    resolved: { runner: "keep", corp: "keep" },
    mulligansTaken: {},
  };
  delete gameState.pendingChoice;
  moveRunnerCardToGripForTest(gameState, "onr_v1_101_mit-west-tier");
  const latestEventIndex = gameState.eventLog.length - 1;
  if (latestEventIndex >= 0)
    gameState.eventLog[latestEventIndex] = {
      ...gameState.eventLog[latestEventIndex]!,
      stateHashAfter: hashState(gameState),
    };
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) =>
    toEventRecordForTest(matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      matchId,
      gameState,
      record.match.matchVersion,
      "snap_v123_mit_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await (service as unknown as { storage: MultiplayerStorage }).storage.save(
    record,
  );
}

async function joinedV112ArchivesMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = toRunnerTurnEngine(
    createGameAfterSetup({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_008",
      corpDeckId: "demo_corp_008",
      agendaPointsToWin: 7,
    }),
  );
  gameState.runner.credits = 10;
  const faceupOperation = moveCorpCardToArchivesForTest(
    gameState,
    "simple_economy_operation",
    true,
  );
  const facedownAsset = moveCorpCardToArchivesForTest(
    gameState,
    "simple_economy_asset",
    false,
  );
  const facedownAgenda = moveCorpCardToArchivesForTest(
    gameState,
    "simple_agenda",
    false,
  );
  keepOnlyCorpArchivesCardsForTest(gameState, [
    faceupOperation,
    facedownAsset,
    facedownAgenda,
  ]);
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      gameState,
      record.match.matchVersion,
      "snap_v112_archives_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
    runner: {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    },
  };
}

async function joinedOffSiteBackupsMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3100",
    publicServerBaseUrl: "http://127.0.0.1:8787",
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Runner",
  });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const corpDeck: DeckDefinition = {
    ...DEMO_DECKS.demo_corp_008,
    id: "server_off_site_backups_fixture",
    name: "Server Off-Site Backups Fixture",
    cards: [
      { id: "onr_v1_296_off-site-backups", quantity: 1 },
      ...DEMO_DECKS.demo_corp_008.cards,
    ],
  };
  let gameState = createGameAfterSetup({
    matchId: created.matchId,
    seed,
    runnerDeckId: "demo_runner_008",
    corpDeck,
    agendaPointsToWin: 7,
  });
  gameState = applyEngineAction(
    gameState,
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  gameState.corp.credits = 10;
  gameState.corp.clicks = 10;
  gameState.corp.maxHandSize = 100;
  moveCorpCardToHqForTest(gameState, "onr_v1_296_off-site-backups");
  const faceupOperation = moveCorpCardToArchivesForTest(
    gameState,
    "simple_economy_operation",
    true,
  );
  const facedownAgenda = moveCorpCardToArchivesForTest(
    gameState,
    "simple_agenda",
    false,
  );
  keepOnlyCorpArchivesCardsForTest(gameState, [
    faceupOperation,
    facedownAgenda,
  ]);
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) =>
    toEventRecordForTest(created.matchId, event),
  );
  record.stateSnapshots = [
    stateSnapshotForTest(
      created.matchId,
      gameState,
      record.match.matchVersion,
      "snap_off_site_backups_ready",
    ),
  ];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: {
      side: "corp" as const,
      sessionToken: created.hostSessionToken,
      reconnectToken: created.hostReconnectToken,
    },
    runner: {
      side: "runner" as const,
      sessionToken: joined.sessionToken,
      reconnectToken: joined.reconnectToken,
    },
  };
}

async function bootstrap(
  service: MultiplayerService,
  matchId: string,
  session: PlayerSession,
): Promise<SidePayload> {
  const payload = await service.bootstrap(
    matchId,
    session.side,
    session.sessionToken,
  );
  expect("error" in payload).toBe(false);
  if ("error" in payload) throw new Error(payload.error.message);
  return payload;
}

function sidePayloadBeliefInput(
  payload: Pick<SidePayload, "playerView" | "eventTail" | "legalActions">,
  side: Side,
  label: string,
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
    profileId: `${side}-ai-v1.4.2-normal`,
  });
}

function toRunnerTurnEngine(state: GameState): GameState {
  let next = applyEngineAction(
    state,
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  next = applyEngineAction(
    next,
    "corp",
    (action) => action.type === "end_turn",
  );
  if (
    next.pendingChoice?.source === "discard_phase" &&
    next.pendingChoice.side === "corp"
  ) {
    next = applyEngineChoice(next, "corp", [
      String(next.pendingChoice.options[0]?.id),
    ]);
  }
  return next;
}

async function submitChoice(
  service: MultiplayerService,
  matchId: string,
  session: PlayerSession,
  optionId: string,
  key: string,
): Promise<SidePayload> {
  const before = await bootstrap(service, matchId, session);
  const choice = before.playerView.pendingChoice;
  if (!choice) throw new Error("Missing pending choice");
  const action = mustAction(
    before,
    (candidate) => candidate.type === "resolve_choice",
  );
  const result = await service.submitAction({
    matchId,
    side: session.side,
    sessionToken: session.sessionToken,
    actionId: action.actionId,
    clientKnownStateVersion: before.playerView.stateVersion,
    selectedChoices: {
      choiceId: choice.choiceId,
      selectedOptionIds: [optionId],
    },
    idempotencyKey: `${key}-${before.playerView.stateVersion}`,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.actorPayload;
}

async function submitFirstChoice(
  service: MultiplayerService,
  matchId: string,
  session: PlayerSession,
  key: string,
): Promise<SidePayload> {
  const before = await bootstrap(service, matchId, session);
  const optionId = before.playerView.pendingChoice?.options[0]?.id;
  if (!optionId) throw new Error("Missing first choice option");
  return submitChoice(service, matchId, session, optionId, key);
}

async function resolveCorpDiscardIfPending(
  service: MultiplayerService,
  matchId: string,
  session: PlayerSession,
  key: string,
): Promise<void> {
  const before = await bootstrap(service, matchId, session);
  if (before.playerView.pendingChoice?.source !== "discard_phase") return;
  if (before.playerView.pendingChoice.side !== "corp") return;
  await submitFirstChoice(service, matchId, session, key);
}

function applyEngineAction(
  state: GameState,
  side: Side,
  predicate: (action: LegalAction) => boolean,
): GameState {
  const selected = getLegalActions(state, side).find(predicate);
  if (!selected) throw new Error(`Missing engine action for ${side}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyEngineChoice(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
): GameState {
  const selected = getLegalActions(state, side).find(
    (action) => action.type === "resolve_choice",
  );
  if (!selected) throw new Error(`Missing engine choice action for ${side}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}-${selectedOptionIds.join(".")}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function sourceDefinitionForServerTest(
  state: GameState,
  action: LegalAction,
): string | undefined {
  const cardId = String(action.payload?.cardId ?? action.source ?? "");
  return state.cardInstances[cardId]?.definitionId;
}

function putCorpIceOnServerForTest(
  state: GameState,
  serverId: "hq" | "rd" | "archives" | `remote_${number}`,
  definitionId: string,
): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Missing server");
  removeEverywhereForTest(state, id);
  server.ice.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpRootInRemoteForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  let server = state.corp.servers.find(
    (candidate) => candidate.id === "remote_1",
  );
  if (!server) {
    server = {
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    };
    state.corp.servers.push(server);
  }
  removeEverywhereForTest(state, id);
  server.root.push(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function putCorpCardOnTopOfRdForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "rd" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function moveCorpCardToHqForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.corp.hq.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
  };
  return id;
}

function moveCorpCardToArchivesForTest(
  state: GameState,
  definitionId: string,
  faceup = true,
): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.corp.archives.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "corp", zone: "archives" },
    faceup,
    rezzed: faceup,
  };
  return id;
}

function keepOnlyCorpArchivesCardsForTest(
  state: GameState,
  ids: CardInstanceId[],
): void {
  const keep = new Set(ids);
  const movedToRd = state.corp.archives.filter((cardId) => !keep.has(cardId));
  state.corp.archives = ids.slice();
  for (const cardId of movedToRd) {
    state.corp.rd.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "rd" },
      faceup: false,
      rezzed: false,
    };
  }
}

function moveRunnerCardToGripForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "grip" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function putRunnerCardOnTopOfStackForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.runner.stack.unshift(id);
  state.cardInstances[id] = {
    ...state.cardInstances[id]!,
    zone: { side: "runner", zone: "stack" },
    faceup: true,
    rezzed: true,
  };
  return id;
}

function emptyRunnerGripForTest(state: GameState): void {
  for (const id of state.runner.grip.slice()) {
    removeEverywhereForTest(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
  }
}

function findCardForTest(
  state: GameState,
  definitionId: string,
): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, card]) => card.definitionId === definitionId,
  );
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
  state.runner.rig.programs = state.runner.rig.programs.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.hardware = state.runner.rig.hardware.filter(
    (id) => id !== cardId,
  );
  state.runner.rig.resources = state.runner.rig.resources.filter(
    (id) => id !== cardId,
  );
  if (state.specialZones) {
    state.specialZones.setAside = state.specialZones.setAside.filter(
      (id) => id !== cardId,
    );
    state.specialZones.removedFromGame =
      state.specialZones.removedFromGame.filter((id) => id !== cardId);
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
    hiddenInfoBarrier: false,
  };
}

function stateSnapshotForTest(
  matchId: string,
  state: GameState,
  matchVersion: number,
  snapshotId: string,
): StateSnapshot {
  return {
    snapshotId,
    matchId,
    stateVersion: state.stateVersion,
    matchVersion,
    stateHash: hashState(state),
    gameState: structuredClone(state),
    createdAt: "2026-05-04T00:00:00.000Z",
    hiddenInfoBarrier: false,
  };
}

function toPublicEventForTest(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass
      ? { visibilityClass: event.visibilityClass }
      : {}),
    publicPayload: event.publicPayload,
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
    visibility: "private_to_side",
  };
}

async function submit(
  service: MultiplayerService,
  matchId: string,
  session: PlayerSession,
  predicate: (action: LegalAction) => boolean,
  idempotencyKey: string,
) {
  const payload = await bootstrap(service, matchId, session);
  const action = mustAction(payload, predicate);
  const result = await service.submitAction({
    matchId,
    side: session.side,
    sessionToken: session.sessionToken,
    actionId: action.actionId,
    clientKnownStateVersion: payload.playerView.stateVersion,
    idempotencyKey,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

function mustAction(
  payload: SidePayload,
  predicate: (action: LegalAction) => boolean,
): LegalAction {
  const selected = payload.legalActions.find(predicate);
  expect(
    selected,
    payload.legalActions
      .map((action) => `${action.type}:${action.label}`)
      .join(", "),
  ).toBeDefined();
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
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for ${type}`)),
      5000,
    );
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
    NETGRID_RATE_LIMIT_PROFILE: "private_internet",
  } as NodeJS.ProcessEnv);
}

const MAINTENANCE_TEST_ORIGIN = "http://127.0.0.1:3100";
const MAINTENANCE_TEST_PASSWORD = "sichere Test-Passphrase";

type MaintenanceTestClient = {
  handle: ReturnType<typeof createNetgridHttpServer>;
  baseUrl: string;
  request(
    path: string,
    init?: RequestInit,
    options?: { sensitive?: boolean },
  ): Promise<Response>;
};

async function authenticatedMaintenanceServer(
  service: MultiplayerService,
  deploymentConfig = loadDeploymentConfig({} as NodeJS.ProcessEnv),
): Promise<MaintenanceTestClient> {
  const maintenanceAuth = new MaintenanceAuthService(
    new InMemoryMaintenanceCredentialStore(),
    {
      passwordKdf: {
        keyLength: 32,
        cost: 1024,
        blockSize: 8,
        parallelization: 1,
        maxMemory: 8 * 1024 * 1024,
      },
    },
  );
  await maintenanceAuth.bootstrapPassword(MAINTENANCE_TEST_PASSWORD);
  const handle = createNetgridHttpServer(service, {
    deploymentConfig,
    maintenanceAuth,
  });
  const baseUrl = await listen(handle);
  const login = await fetch(`${baseUrl}/api/storage/maintenance/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: MAINTENANCE_TEST_ORIGIN,
    },
    body: JSON.stringify({ password: MAINTENANCE_TEST_PASSWORD }),
  });
  if (!login.ok)
    throw new Error(`Maintenance test login failed: ${login.status}`);
  const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
  const loginPayload = (await login.json()) as { csrfToken?: string };
  if (!cookie || !loginPayload.csrfToken)
    throw new Error("Maintenance test login returned no session proof");
  let csrfToken = loginPayload.csrfToken;
  const rawRequest = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    headers.set("cookie", cookie);
    headers.set("origin", MAINTENANCE_TEST_ORIGIN);
    if ((init.method ?? "GET") !== "GET")
      headers.set("x-netgrid-csrf", csrfToken);
    return fetch(`${baseUrl}${path}`, { ...init, headers });
  };
  return {
    handle,
    baseUrl,
    request: async (path, init = {}, options = {}) => {
      if (options.sensitive) {
        const reauth = await rawRequest(
          "/api/storage/maintenance/auth/reauthenticate",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ password: MAINTENANCE_TEST_PASSWORD }),
          },
        );
        if (!reauth.ok)
          throw new Error(
            `Maintenance test reauthentication failed: ${reauth.status}`,
          );
      }
      const response = await rawRequest(path, init);
      if (path === "/api/storage/maintenance/auth/session" && response.ok) {
        const payload = (await response.clone().json()) as {
          csrfToken?: string;
        };
        if (payload.csrfToken) csrfToken = payload.csrfToken;
      }
      return response;
    },
  };
}

async function listen(
  handle: ReturnType<typeof createNetgridHttpServer>,
): Promise<string> {
  await new Promise<void>((resolve) =>
    handle.server.listen(0, "127.0.0.1", resolve),
  );
  const address = handle.server.address();
  if (!address || typeof address === "string")
    throw new Error("Missing server address");
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

async function storedMatchFixture(seed: string): Promise<{
  record: StoredMatch;
  hostSessionToken: string;
  hostReconnectToken: string;
  joinToken: string;
}> {
  const service = new MultiplayerService(new InMemoryMatchStorage(), {
    tokenSalt: `fixture-${seed}`,
  });
  const created = await service.createMatch({ hostSide: "runner", seed });
  const joinToken = new URL(created.joinUrl ?? "").searchParams.get(
    "joinToken",
  );
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, {
    token: joinToken,
    displayName: "Corp",
  });
  expect("error" in joined).toBe(false);
  const record = await service.loadForTest(created.matchId);
  if (!record) throw new Error("Missing stored fixture");
  return {
    record,
    hostSessionToken: created.hostSessionToken,
    hostReconnectToken: created.hostReconnectToken,
    joinToken,
  };
}

async function listBackupManifests(backupDir: string) {
  const entries = await readdir(backupDir, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(
        async (entry) =>
          JSON.parse(
            await readFile(
              join(backupDir, entry.name, "manifest.json"),
              "utf8",
            ),
          ) as Record<string, unknown>,
      ),
  );
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function actionHistoryCountsForTest(
  database: DatabaseSync,
  matchId: string,
): {
  events: number;
  engineEvents: number;
  receipts: number;
  snapshots: number;
  traces: number;
} {
  const row = database
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM events WHERE match_id = ?) AS events,
        (SELECT COUNT(*) FROM engine_events WHERE match_id = ?) AS engineEvents,
        (SELECT COUNT(*) FROM action_receipts WHERE match_id = ?) AS receipts,
        (SELECT COUNT(*) FROM state_snapshots WHERE match_id = ?) AS snapshots,
        (SELECT COUNT(*) FROM ai_decision_traces WHERE match_id = ?) AS traces`,
    )
    .get(matchId, matchId, matchId, matchId, matchId) as Record<
    string,
    number | bigint
  >;
  return {
    events: Number(row.events),
    engineEvents: Number(row.engineEvents),
    receipts: Number(row.receipts),
    snapshots: Number(row.snapshots),
    traces: Number(row.traces),
  };
}

function deckSnapshotByIdForTest(snapshotId: string): DeckSnapshot {
  const snapshot = (snapshotsData08.snapshots as DeckSnapshot[]).find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing test deck snapshot ${snapshotId}`);
  return structuredClone(snapshot) as DeckSnapshot;
}

class FailingStorage implements MultiplayerStorage {
  private readonly inner = new InMemoryMatchStorage();
  failNextSave = false;
  loadCount = 0;
  saveCount = 0;

  load(matchId: string): Promise<StoredMatch | undefined> {
    this.loadCount += 1;
    return this.inner.load(matchId);
  }

  async save(record: StoredMatch): Promise<void> {
    this.saveCount += 1;
    if (this.failNextSave) {
      this.failNextSave = false;
      throw new Error("forced_storage_failure");
    }
    await this.inner.save(record);
  }

  list(): Promise<StoredMatch[]> {
    return this.inner.list();
  }

  resetCounters(): void {
    this.loadCount = 0;
    this.saveCount = 0;
  }
}

class ActionDeltaTrackingStorage implements MultiplayerStorage {
  private readonly inner = new InMemoryMatchStorage();
  actionLoadCount = 0;
  deltaSaveCount = 0;
  fullSaveCount = 0;

  constructor(private readonly order: string[]) {}

  load(
    matchId: string,
    options?: { includeStateSnapshots?: boolean },
  ): Promise<StoredMatch | undefined> {
    return this.inner.load(matchId, options);
  }

  async save(record: StoredMatch): Promise<void> {
    this.fullSaveCount += 1;
    await this.inner.save(record);
  }

  async loadForAction(
    matchId: string,
    _input: ActionPersistenceLoadInput,
  ): Promise<StoredMatch | undefined> {
    this.actionLoadCount += 1;
    const record = await this.inner.load(matchId, {
      includeStateSnapshots: false,
    });
    if (!record) return undefined;
    record.actionPersistenceBaseline = {
      expectedMatchVersion: record.match.matchVersion,
      expectedStateVersion: record.gameState.stateVersion,
      publicEventCount: record.eventLog.length,
      engineEventCount: record.gameState.eventLog.length,
      actionReceiptCount: record.actionReceipts.length,
      aiDecisionTraceCount: record.aiDecisionTraces?.length ?? 0,
      loadedActionReceiptCount: record.actionReceipts.length,
      loadedAiDecisionTraceCount: record.aiDecisionTraces?.length ?? 0,
    };
    return record;
  }

  async saveActionDelta(record: StoredMatch): Promise<void> {
    this.deltaSaveCount += 1;
    const {
      actionPersistenceBaseline: _actionPersistenceBaseline,
      ...persistedRecord
    } = record;
    await this.inner.save(persistedRecord as StoredMatch);
    this.order.push("delta-save");
  }

  list(): Promise<StoredMatch[]> {
    return this.inner.list();
  }

  resetCounters(): void {
    this.actionLoadCount = 0;
    this.deltaSaveCount = 0;
    this.fullSaveCount = 0;
    this.order.length = 0;
  }
}
