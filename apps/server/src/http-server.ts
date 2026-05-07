import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import { simulateAiGame } from "@netrunner/ai";
import {
  JsonFileMatchStorage,
  InMemoryMatchStorage,
  MultiplayerService,
  type ActionReceipt,
  type AiTurnPresentationState,
  type GameResultSummary,
  type LifecycleActionResult,
  type LobbyPayload,
  type SafeErrorPayload,
  type ServicePayload,
  type SidePayload,
  type SubmitActionResult,
  type UndoResult
} from "./multiplayer";
import {
  DEFAULT_LEGACY_MATCH_STORAGE_PATH,
  DEFAULT_SQLITE_STORAGE_PATH,
  DEFAULT_STORAGE_BACKUP_DIR,
  SqliteMatchStorage,
  StorageError,
  type StorageKind
} from "./storage-sqlite";
import { resolveDeckSetup, type AiDeckPolicy, type MatchDeckSelectionInput, type ParticipantDeckPairInput } from "./deck-setup";
import {
  applyCors,
  clientIdentity,
  createRateLimiter,
  FixedWindowRateLimiter,
  hashClientKey,
  isOriginAllowed,
  loadDeploymentConfig,
  originDeniedPayload,
  rateLimitedPayload,
  redactedDiagnosticsUnavailable,
  redactedHealth,
  type DeploymentConfig,
  type RateLimitCategory
} from "./internet-hardening";
import type { Side } from "@netrunner/shared";
import type { AiDifficulty } from "@netrunner/shared";

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

export type ServerWsMessage =
  | { type: "state_update"; payload: { matchStatus: SidePayload["matchStatus"]; matchVersion: number; playerView: SidePayload["playerView"] } }
  | { type: "lobby_update"; payload: LobbyPayload }
  | { type: "legal_actions"; payload: { stateVersion: number; legalActions: SidePayload["legalActions"] } }
  | { type: "choice_request"; payload: { choice: SidePayload["pendingChoice"] | null } }
  | { type: "event_log_update"; payload: { events: SidePayload["eventTail"] } }
  | { type: "action_receipt"; payload: ActionReceipt }
  | { type: "opponent_status"; payload: SidePayload["opponentStatus"] }
  | { type: "undo_request"; payload: NonNullable<SidePayload["pendingUndo"]> }
  | { type: "ai_turn"; payload: AiTurnPresentationState | null }
  | { type: "match_finished"; payload: { matchStatus: SidePayload["matchStatus"]; winner: SidePayload["winner"]; finalStateHash: string; resultSummary?: GameResultSummary } }
  | { type: "error"; payload: SafeErrorPayload }
  | { type: "pong"; payload: { clientTime: number; serverTime: number } };

type WsContext = {
  matchId: string;
  side: Side;
  sessionToken: string;
};

type Connection = {
  socket: WebSocket;
  context: WsContext;
};

export type NetrunnerServerHandle = {
  server: Server;
  service: MultiplayerService;
  realtime: NetrunnerRealtimeServer;
  deploymentConfig: DeploymentConfig;
  close(): Promise<void>;
};

type NetrunnerServerOptions = {
  deploymentConfig?: DeploymentConfig;
  rateLimiter?: FixedWindowRateLimiter;
};

export class NetrunnerRealtimeServer {
  private readonly connections = new Map<string, Map<Side, Connection>>();
  private readonly countdownTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly socketClients = new WeakMap<WebSocket, { clientKey: string }>();
  private wss?: WebSocketServer;

  constructor(
    private readonly service: MultiplayerService,
    private readonly deploymentConfig: DeploymentConfig,
    private readonly rateLimiter: FixedWindowRateLimiter
  ) {}

  attach(server: Server): void {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      verifyClient: (info, done) => {
        if (!isOriginAllowed(info.origin || info.req.headers.origin, this.deploymentConfig)) {
          done(false, 403, "origin_not_allowed");
          return;
        }
        const clientKey = hashClientKey(clientIdentity(info.req, this.deploymentConfig));
        const limited = this.rateLimiter.check("ws_handshake", clientKey, "ws");
        if (!limited.allowed) {
          done(false, 429, "rate_limited");
          return;
        }
        done(true);
      }
    });
    this.wss.on("connection", (socket, request) => {
      this.socketClients.set(socket, { clientKey: hashClientKey(clientIdentity(request, this.deploymentConfig)) });
      socket.on("message", (raw) => void this.handleMessage(socket, raw.toString()));
      socket.on("close", () => void this.handleClose(socket));
      socket.on("error", () => undefined);
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      this.wss?.close(() => resolve());
      if (!this.wss) resolve();
    });
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
      send(socket, { type: "error", payload: { code: "rate_limited", message: "Zu viele WebSocket-Join-Versuche. Bitte kurz warten." } });
      return;
    }
    const connected = await this.service.setConnected(payload.matchId, payload.side, payload.sessionToken, true);
    if ("error" in connected) {
      send(socket, { type: "error", payload: connected.error });
      return;
    }

    const bySide = this.connections.get(payload.matchId) ?? new Map<Side, Connection>();
    const previous = bySide.get(payload.side);
    if (previous && previous.socket !== socket) {
      send(previous.socket, { type: "error", payload: { code: "reconnected_elsewhere", message: "Diese Seite wurde in einem anderen Fenster verbunden." } });
      previous.socket.close(4000, "reconnected");
    }
    bySide.set(payload.side, { socket, context: payload });
    this.connections.set(payload.matchId, bySide);
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

  private async handleClose(socket: WebSocket): Promise<void> {
    const context = this.findContext(socket);
    if (!context) return;
    const bySide = this.connections.get(context.matchId);
    if (bySide?.get(context.side)?.socket !== socket) return;
    bySide.delete(context.side);
    const disconnected = await this.service.setConnected(context.matchId, context.side, context.sessionToken, false);
    if ("error" in disconnected) return;
    if (isLobbyPayload(disconnected)) {
      await this.sendOpponentBootstrap(context.matchId, opposite(context.side), { side: context.side, connected: false });
      return;
    }
    this.sendOpponentStatus(context.matchId, opposite(context.side), { side: context.side, connected: false });
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

export function createNetrunnerHttpServer(service?: MultiplayerService, options: NetrunnerServerOptions = {}): NetrunnerServerHandle {
  const deploymentConfig = options.deploymentConfig ?? loadDeploymentConfig();
  const activeService = service ?? defaultService(deploymentConfig);
  const rateLimiter = options.rateLimiter ?? createRateLimiter(deploymentConfig.rateLimitProfile);
  const realtime = new NetrunnerRealtimeServer(activeService, deploymentConfig, rateLimiter);
  const server = createServer((request, response) => void routeHttp(activeService, realtime, deploymentConfig, rateLimiter, request, response));
  realtime.attach(server);
  return {
    server,
    service: activeService,
    realtime,
    deploymentConfig,
    close: () =>
      new Promise<void>((resolve, reject) => {
        realtime
          .close()
          .then(() =>
            server.close((error) => {
              activeService.closeStorage();
              return error ? reject(error) : resolve();
            })
          )
          .catch(reject);
      })
  };
}

export async function startNetrunnerServer(options: { port?: number; host?: string; service?: MultiplayerService } = {}): Promise<NetrunnerServerHandle & { url: string }> {
  const handle = createNetrunnerHttpServer(options.service);
  const port = options.port ?? Number(process.env.PORT ?? 8787);
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  await new Promise<void>((resolveListen) => handle.server.listen(port, host, resolveListen));
  return { ...handle, url: `http://${host}:${port}` };
}

async function routeHttp(
  service: MultiplayerService,
  realtime: NetrunnerRealtimeServer,
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

    if (request.method === "GET" && url.pathname === "/ops/diagnostics") {
      sendJson(response, 403, redactedDiagnosticsUnavailable());
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
      Object.assign(createInput, deckSelectionFromBody(body));
      if (typeof body.settings === "object" && body.settings) {
        const settings = body.settings as Record<string, unknown>;
        const nextSettings: Parameters<MultiplayerService["createMatch"]>[0]["settings"] = {};
        nextSettings.agendaPointsToWin = 7;
        if (settings.matchFormat === "rules_match" || settings.matchFormat === "two_game_side_swap") nextSettings.matchFormat = settings.matchFormat;
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
  const storageKind = storageKindFromEnv(process.env.NETRUNNER_STORAGE_KIND);
  if (storageKind === "memory") return new InMemoryMatchStorage();
  if (storageKind === "json") {
    const storagePath = process.env.NETRUNNER_MATCH_STORAGE_PATH ? resolve(process.env.NETRUNNER_MATCH_STORAGE_PATH) : resolve(root, DEFAULT_LEGACY_MATCH_STORAGE_PATH);
    return new JsonFileMatchStorage(storagePath);
  }
  const sqlitePath = process.env.NETRUNNER_SQLITE_STORAGE_PATH ? resolve(process.env.NETRUNNER_SQLITE_STORAGE_PATH) : resolve(root, DEFAULT_SQLITE_STORAGE_PATH);
  const legacyJsonPath = process.env.NETRUNNER_LEGACY_MATCH_STORAGE_PATH ? resolve(process.env.NETRUNNER_LEGACY_MATCH_STORAGE_PATH) : resolve(root, DEFAULT_LEGACY_MATCH_STORAGE_PATH);
  const backupDir = process.env.NETRUNNER_STORAGE_BACKUP_DIR ? resolve(process.env.NETRUNNER_STORAGE_BACKUP_DIR) : resolve(root, DEFAULT_STORAGE_BACKUP_DIR);
  try {
    return new SqliteMatchStorage({ dbPath: sqlitePath, legacyJsonPath, backupDir });
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError("storage_corrupt", "Storage konnte nicht geöffnet werden. Bitte aus einem lokalen Backup wiederherstellen.");
  }
}

function storageKindFromEnv(value: string | undefined): StorageKind {
  if (value === "json" || value === "memory" || value === "sqlite") return value;
  return "sqlite";
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
  send(socket, { type: "state_update", payload: { matchStatus: payload.matchStatus, matchVersion: payload.matchVersion, playerView: payload.playerView } });
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

function bearerToken(request: IncomingMessage): string | undefined {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

function opposite(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function isDifficulty(value: unknown): value is AiDifficulty {
  return value === "easy" || value === "normal" || value === "hard";
}

function isAiPacingMode(value: unknown): value is NonNullable<Parameters<MultiplayerService["createMatch"]>[0]["aiPacingMode"]> {
  return value === "fast" || value === "paced" || value === "manual";
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
  if (code === "deck_snapshot_not_found") return "Das gewählte Deck wurde nicht gefunden.";
  return "Die gewählten Decks sind nicht matchstartfähig.";
}
