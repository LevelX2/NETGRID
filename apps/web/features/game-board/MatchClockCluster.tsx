"use client";

import type { ApiPlayerClockSnapshot, Side } from "@netgrid/shared";
import { Clock } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "use-intl/react";

import {
  formatMatchTimerDuration,
  playerClockIsPaused,
  playerClockLiveElapsed,
} from "../../app/match-timer-ui";
import type { PlayerClockUpdates } from "../match-session/player-clock-updates";
import { PlayerClockStrip, playerClockGraceDisplay } from "./PlayerClock";

export function MatchClockCluster({
  anchor,
  scopeLabel,
  snapshot: matchSnapshot,
  matchId,
  matchVersion,
  side,
  updates,
}: {
  anchor: { matchStartedAtMs: number; decisionStartedAtMs: number } | null;
  scopeLabel: string;
  snapshot: ApiPlayerClockSnapshot | undefined;
  matchId: string;
  matchVersion: number;
  side: Side;
  updates: PlayerClockUpdates;
}) {
  const t = useTranslations("Board.page");
  const clockT = useTranslations("Board.clock");
  const update = useSyncExternalStore(
    updates.subscribe,
    updates.getSnapshot,
    () => null,
  );
  const observation =
    update?.matchId === matchId &&
    update.side === side &&
    update.matchVersion === matchVersion
      ? update
      : null;
  const snapshot = observation?.clock ?? matchSnapshot;
  const [time, setTime] = useState(readClock);

  useEffect(() => {
    const tick = () => setTime(readClock());
    tick();
    const handle = window.setInterval(tick, 1000);
    return () => window.clearInterval(handle);
  }, [anchor, snapshot]);

  const clockNowMs =
    observation && snapshot?.serverNowMs !== undefined
      ? snapshot.serverNowMs +
        Math.max(0, time.monotonicMs - observation.receivedAtMs)
      : time.wallMs;
  const paused = playerClockIsPaused(snapshot, clockNowMs);
  const playerDecisionMs =
    snapshot &&
    (snapshot.paused || snapshot.visibilityExpiresAtMs !== undefined)
      ? playerClockLiveElapsed(snapshot, clockNowMs)
      : undefined;
  const clockLabel = paused
    ? clockT("paused")
    : playerClockGraceDisplay(snapshot, clockNowMs, {
        grace: (duration) => t("grace", { duration }),
        over: t("graceOver"),
      });

  return (
    <div className="clockCluster" aria-label={t("clockArea")}>
      {anchor ? (
        <div
          className="matchClockStrip"
          aria-label={t("matchClock")}
          data-testid="match-clock"
        >
          <span className="matchClockIcon" aria-hidden="true">
            <Clock size={15} />
          </span>
          <span>
            <strong>{t("match")}</strong>{" "}
            {formatMatchTimerDuration(time.wallMs - anchor.matchStartedAtMs)}
          </span>
          <span>
            <strong>{scopeLabel}</strong>{" "}
            {formatMatchTimerDuration(
              playerDecisionMs ?? time.wallMs - anchor.decisionStartedAtMs,
            )}
          </span>
          {clockLabel ? <small>{clockLabel}</small> : null}
        </div>
      ) : null}
      {snapshot ? (
        <PlayerClockStrip snapshot={snapshot} nowMs={clockNowMs} />
      ) : null}
    </div>
  );
}

function readClock() {
  return { wallMs: Date.now(), monotonicMs: performance.now() };
}
