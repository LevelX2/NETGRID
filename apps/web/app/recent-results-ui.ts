import type { ApiRecentGameResult, ApiRecentSeriesResult, Side } from "@netgrid/shared";

export function singleRecentMatchPoints(winner: ApiRecentGameResult["winner"], side: Side, agendaPoints: number): number {
  if (winner === "draw") return agendaPoints;
  return winner === side ? 10 : agendaPoints;
}

export function seriesStatusLabel(status: ApiRecentSeriesResult["status"]): string {
  if (status === "finished") return "abgeschlossen";
  if (status === "between_games") return "zwischen Spielen";
  return "aktiv";
}

export function recentResultsEmptyText(loading: boolean): string {
  return loading ? "Lade letzte Spiele ..." : "Noch keine vollständig beendeten Spiele gefunden.";
}

export function recentSeriesWinnerLabel(result: Pick<ApiRecentSeriesResult, "outcome" | "players">): string {
  if (result.outcome === "draw") return "Serie unentschieden";
  return `${result.players[result.outcome].displayName} gewinnt die Serie`;
}
