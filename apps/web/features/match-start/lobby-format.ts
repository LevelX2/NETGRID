import type {
  ApiLobbyParticipantPayload,
  ApiLobbyPayload,
  ApiMatchStartLobbyPayload,
  ApiSeriesResultSummary,
  Side,
  Winner
} from "@netgrid/shared";

type MatchFormat = string;
type MatchStatus = string;
type LifecycleResultSummary = {
  reason?: string;
  winner?: Winner;
  runnerAgendaPoints?: number;
  corpAgendaPoints?: number;
};
type SeriesResultSummary = ApiSeriesResultSummary;
type MatchStartLobby = ApiMatchStartLobbyPayload;
type LobbyClientPayload = ApiLobbyPayload;
type LobbyParticipant = ApiLobbyParticipantPayload;

export function matchFormatLabel(format: MatchFormat): string {
  if (format === "single_game") return "Einzelspiel";
  if (format === "quick_match") return "Quick Match";
  return "Regelmatch";
}

export function resultReasonLabel(reason: string, winner?: Winner): string {
  switch (reason) {
    case "agenda_points":
      return winner === "runner" ? "Runner erreicht Agenda-Zielwert" : "Korp erreicht Agenda-Zielwert";
    case "flatline":
      return "Runner flatlined";
    case "corp_deck_empty":
      return "Korp kann nicht mehr ziehen";
    case "forfeit":
      return "Aufgabe";
    case "action_limit_reached":
      return "Aktionslimit erreicht";
    default:
      return reason;
  }
}

export function terminalLobbyTitle(status: MatchStatus, result?: LifecycleResultSummary): string {
  if (status === "cancelled") return "Match abgebrochen";
  if (status === "forfeited") return result?.winner ? `${result.winner === "runner" ? "Runner" : "Korp"} gewinnt durch Aufgabe` : "Match aufgegeben";
  if (status === "finished") return result?.winner ? `${result.winner === "runner" ? "Runner" : "Korp"} gewinnt` : "Match beendet";
  if (status === "expired") return "Match abgelaufen";
  if (status === "abandoned") return "Match verlassen";
  return "Match nicht mehr aktiv";
}

export function terminalLobbyMessage(status: MatchStatus, result?: LifecycleResultSummary): string {
  if (result?.reason) return `${resultReasonLabel(result.reason, result.winner)} · Endstand Runner ${result.runnerAgendaPoints ?? "-"} / Korp ${result.corpAgendaPoints ?? "-"}.`;
  if (status === "cancelled") return "Die Lobby wurde vor Spielstart beendet.";
  if (status === "expired") return "Die Lobby ist abgelaufen und kann nicht mehr betreten werden.";
  if (status === "abandoned") return "Die Gegenseite hat die Lobby verlassen.";
  return "Dieser Matchstand kann nicht fortgesetzt werden.";
}

export function isInvalidatingTerminalStatus(status: MatchStatus): boolean {
  return status === "cancelled" || status === "expired" || status === "abandoned";
}

export function shouldForgetRecoveryStatus(status: MatchStatus): boolean {
  return isInvalidatingTerminalStatus(status) || status === "finished" || status === "forfeited";
}

export function seriesStatusText(series: SeriesResultSummary, viewerLabel = "Du", opponentLabel = "Gegenseite"): string {
  const wins = `${viewerLabel}: ${series.viewerWins} · ${opponentLabel}: ${series.opponentWins}`;
  if (series.status === "finished") {
    if (series.viewerSeriesOutcome === "won") return `Serie gewonnen. ${wins}`;
    if (series.viewerSeriesOutcome === "lost") return `Serie verloren. ${wins}`;
    return `Serie unentschieden. ${wins}`;
  }
  return `Serie läuft. ${wins}`;
}

export function playerSlotForSide(lobby: MatchStartLobby, side: Side): "player_a" | "player_b" {
  return lobby.sideAssignment.runnerPlayer === "player_a" && side === "runner" ? "player_a" : lobby.sideAssignment.corpPlayer === "player_a" && side === "corp" ? "player_a" : "player_b";
}

export function startLobbySideHeadline(lobby: LobbyClientPayload): string {
  if (lobby.startLobby?.sideAssignmentMode === "random_pending") return "Seite wird beim Start ausgelost";
  return `Du startest als ${lobby.side === "runner" ? "Runner" : "Korp"}`;
}

export function connectionQualityLabel(quality: LobbyParticipant["connectionQuality"] | undefined): string {
  if (quality === "online") return "Teilnehmer verbunden";
  if (quality === "unstable") return "Verbindung instabil";
  return "Wartet auf Verbindung";
}

export function formatLobbyTime(value: string | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}

export function shortMatchId(matchId: string): string {
  const normalized = matchId.replace(/^match_/, "");
  return normalized.length > 10 ? normalized.slice(0, 10) : normalized;
}

export function openMatchAgeLabel(ageSeconds: number): string {
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) return "gerade erstellt";
  if (ageSeconds < 60) return `${ageSeconds}s`;
  const minutes = Math.floor(ageSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h`;
}
