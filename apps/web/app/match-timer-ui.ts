import type { ApiPlayerClockSnapshot, LegalAction, PlayerView, Side, Winner } from "@netgrid/shared";

export type MatchTimerSnapshotInput = {
  matchId: string;
  playerView: PlayerView;
  legalActions: LegalAction[];
  winner?: Winner | undefined;
};

function sideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}

export function formatMatchTimerDuration(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function matchTimerDecisionKey(input: MatchTimerSnapshotInput): string {
  const choice = input.playerView.pendingChoice;
  const choiceKey = choice ? `${choice.choiceId}:${choice.side}:${choice.stateVersion}` : "none";
  const legalActionKey = input.legalActions.map((action) => action.actionId).join(",");
  return [
    input.matchId,
    input.playerView.stateVersion,
    input.playerView.activeSide,
    input.playerView.phase,
    choiceKey,
    legalActionKey,
    input.winner ?? input.playerView.winner ?? "open"
  ].join("|");
}

export function matchTimerScopeLabel(view: PlayerView, legalActions: LegalAction[]): string {
  if (view.winner) return "Spiel beendet";
  if (view.pendingChoice) return `${sideLabel(view.pendingChoice.side)} entscheidet`;
  if (legalActions.length > 0 && legalActions.every((action) => action.side === view.side)) return `${sideLabel(view.side)} entscheidet`;
  if (view.phase === "setup") return "Setup";
  if (view.phase === "run") return `${sideLabel(view.activeSide)} im Run`;
  return `${sideLabel(view.activeSide)} am Zug`;
}

export function playerClockLiveRemaining(snapshot: ApiPlayerClockSnapshot, side: Side, nowMs: number): number {
  let remainingMs = snapshot.remainingMs?.[side] ?? 0;
  if (snapshot.expiredSide === side) return 0;
  if (snapshot.decisionOwnerSide !== side || snapshot.activityStartedAtMs === undefined || snapshot.gracePeriodMs === undefined) return remainingMs;
  const elapsedMs = Math.max(0, nowMs - snapshot.activityStartedAtMs);
  const liveChargeableMs = Math.max(0, elapsedMs - snapshot.gracePeriodMs);
  const serverChargeableMs = snapshot.chargeableElapsedMs ?? 0;
  return Math.max(0, remainingMs - Math.max(0, liveChargeableMs - serverChargeableMs));
}

export function playerClockLiveConsumed(snapshot: ApiPlayerClockSnapshot, side: Side, nowMs: number): number {
  const consumedMs = snapshot.consumedMs?.[side] ?? 0;
  if (snapshot.mode !== "none" || snapshot.decisionOwnerSide !== side || snapshot.activityStartedAtMs === undefined) return consumedMs;
  const elapsedMs = Math.max(0, nowMs - snapshot.activityStartedAtMs);
  const serverElapsedMs = snapshot.elapsedActivityMs ?? 0;
  return Math.max(0, consumedMs + Math.max(0, elapsedMs - serverElapsedMs));
}

export function formatPlayerClockDuration(valueMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
