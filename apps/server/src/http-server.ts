import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import { isAiDeckSnapshotRuntimeError } from "@netgrid/ai";
import { simulateAiGame } from "@netgrid/ai/simulation";
import type {
  ApiAccountActivePublicMatchIds,
  ApiMatchCardPool,
} from "@netgrid/shared";
import {
  createConnectionAuditLoggerFromEnv,
  noopConnectionAuditLogger,
  type ConnectionAuditLogger,
} from "./connection-audit";
import {
  MultiplayerService,
  type MatchMode,
  type MatchStatus,
  type ReplayPerspective,
  type LifecycleActionResult,
  type LobbyPayload,
  type ServicePayload,
  type SidePayload,
  type StoredMatch,
  type SubmitActionResult,
  type UndoResult,
} from "./multiplayer";
import {
  DEFAULT_SQLITE_STORAGE_PATH,
  DEFAULT_STORAGE_BACKUP_DIR,
  SqliteMatchStorage,
  StorageError,
} from "./storage-sqlite";
import type {
  StorageMaintenanceCleanupApplyInput,
  StorageMaintenanceCleanupFilters,
  StorageMaintenanceCleanupPolicyInput,
  StorageMaintenanceMatchFilters,
} from "./storage-sqlite";
import { resolveDeckSetup } from "./deck-setup";
import {
  aiDeckPolicyFromValue,
  deckPairFromBody,
  deckSelectionFromBody,
} from "./deck-request";
import {
  applyCors,
  clientIdentity,
  createRateLimiter,
  envValue,
  FixedWindowRateLimiter,
  hashClientKey,
  isOriginAllowed,
  loadDeploymentConfig,
  originDeniedPayload,
  rateLimitedPayload,
  redactedDiagnosticsUnavailable,
  redactedHealth,
  redactSensitiveText,
  type DeploymentConfig,
  type RateLimitCategory,
} from "./internet-hardening";
import type { ApiServerMessage, Side } from "@netgrid/shared";
import type { AiDifficulty } from "@netgrid/shared";
import {
  JsonFileMaintenanceCredentialStore,
  MAINTENANCE_SESSION_COOKIE_NAME,
  MAINTENANCE_SESSION_MAX_AGE_MINUTES,
  MaintenanceAuthService,
  maintenanceAuthPathFromEnv,
} from "./maintenance-auth";
import { AccountAuthService } from "./account-password";
import {
  AccountDeckError,
  AccountDeckService,
  SqliteAccountDeckStorage,
  type AccountDeckDraftInput,
  type AccountDeckRecord,
} from "./account-decks";
import {
  AccountMatchStartPreferenceService,
  AccountMatchStartPreferencesError,
  SqliteAccountMatchStartPreferenceStorage,
} from "./account-match-start-preferences";
import {
  ACCOUNT_SESSION_COOKIE_NAME,
  ACCOUNT_SESSION_MAX_AGE_DAYS,
  SqliteAccountStorage,
  type AccountSessionAuthResult,
} from "./account-session";
import {
  AccountMatchStatisticsService,
  SqliteAccountStatisticsStorage,
  type AccountMatchHistoryQuery,
  type AccountStatisticsQuery,
} from "./account-statistics";

const NETGRID_REPOSITORY_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const MAINTENANCE_ANALYSIS_BUNDLE_ROUTE =
  /^\/api\/storage\/maintenance\/analysis\/matches\/([^/]+)\/bundle$/;
const MAINTENANCE_DECISION_ANALYSIS_ROUTE =
  /^\/api\/storage\/maintenance\/analysis\/matches\/([^/]+)\/decisions\/(\d+)$/;

function resolveRepositoryStoragePath(path: string): string {
  return resolve(NETGRID_REPOSITORY_ROOT, path);
}

export function resolveConfiguredMatchSqlitePath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return resolveRepositoryStoragePath(
    envValue(env, "NETGRID_SQLITE_STORAGE_PATH") ?? DEFAULT_SQLITE_STORAGE_PATH,
  );
}

export function resolveConfiguredAccountSqlitePath(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const accountPath = envValue(env, "NETGRID_ACCOUNT_SQLITE_PATH");
  return accountPath
    ? resolveRepositoryStoragePath(accountPath)
    : resolveConfiguredMatchSqlitePath(env);
}

function resolveConfiguredStorageBackupDir(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return resolveRepositoryStoragePath(
    envValue(env, "NETGRID_STORAGE_BACKUP_DIR") ?? DEFAULT_STORAGE_BACKUP_DIR,
  );
}

type ClientWsMessage =
  | {
      type: "join_match";
      payload: { matchId: string; sessionToken: string; side: Side };
    }
  | {
      type: "submit_action";
      payload: {
        matchId: string;
        side: Side;
        actionId: string;
        clientKnownStateVersion: number;
        idempotencyKey: string;
        selectedTargets?: Record<string, string>;
        selectedChoices?: Record<string, unknown>;
      };
    }
  | {
      type: "request_undo";
      payload: { targetEventId: string; reason?: string };
    }
  | { type: "accept_undo"; payload: { undoRequestId: string } }
  | { type: "decline_undo"; payload: { undoRequestId: string } }
  | { type: "set_ready"; payload: { ready: boolean } }
  | { type: "cancel_countdown"; payload: Record<string, never> }
  | { type: "send_lobby_chat"; payload: { text: string } }
  | {
      type: "advance_ai";
      payload: {
        knownStateVersion?: number;
        knownMatchVersion?: number;
        mode?: "single_step" | "until_human";
      };
    }
  | { type: "ping"; payload: { clientTime: number } };

export type ServerWsMessage = ApiServerMessage;

type WsContext = {
  matchId: string;
  side: Side;
  sessionToken: string;
};

type Connection = {
  socket: WebSocket;
  context: WsContext;
};

export type NetgridServerHandle = {
  server: Server;
  service: MultiplayerService;
  realtime: NetgridRealtimeServer;
  deploymentConfig: DeploymentConfig;
  accountStatisticsReady: Promise<void>;
  close(): Promise<void>;
};

export type NetgridServerOptions = {
  deploymentConfig?: DeploymentConfig;
  rateLimiter?: FixedWindowRateLimiter;
  connectionAudit?: ConnectionAuditLogger;
  maintenanceAuth?: MaintenanceAuthService;
  accountAuth?: AccountAuthService;
  accountDecks?: AccountDeckService;
  accountMatchStartPreferences?: AccountMatchStartPreferenceService;
  accountStatistics?: AccountMatchStatisticsService;
};

export class NetgridRealtimeServer {
  private readonly connections = new Map<string, Map<Side, Connection>>();
  private readonly countdownTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();
  private readonly socketClients = new WeakMap<
    WebSocket,
    {
      clientKey: string;
      openedAt: number;
      origin?: string | undefined;
      replacedByReconnect?: boolean;
    }
  >();
  private readonly socketContexts = new WeakMap<WebSocket, WsContext>();
  private wss?: WebSocketServer;

  constructor(
    private readonly service: MultiplayerService,
    private readonly deploymentConfig: DeploymentConfig,
    private readonly rateLimiter: FixedWindowRateLimiter,
    private readonly connectionAudit: ConnectionAuditLogger = noopConnectionAuditLogger,
  ) {}

  attach(server: Server): void {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      verifyClient: (info, done) => {
        const origin = info.origin || info.req.headers.origin;
        const clientKey = hashClientKey(
          clientIdentity(info.req, this.deploymentConfig),
        );
        if (!isOriginAllowed(origin, this.deploymentConfig)) {
          this.recordConnectionAudit({
            event: "ws_handshake_denied",
            origin: originOfHeader(origin),
            clientKey,
            errorCode: "origin_not_allowed",
          });
          done(false, 403, "origin_not_allowed");
          return;
        }
        const limited = this.rateLimiter.check("ws_handshake", clientKey, "ws");
        if (!limited.allowed) {
          this.recordConnectionAudit({
            event: "ws_handshake_denied",
            origin: originOfHeader(origin),
            clientKey,
            errorCode: "rate_limited",
            rateLimitCategory: "ws_handshake",
          });
          done(false, 429, "rate_limited");
          return;
        }
        done(true);
      },
    });
    this.wss.on("connection", (socket, request) => {
      const origin = originOfHeader(request.headers.origin);
      const clientKey = hashClientKey(
        clientIdentity(request, this.deploymentConfig),
      );
      this.socketClients.set(socket, {
        clientKey,
        openedAt: Date.now(),
        origin,
      });
      this.recordConnectionAudit({ event: "ws_open", origin, clientKey });
      socket.on(
        "message",
        (raw) =>
          void this.handleMessage(socket, raw.toString()).catch((error) =>
            this.handleMessageFailure(socket, error),
          ),
      );
      socket.on(
        "close",
        (code, reason) =>
          void this.handleClose(socket, code, reason.toString("utf8")),
      );
      socket.on("error", (error) => this.handleSocketError(socket, error));
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss?.close(() => resolve());
      if (!this.wss) resolve();
    });
  }

  recordServerStart(url: string): void {
    this.recordConnectionAudit({
      event: "server_start",
      profile: this.deploymentConfig.profile,
      url,
    });
  }

  private async handleMessage(socket: WebSocket, raw: string): Promise<void> {
    const message = parseWsMessage(raw);
    if (!message) {
      send(socket, {
        type: "error",
        payload: {
          code: "bad_message",
          message: "Nachricht konnte nicht gelesen werden.",
        },
      });
      return;
    }

    if (message.type === "ping") {
      send(socket, {
        type: "pong",
        payload: {
          clientTime: message.payload.clientTime,
          serverTime: Date.now(),
        },
      });
      return;
    }

    if (message.type === "join_match") {
      await this.joinSocket(socket, message.payload);
      return;
    }

    const context = this.findContext(socket);
    if (!context) {
      send(socket, {
        type: "error",
        payload: {
          code: "not_joined",
          message: "WebSocket ist noch keinem Match beigetreten.",
        },
      });
      return;
    }

    if (message.type === "submit_action") {
      if (
        message.payload.matchId !== context.matchId ||
        message.payload.side !== context.side
      ) {
        send(socket, {
          type: "error",
          payload: {
            code: "wrong_session",
            message: "Diese Session darf diese Aktion nicht ausführen.",
          },
        });
        return;
      }
      await this.handleSubmitAction(context, message.payload);
      return;
    }

    if (message.type === "advance_ai") {
      await this.handleAdvanceAi(context, message.payload);
      return;
    }

    if (message.type === "set_ready") {
      await this.handleLobbyOperation(
        this.service.setLobbyReady({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken,
          ready: Boolean(message.payload.ready),
        }),
      );
      return;
    }

    if (message.type === "cancel_countdown") {
      await this.handleLobbyOperation(
        this.service.cancelLobbyCountdown({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken,
        }),
      );
      return;
    }

    if (message.type === "send_lobby_chat") {
      await this.handleLobbyOperation(
        this.service.sendLobbyChat({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken,
          text:
            typeof message.payload.text === "string"
              ? message.payload.text
              : "",
        }),
      );
      return;
    }

    if (message.type === "request_undo") {
      await this.handleUndo(
        context,
        this.service.requestUndo({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken,
          targetEventId: message.payload.targetEventId,
          ...(message.payload.reason ? { reason: message.payload.reason } : {}),
        }),
      );
      return;
    }

    if (message.type === "accept_undo") {
      await this.handleUndo(
        context,
        this.service.acceptUndo({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken,
          undoRequestId: message.payload.undoRequestId,
        }),
      );
      return;
    }

    if (message.type === "decline_undo") {
      await this.handleUndo(
        context,
        this.service.declineUndo({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken,
          undoRequestId: message.payload.undoRequestId,
        }),
      );
    }
  }

  private async joinSocket(
    socket: WebSocket,
    payload: { matchId: string; sessionToken: string; side: Side },
  ): Promise<void> {
    const clientKey =
      this.socketClients.get(socket)?.clientKey ?? "unknown-client";
    const limited = this.rateLimiter.check(
      "ws_join",
      clientKey,
      payload.matchId,
    );
    if (!limited.allowed) {
      this.recordConnectionAudit({
        event: "ws_join_failed",
        clientKey,
        matchId: payload.matchId,
        side: payload.side,
        errorCode: "rate_limited",
        rateLimitCategory: "ws_join",
      });
      send(socket, {
        type: "error",
        payload: {
          code: "rate_limited",
          message: "Zu viele WebSocket-Join-Versuche. Bitte kurz warten.",
        },
      });
      return;
    }
    const connected = await this.service.setConnected(
      payload.matchId,
      payload.side,
      payload.sessionToken,
      true,
    );
    if ("error" in connected) {
      this.recordConnectionAudit({
        event: "ws_join_failed",
        clientKey,
        matchId: payload.matchId,
        side: payload.side,
        errorCode: connected.error.code,
      });
      send(socket, { type: "error", payload: connected.error });
      return;
    }

    const bySide =
      this.connections.get(payload.matchId) ?? new Map<Side, Connection>();
    const previous = bySide.get(payload.side);
    if (previous && previous.socket !== socket) {
      send(previous.socket, {
        type: "error",
        payload: {
          code: "reconnected_elsewhere",
          message: "Diese Seite wurde in einem anderen Fenster verbunden.",
        },
      });
      const previousMeta = this.socketClients.get(previous.socket);
      if (previousMeta)
        this.socketClients.set(previous.socket, {
          ...previousMeta,
          replacedByReconnect: true,
        });
      this.recordConnectionAudit({
        event: "ws_replaced_by_reconnect",
        clientKey: previousMeta?.clientKey,
        matchId: payload.matchId,
        side: payload.side,
        code: 4000,
        reason: "reconnected",
      });
      previous.socket.close(4000, "reconnected");
    }
    bySide.set(payload.side, { socket, context: payload });
    this.connections.set(payload.matchId, bySide);
    this.socketContexts.set(socket, payload);
    this.recordConnectionAudit({
      event: "ws_join_ok",
      clientKey,
      matchId: payload.matchId,
      side: payload.side,
    });
    sendBootstrap(socket, connected);
    this.scheduleCountdownFromPayload(connected);
    await this.sendOpponentBootstrap(
      payload.matchId,
      opposite(payload.side),
      connected.opponentStatus,
    );
  }

  private async handleSubmitAction(
    context: WsContext,
    payload: Extract<ClientWsMessage, { type: "submit_action" }>["payload"],
  ): Promise<void> {
    const result = await this.service.submitAction({
      matchId: context.matchId,
      side: context.side,
      sessionToken: context.sessionToken,
      actionId: payload.actionId,
      clientKnownStateVersion: payload.clientKnownStateVersion,
      idempotencyKey: payload.idempotencyKey,
      ...(payload.selectedTargets
        ? { selectedTargets: payload.selectedTargets }
        : {}),
      ...(payload.selectedChoices
        ? { selectedChoices: payload.selectedChoices }
        : {}),
    });

    const actor = this.connection(context.matchId, context.side);
    if (!result.ok) {
      if (result.receipt)
        send(actor?.socket, {
          type: "action_receipt",
          payload: result.receipt,
        });
      send(actor?.socket, { type: "error", payload: result.error });
      if (result.payload) sendBootstrap(actor?.socket, result.payload);
      return;
    }

    send(actor?.socket, { type: "action_receipt", payload: result.receipt });
    this.broadcastPayload(result.actorPayload);
    this.broadcastPayload(result.opponentPayload);
  }

  private async handleAdvanceAi(
    context: WsContext,
    payload: Extract<ClientWsMessage, { type: "advance_ai" }>["payload"],
  ): Promise<void> {
    const result = await this.service.advanceAi({
      matchId: context.matchId,
      side: context.side,
      sessionToken: context.sessionToken,
      ...(typeof payload.knownStateVersion === "number"
        ? { knownStateVersion: payload.knownStateVersion }
        : {}),
      ...(typeof payload.knownMatchVersion === "number"
        ? { knownMatchVersion: payload.knownMatchVersion }
        : {}),
      ...(payload.mode === "until_human" || payload.mode === "single_step"
        ? { mode: payload.mode }
        : {}),
    });

    const actor = this.connection(context.matchId, context.side);
    if (!result.ok) {
      send(actor?.socket, { type: "error", payload: result.error });
      if (result.payload) sendBootstrap(actor?.socket, result.payload);
      return;
    }

    this.broadcastPayload(result.requesterPayload);
    this.broadcastPayload(result.opponentPayload);
  }

  private async handleUndo(
    context: WsContext,
    operation: Promise<UndoResult>,
  ): Promise<void> {
    const result = await operation;
    const actor = this.connection(context.matchId, context.side);
    if (!result.ok) {
      send(actor?.socket, { type: "error", payload: result.error });
      if (result.payload) sendBootstrap(actor?.socket, result.payload);
      return;
    }
    this.broadcastPayload(result.requesterPayload);
    this.broadcastPayload(result.opponentPayload);
  }

  private async handleLobbyOperation(
    operation: Promise<
      Awaited<ReturnType<MultiplayerService["setLobbyReady"]>>
    >,
  ): Promise<void> {
    const result = await operation;
    if (!result.ok) {
      if (result.payload) this.broadcastPayload(result.payload);
      return;
    }
    this.broadcastPayload(result.actorPayload);
    if (result.opponentPayload) this.broadcastPayload(result.opponentPayload);
    this.scheduleCountdownFromPayload(result.actorPayload);
  }

  broadcastLifecycle(result: LifecycleActionResult): void {
    if (!result.ok) {
      if (result.payload) this.broadcastPayload(result.payload);
      return;
    }
    this.broadcastPayload(result.actorPayload);
    if (result.opponentPayload) this.broadcastPayload(result.opponentPayload);
  }

  async refreshSide(matchId: string, side: Side): Promise<void> {
    const connection = this.connection(matchId, side);
    if (!connection) return;
    const payload = await this.service.bootstrap(
      matchId,
      side,
      connection.context.sessionToken,
      { allowLobby: true },
    );
    if ("error" in payload) return;
    sendBootstrap(connection.socket, payload);
    this.scheduleCountdownFromPayload(payload);
  }

  private async handleClose(
    socket: WebSocket,
    code?: number,
    reason?: string,
  ): Promise<void> {
    const context = this.findContext(socket) ?? this.socketContexts.get(socket);
    const meta = this.socketClients.get(socket);
    const durationMs = meta
      ? Math.max(0, Date.now() - meta.openedAt)
      : undefined;
    if (!context) {
      this.recordConnectionAudit({
        event: "ws_close",
        clientKey: meta?.clientKey,
        code,
        reason: safeCloseReason(reason),
        durationMs,
      });
      return;
    }
    const bySide = this.connections.get(context.matchId);
    if (bySide?.get(context.side)?.socket !== socket) {
      this.recordConnectionAudit({
        event: "ws_close",
        clientKey: meta?.clientKey,
        matchId: context.matchId,
        side: context.side,
        code,
        reason: safeCloseReason(reason),
        durationMs,
        ignoredAsReplaced: true,
      });
      return;
    }
    bySide.delete(context.side);
    this.recordConnectionAudit({
      event: "ws_close",
      clientKey: meta?.clientKey,
      matchId: context.matchId,
      side: context.side,
      code,
      reason: safeCloseReason(reason),
      durationMs,
      ...(meta?.replacedByReconnect ? { ignoredAsReplaced: true } : {}),
    });
    const disconnected = await this.service.setConnected(
      context.matchId,
      context.side,
      context.sessionToken,
      false,
    );
    if ("error" in disconnected) return;
    if (isLobbyPayload(disconnected)) {
      await this.sendOpponentBootstrap(
        context.matchId,
        opposite(context.side),
        { side: context.side, connected: false },
      );
      return;
    }
    if (isTerminalSidePayload(disconnected)) {
      await this.sendOpponentBootstrap(
        context.matchId,
        opposite(context.side),
        { side: context.side, connected: false },
      );
      return;
    }
    this.sendOpponentStatus(context.matchId, opposite(context.side), {
      side: context.side,
      connected: false,
    });
  }

  private handleSocketError(socket: WebSocket, error: Error): void {
    const context = this.findContext(socket) ?? this.socketContexts.get(socket);
    const meta = this.socketClients.get(socket);
    this.recordConnectionAudit({
      event: "ws_error",
      clientKey: meta?.clientKey,
      matchId: context?.matchId,
      side: context?.side,
      errorCode: error.name || "websocket_error",
    });
  }

  private handleMessageFailure(socket: WebSocket, error: unknown): void {
    const context = this.findContext(socket) ?? this.socketContexts.get(socket);
    const meta = this.socketClients.get(socket);
    this.recordConnectionAudit({
      event: "ws_error",
      clientKey: meta?.clientKey,
      matchId: context?.matchId,
      side: context?.side,
      errorCode:
        error instanceof Error && error.name
          ? error.name
          : "message_handler_failure",
    });
    send(socket, {
      type: "error",
      payload: {
        code: "server_operation_failed",
        message:
          "Die Serveraktion konnte nicht verarbeitet werden. Bitte versuche es erneut.",
      },
    });
  }

  private recordConnectionAudit(
    event: Parameters<ConnectionAuditLogger["record"]>[0],
  ): void {
    this.connectionAudit.record(event);
  }

  private broadcastPayload(payload: ServicePayload): void {
    const connection = this.connection(payload.matchId, payload.side);
    sendBootstrap(connection?.socket, payload);
  }

  private sendOpponentStatus(
    matchId: string,
    side: Side,
    status: SidePayload["opponentStatus"],
  ): void {
    send(this.connection(matchId, side)?.socket, {
      type: "opponent_status",
      payload: status,
    });
  }

  private async sendOpponentBootstrap(
    matchId: string,
    side: Side,
    fallbackStatus: SidePayload["opponentStatus"],
  ): Promise<void> {
    const opponent = this.connection(matchId, side);
    if (!opponent) return;
    const payload = await this.service.bootstrap(
      matchId,
      side,
      opponent.context.sessionToken,
      { allowLobby: true },
    );
    if ("error" in payload) {
      send(opponent.socket, {
        type: "opponent_status",
        payload: fallbackStatus,
      });
      return;
    }
    sendBootstrap(opponent.socket, payload);
    this.scheduleCountdownFromPayload(payload);
  }

  private scheduleCountdownFromPayload(payload: ServicePayload): void {
    if (
      !isLobbyPayload(payload) ||
      payload.matchStatus !== "countdown" ||
      !payload.startLobby?.countdownEndsAt
    ) {
      const existing = this.countdownTimers.get(payload.matchId);
      if (existing) clearTimeout(existing);
      this.countdownTimers.delete(payload.matchId);
      return;
    }
    const existing = this.countdownTimers.get(payload.matchId);
    if (existing) clearTimeout(existing);
    const delay = Math.max(
      0,
      new Date(payload.startLobby.countdownEndsAt).getTime() - Date.now(),
    );
    const timer = setTimeout(
      () => void this.activateCountdown(payload.matchId),
      delay,
    );
    this.countdownTimers.set(payload.matchId, timer);
  }

  private async activateCountdown(matchId: string): Promise<void> {
    this.countdownTimers.delete(matchId);
    const result = await this.service.activateLobbyCountdown(matchId);
    if (!result.ok) {
      if (result.payload) this.broadcastPayload(result.payload);
      return;
    }
    this.broadcastPayload(result.actorPayload);
    if (result.opponentPayload) this.broadcastPayload(result.opponentPayload);
  }

  private connection(matchId: string, side: Side): Connection | undefined {
    return this.connections.get(matchId)?.get(side);
  }

  private findContext(socket: WebSocket): WsContext | undefined {
    for (const bySide of this.connections.values()) {
      for (const connection of bySide.values()) {
        if (connection.socket === socket) return connection.context;
      }
    }
    return undefined;
  }
}

export function createNetgridHttpServer(
  service?: MultiplayerService,
  options: NetgridServerOptions = {},
): NetgridServerHandle {
  const deploymentConfig = options.deploymentConfig ?? loadDeploymentConfig();
  const activeService = service ?? defaultService(deploymentConfig);
  const rateLimiter =
    options.rateLimiter ?? createRateLimiter(deploymentConfig.rateLimitProfile);
  const connectionAudit =
    options.connectionAudit ?? createConnectionAuditLoggerFromEnv();
  const maintenanceAuth =
    options.maintenanceAuth ??
    new MaintenanceAuthService(
      new JsonFileMaintenanceCredentialStore(maintenanceAuthPathFromEnv()),
    );
  const accountAuth = options.accountAuth;
  const accountDecks = options.accountDecks;
  const accountMatchStartPreferences = options.accountMatchStartPreferences;
  const accountStatistics = options.accountStatistics;
  const observeAccountStatistics = accountStatistics
    ? async (record: StoredMatch) => {
        await accountStatistics.recordTerminalMatch(record);
        await accountStatistics.reconcileSeriesNextParticipantBindings(record);
      }
    : undefined;
  const removeAccountStatisticsObserver = observeAccountStatistics
    ? activeService.addPersistenceObserver(observeAccountStatistics)
    : undefined;
  const accountStatisticsReady = observeAccountStatistics
    ? activeService
        .reconcilePersistedMatches(observeAccountStatistics)
        .then(() => undefined)
    : Promise.resolve();
  const realtime = new NetgridRealtimeServer(
    activeService,
    deploymentConfig,
    rateLimiter,
    connectionAudit,
  );
  const server = createServer(
    (request, response) =>
      void routeHttp(
        activeService,
        realtime,
        deploymentConfig,
        rateLimiter,
        maintenanceAuth,
        accountAuth,
        accountDecks,
        accountMatchStartPreferences,
        accountStatistics,
        request,
        response,
      ),
  );
  realtime.attach(server);
  const cleanupTimer =
    deploymentConfig.profile === "local"
      ? startMaintenanceCleanupTimer(activeService)
      : undefined;
  return {
    server,
    service: activeService,
    realtime,
    deploymentConfig,
    accountStatisticsReady,
    close: () =>
      new Promise<void>((resolve, reject) => {
        connectionAudit.record({
          event: "server_stop",
          profile: deploymentConfig.profile,
        });
        realtime
          .close()
          .then(() =>
            server.close((error) => {
              if (cleanupTimer) clearInterval(cleanupTimer);
              removeAccountStatisticsObserver?.();
              accountDecks?.close();
              accountMatchStartPreferences?.close();
              accountStatistics?.close();
              accountAuth?.close();
              activeService.closeStorage();
              return error ? reject(error) : resolve();
            }),
          )
          .catch(reject);
      }),
  };
}

export async function startNetgridServer(
  options: {
    port?: number;
    host?: string;
    service?: MultiplayerService;
    accountAuth?: AccountAuthService;
    accountDecks?: AccountDeckService;
    accountMatchStartPreferences?: AccountMatchStartPreferenceService;
    accountStatistics?: AccountMatchStatisticsService;
  } = {},
): Promise<NetgridServerHandle & { url: string; bindUrl: string }> {
  const accountDecks = options.accountDecks ?? createConfiguredAccountDecks();
  const handle = createNetgridHttpServer(options.service, {
    accountAuth: options.accountAuth ?? createConfiguredAccountAuth(),
    accountDecks,
    accountMatchStartPreferences:
      options.accountMatchStartPreferences ??
      createConfiguredAccountMatchStartPreferences(undefined, accountDecks),
    accountStatistics:
      options.accountStatistics ?? createConfiguredAccountStatistics(),
  });
  await handle.accountStatisticsReady;
  const port = options.port ?? Number(process.env.PORT ?? 8787);
  const host = (options.host ?? process.env.HOST ?? "0.0.0.0").trim();
  await new Promise<void>((resolveListen) =>
    handle.server.listen(port, host, resolveListen),
  );
  const advertisedHost = advertisedServerHost(host);
  const url = `http://${advertisedHost}:${port}`;
  const bindUrl = `http://${host}:${port}`;
  handle.realtime.recordServerStart(url);
  return { ...handle, url, bindUrl };
}

export function createConfiguredAccountAuth(
  env: NodeJS.ProcessEnv = process.env,
): AccountAuthService {
  const dbPath = resolveConfiguredAccountSqlitePath(env);
  const backupDir = resolveConfiguredStorageBackupDir(env);
  return new AccountAuthService(
    new SqliteAccountStorage({ dbPath, backupDir }),
  );
}

export function createConfiguredAccountDecks(
  env: NodeJS.ProcessEnv = process.env,
): AccountDeckService {
  const dbPath = resolveConfiguredAccountSqlitePath(env);
  const backupDir = resolveConfiguredStorageBackupDir(env);
  return new AccountDeckService(
    new SqliteAccountDeckStorage({ dbPath, backupDir }),
  );
}

export function createConfiguredAccountStatistics(
  env: NodeJS.ProcessEnv = process.env,
): AccountMatchStatisticsService {
  const dbPath = resolveConfiguredAccountSqlitePath(env);
  const backupDir = resolveConfiguredStorageBackupDir(env);
  return new AccountMatchStatisticsService(
    new SqliteAccountStatisticsStorage({ dbPath, backupDir }),
  );
}

export function createConfiguredAccountMatchStartPreferences(
  env: NodeJS.ProcessEnv | undefined = process.env,
  accountDecks: AccountDeckService = createConfiguredAccountDecks(env),
): AccountMatchStartPreferenceService {
  const dbPath = resolveConfiguredAccountSqlitePath(env);
  const backupDir = resolveConfiguredStorageBackupDir(env);
  return new AccountMatchStartPreferenceService(
    new SqliteAccountMatchStartPreferenceStorage({ dbPath, backupDir }),
    accountDecks,
  );
}

function startMaintenanceCleanupTimer(
  service: MultiplayerService,
): ReturnType<typeof setInterval> | undefined {
  if (!service.runStorageMaintenanceCleanupPolicy) return undefined;
  const timer = setInterval(
    () => {
      void service.runStorageMaintenanceCleanupPolicy().catch((error) => {
        const code =
          error instanceof Error ? error.message : "cleanup_policy_failed";
        console.warn(
          `maintenance_cleanup_policy_failed:${redactSensitiveText(code)}`,
        );
      });
    },
    60 * 60 * 1000,
  );
  timer.unref?.();
  return timer;
}

async function routeHttp(
  service: MultiplayerService,
  realtime: NetgridRealtimeServer,
  deploymentConfig: DeploymentConfig,
  rateLimiter: FixedWindowRateLimiter,
  maintenanceAuth: MaintenanceAuthService,
  accountAuth: AccountAuthService | undefined,
  accountDecks: AccountDeckService | undefined,
  accountMatchStartPreferences: AccountMatchStartPreferenceService | undefined,
  accountStatistics: AccountMatchStatisticsService | undefined,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://localhost");
  const corsConfig =
    url.pathname.startsWith("/api/storage/maintenance/") &&
    deploymentConfig.maintenanceEnabled
      ? {
          ...deploymentConfig,
          allowedOrigins: deploymentConfig.maintenanceAllowedOrigins,
        }
      : deploymentConfig;
  const corsDecision = applyCors(request, response, corsConfig);
  if (corsDecision === "denied") {
    sendJson(response, 403, originDeniedPayload());
    return;
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(
        response,
        200,
        redactedHealth(await service.storageHealth(), deploymentConfig),
      );
      return;
    }

    if (url.pathname === "/api/account/login" && request.method === "POST") {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      if (!ensureAccountOrigin(response, request, deploymentConfig)) return;
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "account-login",
        )
      )
        return;
      const body = await readJson(request);
      const result = await accountAuth.login({
        loginName: typeof body.loginName === "string" ? body.loginName : "",
        password: typeof body.password === "string" ? body.password : "",
        ...(typeof body.deviceLabel === "string"
          ? { deviceLabel: body.deviceLabel }
          : {}),
      });
      if (!result.ok)
        return sendJson(response, 401, accountInvalidCredentialsPayload());
      response.setHeader(
        "set-cookie",
        accountSessionCookie(
          result.session.sessionToken,
          request,
          deploymentConfig,
        ),
      );
      sendJson(response, 200, {
        account: result.account,
        session: result.session.session,
        csrfToken: result.session.csrfToken,
      });
      return;
    }

    if (url.pathname === "/api/account/session" && request.method === "GET") {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await accountAuth.authenticateSession(
        accountSessionToken(request) ?? "",
      );
      if (!auth.ok)
        return sendJson(response, 401, accountAuthRequiredPayload());
      const csrfToken = await accountAuth.sessions.restoreCsrfToken(
        accountSessionToken(request) ?? "",
      );
      if (!csrfToken)
        return sendJson(response, 401, accountAuthRequiredPayload());
      sendJson(response, 200, {
        account: auth.account,
        session: auth.session,
        csrfToken,
      });
      return;
    }

    if (url.pathname === "/api/account/logout" && request.method === "POST") {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      await accountAuth.sessions.revokeSessionByToken(
        accountSessionToken(request) ?? "",
      );
      response.setHeader(
        "set-cookie",
        clearAccountSessionCookie(request, deploymentConfig),
      );
      sendJson(response, 200, { ok: true });
      return;
    }

    if (
      url.pathname === "/api/account/sessions/revoke-all" &&
      request.method === "POST"
    ) {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const revoked = await accountAuth.sessions.revokeAllAccountSessions(
        auth.account.accountId,
      );
      response.setHeader(
        "set-cookie",
        clearAccountSessionCookie(request, deploymentConfig),
      );
      sendJson(response, 200, { ok: true, revoked });
      return;
    }

    if (url.pathname === "/api/account/password" && request.method === "POST") {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "account-password",
        )
      )
        return;
      const body = await readJson(request);
      try {
        const changed = await accountAuth.changePassword({
          accountId: auth.account.accountId,
          currentPassword:
            typeof body.currentPassword === "string"
              ? body.currentPassword
              : "",
          newPassword:
            typeof body.newPassword === "string" ? body.newPassword : "",
        });
        if (!changed)
          return sendJson(response, 401, accountInvalidCredentialsPayload());
      } catch (error) {
        const payload = accountInputErrorPayload(error);
        if (payload) return sendJson(response, 400, payload);
        throw error;
      }
      response.setHeader(
        "set-cookie",
        clearAccountSessionCookie(request, deploymentConfig),
      );
      sendJson(response, 200, { ok: true, sessionsRevoked: true });
      return;
    }

    const inviteRoute = /^\/api\/account\/invites\/([^/]+)$/.exec(url.pathname);
    if (inviteRoute && request.method === "GET") {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "account-invite-inspect",
        )
      )
        return;
      const invite = await accountAuth.inspectInvite(
        decodeURIComponent(inviteRoute[1] ?? ""),
      );
      if (!invite)
        return sendJson(response, 404, accountOneTimeTokenInvalidPayload());
      sendJson(response, 200, { invite });
      return;
    }

    const inviteAcceptRoute = /^\/api\/account\/invites\/([^/]+)\/accept$/.exec(
      url.pathname,
    );
    if (inviteAcceptRoute && request.method === "POST") {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      if (!ensureAccountOrigin(response, request, deploymentConfig)) return;
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "account-invite-accept",
        )
      )
        return;
      const body = await readJson(request);
      try {
        const accepted = await accountAuth.acceptInvite({
          inviteToken: decodeURIComponent(inviteAcceptRoute[1] ?? ""),
          password: typeof body.password === "string" ? body.password : "",
          ...(typeof body.deviceLabel === "string"
            ? { deviceLabel: body.deviceLabel }
            : {}),
        });
        if (!accepted)
          return sendJson(response, 404, accountOneTimeTokenInvalidPayload());
        response.setHeader(
          "set-cookie",
          accountSessionCookie(
            accepted.session.sessionToken,
            request,
            deploymentConfig,
          ),
        );
        sendJson(response, 200, {
          account: accepted.account,
          session: accepted.session.session,
          csrfToken: accepted.session.csrfToken,
        });
      } catch (error) {
        const payload = accountInputErrorPayload(error);
        if (payload) return sendJson(response, 400, payload);
        throw error;
      }
      return;
    }

    const resetAcceptRoute = /^\/api\/account\/resets\/([^/]+)\/accept$/.exec(
      url.pathname,
    );
    if (resetAcceptRoute && request.method === "POST") {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      if (!ensureAccountOrigin(response, request, deploymentConfig)) return;
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "account-reset-accept",
        )
      )
        return;
      const body = await readJson(request);
      try {
        const accepted = await accountAuth.acceptReset({
          resetToken: decodeURIComponent(resetAcceptRoute[1] ?? ""),
          newPassword:
            typeof body.newPassword === "string" ? body.newPassword : "",
        });
        if (!accepted)
          return sendJson(response, 404, accountOneTimeTokenInvalidPayload());
      } catch (error) {
        const payload = accountInputErrorPayload(error);
        if (payload) return sendJson(response, 400, payload);
        throw error;
      }
      response.setHeader(
        "set-cookie",
        clearAccountSessionCookie(request, deploymentConfig),
      );
      sendJson(response, 200, { ok: true, sessionsRevoked: true });
      return;
    }

    if (
      url.pathname === "/api/account/admin/invites" &&
      request.method === "POST"
    ) {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
        "admin",
      );
      if (!auth) return;
      const body = await readJson(request);
      try {
        const created = await accountAuth.createInvite({
          loginName: typeof body.loginName === "string" ? body.loginName : "",
          displayName:
            typeof body.displayName === "string" ? body.displayName : "",
          createdByAccountId: auth.account.accountId,
          ...(typeof body.expiresInHours === "number"
            ? { expiresInHours: body.expiresInHours }
            : {}),
        });
        sendJson(response, 201, created);
      } catch (error) {
        const payload = accountInputErrorPayload(error);
        if (payload) return sendJson(response, 400, payload);
        throw error;
      }
      return;
    }

    if (
      url.pathname === "/api/account/admin/resets" &&
      request.method === "POST"
    ) {
      if (!accountAuth)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
        "admin",
      );
      if (!auth) return;
      const body = await readJson(request);
      const created = await accountAuth.createResetToken({
        loginName: typeof body.loginName === "string" ? body.loginName : "",
        createdByAccountId: auth.account.accountId,
        ...(typeof body.expiresInHours === "number"
          ? { expiresInHours: body.expiresInHours }
          : {}),
      });
      if (!created)
        return sendJson(response, 404, accountOneTimeTokenInvalidPayload());
      sendJson(response, 201, created);
      return;
    }

    if (
      url.pathname === "/api/account/statistics" &&
      request.method === "GET"
    ) {
      if (!accountAuth || !accountStatistics)
        return sendJson(response, 503, accountUnavailablePayload());
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "account_read",
          request,
          deploymentConfig,
          "account-statistics",
        )
      )
        return;
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      response.setHeader("cache-control", "no-store");
      sendJson(
        response,
        200,
        await accountStatistics.statisticsForAccount(
          auth.account.accountId,
          accountStatisticsQueryFromUrl(url),
        ),
      );
      return;
    }

    if (
      url.pathname === "/api/account/recent-results" &&
      request.method === "GET"
    ) {
      if (!accountAuth || !accountStatistics)
        return sendJson(response, 503, accountUnavailablePayload());
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "account_read",
          request,
          deploymentConfig,
          "account-recent-results",
        )
      )
        return;
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      const gameResults = await accountStatistics.gameResultsForAccount(
        auth.account.accountId,
      );
      const matchIds = gameResults.map((result) => result.originMatchId);
      const limit = Number(url.searchParams.get("limit") ?? 20);
      response.setHeader("cache-control", "no-store");
      sendJson(response, 200, {
        schemaVersion: "netgrid-personal-recent-results-v1",
        generatedAt: new Date().toISOString(),
        results: await service.listPersonalRecentGameResults(matchIds, limit),
      });
      return;
    }

    if (
      url.pathname === "/api/account/active-public-match-ids" &&
      request.method === "GET"
    ) {
      if (!accountAuth || !accountStatistics)
        return sendJson(response, 503, accountUnavailablePayload());
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "account_read",
          request,
          deploymentConfig,
          "account-active-public-match-ids",
        )
      )
        return;
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      const ownMatchIds = new Set(
        (
          await accountStatistics.bindingsForAccount(auth.account.accountId)
        ).map((binding) => binding.matchId),
      );
      const matchIds = (await service.listPublicMatches())
        .filter(
          (entry) =>
            entry.status === "active" && ownMatchIds.has(entry.matchId),
        )
        .map((entry) => entry.matchId);
      const payload: ApiAccountActivePublicMatchIds = {
        schemaVersion: "netgrid-account-active-public-match-ids-v1",
        generatedAt: new Date().toISOString(),
        matchIds,
      };
      response.setHeader("cache-control", "no-store");
      sendJson(response, 200, payload);
      return;
    }

    const accountRejoinRoute =
      /^\/api\/account\/matches\/([^/]+)\/rejoin$/.exec(url.pathname);
    if (accountRejoinRoute && request.method === "POST") {
      if (!accountAuth || !accountStatistics)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const matchId = decodeURIComponent(accountRejoinRoute[1] ?? "");
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          `account-rejoin:${matchId}`,
        )
      )
        return;
      const binding = (await accountStatistics.bindingsForMatch(matchId)).find(
        (candidate) => candidate.accountId === auth.account.accountId,
      );
      if (!binding)
        return sendJson(response, 404, {
          error: {
            code: "not_found",
            message: "Dieses Match ist nicht verfügbar.",
          },
        });
      const rejoined = await service.rejoinBoundAccountMatch(
        matchId,
        binding.participantSlot,
      );
      if (!("error" in rejoined))
        void realtime.refreshSide(matchId, opposite(rejoined.side));
      sendJson(response, "error" in rejoined ? 404 : 200, rejoined);
      return;
    }

    if (
      url.pathname === "/api/account/match-history" &&
      request.method === "GET"
    ) {
      if (!accountAuth || !accountStatistics)
        return sendJson(response, 503, accountUnavailablePayload());
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "account_read",
          request,
          deploymentConfig,
          "account-match-history",
        )
      )
        return;
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      response.setHeader("cache-control", "no-store");
      sendJson(
        response,
        200,
        await accountStatistics.matchHistoryForAccount(
          auth.account.accountId,
          accountMatchHistoryQueryFromUrl(url),
        ),
      );
      return;
    }

    if (
      url.pathname === "/api/account/match-start-preferences" &&
      request.method === "GET"
    ) {
      if (!accountAuth || !accountMatchStartPreferences)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      response.setHeader("cache-control", "no-store");
      sendJson(
        response,
        200,
        await accountMatchStartPreferences.load(auth.account.accountId),
      );
      return;
    }

    if (
      url.pathname === "/api/account/match-start-preferences" &&
      request.method === "PUT"
    ) {
      if (!accountAuth || !accountMatchStartPreferences)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const body = await readJson(request);
      try {
        const saved = await accountMatchStartPreferences.save(
          auth.account.accountId,
          body.preferences,
        );
        response.setHeader("cache-control", "no-store");
        sendJson(response, 200, saved);
      } catch (error) {
        if (error instanceof AccountMatchStartPreferencesError) {
          sendJson(response, 400, accountMatchStartPreferencesErrorPayload());
          return;
        }
        throw error;
      }
      return;
    }

    if (
      url.pathname === "/api/account/match-start-preferences" &&
      request.method === "DELETE"
    ) {
      if (!accountAuth || !accountMatchStartPreferences)
        return sendJson(response, 503, accountUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      await accountMatchStartPreferences.delete(auth.account.accountId);
      response.setHeader("cache-control", "no-store");
      sendJson(response, 200, { ok: true });
      return;
    }

    if (url.pathname === "/api/account/export" && request.method === "GET") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      const account = await accountAuth.exportAccount(auth.account.accountId);
      const decks = await accountDecks.list(auth.account.accountId);
      const statistics = accountStatistics
        ? await accountStatistics.exportForAccount(auth.account.accountId)
        : undefined;
      const matchStartPreferences = accountMatchStartPreferences
        ? await accountMatchStartPreferences.load(auth.account.accountId)
        : undefined;
      response.setHeader("cache-control", "no-store");
      sendJson(response, 200, {
        schemaVersion: matchStartPreferences
          ? statistics
            ? "netgrid-account-export-v3"
            : "netgrid-account-export-v2"
          : statistics
            ? "netgrid-account-export-v2"
            : "netgrid-account-export-v1",
        exportedAt: new Date().toISOString(),
        account,
        decks: decks.decks.map(accountDeckPublicView),
        ...(statistics ? { statistics } : {}),
        ...(matchStartPreferences
          ? { matchStartPreferences: matchStartPreferences.preferences }
          : {}),
      });
      return;
    }

    if (url.pathname === "/api/account" && request.method === "DELETE") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const body = await readJson(request);
      const deleted = await accountAuth.deleteAccount({
        accountId: auth.account.accountId,
        currentPassword:
          typeof body.currentPassword === "string" ? body.currentPassword : "",
      });
      if (!deleted)
        return sendJson(response, 401, accountInvalidCredentialsPayload());
      await accountDecks.deleteAll(auth.account.accountId);
      await accountMatchStartPreferences?.delete(auth.account.accountId);
      await accountStatistics?.deleteAccountData(auth.account.accountId);
      response.setHeader(
        "set-cookie",
        clearAccountSessionCookie(request, deploymentConfig),
      );
      sendJson(response, 200, { ok: true, accountDeleted: true });
      return;
    }

    if (url.pathname === "/api/decks/standards" && request.method === "GET") {
      if (!accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const standards = accountDecks.listStandards();
      sendJson(response, 200, {
        catalog: {
          schemaVersion: "netgrid-standard-deck-catalog-v1",
          decks: standards,
          snapshots: standards.map((standard) =>
            accountDecks.standardSnapshot(standard.standardDeckId),
          ),
        },
      });
      return;
    }

    const standardSnapshotRoute =
      /^\/api\/decks\/standards\/([^/]+)\/snapshot$/.exec(url.pathname);
    if (standardSnapshotRoute && request.method === "POST") {
      if (!accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      sendJson(response, 200, {
        snapshot: accountDecks.standardSnapshot(
          decodeURIComponent(standardSnapshotRoute[1] ?? ""),
        ),
      });
      return;
    }

    if (url.pathname === "/api/account/decks" && request.method === "GET") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      const listed = await accountDecks.list(auth.account.accountId);
      sendJson(response, 200, {
        decks: listed.decks.map(accountDeckPublicView),
        quota: listed.quota,
      });
      return;
    }

    if (url.pathname === "/api/account/decks" && request.method === "POST") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const body = await readJson(request);
      const created = await accountDecks.create(
        auth.account.accountId,
        accountDeckInputFromBody(body.deck ?? body),
      );
      sendJson(response, 201, {
        deck: accountDeckPublicView(created),
        quota: (await accountDecks.list(auth.account.accountId)).quota,
      });
      return;
    }

    if (
      url.pathname === "/api/account/decks/copy-standard" &&
      request.method === "POST"
    ) {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const body = await readJson(request);
      const copied = await accountDecks.copyStandard(
        auth.account.accountId,
        typeof body.standardDeckId === "string" ? body.standardDeckId : "",
        typeof body.name === "string" ? body.name : undefined,
      );
      sendJson(response, 201, {
        deck: accountDeckPublicView(copied),
        quota: (await accountDecks.list(auth.account.accountId)).quota,
      });
      return;
    }

    const accountDeckSnapshotRoute =
      /^\/api\/account\/decks\/([^/]+)\/snapshot$/.exec(url.pathname);
    if (accountDeckSnapshotRoute && request.method === "POST") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const snapshot = await accountDecks.snapshot(
        auth.account.accountId,
        decodeURIComponent(accountDeckSnapshotRoute[1] ?? ""),
      );
      sendJson(response, 200, { snapshot });
      return;
    }

    const accountDeckRoute = /^\/api\/account\/decks\/([^/]+)$/.exec(
      url.pathname,
    );
    if (accountDeckRoute && request.method === "GET") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountAuthenticated(
        response,
        request,
        accountAuth,
      );
      if (!auth) return;
      const deck = await accountDecks.get(
        auth.account.accountId,
        decodeURIComponent(accountDeckRoute[1] ?? ""),
      );
      sendJson(response, 200, { deck: accountDeckPublicView(deck) });
      return;
    }

    if (accountDeckRoute && request.method === "PUT") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      const body = await readJson(request);
      const expectedVersion =
        typeof body.expectedVersion === "number" ? body.expectedVersion : 0;
      const deck = await accountDecks.update(
        auth.account.accountId,
        decodeURIComponent(accountDeckRoute[1] ?? ""),
        expectedVersion,
        accountDeckInputFromBody(body.deck ?? body),
      );
      sendJson(response, 200, { deck: accountDeckPublicView(deck) });
      return;
    }

    if (accountDeckRoute && request.method === "DELETE") {
      if (!accountAuth || !accountDecks)
        return sendJson(response, 503, accountDecksUnavailablePayload());
      const auth = await ensureAccountMutationAccess(
        response,
        request,
        deploymentConfig,
        accountAuth,
      );
      if (!auth) return;
      await accountDecks.delete(
        auth.account.accountId,
        decodeURIComponent(accountDeckRoute[1] ?? ""),
      );
      sendJson(response, 200, {
        ok: true,
        quota: (await accountDecks.list(auth.account.accountId)).quota,
      });
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/auth/login" &&
      request.method === "POST"
    ) {
      if (
        !ensureMaintenanceTransport(response, request, deploymentConfig) ||
        !ensureMaintenanceOrigin(response, request, deploymentConfig)
      )
        return;
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "storage-maintenance-login",
        )
      )
        return;
      if (!(await maintenanceAuth.isInitialized())) {
        sendJson(response, 503, maintenanceAuthUninitializedPayload());
        return;
      }
      const body = await readJson(request);
      const created = await maintenanceAuth.createSession(
        typeof body.password === "string" ? body.password : "",
      );
      if (!created) {
        sendJson(response, 401, maintenanceAuthInvalidPayload());
        return;
      }
      response.setHeader(
        "set-cookie",
        maintenanceSessionCookie(
          created.sessionToken,
          request,
          deploymentConfig,
        ),
      );
      sendJson(response, 200, {
        session: created.session,
        csrfToken: created.csrfToken,
      });
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/auth/session" &&
      request.method === "GET"
    ) {
      if (!ensureMaintenanceTransport(response, request, deploymentConfig))
        return;
      if (!(await maintenanceAuth.isInitialized())) {
        sendJson(response, 503, maintenanceAuthUninitializedPayload());
        return;
      }
      const sessionToken = maintenanceSessionToken(request);
      const auth = await maintenanceAuth.authenticateSession(sessionToken);
      if (!auth.ok) {
        sendJson(response, 401, maintenanceAuthRequiredPayload());
        return;
      }
      const csrfToken = await maintenanceAuth.rotateCsrfToken(sessionToken);
      if (!csrfToken) {
        sendJson(response, 401, maintenanceAuthRequiredPayload());
        return;
      }
      sendJson(response, 200, { session: auth.session, csrfToken });
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/auth/logout" &&
      request.method === "POST"
    ) {
      if (
        !(await ensureMaintenanceMutationAccess(
          response,
          request,
          deploymentConfig,
          maintenanceAuth,
        ))
      )
        return;
      maintenanceAuth.revokeSession(maintenanceSessionToken(request));
      response.setHeader(
        "set-cookie",
        clearMaintenanceSessionCookie(request, deploymentConfig),
      );
      sendJson(response, 200, { ok: true });
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/auth/reauthenticate" &&
      request.method === "POST"
    ) {
      if (
        !(await ensureMaintenanceMutationAccess(
          response,
          request,
          deploymentConfig,
          maintenanceAuth,
        ))
      )
        return;
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "storage-maintenance-reauthenticate",
        )
      )
        return;
      const body = await readJson(request);
      const result = await maintenanceAuth.reauthenticateSession(
        maintenanceSessionToken(request),
        typeof body.password === "string" ? body.password : "",
      );
      if (!result.ok) {
        sendJson(response, 401, maintenanceAuthInvalidPayload());
        return;
      }
      sendJson(response, 200, { session: result.session });
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/auth/password" &&
      request.method === "POST"
    ) {
      if (
        !(await ensureMaintenanceMutationAccess(
          response,
          request,
          deploymentConfig,
          maintenanceAuth,
        ))
      )
        return;
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "storage-maintenance-password-change",
        )
      )
        return;
      const body = await readJson(request);
      let changed: boolean;
      try {
        changed = await maintenanceAuth.changePassword(
          maintenanceSessionToken(request),
          typeof body.currentPassword === "string" ? body.currentPassword : "",
          typeof body.newPassword === "string" ? body.newPassword : "",
        );
      } catch (error) {
        const code = error instanceof Error ? error.message : "";
        if (
          code === "maintenance_password_too_short" ||
          code === "maintenance_password_too_long"
        ) {
          sendJson(response, 400, {
            error: {
              code,
              message:
                "Das neue Maintenance-Passwort erfüllt die Längenanforderungen nicht.",
            },
          });
          return;
        }
        throw error;
      }
      if (!changed) {
        sendJson(response, 401, maintenanceAuthInvalidPayload());
        return;
      }
      response.setHeader(
        "set-cookie",
        clearMaintenanceSessionCookie(request, deploymentConfig),
      );
      sendJson(response, 200, { ok: true, sessionsRevoked: true });
      return;
    }

    if (url.pathname.startsWith("/api/storage/maintenance/")) {
      const authenticated =
        mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(
          request,
          url.pathname,
          deploymentConfig,
        )
          ? true
          : request.method === "GET"
            ? await ensureMaintenanceAuthenticated(
                response,
                request,
                deploymentConfig,
                maintenanceAuth,
              )
            : await ensureMaintenanceMutationAccess(
                response,
                request,
                deploymentConfig,
                maintenanceAuth,
              );
      if (!authenticated) return;
      if (
        isSensitiveMaintenanceOperation(url.pathname, request.method) &&
        !(await maintenanceAuth.consumeReauthentication(
          maintenanceSessionToken(request),
        ))
      ) {
        sendJson(response, 403, maintenanceReauthenticationRequiredPayload());
        return;
      }
    }

    if (
      url.pathname === "/api/storage/maintenance/summary" &&
      request.method === "GET"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "storage-maintenance-summary",
        )
      )
        return;
      const summary = await service.storageMaintenanceSummary();
      if (!summary) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, summary);
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/matches" &&
      request.method === "GET"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "storage-maintenance-matches",
        )
      )
        return;
      const matches = await service.storageMaintenanceMatches(
        maintenanceFiltersFromSearch(url.searchParams),
      );
      if (!matches) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, { matches });
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/ai-decision-traces/matches" &&
      request.method === "GET"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "storage-maintenance-ai-trace-matches",
        )
      )
        return;
      const matches = await service.storageMaintenanceAiDecisionTraceMatches();
      if (!matches) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, { matches });
      return;
    }

    const maintenanceAiTraceEnableRoute =
      /^\/api\/storage\/maintenance\/ai-decision-traces\/matches\/([^/]+)\/enable$/.exec(
        url.pathname,
      );
    if (maintenanceAiTraceEnableRoute && request.method === "POST") {
      const matchId = decodeURIComponent(
        maintenanceAiTraceEnableRoute[1] ?? "",
      );
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          `storage-maintenance-ai-trace-enable:${matchId}`,
        )
      )
        return;
      const body = await readJson(request);
      const mode = body.mode === "summary" ? "summary" : "detailed";
      try {
        const match = await service.enableStorageMaintenanceAiDecisionTrace(
          matchId,
          mode,
        );
        if (!match) {
          sendJson(response, 404, {
            error: {
              code: "not_found",
              message:
                "Diese Wartungsansicht hat keine Daten für dieses Match.",
            },
          });
          return;
        }
        sendJson(response, 200, { match });
      } catch (error) {
        const code = error instanceof Error ? error.message : String(error);
        const message =
          code === "ai_trace_match_has_no_ai"
            ? "Für dieses Match gibt es keine KI-Seite, daher kann kein KI-Entscheidungslog aufgezeichnet werden."
            : code === "ai_trace_match_terminal"
              ? "Dieses Match ist bereits beendet. KI-Tracing kann nur für laufende KI-Matches ab jetzt aktiviert werden."
              : "KI-Tracing konnte für dieses Match nicht aktiviert werden.";
        sendJson(response, 409, { error: { code, message } });
      }
      return;
    }

    const maintenanceAiTraceIndexRoute =
      /^\/api\/storage\/maintenance\/ai-decision-traces\/matches\/([^/]+)$/.exec(
        url.pathname,
      );
    if (maintenanceAiTraceIndexRoute && request.method === "GET") {
      const matchId = decodeURIComponent(maintenanceAiTraceIndexRoute[1] ?? "");
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          `storage-maintenance-ai-trace-index:${matchId}`,
        )
      )
        return;
      const afterDecisionIndex = numberParam(
        url.searchParams.get("afterDecisionIndex"),
      );
      const traces = await service.storageMaintenanceAiDecisionTraceIndex(
        matchId,
        afterDecisionIndex === undefined ? undefined : { afterDecisionIndex },
      );
      if (!traces) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, { traces });
      return;
    }

    const maintenanceAiTraceDetailRoute =
      /^\/api\/storage\/maintenance\/ai-decision-traces\/([^/]+)$/.exec(
        url.pathname,
      );
    if (maintenanceAiTraceDetailRoute && request.method === "GET") {
      const traceId = decodeURIComponent(
        maintenanceAiTraceDetailRoute[1] ?? "",
      );
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          `storage-maintenance-ai-trace-detail:${traceId}`,
        )
      )
        return;
      const trace =
        await service.storageMaintenanceAiDecisionTraceDetail(traceId);
      if (!trace) {
        sendJson(response, 404, {
          error: {
            code: "not_found",
            message: "Diese Wartungsansicht hat keinen KI-Trace für diese ID.",
          },
        });
        return;
      }
      sendJson(response, 200, trace);
      return;
    }

    const maintenanceAnalysisRoute = MAINTENANCE_ANALYSIS_BUNDLE_ROUTE.exec(
      url.pathname,
    );
    if (maintenanceAnalysisRoute && request.method === "GET") {
      const matchId = decodeURIComponent(maintenanceAnalysisRoute[1] ?? "");
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          `storage-maintenance-analysis:${matchId}`,
        )
      )
        return;
      const bundle = await service.storageMaintenanceMatchAnalysis(
        matchId,
        maintenanceAnalysisFiltersFromSearch(url.searchParams),
      );
      if (!bundle) {
        sendJson(response, 404, {
          error: {
            code: "not_found",
            message: "Diese Analyseansicht hat keine Daten für dieses Match.",
          },
        });
        return;
      }
      sendJson(response, 200, bundle);
      return;
    }

    const maintenanceDecisionAnalysisRoute =
      MAINTENANCE_DECISION_ANALYSIS_ROUTE.exec(url.pathname);
    if (maintenanceDecisionAnalysisRoute && request.method === "GET") {
      const matchId = decodeURIComponent(
        maintenanceDecisionAnalysisRoute[1] ?? "",
      );
      const decisionIndex = Number(maintenanceDecisionAnalysisRoute[2]);
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          `storage-maintenance-decision-analysis:${matchId}:${decisionIndex}`,
        )
      )
        return;
      const context = await service.storageMaintenanceDecisionAnalysis(
        matchId,
        decisionIndex,
      );
      if (!context) {
        sendJson(response, 404, {
          error: {
            code: "not_found",
            message:
              "Diese Analyseansicht hat keine Entscheidung für diesen Match-Kontext.",
          },
        });
        return;
      }
      sendJson(response, 200, context);
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/cleanup/preview" &&
      request.method === "POST"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          "storage-maintenance-cleanup-preview",
        )
      )
        return;
      const body = await readJson(request);
      const preview = await service.storageMaintenanceCleanupPreview(
        maintenanceCleanupFiltersFromBody(body),
      );
      if (!preview) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, preview);
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/cleanup/apply" &&
      request.method === "POST"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          "storage-maintenance-cleanup-apply",
        )
      )
        return;
      const body = await readJson(request);
      const input = maintenanceCleanupApplyFromBody(body);
      if (!input) {
        sendJson(response, 400, {
          error: {
            code: "cleanup_request_invalid",
            message: "Cleanup braucht gültige Filter und Preview-ID.",
          },
        });
        return;
      }
      try {
        const result = await service.storageMaintenanceCleanupApply(input);
        if (!result) {
          sendJson(response, 503, maintenanceUnavailablePayload());
          return;
        }
        sendJson(response, 200, result);
      } catch (error) {
        const payload = maintenanceCleanupErrorPayload(error);
        sendJson(response, payload.status, {
          error: { code: payload.code, message: payload.message },
        });
      }
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/cleanup/policy" &&
      request.method === "GET"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "storage-maintenance-cleanup-policy",
        )
      )
        return;
      const policy = await service.storageMaintenanceCleanupPolicy();
      if (!policy) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, policy);
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/cleanup/policy" &&
      request.method === "POST"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          "storage-maintenance-cleanup-policy-update",
        )
      )
        return;
      const body = await readJson(request);
      const policy = await service.setStorageMaintenanceCleanupPolicy(
        maintenanceCleanupPolicyFromBody(body),
      );
      if (!policy) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, policy);
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/cleanup/policy/run" &&
      request.method === "POST"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          "storage-maintenance-cleanup-policy-run",
        )
      )
        return;
      const result = await service.runStorageMaintenanceCleanupPolicy();
      if (!result) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, result);
      return;
    }

    if (
      url.pathname === "/api/storage/maintenance/snapshot-compaction/apply" &&
      request.method === "POST"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          "storage-maintenance-snapshot-compaction",
        )
      )
        return;
      try {
        const result = await service.storageMaintenanceCompactSnapshots();
        if (!result) {
          sendJson(response, 503, maintenanceUnavailablePayload());
          return;
        }
        sendJson(response, 200, result);
      } catch (error) {
        const payload = maintenanceCleanupErrorPayload(error);
        sendJson(response, payload.status, {
          error: { code: payload.code, message: payload.message },
        });
      }
      return;
    }

    const maintenanceRetentionRoute =
      /^\/api\/storage\/maintenance\/matches\/([^/]+)\/retention-protection$/.exec(
        url.pathname,
      );
    if (maintenanceRetentionRoute && request.method === "POST") {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          `storage-maintenance-retention:${maintenanceRetentionRoute[1]}`,
        )
      )
        return;
      const body = await readJson(request);
      const matchId = decodeURIComponent(maintenanceRetentionRoute[1] ?? "");
      const detail = await service.storageMaintenanceSetRetentionProtection(
        matchId,
        body.protected === true,
      );
      if (!detail) {
        sendJson(response, 404, {
          error: {
            code: "not_found",
            message: "Diese Wartungsansicht hat keine Daten für dieses Match.",
          },
        });
        return;
      }
      sendJson(response, 200, detail);
      return;
    }

    const maintenanceRecoveryRoute =
      /^\/api\/storage\/maintenance\/matches\/([^/]+)\/recovery-access$/.exec(
        url.pathname,
      );
    if (maintenanceRecoveryRoute && request.method === "POST") {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "lifecycle",
          request,
          deploymentConfig,
          `storage-maintenance-recovery:${maintenanceRecoveryRoute[1]}`,
        )
      )
        return;
      const body = await readJson(request);
      const matchId = decodeURIComponent(maintenanceRecoveryRoute[1] ?? "");
      const side = body.side === "corp" ? "corp" : "runner";
      const issued = await service.issueMaintenanceRecoveryAccess(matchId, {
        side,
        ...(typeof body.displayName === "string"
          ? { displayName: body.displayName }
          : {}),
      });
      sendJson(response, "error" in issued ? 409 : 200, issued);
      return;
    }

    const maintenanceMatchRoute =
      /^\/api\/storage\/maintenance\/matches\/([^/]+)$/.exec(url.pathname);
    if (maintenanceMatchRoute && request.method === "GET") {
      const matchId = decodeURIComponent(maintenanceMatchRoute[1] ?? "");
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          `storage-maintenance-match:${matchId}`,
        )
      )
        return;
      const detail = await service.storageMaintenanceMatchDetail(matchId);
      if (!detail) {
        sendJson(response, 404, {
          error: {
            code: "not_found",
            message: "Diese Wartungsansicht hat keine Daten für dieses Match.",
          },
        });
        return;
      }
      sendJson(response, 200, detail);
      return;
    }

    if (request.method === "GET" && url.pathname === "/ops/diagnostics") {
      sendJson(response, 403, redactedDiagnosticsUnavailable());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/matches/open") {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "matches-open",
        )
      )
        return;
      sendJson(response, 200, { matches: await service.listOpenMatches() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/public/matches") {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "public-matches",
        )
      )
        return;
      sendJson(response, 200, { matches: await service.listPublicMatches() });
      return;
    }

    const publicSpectatorRoute =
      /^\/api\/public\/matches\/([^/]+)\/spectator$/.exec(url.pathname);
    if (publicSpectatorRoute && request.method === "GET") {
      const matchId = decodeURIComponent(publicSpectatorRoute[1] ?? "");
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          `public-spectator:${matchId}`,
        )
      )
        return;
      const result = await service.loadPublicSpectatorView(matchId);
      sendJson(
        response,
        result.ok ? 200 : 404,
        result.ok ? result.spectator : { error: result.error },
      );
      return;
    }

    if (
      request.method === "GET" &&
      url.pathname === "/api/matches/recent-results"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "matches-recent-results",
        )
      )
        return;
      const limit = Number(url.searchParams.get("limit") ?? 20);
      sendJson(response, 200, {
        results: await service.listRecentGameResults(limit),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/matches") {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "create_match",
          request,
          deploymentConfig,
          "create",
        )
      )
        return;
      const body = await readJson(request);
      const createInput: Parameters<MultiplayerService["createMatch"]>[0] = {
        hostSide:
          body.hostSide === "runner" ||
          body.hostSide === "corp" ||
          body.hostSide === "random"
            ? body.hostSide
            : "runner",
      };
      if (body.playMode === "human_vs_ai") {
        createInput.playMode = "human_vs_ai";
        createInput.humanSide =
          body.humanSide === "runner" ||
          body.humanSide === "corp" ||
          body.humanSide === "random"
            ? body.humanSide
            : "random";
      }
      if (
        body.mode === "human_vs_human" ||
        body.mode === "human_runner_vs_corp_ai" ||
        body.mode === "human_corp_vs_runner_ai" ||
        body.mode === "ai_vs_ai"
      )
        createInput.mode = body.mode;
      const accountIdentity = await optionalAccountIdentity(
        request,
        accountAuth,
      );
      if (accountIdentity) {
        createInput.displayName = accountIdentity.displayName;
        createInput.identityKind = "account";
      } else if (typeof body.displayName === "string") {
        createInput.displayName = body.displayName;
        createInput.identityKind = "guest";
      }
      if (typeof body.seed === "string") createInput.seed = body.seed;
      if (typeof body.countdownSeconds === "number")
        createInput.countdownSeconds = body.countdownSeconds;
      if (isDifficulty(body.runnerDifficulty))
        createInput.runnerDifficulty = body.runnerDifficulty;
      if (isDifficulty(body.corpDifficulty))
        createInput.corpDifficulty = body.corpDifficulty;
      if (isAiPacingMode(body.aiPacingMode))
        createInput.aiPacingMode = body.aiPacingMode;
      if (isAiDecisionTraceMode(body.aiTraceMode))
        createInput.aiTraceMode = body.aiTraceMode;
      if (typeof body.isPublic === "boolean")
        createInput.isPublic = body.isPublic;
      Object.assign(createInput, deckSelectionFromBody(body));
      if (typeof body.settings === "object" && body.settings) {
        const settings = body.settings as Record<string, unknown>;
        const nextSettings: Parameters<
          MultiplayerService["createMatch"]
        >[0]["settings"] = {};
        nextSettings.agendaPointsToWin = 7;
        if (
          settings.matchFormat === "rules_match" ||
          settings.matchFormat === "two_game_side_swap"
        )
          nextSettings.matchFormat = settings.matchFormat;
        if (typeof settings.seriesGamesPlanned === "number")
          nextSettings.seriesGamesPlanned = settings.seriesGamesPlanned;
        if (isMatchCardPool(settings.cardPool))
          nextSettings.cardPool = settings.cardPool;
        if (settings.playerClock && typeof settings.playerClock === "object") {
          const playerClock = settings.playerClock as Record<string, unknown>;
          nextSettings.playerClock = {
            mode: playerClock.mode === "player_clock" ? "player_clock" : "none",
            ...(typeof playerClock.startingTimeMs === "number"
              ? { startingTimeMs: playerClock.startingTimeMs }
              : {}),
            ...(typeof playerClock.gracePeriodMs === "number"
              ? { gracePeriodMs: playerClock.gracePeriodMs }
              : {}),
          };
        }
        if (Object.keys(nextSettings).length > 0)
          createInput.settings = nextSettings;
      }
      try {
        const created = await service.createMatch(createInput);
        if (
          accountIdentity &&
          accountStatistics &&
          created.mode !== "ai_vs_ai"
        ) {
          await accountStatistics.bindAuthenticatedParticipant({
            matchId: created.matchId,
            participantSlot: "player_a",
            accountId: accountIdentity.accountId,
            bindingSource: "authenticated_create",
          });
        }
        sendJson(response, 201, created);
      } catch (error) {
        sendJson(response, 400, {
          error: {
            code: deckErrorCode(error),
            message: deckErrorMessage(error),
          },
        });
      }
      return;
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/simulations/ai-vs-ai"
    ) {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "ai_advance",
          request,
          deploymentConfig,
          "simulation",
        )
      )
        return;
      const body = await readJson(request);
      const config: Parameters<typeof simulateAiGame>[0] = {};
      if (typeof body.seed === "string") config.seed = body.seed;
      if (typeof body.maxActions === "number")
        config.maxActions = Math.max(
          1,
          Math.min(500, Math.floor(body.maxActions)),
        );
      config.agendaPointsToWin = 7;
      if (isDifficulty(body.runnerDifficulty))
        config.runnerDifficulty = body.runnerDifficulty;
      if (isDifficulty(body.corpDifficulty))
        config.corpDifficulty = body.corpDifficulty;
      const deckSelection = deckSelectionFromBody(body);
      if (Object.keys(deckSelection).length > 0) {
        const aiDeckPolicy = aiDeckPolicyFromValue(body.aiDeckPolicy);
        const requestedCardPool =
          body.settings && typeof body.settings === "object"
            ? (body.settings as Record<string, unknown>).cardPool
            : undefined;
        const cardPool = isMatchCardPool(requestedCardPool)
          ? requestedCardPool
          : "originalset";
        const deckSetup = resolveDeckSetup(
          deckSelection.participantADecks ?? {},
          {
            seed: config.seed ?? "ai-vs-ai-smoke",
            ...(aiDeckPolicy ? { aiDeckPolicy } : {}),
            cardPool,
          },
        );
        config.runnerDeck = deckSetup.runnerDeck;
        config.corpDeck = deckSetup.corpDeck;
        config.runnerDeckMetadata = deckSetup.runnerSnapshot.publicMetadata;
        config.corpDeckMetadata = deckSetup.corpSnapshot.publicMetadata;
        config.agendaPointsToWin = config.agendaPointsToWin ?? 7;
      } else {
        if (
          body.runnerDeckId === "demo_runner_001" ||
          body.runnerDeckId === "demo_runner_004"
        )
          config.runnerDeckId = body.runnerDeckId;
        if (
          body.corpDeckId === "demo_corp_001" ||
          body.corpDeckId === "demo_corp_004"
        )
          config.corpDeckId = body.corpDeckId;
      }
      try {
        sendJson(response, 200, {
          mode: "ai_vs_ai",
          summary: simulateAiGame(config),
        });
      } catch (error) {
        if (isAiDeckSnapshotRuntimeError(error)) {
          sendJson(response, 400, {
            error: { code: error.code, message: deckErrorMessage(error) },
          });
          return;
        }
        throw error;
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/replays") {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          "replay-index",
        )
      )
        return;
      sendJson(response, 200, {
        replays: await service.listPublicReplayIndex(),
      });
      return;
    }

    const replayRoute =
      /^\/api\/replays\/([^/]+)(?:\/(export|gamebook))?$/.exec(url.pathname);
    if (replayRoute && request.method === "GET") {
      if (
        !checkRateLimit(
          response,
          rateLimiter,
          "token_probe",
          request,
          deploymentConfig,
          `replay:${replayRoute[1]}`,
        )
      )
        return;
      const matchId = decodeURIComponent(replayRoute[1] ?? "");
      const replayAccess = {
        ...(url.searchParams.get("side") === "runner" ||
        url.searchParams.get("side") === "corp"
          ? { side: url.searchParams.get("side") as "runner" | "corp" }
          : {}),
        ...(bearerToken(request) || url.searchParams.get("sessionToken")
          ? {
              sessionToken:
                bearerToken(request) ??
                url.searchParams.get("sessionToken") ??
                "",
            }
          : {}),
      };
      if (replayRoute[2] === "gamebook") {
        const exported = await service.exportGamebook(matchId, replayAccess);
        if (!exported.ok) {
          sendJson(response, 404, { error: exported.error });
          return;
        }
        sendMarkdown(
          response,
          exported.artifact.markdown,
          `netgrid-spielprotokoll-${matchId}.md`,
        );
        return;
      }
      const perspective = replayPerspectiveFromParam(
        url.searchParams.get("perspective"),
      );
      if (!perspective) {
        sendJson(response, 400, {
          error: {
            code: "bad_request",
            message: "Unbekannte Replay-Perspektive.",
          },
        });
        return;
      }
      if (replayRoute[2] === "export") {
        const exported = await service.exportReplay(
          matchId,
          perspective,
          replayAccess,
        );
        const status = exported.ok
          ? 200
          : exported.error.code === "bad_request"
            ? 400
            : 404;
        sendJson(
          response,
          status,
          exported.ok ? exported.artifact : { error: exported.error },
        );
        return;
      }
      const replay = await service.loadReplayView(
        matchId,
        perspective,
        replayAccess,
      );
      sendJson(
        response,
        replay.ok ? 200 : 404,
        replay.ok ? replay.replay : { error: replay.error },
      );
      return;
    }

    const matchRoute = /^\/api\/matches\/([^/]+)\/([^/]+)$/.exec(url.pathname);
    if (matchRoute) {
      const matchId = decodeURIComponent(matchRoute[1] ?? "");
      const action = matchRoute[2];
      if (request.method === "GET" && action === "join-info") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "token_probe",
            request,
            deploymentConfig,
            `join-info:${matchId}`,
          )
        )
          return;
        sendJson(
          response,
          200,
          await service.getJoinInfo(
            matchId,
            url.searchParams.get("token") ?? undefined,
          ),
        );
        return;
      }
      if (request.method === "POST" && action === "join") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "token_probe",
            request,
            deploymentConfig,
            `join:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const joinInput: Parameters<MultiplayerService["joinMatch"]>[1] = {
          token: typeof body.token === "string" ? body.token : "",
          ...(deckPairFromBody(body) ?? {}),
        };
        const accountIdentity = await optionalAccountIdentity(
          request,
          accountAuth,
        );
        if (accountIdentity) {
          joinInput.displayName = accountIdentity.displayName;
          joinInput.identityKind = "account";
        } else if (typeof body.displayName === "string") {
          joinInput.displayName = body.displayName;
          joinInput.identityKind = "guest";
        }
        const joined = await service.joinMatch(matchId, joinInput);
        if (!("error" in joined) && accountIdentity && accountStatistics) {
          await accountStatistics.bindAuthenticatedParticipant({
            matchId,
            participantSlot: "player_b",
            accountId: accountIdentity.accountId,
            bindingSource: "authenticated_join",
          });
        }
        if (!("error" in joined))
          void realtime.refreshSide(matchId, opposite(joined.side));
        sendJson(response, "error" in joined ? 403 : 200, joined);
        return;
      }
      if (request.method === "POST" && action === "reconnect") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "token_probe",
            request,
            deploymentConfig,
            `reconnect:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side =
          body.side === "runner" || body.side === "corp" ? body.side : "runner";
        const reconnectInput: Parameters<
          MultiplayerService["reconnectMatch"]
        >[1] = {
          side,
          sessionToken:
            typeof body.sessionToken === "string" ? body.sessionToken : "",
          reconnectToken:
            typeof body.reconnectToken === "string" ? body.reconnectToken : "",
        };
        const recoveryInput: Parameters<MultiplayerService["recoverMatch"]>[1] =
          reconnectInput;
        if (typeof body.displayName === "string")
          recoveryInput.displayName = body.displayName;
        const reconnected =
          body.recovery === true
            ? await service.recoverMatch(matchId, recoveryInput)
            : await service.reconnectMatch(matchId, reconnectInput);
        sendJson(response, "error" in reconnected ? 403 : 200, reconnected);
        return;
      }
      if (request.method === "POST" && action === "cancel") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "lifecycle",
            request,
            deploymentConfig,
            `cancel:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.cancelMatch({
          matchId,
          side,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
        });
        realtime.broadcastLifecycle(result);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "POST" && action === "leave") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "lifecycle",
            request,
            deploymentConfig,
            `leave:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.leaveMatch({
          matchId,
          side,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
        });
        realtime.broadcastLifecycle(result);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "POST" && action === "forfeit") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "lifecycle",
            request,
            deploymentConfig,
            `forfeit:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.forfeitMatch({
          matchId,
          side,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
        });
        realtime.broadcastLifecycle(result);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "POST" && action === "recreate") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "lifecycle",
            request,
            deploymentConfig,
            `recreate:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.recreateMatch(matchId, {
          side,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          ...(typeof body.displayName === "string"
            ? { displayName: body.displayName }
            : {}),
        });
        if (result.ok && result.newMatch && accountStatistics) {
          await accountStatistics.inheritMatchParticipants({
            sourceMatchId: matchId,
            targetMatchId: result.newMatch.matchId,
            bindingSource: "inherited_recreate",
          });
        }
        realtime.broadcastLifecycle(result);
        sendJson(
          response,
          result.ok && result.newMatch ? 201 : result.ok ? 200 : 409,
          result.ok && result.newMatch ? result.newMatch : result,
        );
        return;
      }
      if (request.method === "POST" && action === "retention-protection") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "lifecycle",
            request,
            deploymentConfig,
            `retention-protection:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.setMatchRetentionProtection({
          matchId,
          side,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          protected: body.protected === true,
        });
        if (result.ok) void realtime.refreshSide(matchId, side);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "GET" && action === "bootstrap") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "token_probe",
            request,
            deploymentConfig,
            `bootstrap:${matchId}`,
          )
        )
          return;
        const side =
          url.searchParams.get("side") === "corp" ? "corp" : "runner";
        const sessionToken =
          bearerToken(request) ?? url.searchParams.get("sessionToken") ?? "";
        const bootstrapped = await service.bootstrap(
          matchId,
          side,
          sessionToken,
          { allowLobby: true },
        );
        sendJson(response, "error" in bootstrapped ? 403 : 200, bootstrapped);
        return;
      }
      if (request.method === "POST" && action === "series-next") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "lifecycle",
            request,
            deploymentConfig,
            `series-next:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const sessionToken =
          bearerToken(request) ??
          (typeof body.sessionToken === "string" ? body.sessionToken : "");
        const next = await service.startNextSeriesGame(matchId, {
          side,
          sessionToken,
          ...(typeof body.displayName === "string"
            ? { displayName: body.displayName }
            : {}),
        });
        if (!("error" in next) && accountStatistics) {
          await accountStatistics.inheritMatchParticipants({
            sourceMatchId: matchId,
            targetMatchId: next.matchId,
            bindingSource: "inherited_series_next",
          });
        }
        sendJson(response, "error" in next ? 409 : 201, next);
        return;
      }
      if (request.method === "POST" && action === "ai-advance") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "ai_advance",
            request,
            deploymentConfig,
            `ai:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const advanced = await service.advanceAi({
          matchId,
          side,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          ...(typeof body.knownStateVersion === "number"
            ? { knownStateVersion: body.knownStateVersion }
            : {}),
          ...(typeof body.knownMatchVersion === "number"
            ? { knownMatchVersion: body.knownMatchVersion }
            : {}),
          ...(body.mode === "until_human" || body.mode === "single_step"
            ? { mode: body.mode }
            : {}),
        });
        if (advanced.ok) {
          sendJson(response, 200, {
            ok: true,
            requesterPayload: advanced.requesterPayload,
            ...(advanced.publicEvent
              ? { publicEvent: advanced.publicEvent }
              : {}),
          });
        } else {
          sendJson(response, 409, advanced);
        }
        return;
      }
      if (request.method === "POST" && action === "ai-preview") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "ai_advance",
            request,
            deploymentConfig,
            `ai-preview:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const requesterSide = body.side === "corp" ? "corp" : "runner";
        const targetSide =
          body.targetSide === "corp"
            ? "corp"
            : body.targetSide === "runner"
              ? "runner"
              : requesterSide;
        const preview = await service.previewAi({
          matchId,
          requesterSide,
          targetSide,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          ...(typeof body.knownStateVersion === "number"
            ? { knownStateVersion: body.knownStateVersion }
            : {}),
          ...(typeof body.knownMatchVersion === "number"
            ? { knownMatchVersion: body.knownMatchVersion }
            : {}),
        });
        if (preview.ok) {
          sendJson(response, 200, { ok: true, preview: preview.preview });
        } else {
          sendJson(response, 409, preview);
        }
        return;
      }
      if (request.method === "POST" && action === "ai-decision-debug") {
        if (
          !checkRateLimit(
            response,
            rateLimiter,
            "ai_advance",
            request,
            deploymentConfig,
            `ai-decision-debug:${matchId}`,
          )
        )
          return;
        const body = await readJson(request);
        const requesterSide = body.side === "corp" ? "corp" : "runner";
        const prepared = await service.prepareAiDecisionDebug({
          matchId,
          requesterSide,
          sessionToken:
            bearerToken(request) ??
            (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          ...(typeof body.knownStateVersion === "number"
            ? { knownStateVersion: body.knownStateVersion }
            : {}),
          ...(typeof body.knownMatchVersion === "number"
            ? { knownMatchVersion: body.knownMatchVersion }
            : {}),
        });
        if (prepared.ok) {
          sendJson(response, 200, { ok: true, prepared: prepared.prepared });
        } else {
          sendJson(response, 409, prepared);
        }
        return;
      }
    }

    sendJson(response, 404, {
      error: { code: "not_found", message: "Route nicht gefunden." },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(response, 400, {
        error: {
          code: "bad_json",
          message: "Anfrage konnte nicht gelesen werden.",
        },
      });
      return;
    }
    if (error instanceof AccountDeckError) {
      const mapped = accountDeckErrorPayload(error);
      sendJson(response, mapped.status, mapped.payload);
      return;
    }
    if (
      error instanceof StorageError &&
      error.code === "storage_temporarily_unavailable"
    ) {
      sendJson(response, 503, {
        error: {
          code: error.code,
          message:
            "Die Datenbank ist kurzzeitig belegt. Bitte führe die Anfrage gleich noch einmal aus.",
        },
      });
      return;
    }
    sendJson(response, 500, {
      error: { code: "server_error", message: "Serverfehler." },
    });
  }
}

function defaultService(
  deploymentConfig: DeploymentConfig,
): MultiplayerService {
  return new MultiplayerService(createConfiguredStorage(), {
    ...(deploymentConfig.tokenSalt
      ? { tokenSalt: deploymentConfig.tokenSalt }
      : {}),
    publicWebBaseUrl: deploymentConfig.webBaseUrl,
    publicServerBaseUrl: deploymentConfig.serverBaseUrl,
    allowHiddenInfoUndo: deploymentConfig.profile === "local",
  });
}

export function createConfiguredStorage(env: NodeJS.ProcessEnv = process.env) {
  const sqlitePath = resolveConfiguredMatchSqlitePath(env);
  const backupDir = resolveConfiguredStorageBackupDir(env);
  try {
    return new SqliteMatchStorage({
      dbPath: sqlitePath,
      backupDir,
    });
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError(
      "storage_corrupt",
      "Storage konnte nicht geöffnet werden. Bitte aus einem lokalen Backup wiederherstellen.",
    );
  }
}

function advertisedServerHost(bindHost: string): string {
  const configured = envValue(process.env, "NETGRID_PUBLIC_HOST");
  if (configured) return configured;
  if (bindHost !== "0.0.0.0" && bindHost !== "::") return bindHost;
  return firstLanIpv4() ?? "127.0.0.1";
}

function firstLanIpv4(): string | undefined {
  for (const entries of Object.values(networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (
        entry.family === "IPv4" &&
        !entry.internal &&
        !entry.address.startsWith("169.254.")
      )
        return entry.address;
    }
  }
  return undefined;
}

async function readJson(
  request: IncomingMessage,
): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<
    string,
    unknown
  >;
}

function sendJson(
  response: ServerResponse,
  status: number,
  payload: unknown,
): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendMarkdown(
  response: ServerResponse,
  markdown: string,
  filename: string,
): void {
  response.writeHead(200, {
    "content-type": "text/markdown; charset=utf-8",
    "content-disposition": `attachment; filename="${filename}"`,
  });
  response.end(markdown);
}

function sendBootstrap(
  socket: WebSocket | undefined,
  payload: ServicePayload,
): void {
  if (isLobbyPayload(payload)) {
    send(socket, { type: "lobby_update", payload });
    return;
  }
  send(socket, {
    type: "state_update",
    payload: {
      matchStatus: payload.matchStatus,
      matchVersion: payload.matchVersion,
      playerView: payload.playerView,
      ...(payload.playerClock ? { playerClock: payload.playerClock } : {}),
      pendingUndo: payload.pendingUndo ?? null,
    },
  });
  send(socket, {
    type: "legal_actions",
    payload: {
      stateVersion: payload.playerView.stateVersion,
      legalActions: payload.legalActions,
    },
  });
  send(socket, {
    type: "choice_request",
    payload: { choice: payload.pendingChoice ?? null },
  });
  send(socket, {
    type: "event_log_update",
    payload: { events: payload.eventTail },
  });
  send(socket, { type: "opponent_status", payload: payload.opponentStatus });
  send(socket, {
    type: "ai_turn",
    payload: payload.aiTurnPresentation ?? null,
  });
  if (payload.pendingUndo)
    send(socket, { type: "undo_request", payload: payload.pendingUndo });
  if (payload.winner && payload.finalStateHash)
    send(socket, {
      type: "match_finished",
      payload: {
        matchStatus: payload.matchStatus,
        winner: payload.winner,
        finalStateHash: payload.finalStateHash,
        ...(payload.resultSummary
          ? { resultSummary: payload.resultSummary }
          : {}),
      },
    });
}

function isLobbyPayload(payload: ServicePayload): payload is LobbyPayload {
  return !("playerView" in payload);
}

function isTerminalSidePayload(
  payload: ServicePayload,
): payload is SidePayload {
  return (
    "playerView" in payload &&
    (payload.matchStatus === "finished" ||
      payload.matchStatus === "forfeited") &&
    Boolean(payload.winner)
  );
}

function send(socket: WebSocket | undefined, message: ServerWsMessage): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(message));
}

function parseWsMessage(raw: string): ClientWsMessage | null {
  try {
    const parsed = JSON.parse(raw) as ClientWsMessage;
    return typeof parsed?.type === "string" &&
      typeof parsed.payload === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function checkRateLimit(
  response: ServerResponse,
  rateLimiter: FixedWindowRateLimiter,
  category: RateLimitCategory,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
  scope: string,
): boolean {
  const clientKey = hashClientKey(clientIdentity(request, deploymentConfig));
  const limited = rateLimiter.check(category, clientKey, scope);
  if (limited.allowed) return true;
  if (limited.retryAfterSeconds)
    response.setHeader("retry-after", String(limited.retryAfterSeconds));
  sendJson(response, 429, rateLimitedPayload());
  return false;
}

async function ensureAccountMutationAccess(
  response: ServerResponse,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
  accountAuth: AccountAuthService,
  requiredRole?: "admin",
): Promise<Extract<AccountSessionAuthResult, { ok: true }> | undefined> {
  if (!ensureAccountOrigin(response, request, deploymentConfig))
    return undefined;
  const sessionToken = accountSessionToken(request) ?? "";
  const auth = await accountAuth.authenticateSession(sessionToken);
  if (!auth.ok) {
    sendJson(response, 401, accountAuthRequiredPayload());
    return undefined;
  }
  if (requiredRole && auth.account.role !== requiredRole) {
    sendJson(response, 403, {
      error: {
        code: "account_admin_required",
        message: "Für diese Operation ist ein Admin-Account erforderlich.",
      },
    });
    return undefined;
  }
  const csrfToken = firstHeaderValue(request.headers["x-netgrid-csrf"]);
  if (!csrfToken || !(await accountAuth.verifyCsrf(sessionToken, csrfToken))) {
    sendJson(response, 403, accountRequestRejectedPayload());
    return undefined;
  }
  return auth;
}

async function ensureAccountAuthenticated(
  response: ServerResponse,
  request: IncomingMessage,
  accountAuth: AccountAuthService,
): Promise<Extract<AccountSessionAuthResult, { ok: true }> | undefined> {
  const auth = await accountAuth.authenticateSession(
    accountSessionToken(request) ?? "",
  );
  if (!auth.ok) {
    sendJson(response, 401, accountAuthRequiredPayload());
    return undefined;
  }
  return auth;
}

async function optionalAccountIdentity(
  request: IncomingMessage,
  accountAuth: AccountAuthService | undefined,
): Promise<{ accountId: string; displayName: string } | undefined> {
  if (!accountAuth) return undefined;
  const sessionToken = accountSessionToken(request);
  if (!sessionToken) return undefined;
  const auth = await accountAuth.authenticateSession(sessionToken);
  return auth.ok
    ? {
        accountId: auth.account.accountId,
        displayName: auth.account.displayName,
      }
    : undefined;
}

function accountStatisticsQueryFromUrl(url: URL): AccountStatisticsQuery {
  const period = url.searchParams.get("period");
  const side = url.searchParams.get("side");
  const opponentKind = url.searchParams.get("opponentKind");
  const matchMode = url.searchParams.get("matchMode");
  return {
    ...(period === "30d" || period === "90d" || period === "all"
      ? { period }
      : {}),
    ...(side === "runner" || side === "corp" ? { side } : {}),
    ...(opponentKind === "account" ||
    opponentKind === "guest" ||
    opponentKind === "ai"
      ? { opponentKind }
      : {}),
    ...(matchMode === "human_vs_human" ||
    matchMode === "human_runner_vs_corp_ai" ||
    matchMode === "human_corp_vs_runner_ai" ||
    matchMode === "ai_vs_ai"
      ? { matchMode }
      : {}),
  };
}

function accountMatchHistoryQueryFromUrl(url: URL): AccountMatchHistoryQuery {
  const base = accountStatisticsQueryFromUrl(url);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const cursor = url.searchParams.get("cursor")?.trim();
  return {
    ...base,
    limit: Number.isFinite(limit) ? limit : 20,
    ...(cursor ? { cursor } : {}),
  };
}

function ensureAccountOrigin(
  response: ServerResponse,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): boolean {
  const origin = firstHeaderValue(request.headers.origin);
  if (!origin || !isOriginAllowed(origin, deploymentConfig)) {
    sendJson(response, 403, accountRequestRejectedPayload());
    return false;
  }
  return true;
}

function accountSessionToken(request: IncomingMessage): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() !== ACCOUNT_SESSION_COOKIE_NAME)
      continue;
    return part.slice(separator + 1).trim() || undefined;
  }
  return undefined;
}

function accountSessionCookie(
  sessionToken: string,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): string {
  const secure = isAccountTlsRequest(request, deploymentConfig)
    ? "; Secure"
    : "";
  return `${ACCOUNT_SESSION_COOKIE_NAME}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${ACCOUNT_SESSION_MAX_AGE_DAYS * 24 * 60 * 60}${secure}`;
}

function clearAccountSessionCookie(
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): string {
  const secure = isAccountTlsRequest(request, deploymentConfig)
    ? "; Secure"
    : "";
  return `${ACCOUNT_SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function isAccountTlsRequest(
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): boolean {
  if (deploymentConfig.profile === "private_internet") return true;
  if (
    (request.socket as IncomingMessage["socket"] & { encrypted?: boolean })
      .encrypted === true
  )
    return true;
  if (!deploymentConfig.trustProxyHeaders) return false;
  return (
    firstHeaderValue(request.headers["x-forwarded-proto"])
      ?.split(",")[0]
      ?.trim()
      .toLowerCase() === "https"
  );
}

function accountUnavailablePayload(): {
  error: { code: "account_auth_unavailable"; message: string };
} {
  return {
    error: {
      code: "account_auth_unavailable",
      message:
        "Die Account-Anmeldung ist in diesem Serverprozess nicht aktiviert.",
    },
  };
}

function accountAuthRequiredPayload(): {
  error: { code: "account_auth_required"; message: string };
} {
  return {
    error: {
      code: "account_auth_required",
      message: "Eine gültige Account-Sitzung ist erforderlich.",
    },
  };
}

function accountInvalidCredentialsPayload(): {
  error: { code: "account_invalid_credentials"; message: string };
} {
  return {
    error: {
      code: "account_invalid_credentials",
      message: "Anmeldename oder Passwort ist nicht korrekt.",
    },
  };
}

function accountOneTimeTokenInvalidPayload(): {
  error: { code: "account_token_invalid"; message: string };
} {
  return {
    error: {
      code: "account_token_invalid",
      message: "Der Link ist ungültig, abgelaufen oder bereits verwendet.",
    },
  };
}

function accountRequestRejectedPayload(): {
  error: { code: "account_request_rejected"; message: string };
} {
  return {
    error: {
      code: "account_request_rejected",
      message: "Die Account-Anfrage wurde aus Sicherheitsgründen abgelehnt.",
    },
  };
}

function accountInputErrorPayload(
  error: unknown,
): { error: { code: string; message: string } } | undefined {
  const code = error instanceof Error ? error.message : "";
  if (code.startsWith("account_password_"))
    return {
      error: {
        code,
        message: "Das Passwort erfüllt die Sicherheitsanforderungen nicht.",
      },
    };
  if (code === "login_name_invalid" || code === "display_name_invalid")
    return {
      error: { code, message: "Anmeldename oder Anzeigename ist ungültig." },
    };
  if (code === "login_name_unavailable" || code === "account_exists")
    return {
      error: {
        code: "login_name_unavailable",
        message: "Dieser Anmeldename ist nicht verfügbar.",
      },
    };
  return undefined;
}

function accountDeckInputFromBody(value: unknown): AccountDeckDraftInput {
  if (!value || typeof value !== "object")
    throw new AccountDeckError("account_deck_input_invalid");
  const body = value as Record<string, unknown>;
  if (body.side !== "runner" && body.side !== "corp")
    throw new AccountDeckError("account_deck_input_invalid");
  return {
    name: typeof body.name === "string" ? body.name : "",
    side: body.side,
    identityCardId:
      typeof body.identityCardId === "string" ? body.identityCardId : "",
    cardPoolSnapshotId:
      typeof body.cardPoolSnapshotId === "string"
        ? body.cardPoolSnapshotId
        : "",
    ...(typeof body.cardPoolVersion === "string"
      ? { cardPoolVersion: body.cardPoolVersion }
      : {}),
    formatProfileId:
      typeof body.formatProfileId === "string" ? body.formatProfileId : "",
    ...(typeof body.formatProfileVersion === "string"
      ? { formatProfileVersion: body.formatProfileVersion }
      : {}),
    cards: Array.isArray(body.cards)
      ? body.cards.map((entry) => {
          const card =
            entry && typeof entry === "object"
              ? (entry as Record<string, unknown>)
              : {};
          return {
            cardId: typeof card.cardId === "string" ? card.cardId : "",
            quantity:
              typeof card.quantity === "number" ? card.quantity : Number.NaN,
          };
        })
      : [],
    ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
    ...(body.tableLayout && typeof body.tableLayout === "object"
      ? {
          tableLayout: body.tableLayout as NonNullable<
            AccountDeckDraftInput["tableLayout"]
          >,
        }
      : {}),
  };
}

function accountDeckPublicView(
  record: AccountDeckRecord,
): Omit<AccountDeckRecord, "ownerAccountId" | "deletedAt"> {
  return {
    cloudDeckId: record.cloudDeckId,
    deckVersion: record.deckVersion,
    deck: record.deck,
    validationStatus: record.validationStatus,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function accountDecksUnavailablePayload(): {
  error: { code: "account_decks_unavailable"; message: string };
} {
  return {
    error: {
      code: "account_decks_unavailable",
      message:
        "Die persönliche Deckbibliothek ist in diesem Serverprozess nicht aktiviert.",
    },
  };
}

function accountMatchStartPreferencesErrorPayload(): {
  error: {
    code: "account_match_start_preferences_invalid";
    message: string;
  };
} {
  return {
    error: {
      code: "account_match_start_preferences_invalid",
      message:
        "Die Matchstart-Vorbelegung enthält nicht erlaubte oder ungültige Werte.",
    },
  };
}

function accountDeckErrorPayload(error: AccountDeckError): {
  status: number;
  payload: { error: { code: string; message: string } };
} {
  if (error.code === "account_deck_limit_reached")
    return {
      status: 409,
      payload: {
        error: {
          code: error.code,
          message: "Das Limit persönlicher Decks ist erreicht.",
        },
      },
    };
  if (error.code === "account_deck_version_conflict")
    return {
      status: 409,
      payload: {
        error: {
          code: error.code,
          message: "Das Deck wurde inzwischen geändert. Bitte neu laden.",
        },
      },
    };
  if (
    error.code === "account_deck_not_found" ||
    error.code === "standard_deck_not_found"
  )
    return {
      status: 404,
      payload: { error: { code: error.code, message: "Deck nicht gefunden." } },
    };
  if (error.code === "account_deck_invalid")
    return {
      status: 422,
      payload: {
        error: {
          code: error.code,
          message: "Dieser Deckentwurf ist noch nicht spielfähig.",
        },
      },
    };
  return {
    status: 400,
    payload: {
      error: { code: error.code, message: "Die Deckdaten sind ungültig." },
    },
  };
}

function ensureMaintenanceTransport(
  response: ServerResponse,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): boolean {
  if (!deploymentConfig.maintenanceEnabled) {
    sendJson(response, 403, {
      error: {
        code: "maintenance_unavailable",
        message:
          "Die Wartungs-Control-Plane ist in diesem Profil nicht aktiviert.",
      },
    });
    return false;
  }
  if (
    deploymentConfig.profile === "local" &&
    isMaintenanceClientAddressAllowed(request.socket.remoteAddress)
  )
    return true;
  if (!isMaintenanceTlsRequest(request, deploymentConfig)) {
    sendJson(response, 403, {
      error: {
        code: "maintenance_unavailable",
        message:
          "Die Wartungs-Control-Plane ist in diesem Transportprofil nicht verfügbar.",
      },
    });
    return false;
  }
  return true;
}

async function ensureMaintenanceAuthenticated(
  response: ServerResponse,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
  maintenanceAuth: MaintenanceAuthService,
): Promise<boolean> {
  if (!ensureMaintenanceTransport(response, request, deploymentConfig))
    return false;
  if (!(await maintenanceAuth.isInitialized())) {
    sendJson(response, 503, maintenanceAuthUninitializedPayload());
    return false;
  }
  const auth = await maintenanceAuth.authenticateSession(
    maintenanceSessionToken(request),
  );
  if (!auth.ok) {
    sendJson(response, 401, maintenanceAuthRequiredPayload());
    return false;
  }
  return true;
}

async function ensureMaintenanceMutationAccess(
  response: ServerResponse,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
  maintenanceAuth: MaintenanceAuthService,
): Promise<boolean> {
  if (
    !(await ensureMaintenanceAuthenticated(
      response,
      request,
      deploymentConfig,
      maintenanceAuth,
    ))
  )
    return false;
  if (!ensureMaintenanceOrigin(response, request, deploymentConfig))
    return false;
  const csrfHeader = firstHeaderValue(request.headers["x-netgrid-csrf"]);
  if (
    !(await maintenanceAuth.verifyCsrf(
      maintenanceSessionToken(request),
      csrfHeader,
    ))
  ) {
    sendJson(response, 403, maintenanceRequestRejectedPayload());
    return false;
  }
  return true;
}

function ensureMaintenanceOrigin(
  response: ServerResponse,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): boolean {
  const origin = firstHeaderValue(request.headers.origin);
  if (
    !origin ||
    !isOriginAllowed(origin, {
      ...deploymentConfig,
      allowedOrigins: deploymentConfig.maintenanceAllowedOrigins,
    })
  ) {
    sendJson(response, 403, maintenanceRequestRejectedPayload());
    return false;
  }
  return true;
}

function isSensitiveMaintenanceOperation(
  pathname: string,
  method: string | undefined,
): boolean {
  if (method !== "POST") return false;
  return (
    pathname === "/api/storage/maintenance/cleanup/apply" ||
    pathname === "/api/storage/maintenance/cleanup/policy" ||
    pathname === "/api/storage/maintenance/cleanup/policy/run" ||
    pathname === "/api/storage/maintenance/snapshot-compaction/apply" ||
    /\/api\/storage\/maintenance\/matches\/[^/]+\/recovery-access$/.test(
      pathname,
    )
  );
}

export function mayAccessLocalReadOnlyAnalysisWithoutMaintenanceAuth(
  request: IncomingMessage,
  pathname: string,
  deploymentConfig: DeploymentConfig,
): boolean {
  if (request.method !== "GET") return false;
  if (!isExplicitLocalReadOnlyAnalysisRoute(pathname)) return false;
  if (deploymentConfig.profile !== "local") return false;
  const address = normalizeClientAddress(request.socket.remoteAddress);
  return address === "127.0.0.1" || address === "::1";
}

function isExplicitLocalReadOnlyAnalysisRoute(pathname: string): boolean {
  return (
    MAINTENANCE_ANALYSIS_BUNDLE_ROUTE.test(pathname) ||
    MAINTENANCE_DECISION_ANALYSIS_ROUTE.test(pathname)
  );
}

function maintenanceSessionToken(request: IncomingMessage): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== MAINTENANCE_SESSION_COOKIE_NAME) continue;
    const value = part.slice(separator + 1).trim();
    return value || undefined;
  }
  return undefined;
}

function maintenanceSessionCookie(
  sessionToken: string,
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): string {
  const secure = isMaintenanceTlsRequest(request, deploymentConfig)
    ? "; Secure"
    : "";
  return `${MAINTENANCE_SESSION_COOKIE_NAME}=${sessionToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAINTENANCE_SESSION_MAX_AGE_MINUTES * 60}${secure}`;
}

function clearMaintenanceSessionCookie(
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): string {
  const secure = isMaintenanceTlsRequest(request, deploymentConfig)
    ? "; Secure"
    : "";
  return `${MAINTENANCE_SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`;
}

function isMaintenanceTlsRequest(
  request: IncomingMessage,
  deploymentConfig: DeploymentConfig,
): boolean {
  if (
    (request.socket as IncomingMessage["socket"] & { encrypted?: boolean })
      .encrypted === true
  )
    return true;
  const remoteAddress = normalizeClientAddress(request.socket.remoteAddress);
  const trustedProxy = deploymentConfig.maintenanceTrustedProxyAddresses.some(
    (address) => normalizeClientAddress(address) === remoteAddress,
  );
  if (!trustedProxy) return false;
  return (
    firstHeaderValue(request.headers["x-forwarded-proto"])
      ?.split(",")[0]
      ?.trim()
      .toLowerCase() === "https"
  );
}

function firstHeaderValue(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function maintenanceAuthUninitializedPayload(): {
  error: { code: string; message: string };
} {
  return {
    error: {
      code: "maintenance_auth_uninitialized",
      message:
        "Maintenance-Authentifizierung muss lokal durch den Betreiber initialisiert werden.",
    },
  };
}

function maintenanceAuthRequiredPayload(): {
  error: { code: string; message: string };
} {
  return {
    error: {
      code: "maintenance_auth_required",
      message: "Eine gültige Maintenance-Sitzung ist erforderlich.",
    },
  };
}

function maintenanceAuthInvalidPayload(): {
  error: { code: string; message: string };
} {
  return {
    error: {
      code: "maintenance_auth_invalid",
      message: "Anmeldung oder Passwortbestätigung ist fehlgeschlagen.",
    },
  };
}

function maintenanceRequestRejectedPayload(): {
  error: { code: string; message: string };
} {
  return {
    error: {
      code: "maintenance_request_rejected",
      message:
        "Die Maintenance-Anfrage wurde aus Sicherheitsgründen abgelehnt.",
    },
  };
}

function maintenanceReauthenticationRequiredPayload(): {
  error: { code: string; message: string };
} {
  return {
    error: {
      code: "maintenance_reauthentication_required",
      message: "Diese Operation verlangt eine frische Passwortbestätigung.",
    },
  };
}

function maintenanceUnavailablePayload(): {
  error: { code: "maintenance_unavailable"; message: string };
} {
  return {
    error: {
      code: "maintenance_unavailable",
      message:
        "Storage-Wartungsdaten sind nur für lokalen SQLite-Storage verfügbar.",
    },
  };
}

function maintenanceFiltersFromSearch(
  searchParams: URLSearchParams,
): StorageMaintenanceMatchFilters {
  const filters: StorageMaintenanceMatchFilters = {};
  const status = maintenanceStatus(searchParams.get("status"));
  if (status) filters.status = status;
  const terminal = searchParams.get("terminal");
  if (terminal === "true") filters.terminal = true;
  if (terminal === "false") filters.terminal = false;
  const mode = maintenanceMode(searchParams.get("mode"));
  if (mode) filters.mode = mode;
  const olderThanDays = numberParam(searchParams.get("olderThanDays"));
  if (olderThanDays !== undefined) filters.olderThanDays = olderThanDays;
  const largerThanBytes = numberParam(searchParams.get("largerThanBytes"));
  if (largerThanBytes !== undefined) filters.largerThanBytes = largerThanBytes;
  const limitParam = searchParams.get("limit");
  const limit = numberParam(limitParam);
  if (limit !== undefined) filters.limit = limit;
  else if (limitParam !== "all") filters.limit = 50;
  return filters;
}

function maintenanceAnalysisFiltersFromSearch(searchParams: URLSearchParams): {
  side?: "runner" | "corp";
  turn?: number;
  fromDecision?: number;
  toDecision?: number;
  includeEvents?: boolean;
  includeDecisionTraces?: boolean;
  includeBeliefState?: boolean;
  includeOwnDeckSnapshot?: boolean;
} {
  const filters: {
    side?: "runner" | "corp";
    turn?: number;
    fromDecision?: number;
    toDecision?: number;
    includeEvents?: boolean;
    includeDecisionTraces?: boolean;
    includeBeliefState?: boolean;
    includeOwnDeckSnapshot?: boolean;
  } = {};
  const side = searchParams.get("side");
  if (side === "runner" || side === "corp") filters.side = side;
  for (const [queryName, field] of [
    ["turn", "turn"],
    ["fromDecision", "fromDecision"],
    ["toDecision", "toDecision"],
  ] as const) {
    const value = nonNegativeIntegerParam(searchParams.get(queryName));
    if (value !== undefined) filters[field] = value;
  }
  if (searchParams.get("includeEvents") === "false")
    filters.includeEvents = false;
  if (searchParams.get("includeDecisionTraces") === "false")
    filters.includeDecisionTraces = false;
  if (searchParams.get("includeBeliefState") === "true")
    filters.includeBeliefState = true;
  if (searchParams.get("includeOwnDeckSnapshot") === "true")
    filters.includeOwnDeckSnapshot = true;
  return filters;
}

function maintenanceCleanupFiltersFromBody(
  body: Record<string, unknown>,
): StorageMaintenanceCleanupFilters {
  const statuses = Array.isArray(body.statuses)
    ? body.statuses
        .map((status) =>
          maintenanceStatus(typeof status === "string" ? status : null),
        )
        .filter((status): status is MatchStatus => Boolean(status))
    : [];
  const olderThanMinutes = positiveInteger(
    body.olderThanMinutes,
    60,
    1,
    525_600,
  );
  const limit = positiveInteger(body.limit, 100, 1, 500);
  return {
    statuses: [...new Set(statuses)],
    olderThanMinutes,
    limit,
    includeProtected: body.includeProtected === true,
  };
}

function maintenanceCleanupPolicyFromBody(
  body: Record<string, unknown>,
): StorageMaintenanceCleanupPolicyInput {
  const filters = maintenanceCleanupFiltersFromBody({
    statuses: body.statuses,
    olderThanMinutes: 60,
    limit: body.limit,
    includeProtected: body.includeProtected,
  });
  return {
    enabled: body.enabled === true,
    statuses: filters.statuses,
    olderThanDays: positiveInteger(body.olderThanDays, 3, 1, 3650),
    limit: filters.limit ?? 100,
    includeProtected: body.includeProtected === true,
    vacuumAfter: body.vacuumAfter === true,
    createBackup: body.createBackup === true,
  };
}

function maintenanceCleanupApplyFromBody(
  body: Record<string, unknown>,
): StorageMaintenanceCleanupApplyInput | undefined {
  if (typeof body.previewId !== "string" || body.previewId.length === 0)
    return undefined;
  return {
    filters: maintenanceCleanupFiltersFromBody(body),
    previewId: body.previewId,
    ...(body.createBackup === true ? { createBackup: true } : {}),
    ...(body.vacuumAfter === true ? { vacuumAfter: true } : {}),
  };
}

function maintenanceCleanupErrorPayload(error: unknown): {
  status: number;
  code: string;
  message: string;
} {
  const message = error instanceof Error ? error.message : "";
  if (message === "maintenance_preview_mismatch") {
    return {
      status: 409,
      code: "cleanup_preview_mismatch",
      message:
        "Die Vorschau ist nicht mehr aktuell. Bitte neu prüfen und danach löschen.",
    };
  }
  if (message === "maintenance_no_matches") {
    return {
      status: 409,
      code: "cleanup_no_matches",
      message: "Keine Matches erfüllen die aktuellen Löschfilter.",
    };
  }
  if (error instanceof StorageError) {
    return {
      status: 500,
      code: "cleanup_storage_error",
      message: "Cleanup wurde wegen eines Storage-Fehlers abgebrochen.",
    };
  }
  return {
    status: 500,
    code: "cleanup_failed",
    message: "Cleanup konnte nicht abgeschlossen werden.",
  };
}

function maintenanceStatus(value: string | null): MatchStatus | undefined {
  if (
    value === "pending" ||
    value === "waiting_for_runner" ||
    value === "waiting_for_corp" ||
    value === "waiting_for_joiner_decks" ||
    value === "ready_check" ||
    value === "countdown" ||
    value === "active" ||
    value === "cancelled" ||
    value === "abandoned" ||
    value === "forfeited" ||
    value === "finished"
  ) {
    return value;
  }
  return undefined;
}

function maintenanceMode(value: string | null): MatchMode | undefined {
  if (
    value === "human_vs_human" ||
    value === "human_runner_vs_corp_ai" ||
    value === "human_corp_vs_runner_ai" ||
    value === "ai_vs_ai"
  )
    return value;
  return undefined;
}

function numberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function nonNegativeIntegerParam(value: string | null): number | undefined {
  const parsed = numberParam(value);
  return parsed === undefined || parsed < 0 ? undefined : Math.floor(parsed);
}

function positiveInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

export function isMaintenanceClientAddressAllowed(
  value: string | undefined,
): boolean {
  const address = normalizeClientAddress(value);
  if (!address) return false;
  if (address === "::1" || address === "localhost") return true;
  const parts = address.split(".").map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  )
    return false;
  return parts[0] === 127;
}

function normalizeClientAddress(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith("::ffff:")) return trimmed.slice("::ffff:".length);
  return trimmed;
}

function bearerToken(request: IncomingMessage): string | undefined {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

function opposite(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function originOfHeader(
  value: string | string[] | undefined,
): string | undefined {
  const header = Array.isArray(value) ? value[0] : value;
  if (!header) return undefined;
  try {
    return new URL(header).origin;
  } catch {
    return undefined;
  }
}

function safeCloseReason(reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  return redactSensitiveText(reason).slice(0, 120);
}

function isDifficulty(value: unknown): value is AiDifficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

function isAiPacingMode(
  value: unknown,
): value is NonNullable<
  Parameters<MultiplayerService["createMatch"]>[0]["aiPacingMode"]
> {
  return value === "fast" || value === "paced" || value === "manual";
}

function isAiDecisionTraceMode(
  value: unknown,
): value is NonNullable<
  Parameters<MultiplayerService["createMatch"]>[0]["aiTraceMode"]
> {
  return value === "summary" || value === "detailed";
}

function isMatchCardPool(value: unknown): value is ApiMatchCardPool {
  return (
    value === "originalset" ||
    value === "originalset_classic" ||
    value === "originalset_proteus" ||
    value === "originalset_classic_proteus"
  );
}

function replayPerspectiveFromParam(
  value: string | null,
): ReplayPerspective | undefined {
  if (!value) return "runner";
  if (value === "runner" || value === "corp" || value === "local_analysis")
    return value;
  return undefined;
}

function deckErrorMessage(error: unknown): string {
  if (isAiDeckSnapshotRuntimeError(error))
    return aiDeckSnapshotHttpErrorMessage(error.code);
  const code = error instanceof Error ? error.message : String(error);
  if (code === "deck_snapshot_wrong_side")
    return "Das gewählte Deck hat die falsche Seite.";
  if (
    code === "deck_snapshot_not_validated" ||
    code === "deck_snapshot_invalid"
  )
    return "Das gewählte Deck ist nicht matchstartfähig. Bitte prüfe die Validierungsfehler.";
  if (code === "deck_snapshot_card_pool_mismatch")
    return "Das gewählte Deck passt nicht zum Kartenpool dieses Spiels.";
  if (code === "ai_deck_snapshot_not_supported")
    return "Das gewählte KI-Deck ist nicht KI-freigegeben. Bitte nutze feste Standard-Decks, deterministisch zufällige KI-Decks oder ein KI-sicheres Snapshot-Deck.";
  if (code === "deck_snapshot_needs_revalidation")
    return "Das gewählte Deck muss nach der aktuellen Formatversion neu validiert werden.";
  if (code === "deck_snapshot_not_found")
    return "Das gewählte Deck wurde nicht gefunden.";
  return "Die gewählten Decks sind nicht matchstartfähig.";
}

function deckErrorCode(error: unknown): string {
  return isAiDeckSnapshotRuntimeError(error) ? error.code : "deck_invalid";
}

function aiDeckSnapshotHttpErrorMessage(code: string): string {
  switch (code) {
    case "ai_deck_snapshot_missing":
      return "Der KI-Deck-Snapshot fehlt.";
    case "ai_deck_snapshot_empty":
      return "Der KI-Deck-Snapshot enthält keine Karten.";
    case "ai_deck_snapshot_side_mismatch":
      return "Der KI-Deck-Snapshot passt nicht zur KI-Seite.";
    case "ai_deck_snapshot_unknown_card":
      return "Der KI-Deck-Snapshot enthält eine Karte außerhalb des Runtime-Card-Pools.";
    case "ai_deck_snapshot_stale":
      return "Der KI-Deck-Snapshot passt nicht zum gewählten Deck.";
    case "ai_deck_snapshot_invalid":
      return "Der KI-Deck-Snapshot ist ungültig.";
    default:
      return "Der KI-Deck-Snapshot ist nicht matchstartfähig.";
  }
}
