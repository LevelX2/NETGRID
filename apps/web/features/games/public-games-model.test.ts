import { describe, expect, it } from "vitest";

import type { ApiPublicMatchListEntry } from "@netgrid/shared";
import {
  canRejoinPublicMatch,
  filterAndSortPublicMatches,
  publicGamesFilterLabel,
  publicGamesViewModeLabel,
  publicMatchResultScore,
  shouldRefreshPublicGames,
  type PublicGamesFilter,
  type PublicGamesViewMode,
} from "./public-games-model";

function entry(
  matchId: string,
  status: ApiPublicMatchListEntry["status"],
  updatedAt: string,
): ApiPublicMatchListEntry {
  return {
    matchId,
    status,
    matchMode: "human_vs_human",
    matchFormat: "single_game",
    cardPool: "originalset",
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt,
    participantNames: {},
  };
}

describe("public games model", () => {
  it("orders open before active before finished and uses newest update within each group", () => {
    const result = filterAndSortPublicMatches(
      [
        entry("finished", "finished", "2026-07-20T12:00:00.000Z"),
        entry("open-old", "open", "2026-07-20T10:00:00.000Z"),
        entry("active", "active", "2026-07-20T13:00:00.000Z"),
        entry("open-new", "open", "2026-07-20T11:00:00.000Z"),
      ],
      "all",
    );

    expect(result.map((candidate) => candidate.matchId)).toEqual([
      "open-new",
      "open-old",
      "active",
      "finished",
    ]);
  });

  it.each<[PublicGamesFilter, string]>([
    ["all", "Alle"],
    ["open", "Offen"],
    ["active", "Laufend"],
    ["finished", "Abgeschlossen"],
  ])("filters and labels %s", (filter, label) => {
    const entries = [
      entry("open", "open", "2026-07-20T10:00:00.000Z"),
      entry("active", "active", "2026-07-20T11:00:00.000Z"),
      entry("finished", "finished", "2026-07-20T12:00:00.000Z"),
    ];
    const result = filterAndSortPublicMatches(entries, filter);

    expect(publicGamesFilterLabel(filter)).toBe(label);
    expect(result).toHaveLength(filter === "all" ? 3 : 1);
    if (filter !== "all") expect(result[0]?.status).toBe(filter);
  });

  it.each<[PublicGamesViewMode, string]>([
    ["detailed", "Ausführlich"],
    ["compact", "Kompakt"],
  ])("labels the %s view mode", (mode, label) => {
    expect(publicGamesViewModeLabel(mode)).toBe(label);
  });

  it("keeps match points and agenda points as distinct result scores", () => {
    const finished = entry("finished", "finished", "2026-07-20T12:00:00.000Z");
    finished.result = {
      schemaVersion: "netgrid-match-result-v1",
      matchId: finished.matchId,
      matchStatus: "finished",
      matchMode: finished.matchMode,
      matchFormat: finished.matchFormat,
      finishedAt: finished.updatedAt,
      startedAt: finished.createdAt,
      winner: "runner",
      winnerSide: "runner",
      reason: "agenda_points",
      runner: {
        displayName: "Runner",
        agendaPoints: 7,
        matchPoints: 10,
      },
      corp: {
        displayName: "Korp",
        agendaPoints: 3,
        matchPoints: 3,
      },
      actionCount: 12,
      runCount: 4,
      finalStateHash: "hash",
    };

    expect(publicMatchResultScore(finished)).toEqual({
      matchPoints: "10 : 3",
      agendaPoints: "7 : 3",
    });
  });

  it("does not infer missing match points from the winner or agenda score", () => {
    const finished = entry(
      "legacy-finished",
      "finished",
      "2026-07-20T12:00:00.000Z",
    );
    finished.result = {
      schemaVersion: "netgrid-match-result-v1",
      matchId: finished.matchId,
      matchStatus: "finished",
      matchMode: finished.matchMode,
      matchFormat: finished.matchFormat,
      finishedAt: finished.updatedAt,
      startedAt: finished.createdAt,
      winner: "corp",
      winnerSide: "corp",
      reason: "agenda_points",
      runner: { displayName: "Runner", agendaPoints: 2 },
      corp: { displayName: "Korp", agendaPoints: 7 },
      actionCount: 15,
      runCount: 3,
      finalStateHash: "legacy-hash",
    };

    expect(publicMatchResultScore(finished)).toEqual({
      agendaPoints: "2 : 7",
    });
    expect(
      publicMatchResultScore(
        entry("active", "active", "2026-07-20T12:00:00.000Z"),
      ),
    ).toBeNull();
  });

  it("refreshes the visible setup list even when a local recovery session exists", () => {
    expect(
      shouldRefreshPublicGames({
        hasActivePlayerView: false,
        entryTab: "games",
        activeMatchWorkspace: "game",
      }),
    ).toBe(true);
  });

  it("uses the active workspace only while rendering an active player view", () => {
    expect(
      shouldRefreshPublicGames({
        hasActivePlayerView: true,
        entryTab: "games",
        activeMatchWorkspace: "game",
      }),
    ).toBe(false);
    expect(
      shouldRefreshPublicGames({
        hasActivePlayerView: true,
        entryTab: "play",
        activeMatchWorkspace: "games",
      }),
    ).toBe(true);
  });

  it("allows account rejoin only for an active match from the private account capability list", () => {
    const match = entry("own-active", "active", "2026-07-20T11:00:00.000Z");
    expect(canRejoinPublicMatch(match, new Set([match.matchId]))).toBe(true);
    expect(canRejoinPublicMatch(match, new Set())).toBe(false);
    expect(
      canRejoinPublicMatch(
        entry("own-finished", "finished", "2026-07-20T12:00:00.000Z"),
        new Set(["own-finished"]),
      ),
    ).toBe(false);
  });
});
