import type { ApiPlayerClockSnapshot, Side } from "@netgrid/shared";

export function PlayerClockStrip({ snapshot, nowMs }: { snapshot: ApiPlayerClockSnapshot; nowMs: number }) {
  const isNoLimit = snapshot.mode === "none";
  const runnerValueMs = isNoLimit ? playerClockLiveConsumed(snapshot, "runner", nowMs) : playerClockLiveRemaining(snapshot, "runner", nowMs);
  const corpValueMs = isNoLimit ? playerClockLiveConsumed(snapshot, "corp", nowMs) : playerClockLiveRemaining(snapshot, "corp", nowMs);
  const ownerLabel = snapshot.expiredSide
    ? `${sideLabel(snapshot.expiredSide)} abgelaufen`
    : snapshot.decisionOwnerSide
      ? `${sideLabel(snapshot.decisionOwnerSide)} entscheidet`
      : "Wartet";
  const valueLabel = isNoLimit ? "verbraucht" : "verbleibend";
  return (
    <div className={`playerClockStrip ${snapshot.warningLevel} ${isNoLimit ? "countUp" : "countDown"}`} aria-label={`Spielerzeit ${valueLabel}: ${ownerLabel}`} data-testid="player-clock">
      <span className={`playerClockSide runner ${snapshot.decisionOwnerSide === "runner" ? "active" : ""}`}>
        <strong>Runner</strong>
        <span className="playerClockValue">{formatPlayerClockDuration(runnerValueMs)}</span>
        {isNoLimit ? <small>verbraucht</small> : null}
      </span>
      <span className={`playerClockSide corp ${snapshot.decisionOwnerSide === "corp" ? "active" : ""}`}>
        <strong>Korp</strong>
        <span className="playerClockValue">{formatPlayerClockDuration(corpValueMs)}</span>
        {isNoLimit ? <small>verbraucht</small> : null}
      </span>
    </div>
  );
}

export function playerClockGraceDisplay(snapshot: ApiPlayerClockSnapshot | undefined, nowMs: number): string | null {
  if (!snapshot || snapshot.mode !== "player_clock" || snapshot.decisionOwnerSide === undefined || snapshot.expiredSide) return null;
  const remainingMs = playerClockLiveGraceRemaining(snapshot, nowMs);
  if (remainingMs === null) return null;
  return remainingMs > 0 ? `Kulanz ${formatPlayerClockDuration(remainingMs)}` : "Kulanz vorbei";
}

function playerClockLiveGraceRemaining(snapshot: ApiPlayerClockSnapshot, nowMs: number): number | null {
  if (snapshot.decisionOwnerSide === undefined) return null;
  if (snapshot.activityStartedAtMs !== undefined && snapshot.gracePeriodMs !== undefined) {
    const elapsedMs = Math.max(0, nowMs - snapshot.activityStartedAtMs);
    return Math.max(0, snapshot.gracePeriodMs - elapsedMs);
  }
  if (snapshot.graceRemainingMs !== undefined) return Math.max(0, snapshot.graceRemainingMs);
  return null;
}

function playerClockLiveConsumed(snapshot: ApiPlayerClockSnapshot, side: Side, nowMs: number): number {
  const consumedMs = snapshot.consumedMs?.[side] ?? 0;
  if (snapshot.mode !== "none" || snapshot.decisionOwnerSide !== side || snapshot.activityStartedAtMs === undefined) return consumedMs;
  const elapsedMs = Math.max(0, nowMs - snapshot.activityStartedAtMs);
  const serverElapsedMs = snapshot.elapsedActivityMs ?? 0;
  return Math.max(0, consumedMs + Math.max(0, elapsedMs - serverElapsedMs));
}

function playerClockLiveRemaining(snapshot: ApiPlayerClockSnapshot, side: Side, nowMs: number): number {
  let remainingMs = snapshot.remainingMs?.[side] ?? 0;
  if (snapshot.expiredSide === side) return 0;
  if (snapshot.decisionOwnerSide !== side || snapshot.activityStartedAtMs === undefined || snapshot.gracePeriodMs === undefined) return remainingMs;
  const elapsedMs = Math.max(0, nowMs - snapshot.activityStartedAtMs);
  const liveChargeableMs = Math.max(0, elapsedMs - snapshot.gracePeriodMs);
  const serverChargeableMs = snapshot.chargeableElapsedMs ?? 0;
  return Math.max(0, remainingMs - Math.max(0, liveChargeableMs - serverChargeableMs));
}

function formatPlayerClockDuration(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function sideLabel(side: Side): string {
  return side === "runner" ? "Runner" : "Korp";
}
