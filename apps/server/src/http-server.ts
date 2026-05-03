import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import {
  JsonFileMatchStorage,
  MultiplayerService,
  type ActionReceipt,
  type SafeErrorPayload,
  type SidePayload,
  type SubmitActionResult,
  type UndoResult
} from "./multiplayer";
import type { Side } from "@netrunner/shared";

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
  | { type: "ping"; payload: { clientTime: number } };

export type ServerWsMessage =
  | { type: "state_update"; payload: { matchStatus: SidePayload["matchStatus"]; matchVersion: number; playerView: SidePayload["playerView"] } }
  | { type: "legal_actions"; payload: { stateVersion: number; legalActions: SidePayload["legalActions"] } }
  | { type: "choice_request"; payload: { choice: null } }
  | { type: "event_log_update"; payload: { events: SidePayload["eventTail"] } }
  | { type: "action_receipt"; payload: ActionReceipt }
  | { type: "opponent_status"; payload: SidePayload["opponentStatus"] }
  | { type: "undo_request"; payload: NonNullable<SidePayload["pendingUndo"]> }
  | { type: "match_finished"; payload: { winner: SidePayload["winner"]; finalStateHash: string } }
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
  close(): Promise<void>;
};

export class NetrunnerRealtimeServer {
  private readonly connections = new Map<string, Map<Side, Connection>>();
  private wss?: WebSocketServer;

  constructor(private readonly service: MultiplayerService) {}

  attach(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket) => {
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

  private async handleClose(socket: WebSocket): Promise<void> {
    const context = this.findContext(socket);
    if (!context) return;
    const bySide = this.connections.get(context.matchId);
    if (bySide?.get(context.side)?.socket !== socket) return;
    bySide.delete(context.side);
    const disconnected = await this.service.setConnected(context.matchId, context.side, context.sessionToken, false);
    if (!("error" in disconnected)) this.sendOpponentStatus(context.matchId, opposite(context.side), { side: context.side, connected: false });
  }

  private broadcastPayload(payload: SidePayload): void {
    const connection = this.connection(payload.matchId, payload.side);
    sendBootstrap(connection?.socket, payload);
  }

  private sendOpponentStatus(matchId: string, side: Side, status: SidePayload["opponentStatus"]): void {
    send(this.connection(matchId, side)?.socket, { type: "opponent_status", payload: status });
  }

  private async sendOpponentBootstrap(matchId: string, side: Side, fallbackStatus: SidePayload["opponentStatus"]): Promise<void> {
    const opponent = this.connection(matchId, side);
    if (!opponent) return;
    const payload = await this.service.bootstrap(matchId, side, opponent.context.sessionToken);
    if ("error" in payload) {
      send(opponent.socket, { type: "opponent_status", payload: fallbackStatus });
      return;
    }
    sendBootstrap(opponent.socket, payload);
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

export function createNetrunnerHttpServer(service = defaultService()): NetrunnerServerHandle {
  const realtime = new NetrunnerRealtimeServer(service);
  const server = createServer((request, response) => void routeHttp(service, request, response));
  realtime.attach(server);
  return {
    server,
    service,
    realtime,
    close: () =>
      new Promise<void>((resolve, reject) => {
        realtime
          .close()
          .then(() => server.close((error) => (error ? reject(error) : resolve())))
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

async function routeHttp(service: MultiplayerService, request: IncomingMessage, response: ServerResponse): Promise<void> {
  setCors(response);
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url ?? "/", "http://localhost");
  try {
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "netrunner-multiplayer" });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/matches") {
      const body = await readJson(request);
      const createInput: Parameters<MultiplayerService["createMatch"]>[0] = {
        hostSide: body.hostSide === "runner" || body.hostSide === "corp" || body.hostSide === "random" ? body.hostSide : "runner"
      };
      if (typeof body.displayName === "string") createInput.displayName = body.displayName;
      if (typeof body.seed === "string") createInput.seed = body.seed;
      if (typeof body.settings === "object" && body.settings) {
        const settings = body.settings as Record<string, unknown>;
        if (typeof settings.agendaPointsToWin === "number") createInput.settings = { agendaPointsToWin: settings.agendaPointsToWin };
      }
      const created = await service.createMatch(createInput);
      sendJson(response, 201, created);
      return;
    }

    const matchRoute = /^\/api\/matches\/([^/]+)\/([^/]+)$/.exec(url.pathname);
    if (matchRoute) {
      const matchId = decodeURIComponent(matchRoute[1] ?? "");
      const action = matchRoute[2];
      if (request.method === "GET" && action === "join-info") {
        sendJson(response, 200, await service.getJoinInfo(matchId, url.searchParams.get("token") ?? undefined));
        return;
      }
      if (request.method === "POST" && action === "join") {
        const body = await readJson(request);
        const joinInput: Parameters<MultiplayerService["joinMatch"]>[1] = { token: typeof body.token === "string" ? body.token : "" };
        if (typeof body.displayName === "string") joinInput.displayName = body.displayName;
        const joined = await service.joinMatch(matchId, joinInput);
        sendJson(response, "error" in joined ? 403 : 200, joined);
        return;
      }
      if (request.method === "POST" && action === "reconnect") {
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
      if (request.method === "GET" && action === "bootstrap") {
        const side = url.searchParams.get("side") === "corp" ? "corp" : "runner";
        const sessionToken = bearerToken(request) ?? url.searchParams.get("sessionToken") ?? "";
        const bootstrapped = await service.bootstrap(matchId, side, sessionToken);
        sendJson(response, "error" in bootstrapped ? 403 : 200, bootstrapped);
        return;
      }
    }

    sendJson(response, 404, { error: { code: "not_found", message: "Route nicht gefunden." } });
  } catch {
    sendJson(response, 500, { error: { code: "server_error", message: "Serverfehler." } });
  }
}

function defaultService(): MultiplayerService {
  const storagePath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../data/runtime/multiplayer/matches.json");
  return new MultiplayerService(new JsonFileMatchStorage(storagePath));
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

function sendBootstrap(socket: WebSocket | undefined, payload: SidePayload): void {
  send(socket, { type: "state_update", payload: { matchStatus: payload.matchStatus, matchVersion: payload.matchVersion, playerView: payload.playerView } });
  send(socket, { type: "legal_actions", payload: { stateVersion: payload.playerView.stateVersion, legalActions: payload.legalActions } });
  send(socket, { type: "choice_request", payload: { choice: null } });
  send(socket, { type: "event_log_update", payload: { events: payload.eventTail } });
  send(socket, { type: "opponent_status", payload: payload.opponentStatus });
  if (payload.pendingUndo) send(socket, { type: "undo_request", payload: payload.pendingUndo });
  if (payload.winner && payload.finalStateHash) send(socket, { type: "match_finished", payload: { winner: payload.winner, finalStateHash: payload.finalStateHash } });
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

function setCors(response: ServerResponse): void {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization");
}

function bearerToken(request: IncomingMessage): string | undefined {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

function opposite(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}
