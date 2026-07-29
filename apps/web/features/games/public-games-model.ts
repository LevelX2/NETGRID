import type { ApiPublicMatchListEntry } from "@netgrid/shared";

export type PublicGamesFilter = "all" | "open" | "active" | "finished";
export type PublicGamesViewMode = "detailed" | "compact";

export type PublicMatchResultScore = {
  agendaPoints: string;
  matchPoints?: string;
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
