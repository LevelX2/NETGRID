import type {
  ApiGameResultReason,
  ApiPublicMatchListEntry,
  Side,
} from "@netgrid/shared";

export type PublicGamesFilter = "all" | "open" | "active" | "finished";
export type PublicGamesViewMode = "detailed" | "compact";

export type PublicMatchResultScore = {
  agendaPoints: string;
  matchPoints?: string;
};

export type PublicMatchConclusion = {
  kind: ApiGameResultReason;
  label: string;
  compactLabel: string;
};

export type PublicMatchParticipant = {
  side: Side;
  displayName: string;
  isWinner: boolean;
};

const STATUS_PRIORITY: Record<ApiPublicMatchListEntry["status"], number> = {
  open: 0,
  active: 1,
  finished: 2,
};

export function filterAndSortPublicMatches(
  entries: readonly ApiPublicMatchListEntry[],
  filter: PublicGamesFilter,
): ApiPublicMatchListEntry[] {
  return entries
    .filter((entry) => filter === "all" || entry.status === filter)
    .slice()
    .sort(
      (left, right) =>
        STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status] ||
        right.updatedAt.localeCompare(left.updatedAt) ||
        left.matchId.localeCompare(right.matchId),
    );
}

export function publicGamesFilterLabel(filter: PublicGamesFilter): string {
  if (filter === "open") return "Offen";
  if (filter === "active") return "Laufend";
  if (filter === "finished") return "Abgeschlossen";
  return "Alle";
}

export function publicGamesViewModeLabel(mode: PublicGamesViewMode): string {
  return mode === "compact" ? "Kompakt" : "Ausführlich";
}

export function publicMatchResultScore(
  entry: ApiPublicMatchListEntry,
): PublicMatchResultScore | null {
  if (!entry.result) return null;

  const runnerMatchPoints = entry.result.runner.matchPoints;
  const corpMatchPoints = entry.result.corp.matchPoints;
  const score: PublicMatchResultScore = {
    agendaPoints: `${entry.result.runner.agendaPoints} : ${entry.result.corp.agendaPoints}`,
  };
  return runnerMatchPoints !== undefined && corpMatchPoints !== undefined
    ? {
        ...score,
        matchPoints: `${runnerMatchPoints} : ${corpMatchPoints}`,
      }
    : score;
}

export function publicMatchConclusion(
  entry: ApiPublicMatchListEntry,
): PublicMatchConclusion | null {
  const result = entry.result;
  if (!result) return null;

  if (result.reason === "forfeit" || result.reason === "time_expired") {
    const loserSide =
      result.loserSide ??
      (result.winnerSide === "runner"
        ? "corp"
        : result.winnerSide === "corp"
          ? "runner"
          : undefined);
    const participant = loserSide ? result[loserSide] : undefined;
    const participantName = participant?.displayName.trim();
    const participantLabel = loserSide
      ? `${participantName || sideLabel(loserSide)} (${sideLabel(loserSide)})`
      : undefined;
    const compactParticipantLabel =
      participantName || (loserSide ? sideLabel(loserSide) : undefined);

    if (result.reason === "forfeit") {
      return {
        kind: "forfeit",
        label: participantLabel
          ? `Aufgegeben von ${participantLabel}`
          : "Durch Aufgabe beendet",
        compactLabel: compactParticipantLabel
          ? `Aufgabe: ${compactParticipantLabel}`
          : "Aufgabe",
      };
    }
    return {
      kind: "time_expired",
      label: participantLabel
        ? `Zeit abgelaufen bei ${participantLabel}`
        : "Durch Zeitablauf beendet",
      compactLabel: compactParticipantLabel
        ? `Zeit: ${compactParticipantLabel}`
        : "Zeitablauf",
    };
  }

  const conclusions: Record<
    Exclude<ApiGameResultReason, "forfeit" | "time_expired">,
    PublicMatchConclusion
  > = {
    agenda_points: {
      kind: "agenda_points",
      label: "Sieg durch Agenda-Punkte",
      compactLabel: "Agenda-Sieg",
    },
    flatline: {
      kind: "flatline",
      label: "Sieg durch Flatline des Runners",
      compactLabel: "Flatline",
    },
    corp_deck_empty: {
      kind: "corp_deck_empty",
      label: "Sieg, weil die Korp nicht mehr aus R&D ziehen konnte",
      compactLabel: "R&D leer",
    },
    bad_publicity_7: {
      kind: "bad_publicity_7",
      label: "Sieg durch 7 Bad Publicity der Korp",
      compactLabel: "Bad Publicity",
    },
    draw: {
      kind: "draw",
      label: "Unentschieden",
      compactLabel: "Unentschieden",
    },
    unknown: {
      kind: "unknown",
      label: "Abschlussart unbekannt",
      compactLabel: "Unbekannter Abschluss",
    },
  };
  return conclusions[result.reason];
}

export function publicMatchParticipants(
  entry: ApiPublicMatchListEntry,
): PublicMatchParticipant[] {
  const authoritativeWinnerSide = publicMatchWinnerSide(entry);
  return (["runner", "corp"] as const).map((side) => ({
    side,
    displayName:
      entry.result?.[side].displayName.trim() ||
      entry.participantNames[side]?.trim() ||
      sideLabel(side),
    isWinner: entry.status === "finished" && authoritativeWinnerSide === side,
  }));
}

export function shouldRefreshPublicGames({
  hasActivePlayerView,
  entryTab,
  activeMatchWorkspace,
}: {
  hasActivePlayerView: boolean;
  entryTab: string;
  activeMatchWorkspace: string;
}): boolean {
  return hasActivePlayerView
    ? activeMatchWorkspace === "games"
    : entryTab === "games";
}

export function canRejoinPublicMatch(
  entry: ApiPublicMatchListEntry,
  rejoinableMatchIds: ReadonlySet<string>,
): boolean {
  return entry.status === "active" && rejoinableMatchIds.has(entry.matchId);
}

function sideLabel(side: "runner" | "corp"): string {
  return side === "runner" ? "Runner" : "Korp";
}

function publicMatchWinnerSide(
  entry: ApiPublicMatchListEntry,
): Side | undefined {
  const result = entry.result;
  if (result) {
    if (result.winner === "draw" || result.reason === "draw") return undefined;
    return result.winnerSide ?? result.winner;
  }
  return entry.winner === "runner" || entry.winner === "corp"
    ? entry.winner
    : undefined;
}
