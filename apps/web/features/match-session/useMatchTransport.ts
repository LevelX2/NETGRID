import { useEffect, useRef, useState } from "react";

import type { ApiServerMessage } from "@netgrid/shared";

import type { SessionInfo } from "../../app/session-recovery";
import {
  openMatchConnection,
  type MatchTransportConnection,
  type MatchTransportNoticeKey,
} from "./match-transport-connection";
export type { MatchTransportNoticeKey } from "./match-transport-connection";
import type { ConnectionState } from "../app-shell/AppShell";

type MatchTransportOptions = {
  session: SessionInfo | null;
  onMessage(message: ApiServerMessage): void;
  setConnection(connection: ConnectionState): void;
  setNotice(notice: string): void;
  translateNotice(key: MatchTransportNoticeKey): string;
};

export function useMatchTransport({
  session,
  onMessage,
  setConnection,
  setNotice,
  translateNotice,
}: MatchTransportOptions) {
  const socketRef = useRef<MatchTransportConnection | null>(null);
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
    const connection = openMatchConnection({
      session,
      reconnecting: manualReconnectRef.current,
      onMessage: (message) => onMessageRef.current(message),
      setConnection,
      notice: (key) => setNotice(translateNoticeRef.current(key)),
      onAttemptSettled: () => {
        manualReconnectRef.current = false;
      },
    });
    socketRef.current = connection ?? null;
    return () => {
      if (socketRef.current === connection) socketRef.current = null;
      connection?.dispose();
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
    if (socketRef.current?.isJoined()) return true;
    setNotice(translateNoticeRef.current("serverOffline"));
    return false;
  };

  const sendSocketMessage = (type: string, payload: unknown): boolean => {
    if (!ensureSocketConnected()) return false;
    return socketRef.current?.send(type, payload) ?? false;
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
