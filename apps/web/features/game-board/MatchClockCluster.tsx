"use client";

import type { ApiPlayerClockSnapshot } from "@netgrid/shared";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl/react";

import { formatMatchTimerDuration } from "../../app/match-timer-ui";
import { PlayerClockStrip, playerClockGraceDisplay } from "./PlayerClock";

export function MatchClockCluster({
  anchor,
  scopeLabel,
  snapshot,
}: {
  anchor: { matchStartedAtMs: number; decisionStartedAtMs: number } | null;
  scopeLabel: string;
  snapshot: ApiPlayerClockSnapshot | undefined;
}) {
  const t = useTranslations("Board.page");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setNowMs(Date.now());
    const handle = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(handle);
  }, [anchor, snapshot]);

  const graceLabel = playerClockGraceDisplay(snapshot, nowMs, {
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
            {formatMatchTimerDuration(nowMs - anchor.matchStartedAtMs)}
          </span>
          <span>
            <strong>{scopeLabel}</strong>{" "}
            {formatMatchTimerDuration(nowMs - anchor.decisionStartedAtMs)}
          </span>
          {graceLabel ? <small>{graceLabel}</small> : null}
        </div>
      ) : null}
      {snapshot ? <PlayerClockStrip snapshot={snapshot} nowMs={nowMs} /> : null}
    </div>
  );
}
