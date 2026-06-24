import { useEffect, useRef } from "react";

import type { ApiServerMessage } from "@netgrid/shared";

import type { SessionInfo } from "../../app/session-recovery";
import { normalizeWebSocketUrl } from "../../lib/client-api";
import type { ConnectionState } from "../app-shell/AppShell";

type MatchTransportOptions = {
  session: SessionInfo | null;
  onMessage(message: ApiServerMessage): void;
  setConnection(connection: ConnectionState): void;
  setNotice(notice: string): void;
};

export function useMatchTransport({
  session,
  onMessage,
  setConnection,
  setNotice,
}: MatchTransportOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

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
      setNotice("WebSocket-Verbindung konnte nicht gestartet werden.");
      return;
    }
    let socket: WebSocket;
    try {
      socket = new WebSocket(socketUrl);
    } catch {
      setConnection("offline");
      setNotice("WebSocket-Verbindung konnte nicht gestartet werden.");
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
    };
    socket.onclose = () => {
      if (socketRef.current === socket) setConnection("offline");
    };
    socket.onerror = () => {
      if (socketRef.current === socket) setConnection("offline");
    };
    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return;
      onMessageRef.current(JSON.parse(event.data as string) as ApiServerMessage);
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
    setConnection,
    setNotice,
  ]);

  const ensureSocketConnected = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return true;
    setNotice(
      "Serververbindung ist offline. Bitte prüfe, ob der lokale Multiplayer-Server läuft, und verbinde Dich erneut.",
    );
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

  return { closeSocket, ensureSocketConnected, sendSocketMessage };
}
