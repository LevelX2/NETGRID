import type { ApiServerMessage } from "@netgrid/shared";
import type { SessionInfo } from "../../app/session-recovery";
import { normalizeWebSocketUrl } from "../../lib/client-api";
import type { ConnectionState } from "../app-shell/AppShell";

export type MatchTransportNoticeKey =
  | "webSocketStartFailed"
  | "reconnectCompleted"
  | "reconnectServerFailed"
  | "reconnecting"
  | "serverOffline";

export type MatchTransportConnection = {
  isJoined(): boolean;
  send(type: string, payload: unknown): boolean;
  close(): void;
  dispose(): void;
};

export function openMatchConnection(
  options: {
    session: SessionInfo;
    reconnecting: boolean;
    onMessage(message: ApiServerMessage): void;
    setConnection(connection: ConnectionState): void;
    notice(key: MatchTransportNoticeKey): void;
    onAttemptSettled(): void;
  },
  createSocket: (url: string) => WebSocket = (url) => new WebSocket(url),
): MatchTransportConnection | undefined {
  const { session } = options;
  const url = normalizeWebSocketUrl(session.webSocketUrl);
  if (!session.sessionToken.trim() || !url) {
    options.setConnection("offline");
    options.notice("webSocketStartFailed");
    options.onAttemptSettled();
    return undefined;
  }
  options.setConnection("connecting");
  let socket: WebSocket;
  try {
    socket = createSocket(url);
  } catch {
    options.setConnection("offline");
    options.notice("webSocketStartFailed");
    options.onAttemptSettled();
    return undefined;
  }
  let disposed = false;
  let joined = false;
  let settled = false;
  let joinTimer: ReturnType<typeof setTimeout> | undefined;
  const settle = () => {
    if (settled) return;
    settled = true;
    clearTimeout(joinTimer);
    options.onAttemptSettled();
  };
  const fail = () => {
    joined = false;
    options.setConnection("offline");
    if (!settled && options.reconnecting)
      options.notice("reconnectServerFailed");
    settle();
  };
  const rejectJoin = (message: ApiServerMessage) => {
    fail();
    options.onMessage(message);
    disposed = true;
    socket.close();
  };
  joinTimer = setTimeout(() => {
    if (!disposed && !joined)
      rejectJoin({ type: "error", payload: { code: "not_joined" } });
  }, 10_000);
  socket.onopen = () => {
    if (disposed) return;
    socket.send(
      JSON.stringify({
        type: "join_match",
        payload: {
          matchId: session.matchId,
          side: session.side,
          sessionToken: session.sessionToken,
        },
      }),
    );
  };
  socket.onclose = () => {
    if (disposed) return;
    fail();
    disposed = true;
  };
  socket.onerror = () => {
    if (disposed) return;
    fail();
    disposed = true;
    socket.close();
  };
  socket.onmessage = (event) => {
    if (disposed) return;
    const message = JSON.parse(event.data as string) as ApiServerMessage;
    if (message.type === "match_joined") {
      if (
        message.payload?.matchId !== session.matchId ||
        message.payload?.side !== session.side
      ) {
        rejectJoin({ type: "error", payload: { code: "wrong_session" } });
        return;
      }
      if (!joined) {
        joined = true;
        options.setConnection("online");
        if (!settled && options.reconnecting)
          options.notice("reconnectCompleted");
        settle();
      }
      return;
    }
    if (message.type === "error" && !joined) {
      rejectJoin(message);
      return;
    }
    options.onMessage(message);
  };
  const isJoined = () =>
    !disposed && joined && socket.readyState === socket.OPEN;
  return {
    isJoined,
    send(type, payload) {
      if (!isJoined()) {
        options.notice("serverOffline");
        return false;
      }
      socket.send(JSON.stringify({ type, payload }));
      return true;
    },
    close() {
      if (disposed) return;
      disposed = true;
      joined = false;
      options.setConnection("offline");
      settle();
      socket.close();
    },
    dispose() {
      disposed = true;
      joined = false;
      clearTimeout(joinTimer);
      socket.close();
    },
  };
}
