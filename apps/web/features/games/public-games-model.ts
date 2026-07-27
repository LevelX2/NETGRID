import type { ApiPublicMatchListEntry } from "@netgrid/shared";

export type PublicGamesFilter = "all" | "open" | "active" | "finished";

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
