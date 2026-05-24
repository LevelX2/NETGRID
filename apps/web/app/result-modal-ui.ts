import type { ApiGameResultSummary, ApiSeriesResultSummary, Side, Winner } from "@netgrid/shared";

export type ResultWinnerMotifKind = Side | "draw";
export type ResultWinnerMotifUi = {
  ariaLabel: string;
  caption: string;
  imageSrc?: string;
};
export type GameStanding = {
  summary: string;
  viewerMatchPoints: number;
  opponentMatchPoints: number;
  viewerAgendaPoints: number;
  opponentAgendaPoints: number;
};

const SERIES_WIN_MATCH_POINTS = 10;

export function resultWinnerMotifFor(winner: Winner): ResultWinnerMotifKind {
  return winner === "runner" || winner === "corp" ? winner : "draw";
}

export function resultWinnerMotifUi(motif: ResultWinnerMotifKind): ResultWinnerMotifUi {
  if (motif === "runner") {
    return {
      ariaLabel: "Runner-Sieg",
      caption: "Runner",
      imageSrc: "/result-motifs/result-runner-victory.png"
    };
  }
  if (motif === "corp") {
    return {
      ariaLabel: "Korp-Sieg",
      caption: "Korp",
      imageSrc: "/result-motifs/result-corp-victory.png"
    };
  }
  return {
    ariaLabel: "Unentschieden",
    caption: "Draw"
  };
}

export function resultFooterOutcomeLabel(winner: Winner, viewerSide: Side, opponentName?: string): string {
  if (winner === "draw") return "Draw";
  return winner === viewerSide ? "Deine Seite" : opponentName ?? "Gegenseite";
}

export function resultPlayerLabel(side: Side, viewerSide: Side, viewerName?: string, opponentName?: string): string {
  const name = side === viewerSide ? viewerName : opponentName;
  const fallback = side === viewerSide ? "Du" : "Gegenseite";
  return normalizePlayerName(name) ?? fallback;
}

export function resultPlayerRoleLabel(side: Side, viewerSide: Side, viewerName?: string, opponentName?: string): string {
  return `${resultPlayerLabel(side, viewerSide, viewerName, opponentName)} (${resultSideLabel(side)})`;
}

export function resultOutcomeHeadline(winner: Winner, viewerSide: Side, viewerName?: string, opponentName?: string): string {
  if (winner === "draw") return "Das Spiel endet unentschieden.";
  const winnerLabel = resultPlayerLabel(winner, viewerSide, viewerName, opponentName);
  const verb = winner === viewerSide && winnerLabel.trim().toLocaleLowerCase("de-DE") === "du" ? "gewinnst" : "gewinnt";
  return `${winnerLabel} ${verb} als ${resultSideLabel(winner)}.`;
}

export function resultOutcomeText(winner: Winner): string {
  if (winner === "runner") return "Runner gewinnt.";
  if (winner === "corp") return "Korp gewinnt.";
  return "Das Spiel endet unentschieden.";
}

export function seriesResultHeadline(series: ApiSeriesResultSummary, opponentName?: string, viewerName?: string): string | null {
  if (series.status !== "finished") return null;
  const viewerLabel = normalizePlayerName(viewerName);
  if (series.viewerSeriesOutcome === "won") return viewerLabel ? `${viewerLabel} hat die Match-Serie gewonnen.` : "Du hast die Match-Serie gewonnen.";
  if (series.viewerSeriesOutcome === "lost") return `${opponentName ?? "Gegenseite"} hat die Match-Serie gewonnen.`;
  return "Die Match-Serie endet unentschieden.";
}

export function retentionProtectionUi(retentionProtected: boolean): { label: string; title: string } {
  return retentionProtected
    ? {
        label: "Replay-Sicherung entfernen",
        title: "Entfernt den Schutz vor History- und Cleanup-Löschung. Das Spielergebnis bleibt unverändert."
      }
    : {
        label: "Spiel für Replay sichern",
        title: "Schützt dieses Spiel vor History- und Cleanup-Löschung, damit das Replay später verfügbar bleibt. Das Spielergebnis bleibt unverändert."
      };
}

export function resultExitButtonUi(hasNextSeriesGame: boolean): { label: string; title: string; needsConfirmation: boolean } {
  return hasNextSeriesGame
    ? {
        label: "Serie verlassen",
        title: "Verlässt die lokale Serie-Sitzung, ohne das nächste Serienspiel zu starten.",
        needsConfirmation: true
      }
    : {
        label: "Zurück zum Startbildschirm",
        title: "Zurück zum Startbildschirm",
        needsConfirmation: false
      };
}

export function gameStandingForResult(
  result: Pick<ApiGameResultSummary, "winner" | "runnerAgendaPoints" | "corpAgendaPoints">,
  viewerSide: Side,
  viewerName?: string,
  opponentName?: string
): GameStanding {
  const opponentSide = oppositeSide(viewerSide);
  const viewerAgendaPoints = agendaPointsForResultSide(result, viewerSide);
  const opponentAgendaPoints = agendaPointsForResultSide(result, opponentSide);
  if (result.winner === "draw") {
    return {
      summary: "Draw: beide Seiten erhalten ihre Agenda-Punkte.",
      viewerMatchPoints: viewerAgendaPoints,
      opponentMatchPoints: opponentAgendaPoints,
      viewerAgendaPoints,
      opponentAgendaPoints
    };
  }

  const winnerSide = result.winner;
  const loserSide = oppositeSide(winnerSide);
  const loserAgendaPoints = agendaPointsForResultSide(result, loserSide);
  const winnerLabel = resultPlayerRoleLabel(winnerSide, viewerSide, viewerName, opponentName);
  const loserLabel = resultPlayerRoleLabel(loserSide, viewerSide, viewerName, opponentName);
  const viewerMatchPoints = winnerSide === viewerSide ? SERIES_WIN_MATCH_POINTS : viewerAgendaPoints;
  const opponentMatchPoints = winnerSide === opponentSide ? SERIES_WIN_MATCH_POINTS : opponentAgendaPoints;

  return {
    summary: `${winnerLabel}: ${SERIES_WIN_MATCH_POINTS} Matchpunkte. ${loserLabel}: ${loserAgendaPoints} Agenda-Punkte aus ${agendaPointSourceLabel(loserSide)} Agendas.`,
    viewerMatchPoints,
    opponentMatchPoints,
    viewerAgendaPoints,
    opponentAgendaPoints
  };
}

function agendaPointsForResultSide(result: Pick<ApiGameResultSummary, "runnerAgendaPoints" | "corpAgendaPoints">, side: Side): number {
  return side === "runner" ? result.runnerAgendaPoints : result.corpAgendaPoints;
}

function agendaPointSourceLabel(side: Side): string {
  return side === "runner" ? "gestohlenen" : "gescorten";
}

function oppositeSide(side: Side): Side {
  return side === "runner" ? "corp" : "runner";
}

function resultSideLabel(side: Side): string {
  return side === "corp" ? "Korp" : "Runner";
}

function normalizePlayerName(name: string | undefined): string | null {
  const normalized = name?.trim();
  return normalized ? normalized : null;
}
