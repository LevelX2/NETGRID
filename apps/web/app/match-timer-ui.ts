import type { LegalAction, PlayerView, Side, Winner } from "@netgrid/shared";

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
