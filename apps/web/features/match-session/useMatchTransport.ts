import { useEffect, useRef, useState } from "react";

import type { ApiServerMessage } from "@netgrid/shared";

import type { SessionInfo } from "../../app/session-recovery";
import { normalizeWebSocketUrl } from "../../lib/client-api";
import type { ConnectionState } from "../app-shell/AppShell";

type MatchTransportOptions = {
  session: SessionInfo | null;
  onMessage(message: ApiServerMessage): void;
  setConnection(connection: ConnectionState): void;
  setNotice(notice: string): void;
  translateNotice(key: MatchTransportNoticeKey): string;
};

export type MatchTransportNoticeKey =
  | "webSocketStartFailed"
  | "reconnectCompleted"
  | "reconnectServerFailed"
  | "reconnecting"
  | "serverOffline";

export function useMatchTransport({
  session,
  onMessage,
  setConnection,
  setNotice,
  translateNotice,
}: MatchTransportOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const translateNoticeRef = useRef(translateNotice);
  const manualReconnectRef = useRef(false);
  const [reconnectGeneration, setReconnectGeneration] = useState(0);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    translateNoticeRef.current = translateNotice;
  }, [translateNotice]);

  useEffect(() => {
    if (!session) return;
    if (!session.sessionToken.trim() || !session.webSocketUrl.trim()) {
      setConnection("offline");
      return;
    }
    setConnection("connecting");
    socketRef.current?.close();
    const socketUrl = normalizeWebSocketUrl(session.webSocketUrl);
    if (!socketUrl) {
      setConnection("offline");
      setNotice(translateNoticeRef.current("webSocketStartFailed"));
      return;
    }
    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl);
    } catch {
      setConnection("offline");
      setNotice(translateNoticeRef.current("webSocketStartFailed"));
      return;
    }
    socketRef.current = socket;
    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      setConnection("online");
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
      if (manualReconnectRef.current) {
        manualReconnectRef.current = false;
        setNotice(translateNoticeRef.current("reconnectCompleted"));
      }
    };
    socket.onclose = () => {
      if (socketRef.current !== socket) return;
      setConnection("offline");
      if (manualReconnectRef.current) {
        manualReconnectRef.current = false;
        setNotice(translateNoticeRef.current("reconnectServerFailed"));
      }
    };
    socket.onerror = () => {
      if (socketRef.current !== socket) return;
      setConnection("offline");
      if (manualReconnectRef.current) {
        manualReconnectRef.current = false;
        setNotice(translateNoticeRef.current("reconnectServerFailed"));
      }
    };
    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return;
      onMessageRef.current(
        JSON.parse(event.data as string) as ApiServerMessage,
      );
    };
    return () => {
      if (socketRef.current === socket) socketRef.current = null;
      socket.close();
    };
  }, [
    session?.matchId,
    session?.sessionToken,
    session?.side,
    session?.webSocketUrl,
    reconnectGeneration,
    setConnection,
    setNotice,
  ]);

  const reconnectSocket = () => {
    manualReconnectRef.current = true;
    setNotice(translateNoticeRef.current("reconnecting"));
    setReconnectGeneration((generation) => generation + 1);
  };

  const ensureSocketConnected = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return true;
    setNotice(translateNoticeRef.current("serverOffline"));
    return false;
  };

  const sendSocketMessage = (type: string, payload: unknown): boolean => {
    if (!ensureSocketConnected()) return false;
    socketRef.current?.send(JSON.stringify({ type, payload }));
    return true;
  };

  const closeSocket = () => {
    socketRef.current?.close();
  };

  return {
    closeSocket,
    ensureSocketConnected,
    reconnectSocket,
    sendSocketMessage,
  };
}
