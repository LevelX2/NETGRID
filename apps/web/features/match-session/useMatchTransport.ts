import { useEffect, useRef, useState } from "react";

import {
  PLAYER_CLOCK_VISIBILITY_RENEW_MS,
  type ApiServerMessage,
} from "@netgrid/shared";

import type { SessionInfo } from "../../app/session-recovery";
import {
  openMatchConnection,
  type MatchTransportConnection,
  type MatchTransportNoticeKey,
} from "./match-transport-connection";
export type { MatchTransportNoticeKey } from "./match-transport-connection";
import type { ConnectionState } from "../app-shell/AppShell";
import { createPlayerClockUpdates } from "./player-clock-updates";

type MatchTransportOptions = {
  session: SessionInfo | null;
  connectionState: ConnectionState;
  playerClockPresenceEnabled: boolean;
  onMessage(message: ApiServerMessage): void;
  setConnection(connection: ConnectionState): void;
  setNotice(notice: string): void;
  translateNotice(key: MatchTransportNoticeKey): string;
};

export function useMatchTransport({
  session,
  connectionState,
  playerClockPresenceEnabled,
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
  const [playerClockUpdates] = useState(createPlayerClockUpdates);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    translateNoticeRef.current = translateNotice;
  }, [translateNotice]);

  useEffect(() => {
    playerClockUpdates.publish(null);
    if (!session) return;
    const connection = openMatchConnection({
      session,
      reconnecting: manualReconnectRef.current,
      onMessage: (message) => {
        if (message.type === "player_clock_update") {
          playerClockUpdates.publish(message.payload);
          return;
        }
        if (
          message.type === "state_update" &&
          message.payload.playerClock?.pausesWhenHidden
        ) {
          const { matchId, matchVersion, side, playerClock } = message.payload;
          playerClockUpdates.publish({
            matchId,
            matchVersion,
            side,
            clock: playerClock,
          });
        }
        onMessageRef.current(message);
      },
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
    playerClockUpdates,
  ]);

  useEffect(() => {
    if (!session || !playerClockPresenceEnabled) return;
    let renewal: number | undefined;
    let lastVisible: boolean | undefined;
    const isVisible = () => document.visibilityState === "visible";
    const report = (visible: boolean, returning = false) => {
      if (!returning && visible === lastVisible) return;
      lastVisible = visible;
      window.clearInterval(renewal);
      renewal = undefined;
      const transport = socketRef.current;
      if (!transport?.isJoined()) {
        if (returning && visible && connectionState === "offline")
          setReconnectGeneration((generation) => generation + 1);
        return;
      }
      transport.send("player_clock_presence", { visible });
      if (visible) {
        renewal = window.setInterval(() => {
          if (isVisible() && transport.isJoined())
            transport.send("player_clock_presence", { visible: true });
        }, PLAYER_CLOCK_VISIBILITY_RENEW_MS);
      }
    };
    const onVisibilityChange = () => report(isVisible(), isVisible());
    const onPageShow = () => report(isVisible(), true);
    const onPageHide = () => report(false);
    report(isVisible());
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onPageShow);
    return () => {
      window.clearInterval(renewal);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onPageShow);
    };
  }, [
    session?.matchId,
    session?.side,
    session?.sessionToken,
    playerClockPresenceEnabled,
    connectionState,
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
    playerClockUpdates,
  };
}
