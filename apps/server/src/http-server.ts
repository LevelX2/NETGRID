import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import { simulateAiGame } from "@netgrid/ai";
import { createConnectionAuditLoggerFromEnv, noopConnectionAuditLogger, type ConnectionAuditLogger } from "./connection-audit";
import {
  JsonFileMatchStorage,
  InMemoryMatchStorage,
  MultiplayerService,
  type MatchMode,
  type MatchStatus,
  type ReplayPerspective,
  type LifecycleActionResult,
  type LobbyPayload,
  type ServicePayload,
  type SidePayload,
  type SubmitActionResult,
  type UndoResult
} from "./multiplayer";
import {
  DEFAULT_LEGACY_MATCH_STORAGE_PATH,
  DEFAULT_SQLITE_STORAGE_PATH,
  DEFAULT_STORAGE_BACKUP_DIR,
  LEGACY_SQLITE_STORAGE_PATH,
  SqliteMatchStorage,
  StorageError,
  type StorageKind
} from "./storage-sqlite";
import type { StorageMaintenanceCleanupApplyInput, StorageMaintenanceCleanupFilters, StorageMaintenanceCleanupPolicyInput, StorageMaintenanceMatchFilters } from "./storage-sqlite";
import { resolveDeckSetup, type AiDeckPolicy, type MatchDeckSelectionInput, type ParticipantDeckPairInput } from "./deck-setup";
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
  type RateLimitCategory
} from "./internet-hardening";
import type { ApiServerMessage, Side } from "@netgrid/shared";
import type { AiDifficulty } from "@netgrid/shared";

type ClientWsMessage =
  | { type: "join_match"; payload: { matchId: string; sessionToken: string; side: Side } }
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
  | { type: "request_undo"; payload: { targetEventId: string; reason?: string } }
  | { type: "accept_undo"; payload: { undoRequestId: string } }
  | { type: "decline_undo"; payload: { undoRequestId: string } }
  | { type: "set_ready"; payload: { ready: boolean } }
  | { type: "cancel_countdown"; payload: Record<string, never> }
  | { type: "send_lobby_chat"; payload: { text: string } }
  | { type: "advance_ai"; payload: { knownStateVersion?: number; knownMatchVersion?: number; mode?: "single_step" | "until_human" } }
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
  close(): Promise<void>;
};

type NetgridServerOptions = {
  deploymentConfig?: DeploymentConfig;
  rateLimiter?: FixedWindowRateLimiter;
  connectionAudit?: ConnectionAuditLogger;
};

export class NetgridRealtimeServer {
  private readonly connections = new Map<string, Map<Side, Connection>>();
  private readonly countdownTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly socketClients = new WeakMap<WebSocket, { clientKey: string; openedAt: number; origin?: string | undefined; replacedByReconnect?: boolean }>();
  private readonly socketContexts = new WeakMap<WebSocket, WsContext>();
  private wss?: WebSocketServer;

  constructor(
    private readonly service: MultiplayerService,
    private readonly deploymentConfig: DeploymentConfig,
    private readonly rateLimiter: FixedWindowRateLimiter,
    private readonly connectionAudit: ConnectionAuditLogger = noopConnectionAuditLogger
  ) {}

  attach(server: Server): void {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      verifyClient: (info, done) => {
        const origin = info.origin || info.req.headers.origin;
        const clientKey = hashClientKey(clientIdentity(info.req, this.deploymentConfig));
        if (!isOriginAllowed(origin, this.deploymentConfig)) {
          this.recordConnectionAudit({ event: "ws_handshake_denied", origin: originOfHeader(origin), clientKey, errorCode: "origin_not_allowed" });
          done(false, 403, "origin_not_allowed");
          return;
        }
        const limited = this.rateLimiter.check("ws_handshake", clientKey, "ws");
        if (!limited.allowed) {
          this.recordConnectionAudit({ event: "ws_handshake_denied", origin: originOfHeader(origin), clientKey, errorCode: "rate_limited", rateLimitCategory: "ws_handshake" });
          done(false, 429, "rate_limited");
          return;
        }
        done(true);
      }
    });
    this.wss.on("connection", (socket, request) => {
      const origin = originOfHeader(request.headers.origin);
      const clientKey = hashClientKey(clientIdentity(request, this.deploymentConfig));
      this.socketClients.set(socket, { clientKey, openedAt: Date.now(), origin });
      this.recordConnectionAudit({ event: "ws_open", origin, clientKey });
      socket.on("message", (raw) => void this.handleMessage(socket, raw.toString()));
      socket.on("close", (code, reason) => void this.handleClose(socket, code, reason.toString("utf8")));
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
    this.recordConnectionAudit({ event: "server_start", profile: this.deploymentConfig.profile, url });
  }

  private async handleMessage(socket: WebSocket, raw: string): Promise<void> {
    const message = parseWsMessage(raw);
    if (!message) {
      send(socket, { type: "error", payload: { code: "bad_message", message: "Nachricht konnte nicht gelesen werden." } });
      return;
    }

    if (message.type === "ping") {
      send(socket, { type: "pong", payload: { clientTime: message.payload.clientTime, serverTime: Date.now() } });
      return;
    }

    if (message.type === "join_match") {
      await this.joinSocket(socket, message.payload);
      return;
    }

    const context = this.findContext(socket);
    if (!context) {
      send(socket, { type: "error", payload: { code: "not_joined", message: "WebSocket ist noch keinem Match beigetreten." } });
      return;
    }

    if (message.type === "submit_action") {
      if (message.payload.matchId !== context.matchId || message.payload.side !== context.side) {
        send(socket, { type: "error", payload: { code: "wrong_session", message: "Diese Session darf diese Aktion nicht ausführen." } });
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
          ready: Boolean(message.payload.ready)
        })
      );
      return;
    }

    if (message.type === "cancel_countdown") {
      await this.handleLobbyOperation(
        this.service.cancelLobbyCountdown({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken
        })
      );
      return;
    }

    if (message.type === "send_lobby_chat") {
      await this.handleLobbyOperation(
        this.service.sendLobbyChat({
          matchId: context.matchId,
          side: context.side,
          sessionToken: context.sessionToken,
          text: typeof message.payload.text === "string" ? message.payload.text : ""
        })
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
          ...(message.payload.reason ? { reason: message.payload.reason } : {})
        })
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
          undoRequestId: message.payload.undoRequestId
        })
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
          undoRequestId: message.payload.undoRequestId
        })
      );
    }
  }

  private async joinSocket(socket: WebSocket, payload: { matchId: string; sessionToken: string; side: Side }): Promise<void> {
    const clientKey = this.socketClients.get(socket)?.clientKey ?? "unknown-client";
    const limited = this.rateLimiter.check("ws_join", clientKey, payload.matchId);
    if (!limited.allowed) {
      this.recordConnectionAudit({ event: "ws_join_failed", clientKey, matchId: payload.matchId, side: payload.side, errorCode: "rate_limited", rateLimitCategory: "ws_join" });
      send(socket, { type: "error", payload: { code: "rate_limited", message: "Zu viele WebSocket-Join-Versuche. Bitte kurz warten." } });
      return;
    }
    const connected = await this.service.setConnected(payload.matchId, payload.side, payload.sessionToken, true);
    if ("error" in connected) {
      this.recordConnectionAudit({ event: "ws_join_failed", clientKey, matchId: payload.matchId, side: payload.side, errorCode: connected.error.code });
      send(socket, { type: "error", payload: connected.error });
      return;
    }

    const bySide = this.connections.get(payload.matchId) ?? new Map<Side, Connection>();
    const previous = bySide.get(payload.side);
    if (previous && previous.socket !== socket) {
      send(previous.socket, { type: "error", payload: { code: "reconnected_elsewhere", message: "Diese Seite wurde in einem anderen Fenster verbunden." } });
      const previousMeta = this.socketClients.get(previous.socket);
      if (previousMeta) this.socketClients.set(previous.socket, { ...previousMeta, replacedByReconnect: true });
      this.recordConnectionAudit({ event: "ws_replaced_by_reconnect", clientKey: previousMeta?.clientKey, matchId: payload.matchId, side: payload.side, code: 4000, reason: "reconnected" });
      previous.socket.close(4000, "reconnected");
    }
    bySide.set(payload.side, { socket, context: payload });
    this.connections.set(payload.matchId, bySide);
    this.socketContexts.set(socket, payload);
    this.recordConnectionAudit({ event: "ws_join_ok", clientKey, matchId: payload.matchId, side: payload.side });
    sendBootstrap(socket, connected);
    this.scheduleCountdownFromPayload(connected);
    await this.sendOpponentBootstrap(payload.matchId, opposite(payload.side), connected.opponentStatus);
  }

  private async handleSubmitAction(
    context: WsContext,
    payload: Extract<ClientWsMessage, { type: "submit_action" }>["payload"]
  ): Promise<void> {
    const result = await this.service.submitAction({
      matchId: context.matchId,
      side: context.side,
      sessionToken: context.sessionToken,
      actionId: payload.actionId,
      clientKnownStateVersion: payload.clientKnownStateVersion,
      idempotencyKey: payload.idempotencyKey,
      ...(payload.selectedTargets ? { selectedTargets: payload.selectedTargets } : {}),
      ...(payload.selectedChoices ? { selectedChoices: payload.selectedChoices } : {})
    });

    const actor = this.connection(context.matchId, context.side);
    if (!result.ok) {
      if (result.receipt) send(actor?.socket, { type: "action_receipt", payload: result.receipt });
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
    payload: Extract<ClientWsMessage, { type: "advance_ai" }>["payload"]
  ): Promise<void> {
    const result = await this.service.advanceAi({
      matchId: context.matchId,
      side: context.side,
      sessionToken: context.sessionToken,
      ...(typeof payload.knownStateVersion === "number" ? { knownStateVersion: payload.knownStateVersion } : {}),
      ...(typeof payload.knownMatchVersion === "number" ? { knownMatchVersion: payload.knownMatchVersion } : {}),
      ...(payload.mode === "until_human" || payload.mode === "single_step" ? { mode: payload.mode } : {})
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

  private async handleUndo(context: WsContext, operation: Promise<UndoResult>): Promise<void> {
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

  private async handleLobbyOperation(operation: Promise<Awaited<ReturnType<MultiplayerService["setLobbyReady"]>>>): Promise<void> {
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
    const payload = await this.service.bootstrap(matchId, side, connection.context.sessionToken, { allowLobby: true });
    if ("error" in payload) return;
    sendBootstrap(connection.socket, payload);
    this.scheduleCountdownFromPayload(payload);
  }

  private async handleClose(socket: WebSocket, code?: number, reason?: string): Promise<void> {
    const context = this.findContext(socket) ?? this.socketContexts.get(socket);
    const meta = this.socketClients.get(socket);
    const durationMs = meta ? Math.max(0, Date.now() - meta.openedAt) : undefined;
    if (!context) {
      this.recordConnectionAudit({ event: "ws_close", clientKey: meta?.clientKey, code, reason: safeCloseReason(reason), durationMs });
      return;
    }
    const bySide = this.connections.get(context.matchId);
    if (bySide?.get(context.side)?.socket !== socket) {
      this.recordConnectionAudit({ event: "ws_close", clientKey: meta?.clientKey, matchId: context.matchId, side: context.side, code, reason: safeCloseReason(reason), durationMs, ignoredAsReplaced: true });
      return;
    }
    bySide.delete(context.side);
    this.recordConnectionAudit({ event: "ws_close", clientKey: meta?.clientKey, matchId: context.matchId, side: context.side, code, reason: safeCloseReason(reason), durationMs, ...(meta?.replacedByReconnect ? { ignoredAsReplaced: true } : {}) });
    const disconnected = await this.service.setConnected(context.matchId, context.side, context.sessionToken, false);
    if ("error" in disconnected) return;
    if (isLobbyPayload(disconnected)) {
      await this.sendOpponentBootstrap(context.matchId, opposite(context.side), { side: context.side, connected: false });
      return;
    }
    this.sendOpponentStatus(context.matchId, opposite(context.side), { side: context.side, connected: false });
  }

  private handleSocketError(socket: WebSocket, error: Error): void {
    const context = this.findContext(socket) ?? this.socketContexts.get(socket);
    const meta = this.socketClients.get(socket);
    this.recordConnectionAudit({
      event: "ws_error",
      clientKey: meta?.clientKey,
      matchId: context?.matchId,
      side: context?.side,
      errorCode: error.name || "websocket_error"
    });
  }

  private recordConnectionAudit(event: Parameters<ConnectionAuditLogger["record"]>[0]): void {
    this.connectionAudit.record(event);
  }

  private broadcastPayload(payload: ServicePayload): void {
    const connection = this.connection(payload.matchId, payload.side);
    sendBootstrap(connection?.socket, payload);
  }

  private sendOpponentStatus(matchId: string, side: Side, status: SidePayload["opponentStatus"]): void {
    send(this.connection(matchId, side)?.socket, { type: "opponent_status", payload: status });
  }

  private async sendOpponentBootstrap(matchId: string, side: Side, fallbackStatus: SidePayload["opponentStatus"]): Promise<void> {
    const opponent = this.connection(matchId, side);
    if (!opponent) return;
    const payload = await this.service.bootstrap(matchId, side, opponent.context.sessionToken, { allowLobby: true });
    if ("error" in payload) {
      send(opponent.socket, { type: "opponent_status", payload: fallbackStatus });
      return;
    }
    sendBootstrap(opponent.socket, payload);
    this.scheduleCountdownFromPayload(payload);
  }

  private scheduleCountdownFromPayload(payload: ServicePayload): void {
    if (!isLobbyPayload(payload) || payload.matchStatus !== "countdown" || !payload.startLobby?.countdownEndsAt) {
      const existing = this.countdownTimers.get(payload.matchId);
      if (existing) clearTimeout(existing);
      this.countdownTimers.delete(payload.matchId);
      return;
    }
    const existing = this.countdownTimers.get(payload.matchId);
    if (existing) clearTimeout(existing);
    const delay = Math.max(0, new Date(payload.startLobby.countdownEndsAt).getTime() - Date.now());
    const timer = setTimeout(() => void this.activateCountdown(payload.matchId), delay);
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

export function createNetgridHttpServer(service?: MultiplayerService, options: NetgridServerOptions = {}): NetgridServerHandle {
  const deploymentConfig = options.deploymentConfig ?? loadDeploymentConfig();
  const activeService = service ?? defaultService(deploymentConfig);
  const rateLimiter = options.rateLimiter ?? createRateLimiter(deploymentConfig.rateLimitProfile);
  const connectionAudit = options.connectionAudit ?? createConnectionAuditLoggerFromEnv();
  const realtime = new NetgridRealtimeServer(activeService, deploymentConfig, rateLimiter, connectionAudit);
  const server = createServer((request, response) => void routeHttp(activeService, realtime, deploymentConfig, rateLimiter, request, response));
  realtime.attach(server);
  const cleanupTimer = deploymentConfig.profile === "local" ? startMaintenanceCleanupTimer(activeService) : undefined;
  return {
    server,
    service: activeService,
    realtime,
    deploymentConfig,
    close: () =>
      new Promise<void>((resolve, reject) => {
        connectionAudit.record({ event: "server_stop", profile: deploymentConfig.profile });
        realtime
          .close()
          .then(() =>
            server.close((error) => {
              if (cleanupTimer) clearInterval(cleanupTimer);
              activeService.closeStorage();
              return error ? reject(error) : resolve();
            })
          )
          .catch(reject);
      })
  };
}

export async function startNetgridServer(options: { port?: number; host?: string; service?: MultiplayerService } = {}): Promise<NetgridServerHandle & { url: string; bindUrl: string }> {
  const handle = createNetgridHttpServer(options.service);
  const port = options.port ?? Number(process.env.PORT ?? 8787);
  const host = (options.host ?? process.env.HOST ?? "0.0.0.0").trim();
  await new Promise<void>((resolveListen) => handle.server.listen(port, host, resolveListen));
  const advertisedHost = advertisedServerHost(host);
  const url = `http://${advertisedHost}:${port}`;
  const bindUrl = `http://${host}:${port}`;
  handle.realtime.recordServerStart(url);
  return { ...handle, url, bindUrl };
}

function startMaintenanceCleanupTimer(service: MultiplayerService): ReturnType<typeof setInterval> | undefined {
  if (!service.runStorageMaintenanceCleanupPolicy) return undefined;
  const timer = setInterval(() => {
    void service.runStorageMaintenanceCleanupPolicy().catch((error) => {
      const code = error instanceof Error ? error.message : "cleanup_policy_failed";
      console.warn(`maintenance_cleanup_policy_failed:${redactSensitiveText(code)}`);
    });
  }, 60 * 60 * 1000);
  timer.unref?.();
  return timer;
}

async function routeHttp(
  service: MultiplayerService,
  realtime: NetgridRealtimeServer,
  deploymentConfig: DeploymentConfig,
  rateLimiter: FixedWindowRateLimiter,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const corsDecision = applyCors(request, response, deploymentConfig);
  if (corsDecision === "denied") {
    sendJson(response, 403, originDeniedPayload());
    return;
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");
  try {
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, redactedHealth(await service.storageHealth(), deploymentConfig));
      return;
    }

    if (url.pathname === "/api/storage/maintenance/summary" && request.method === "GET") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, "storage-maintenance-summary")) return;
      const summary = await service.storageMaintenanceSummary();
      if (!summary) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, summary);
      return;
    }

    if (url.pathname === "/api/storage/maintenance/matches" && request.method === "GET") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, "storage-maintenance-matches")) return;
      const matches = await service.storageMaintenanceMatches(maintenanceFiltersFromSearch(url.searchParams));
      if (!matches) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, { matches });
      return;
    }

    if (url.pathname === "/api/storage/maintenance/cleanup/preview" && request.method === "POST") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, "storage-maintenance-cleanup-preview")) return;
      const body = await readJson(request);
      const preview = await service.storageMaintenanceCleanupPreview(maintenanceCleanupFiltersFromBody(body));
      if (!preview) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, preview);
      return;
    }

    if (url.pathname === "/api/storage/maintenance/cleanup/apply" && request.method === "POST") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, "storage-maintenance-cleanup-apply")) return;
      const body = await readJson(request);
      const input = maintenanceCleanupApplyFromBody(body);
      if (!input) {
        sendJson(response, 400, { error: { code: "cleanup_request_invalid", message: "Cleanup braucht gültige Filter und Preview-ID." } });
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
        sendJson(response, payload.status, { error: { code: payload.code, message: payload.message } });
      }
      return;
    }

    if (url.pathname === "/api/storage/maintenance/cleanup/policy" && request.method === "GET") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, "storage-maintenance-cleanup-policy")) return;
      const policy = await service.storageMaintenanceCleanupPolicy();
      if (!policy) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, policy);
      return;
    }

    if (url.pathname === "/api/storage/maintenance/cleanup/policy" && request.method === "POST") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, "storage-maintenance-cleanup-policy-update")) return;
      const body = await readJson(request);
      const policy = await service.setStorageMaintenanceCleanupPolicy(maintenanceCleanupPolicyFromBody(body));
      if (!policy) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, policy);
      return;
    }

    if (url.pathname === "/api/storage/maintenance/cleanup/policy/run" && request.method === "POST") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, "storage-maintenance-cleanup-policy-run")) return;
      const result = await service.runStorageMaintenanceCleanupPolicy();
      if (!result) {
        sendJson(response, 503, maintenanceUnavailablePayload());
        return;
      }
      sendJson(response, 200, result);
      return;
    }

    const maintenanceRetentionRoute = /^\/api\/storage\/maintenance\/matches\/([^/]+)\/retention-protection$/.exec(url.pathname);
    if (maintenanceRetentionRoute && request.method === "POST") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, `storage-maintenance-retention:${maintenanceRetentionRoute[1]}`)) return;
      const body = await readJson(request);
      const matchId = decodeURIComponent(maintenanceRetentionRoute[1] ?? "");
      const detail = await service.storageMaintenanceSetRetentionProtection(matchId, body.protected === true);
      if (!detail) {
        sendJson(response, 404, { error: { code: "not_found", message: "Diese Wartungsansicht hat keine Daten für dieses Match." } });
        return;
      }
      sendJson(response, 200, detail);
      return;
    }

    const maintenanceMatchRoute = /^\/api\/storage\/maintenance\/matches\/([^/]+)$/.exec(url.pathname);
    if (maintenanceMatchRoute && request.method === "GET") {
      if (!ensureMaintenanceAccess(response, request, deploymentConfig)) return;
      const matchId = decodeURIComponent(maintenanceMatchRoute[1] ?? "");
      if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, `storage-maintenance-match:${matchId}`)) return;
      const detail = await service.storageMaintenanceMatchDetail(matchId);
      if (!detail) {
        sendJson(response, 404, { error: { code: "not_found", message: "Diese Wartungsansicht hat keine Daten für dieses Match." } });
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
      if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, "matches-open")) return;
      sendJson(response, 200, { matches: await service.listOpenMatches() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/matches") {
      if (!checkRateLimit(response, rateLimiter, "create_match", request, deploymentConfig, "create")) return;
      const body = await readJson(request);
      const createInput: Parameters<MultiplayerService["createMatch"]>[0] = {
        hostSide: body.hostSide === "runner" || body.hostSide === "corp" || body.hostSide === "random" ? body.hostSide : "runner"
      };
      if (body.playMode === "human_vs_ai") {
        createInput.playMode = "human_vs_ai";
        createInput.humanSide = body.humanSide === "runner" || body.humanSide === "corp" || body.humanSide === "random" ? body.humanSide : "random";
      }
      if (body.mode === "human_vs_human" || body.mode === "human_runner_vs_corp_ai" || body.mode === "human_corp_vs_runner_ai") createInput.mode = body.mode;
      if (typeof body.displayName === "string") createInput.displayName = body.displayName;
      if (typeof body.seed === "string") createInput.seed = body.seed;
      if (typeof body.countdownSeconds === "number") createInput.countdownSeconds = body.countdownSeconds;
      if (isDifficulty(body.runnerDifficulty)) createInput.runnerDifficulty = body.runnerDifficulty;
      if (isDifficulty(body.corpDifficulty)) createInput.corpDifficulty = body.corpDifficulty;
      if (isAiPacingMode(body.aiPacingMode)) createInput.aiPacingMode = body.aiPacingMode;
      if (typeof body.discoverableInLan === "boolean") createInput.discoverableInLan = body.discoverableInLan;
      Object.assign(createInput, deckSelectionFromBody(body));
      if (typeof body.settings === "object" && body.settings) {
        const settings = body.settings as Record<string, unknown>;
        const nextSettings: Parameters<MultiplayerService["createMatch"]>[0]["settings"] = {};
        nextSettings.agendaPointsToWin = 7;
        if (settings.matchFormat === "rules_match" || settings.matchFormat === "two_game_side_swap") nextSettings.matchFormat = settings.matchFormat;
        if (settings.playerClock && typeof settings.playerClock === "object") {
          const playerClock = settings.playerClock as Record<string, unknown>;
          nextSettings.playerClock = {
            mode: playerClock.mode === "player_clock" ? "player_clock" : "none",
            ...(typeof playerClock.startingTimeMs === "number" ? { startingTimeMs: playerClock.startingTimeMs } : {}),
            ...(typeof playerClock.gracePeriodMs === "number" ? { gracePeriodMs: playerClock.gracePeriodMs } : {})
          };
        }
        if (Object.keys(nextSettings).length > 0) createInput.settings = nextSettings;
      }
      try {
        const created = await service.createMatch(createInput);
        sendJson(response, 201, created);
      } catch (error) {
        sendJson(response, 400, { error: { code: "deck_invalid", message: deckErrorMessage(error) } });
      }
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/simulations/ai-vs-ai") {
      if (!checkRateLimit(response, rateLimiter, "ai_advance", request, deploymentConfig, "simulation")) return;
      const body = await readJson(request);
      const config: Parameters<typeof simulateAiGame>[0] = {};
      if (typeof body.seed === "string") config.seed = body.seed;
      if (typeof body.maxActions === "number") config.maxActions = Math.max(1, Math.min(500, Math.floor(body.maxActions)));
      config.agendaPointsToWin = 7;
      if (isDifficulty(body.runnerDifficulty)) config.runnerDifficulty = body.runnerDifficulty;
      if (isDifficulty(body.corpDifficulty)) config.corpDifficulty = body.corpDifficulty;
      const deckSelection = deckSelectionFromBody(body);
      if (Object.keys(deckSelection).length > 0) {
        const aiDeckPolicy = aiDeckPolicyFromValue(body.aiDeckPolicy);
        const deckSetup = resolveDeckSetup(deckSelection, { seed: config.seed ?? "ai-vs-ai-smoke", ...(aiDeckPolicy ? { aiDeckPolicy } : {}) });
        config.runnerDeck = deckSetup.runnerDeck;
        config.corpDeck = deckSetup.corpDeck;
        config.runnerDeckMetadata = deckSetup.runnerSnapshot.publicMetadata;
        config.corpDeckMetadata = deckSetup.corpSnapshot.publicMetadata;
        config.agendaPointsToWin = config.agendaPointsToWin ?? 7;
      } else {
        if (body.runnerDeckId === "demo_runner_001" || body.runnerDeckId === "demo_runner_004") config.runnerDeckId = body.runnerDeckId;
        if (body.corpDeckId === "demo_corp_001" || body.corpDeckId === "demo_corp_004") config.corpDeckId = body.corpDeckId;
      }
      sendJson(response, 200, { mode: "ai_vs_ai", summary: simulateAiGame(config) });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/replays") {
      if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, "replay-index")) return;
      sendJson(response, 200, { replays: await service.listReplayIndex() });
      return;
    }

    const replayRoute = /^\/api\/replays\/([^/]+)(?:\/(export))?$/.exec(url.pathname);
    if (replayRoute && request.method === "GET") {
      if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, `replay:${replayRoute[1]}`)) return;
      const matchId = decodeURIComponent(replayRoute[1] ?? "");
      const perspective = replayPerspectiveFromParam(url.searchParams.get("perspective"));
      if (!perspective) {
        sendJson(response, 400, { error: { code: "bad_request", message: "Unbekannte Replay-Perspektive." } });
        return;
      }
      if (replayRoute[2] === "export") {
        const exported = await service.exportReplay(matchId, perspective);
        const status = exported.ok ? 200 : exported.error.code === "bad_request" ? 400 : 404;
        sendJson(response, status, exported.ok ? exported.artifact : { error: exported.error });
        return;
      }
      const replay = await service.loadReplayView(matchId, perspective);
      sendJson(response, replay.ok ? 200 : 404, replay.ok ? replay.replay : { error: replay.error });
      return;
    }

    const matchRoute = /^\/api\/matches\/([^/]+)\/([^/]+)$/.exec(url.pathname);
    if (matchRoute) {
      const matchId = decodeURIComponent(matchRoute[1] ?? "");
      const action = matchRoute[2];
      if (request.method === "GET" && action === "join-info") {
        if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, `join-info:${matchId}`)) return;
        sendJson(response, 200, await service.getJoinInfo(matchId, url.searchParams.get("token") ?? undefined));
        return;
      }
      if (request.method === "POST" && action === "join") {
        if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, `join:${matchId}`)) return;
        const body = await readJson(request);
        const joinInput: Parameters<MultiplayerService["joinMatch"]>[1] = {
          token: typeof body.token === "string" ? body.token : "",
          ...(deckPairFromBody(body) ?? {})
        };
        if (typeof body.displayName === "string") joinInput.displayName = body.displayName;
        const joined = await service.joinMatch(matchId, joinInput);
        if (!("error" in joined)) void realtime.refreshSide(matchId, opposite(joined.side));
        sendJson(response, "error" in joined ? 403 : 200, joined);
        return;
      }
      if (request.method === "POST" && action === "reconnect") {
        if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, `reconnect:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "runner" || body.side === "corp" ? body.side : "runner";
        const reconnectInput: Parameters<MultiplayerService["reconnectMatch"]>[1] = {
          side,
          reconnectToken: typeof body.reconnectToken === "string" ? body.reconnectToken : ""
        };
        if (typeof body.displayName === "string") reconnectInput.displayName = body.displayName;
        const reconnected = await service.reconnectMatch(matchId, reconnectInput);
        sendJson(response, "error" in reconnected ? 403 : 200, reconnected);
        return;
      }
      if (request.method === "POST" && action === "cancel") {
        if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, `cancel:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.cancelMatch({
          matchId,
          side,
          sessionToken: bearerToken(request) ?? (typeof body.sessionToken === "string" ? body.sessionToken : "")
        });
        realtime.broadcastLifecycle(result);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "POST" && action === "leave") {
        if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, `leave:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.leaveMatch({
          matchId,
          side,
          sessionToken: bearerToken(request) ?? (typeof body.sessionToken === "string" ? body.sessionToken : "")
        });
        realtime.broadcastLifecycle(result);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "POST" && action === "forfeit") {
        if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, `forfeit:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.forfeitMatch({
          matchId,
          side,
          sessionToken: bearerToken(request) ?? (typeof body.sessionToken === "string" ? body.sessionToken : "")
        });
        realtime.broadcastLifecycle(result);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "POST" && action === "recreate") {
        if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, `recreate:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.recreateMatch(matchId, {
          side,
          sessionToken: bearerToken(request) ?? (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          ...(typeof body.displayName === "string" ? { displayName: body.displayName } : {})
        });
        realtime.broadcastLifecycle(result);
        sendJson(response, result.ok && result.newMatch ? 201 : result.ok ? 200 : 409, result.ok && result.newMatch ? result.newMatch : result);
        return;
      }
      if (request.method === "POST" && action === "retention-protection") {
        if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, `retention-protection:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const result = await service.setMatchRetentionProtection({
          matchId,
          side,
          sessionToken: bearerToken(request) ?? (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          protected: body.protected === true
        });
        if (result.ok) void realtime.refreshSide(matchId, side);
        sendJson(response, result.ok ? 200 : 409, result);
        return;
      }
      if (request.method === "GET" && action === "bootstrap") {
        if (!checkRateLimit(response, rateLimiter, "token_probe", request, deploymentConfig, `bootstrap:${matchId}`)) return;
        const side = url.searchParams.get("side") === "corp" ? "corp" : "runner";
        const sessionToken = bearerToken(request) ?? url.searchParams.get("sessionToken") ?? "";
        const bootstrapped = await service.bootstrap(matchId, side, sessionToken, { allowLobby: true });
        sendJson(response, "error" in bootstrapped ? 403 : 200, bootstrapped);
        return;
      }
      if (request.method === "POST" && action === "series-next") {
        if (!checkRateLimit(response, rateLimiter, "lifecycle", request, deploymentConfig, `series-next:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const sessionToken = bearerToken(request) ?? (typeof body.sessionToken === "string" ? body.sessionToken : "");
        const next = await service.startNextSeriesGame(matchId, {
          side,
          sessionToken,
          ...(typeof body.displayName === "string" ? { displayName: body.displayName } : {})
        });
        sendJson(response, "error" in next ? 409 : 201, next);
        return;
      }
      if (request.method === "POST" && action === "ai-advance") {
        if (!checkRateLimit(response, rateLimiter, "ai_advance", request, deploymentConfig, `ai:${matchId}`)) return;
        const body = await readJson(request);
        const side = body.side === "corp" ? "corp" : "runner";
        const advanced = await service.advanceAi({
          matchId,
          side,
          sessionToken: bearerToken(request) ?? (typeof body.sessionToken === "string" ? body.sessionToken : ""),
          ...(typeof body.knownStateVersion === "number" ? { knownStateVersion: body.knownStateVersion } : {}),
          ...(typeof body.knownMatchVersion === "number" ? { knownMatchVersion: body.knownMatchVersion } : {}),
          ...(body.mode === "until_human" || body.mode === "single_step" ? { mode: body.mode } : {})
        });
        if (advanced.ok) {
          sendJson(response, 200, {
            ok: true,
            requesterPayload: advanced.requesterPayload,
            ...(advanced.publicEvent ? { publicEvent: advanced.publicEvent } : {})
          });
        } else {
          sendJson(response, 409, advanced);
        }
        return;
      }
    }

    sendJson(response, 404, { error: { code: "not_found", message: "Route nicht gefunden." } });
  } catch (error) {
    if (error instanceof SyntaxError) {
      sendJson(response, 400, { error: { code: "bad_json", message: "Anfrage konnte nicht gelesen werden." } });
      return;
    }
    sendJson(response, 500, { error: { code: "server_error", message: "Serverfehler." } });
  }
}

function defaultService(deploymentConfig: DeploymentConfig): MultiplayerService {
  return new MultiplayerService(createConfiguredStorage(), {
    ...(deploymentConfig.tokenSalt ? { tokenSalt: deploymentConfig.tokenSalt } : {}),
    publicWebBaseUrl: deploymentConfig.webBaseUrl,
    publicServerBaseUrl: deploymentConfig.serverBaseUrl
  });
}

export function createConfiguredStorage() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const storageKind = storageKindFromEnv(envValue(process.env, "NETGRID_STORAGE_KIND"));
  if (storageKind === "memory") return new InMemoryMatchStorage();
  if (storageKind === "json") {
    const configuredPath = envValue(process.env, "NETGRID_MATCH_STORAGE_PATH");
    const storagePath = configuredPath ? resolve(configuredPath) : resolve(root, DEFAULT_LEGACY_MATCH_STORAGE_PATH);
    return new JsonFileMatchStorage(storagePath);
  }
  const configuredSqlitePath = envValue(process.env, "NETGRID_SQLITE_STORAGE_PATH");
  const sqlitePath = configuredSqlitePath ? resolve(configuredSqlitePath) : resolve(root, DEFAULT_SQLITE_STORAGE_PATH);
  const legacyJsonPath = envValue(process.env, "NETGRID_LEGACY_MATCH_STORAGE_PATH") ?? resolve(root, DEFAULT_LEGACY_MATCH_STORAGE_PATH);
  const backupDir = envValue(process.env, "NETGRID_STORAGE_BACKUP_DIR") ?? resolve(root, DEFAULT_STORAGE_BACKUP_DIR);
  try {
    return new SqliteMatchStorage({
      dbPath: sqlitePath,
      ...(configuredSqlitePath ? {} : { legacySqlitePath: resolve(root, LEGACY_SQLITE_STORAGE_PATH) }),
      legacyJsonPath: resolve(legacyJsonPath),
      backupDir: resolve(backupDir)
    });
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError("storage_corrupt", "Storage konnte nicht geöffnet werden. Bitte aus einem lokalen Backup wiederherstellen.");
  }
}

function storageKindFromEnv(value: string | undefined): StorageKind {
  if (value === "json" || value === "memory" || value === "sqlite") return value;
  return "sqlite";
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
      if (entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("169.254.")) return entry.address;
    }
  }
  return undefined;
}

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
}

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function sendBootstrap(socket: WebSocket | undefined, payload: ServicePayload): void {
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
      pendingUndo: payload.pendingUndo ?? null
    }
  });
  send(socket, { type: "legal_actions", payload: { stateVersion: payload.playerView.stateVersion, legalActions: payload.legalActions } });
  send(socket, { type: "choice_request", payload: { choice: payload.pendingChoice ?? null } });
  send(socket, { type: "event_log_update", payload: { events: payload.eventTail } });
  send(socket, { type: "opponent_status", payload: payload.opponentStatus });
  send(socket, { type: "ai_turn", payload: payload.aiTurnPresentation ?? null });
  if (payload.pendingUndo) send(socket, { type: "undo_request", payload: payload.pendingUndo });
  if (payload.winner && payload.finalStateHash) send(socket, { type: "match_finished", payload: { matchStatus: payload.matchStatus, winner: payload.winner, finalStateHash: payload.finalStateHash, ...(payload.resultSummary ? { resultSummary: payload.resultSummary } : {}) } });
}

function isLobbyPayload(payload: ServicePayload): payload is LobbyPayload {
  return !("playerView" in payload);
}

function send(socket: WebSocket | undefined, message: ServerWsMessage): void {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(message));
}

function parseWsMessage(raw: string): ClientWsMessage | null {
  try {
    const parsed = JSON.parse(raw) as ClientWsMessage;
    return typeof parsed?.type === "string" && typeof parsed.payload === "object" ? parsed : null;
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
  scope: string
): boolean {
  const clientKey = hashClientKey(clientIdentity(request, deploymentConfig));
  const limited = rateLimiter.check(category, clientKey, scope);
  if (limited.allowed) return true;
  if (limited.retryAfterSeconds) response.setHeader("retry-after", String(limited.retryAfterSeconds));
  sendJson(response, 429, rateLimitedPayload());
  return false;
}

function ensureMaintenanceAccess(response: ServerResponse, request: IncomingMessage, deploymentConfig: DeploymentConfig): boolean {
  if (deploymentConfig.profile !== "local" || !isMaintenanceClientAddressAllowed(request.socket.remoteAddress)) {
    sendJson(response, 403, { error: { code: "maintenance_unavailable", message: "Die Wartungsansicht ist nur lokal oder im privaten Netzwerk verfügbar." } });
    return false;
  }
  return true;
}

function maintenanceUnavailablePayload(): { error: { code: "maintenance_unavailable"; message: string } } {
  return { error: { code: "maintenance_unavailable", message: "Storage-Wartungsdaten sind nur für lokalen SQLite-Storage verfügbar." } };
}

function maintenanceFiltersFromSearch(searchParams: URLSearchParams): StorageMaintenanceMatchFilters {
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

function maintenanceCleanupFiltersFromBody(body: Record<string, unknown>): StorageMaintenanceCleanupFilters {
  const statuses = Array.isArray(body.statuses)
    ? body.statuses.map((status) => maintenanceStatus(typeof status === "string" ? status : null)).filter((status): status is MatchStatus => Boolean(status))
    : [];
  const olderThanMinutes = positiveInteger(body.olderThanMinutes, 60, 1, 525_600);
  const limit = positiveInteger(body.limit, 100, 1, 500);
  return { statuses: [...new Set(statuses)], olderThanMinutes, limit, includeProtected: body.includeProtected === true };
}

function maintenanceCleanupPolicyFromBody(body: Record<string, unknown>): StorageMaintenanceCleanupPolicyInput {
  const filters = maintenanceCleanupFiltersFromBody({
    statuses: body.statuses,
    olderThanMinutes: 60,
    limit: body.limit,
    includeProtected: body.includeProtected
  });
  return {
    enabled: body.enabled === true,
    statuses: filters.statuses,
    olderThanDays: positiveInteger(body.olderThanDays, 3, 1, 3650),
    limit: filters.limit ?? 100,
    includeProtected: body.includeProtected === true,
    vacuumAfter: body.vacuumAfter === true,
    createBackup: body.createBackup === true
  };
}

function maintenanceCleanupApplyFromBody(body: Record<string, unknown>): StorageMaintenanceCleanupApplyInput | undefined {
  if (typeof body.previewId !== "string" || body.previewId.length === 0) return undefined;
  return {
    filters: maintenanceCleanupFiltersFromBody(body),
    previewId: body.previewId,
    ...(body.createBackup === true ? { createBackup: true } : {}),
    ...(body.vacuumAfter === true ? { vacuumAfter: true } : {})
  };
}

function maintenanceCleanupErrorPayload(error: unknown): { status: number; code: string; message: string } {
  const message = error instanceof Error ? error.message : "";
  if (message === "maintenance_preview_mismatch") {
    return { status: 409, code: "cleanup_preview_mismatch", message: "Die Vorschau ist nicht mehr aktuell. Bitte neu prüfen und danach löschen." };
  }
  if (message === "maintenance_no_matches") {
    return { status: 409, code: "cleanup_no_matches", message: "Keine Matches erfüllen die aktuellen Löschfilter." };
  }
  if (error instanceof StorageError) {
    return { status: 500, code: "cleanup_storage_error", message: "Cleanup wurde wegen eines Storage-Fehlers abgebrochen." };
  }
  return { status: 500, code: "cleanup_failed", message: "Cleanup konnte nicht abgeschlossen werden." };
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
  if (value === "human_vs_human" || value === "human_runner_vs_corp_ai" || value === "human_corp_vs_runner_ai") return value;
  return undefined;
}

function numberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positiveInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

export function isMaintenanceClientAddressAllowed(value: string | undefined): boolean {
  const address = normalizeClientAddress(value);
  if (!address) return false;
  if (address === "::1" || address === "localhost") return true;
  if (address.includes(":")) {
    const lower = address.toLowerCase();
    return lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
  }
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const a = parts[0]!;
  const b = parts[1]!;
  return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
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

function originOfHeader(value: string | string[] | undefined): string | undefined {
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

function isAiPacingMode(value: unknown): value is NonNullable<Parameters<MultiplayerService["createMatch"]>[0]["aiPacingMode"]> {
  return value === "fast" || value === "paced" || value === "manual";
}

function replayPerspectiveFromParam(value: string | null): ReplayPerspective | undefined {
  if (!value) return "runner";
  if (value === "runner" || value === "corp" || value === "local_analysis") return value;
  return undefined;
}

function deckSelectionFromBody(body: Record<string, unknown>): MatchDeckSelectionInput {
  const selection: MatchDeckSelectionInput = {};
  const aiDeckPolicy = aiDeckPolicyFromValue(body.aiDeckPolicy);
  if (aiDeckPolicy) selection.aiDeckPolicy = aiDeckPolicy;
  if (typeof body.runnerDeckSnapshotId === "string") selection.runnerDeckSnapshotId = body.runnerDeckSnapshotId;
  if (typeof body.corpDeckSnapshotId === "string") selection.corpDeckSnapshotId = body.corpDeckSnapshotId;
  if (body.runnerDeckSnapshot && typeof body.runnerDeckSnapshot === "object") selection.runnerDeckSnapshot = body.runnerDeckSnapshot as NonNullable<MatchDeckSelectionInput["runnerDeckSnapshot"]>;
  if (body.corpDeckSnapshot && typeof body.corpDeckSnapshot === "object") selection.corpDeckSnapshot = body.corpDeckSnapshot as NonNullable<MatchDeckSelectionInput["corpDeckSnapshot"]>;
  const participantADecks = deckPairFromBody(body.participantADecks);
  const participantBDecks = deckPairFromBody(body.participantBDecks);
  if (participantADecks) selection.participantADecks = participantADecks;
  if (participantBDecks) selection.participantBDecks = participantBDecks;
  return selection;
}

function deckPairFromBody(value: unknown): ParticipantDeckPairInput | undefined {
  if (!value || typeof value !== "object") return undefined;
  const body = value as Record<string, unknown>;
  const selection: ParticipantDeckPairInput = {};
  if (typeof body.runnerDeckSnapshotId === "string") selection.runnerDeckSnapshotId = body.runnerDeckSnapshotId;
  if (typeof body.corpDeckSnapshotId === "string") selection.corpDeckSnapshotId = body.corpDeckSnapshotId;
  if (body.runnerDeckSnapshot && typeof body.runnerDeckSnapshot === "object") selection.runnerDeckSnapshot = body.runnerDeckSnapshot as NonNullable<ParticipantDeckPairInput["runnerDeckSnapshot"]>;
  if (body.corpDeckSnapshot && typeof body.corpDeckSnapshot === "object") selection.corpDeckSnapshot = body.corpDeckSnapshot as NonNullable<ParticipantDeckPairInput["corpDeckSnapshot"]>;
  return Object.keys(selection).length > 0 ? selection : undefined;
}

function aiDeckPolicyFromValue(value: unknown): AiDeckPolicy | undefined {
  return value === "fixed" || value === "selected" || value === "seeded_random" ? value : undefined;
}

function deckErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : String(error);
  if (code === "deck_snapshot_wrong_side") return "Das gewählte Deck hat die falsche Seite.";
  if (code === "deck_snapshot_not_validated" || code === "deck_snapshot_invalid") return "Das gewählte Deck ist nicht matchstartfähig. Bitte prüfe die Validierungsfehler.";
  if (code === "ai_deck_snapshot_not_supported") return "Das gewählte KI-Deck ist nicht KI-freigegeben. Bitte nutze feste Standard-Decks, deterministisch zufällige KI-Decks oder ein KI-sicheres Snapshot-Deck.";
  if (code === "deck_snapshot_needs_revalidation") return "Das gewählte Deck muss nach der aktuellen Formatversion neu validiert werden.";
  if (code === "deck_snapshot_not_found") return "Das gewählte Deck wurde nicht gefunden.";
  return "Die gewählten Decks sind nicht matchstartfähig.";
}
