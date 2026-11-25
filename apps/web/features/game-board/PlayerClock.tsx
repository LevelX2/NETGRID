import type { ApiPlayerClockSnapshot } from "@netgrid/shared";
import { useTranslations } from "use-intl/react";
import {
  formatPlayerClockDuration,
  playerClockIsPaused,
  playerClockLiveConsumed,
  playerClockLiveElapsed,
  playerClockLiveRemaining,
} from "../../app/match-timer-ui";

export function PlayerClockStrip({
  snapshot,
  nowMs,
}: {
  snapshot: ApiPlayerClockSnapshot;
  nowMs: number;
}) {
  const t = useTranslations("Board.clock");
  const isNoLimit = snapshot.mode === "none";
  const runnerValueMs = isNoLimit
    ? playerClockLiveConsumed(snapshot, "runner", nowMs)
    : playerClockLiveRemaining(snapshot, "runner", nowMs);
  const corpValueMs = isNoLimit
    ? playerClockLiveConsumed(snapshot, "corp", nowMs)
    : playerClockLiveRemaining(snapshot, "corp", nowMs);
  const ownerLabel = snapshot.expiredSide
    ? t("expired", { side: t(`side.${snapshot.expiredSide}`) })
    : playerClockIsPaused(snapshot, nowMs)
      ? t("paused")
      : snapshot.decisionOwnerSide
        ? t("deciding", { side: t(`side.${snapshot.decisionOwnerSide}`) })
        : t("waiting");
  const valueLabel = isNoLimit ? t("consumed") : t("remaining");
  return (
    <div
      className={`playerClockStrip ${snapshot.warningLevel} ${isNoLimit ? "countUp" : "countDown"}`}
      aria-label={t("ariaLabel", { value: valueLabel, owner: ownerLabel })}
      data-testid="player-clock"
    >
      <span
        className={`playerClockSide runner ${snapshot.decisionOwnerSide === "runner" ? "active" : ""}`}
      >
        <strong>{t("side.runner")}</strong>
        <span className="playerClockValue">
          {formatPlayerClockDuration(runnerValueMs)}
        </span>
        {isNoLimit ? <small>{t("consumed")}</small> : null}
      </span>
      <span
        className={`playerClockSide corp ${snapshot.decisionOwnerSide === "corp" ? "active" : ""}`}
      >
        <strong>{t("side.corp")}</strong>
        <span className="playerClockValue">
          {formatPlayerClockDuration(corpValueMs)}
        </span>
        {isNoLimit ? <small>{t("consumed")}</small> : null}
      </span>
    </div>
  );
}

export function playerClockGraceDisplay(
  snapshot: ApiPlayerClockSnapshot | undefined,
  nowMs: number,
  labels: { grace(duration: string): string; over: string },
): string | null {
  if (
    !snapshot ||
    snapshot.mode !== "player_clock" ||
    snapshot.decisionOwnerSide === undefined ||
    snapshot.expiredSide
  )
    return null;
  const remainingMs = playerClockLiveGraceRemaining(snapshot, nowMs);
  if (remainingMs === null) return null;
  return remainingMs > 0
    ? labels.grace(formatPlayerClockDuration(remainingMs))
    : labels.over;
}

function playerClockLiveGraceRemaining(
  snapshot: ApiPlayerClockSnapshot,
  nowMs: number,
): number | null {
  if (snapshot.decisionOwnerSide === undefined) return null;
  if (
    snapshot.activityStartedAtMs !== undefined &&
    snapshot.gracePeriodMs !== undefined
  ) {
    const elapsedMs = playerClockLiveElapsed(snapshot, nowMs) ?? 0;
    return Math.max(0, snapshot.gracePeriodMs - elapsedMs);
  }
  if (snapshot.graceRemainingMs !== undefined)
    return Math.max(0, snapshot.graceRemainingMs);
  return null;
}
