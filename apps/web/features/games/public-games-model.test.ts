import { describe, expect, it } from "vitest";

import type { ApiPublicMatchListEntry } from "@netgrid/shared";
import {
  canRejoinPublicMatch,
  filterAndSortPublicMatches,
  publicGamesFilterLabel,
  publicGamesViewModeLabel,
  publicMatchConclusion,
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

  it("distinguishes regular results from a participant forfeit", () => {
    const finished = entry(
      "regular-finished",
      "finished",
      "2026-07-20T12:00:00.000Z",
    );
    finished.result = resultSnapshot(finished, {
      winner: "runner",
      winnerSide: "runner",
      reason: "agenda_points",
    });
    expect(publicMatchConclusion(finished)).toEqual({
      kind: "regular",
      label: "Regulär beendet",
      compactLabel: "Regulär",
    });

    const forfeited = entry(
      "forfeited",
      "finished",
      "2026-07-20T12:10:00.000Z",
    );
    forfeited.result = resultSnapshot(forfeited, {
      matchStatus: "forfeited",
      winner: "corp",
      winnerSide: "corp",
      loserSide: "runner",
      reason: "forfeit",
      runnerDisplayName: "Teilnehmer A",
    });
    expect(publicMatchConclusion(forfeited)).toEqual({
      kind: "forfeit",
      label: "Aufgegeben von Teilnehmer A (Runner)",
      compactLabel: "Aufgabe: Teilnehmer A",
    });
  });

  it("uses the authoritative winner only as a legacy fallback for terminal loser reasons", () => {
    const expired = entry("expired", "finished", "2026-07-20T12:20:00.000Z");
    expired.result = resultSnapshot(expired, {
      matchStatus: "forfeited",
      winner: "runner",
      winnerSide: "runner",
      reason: "time_expired",
      corpDisplayName: "Teilnehmer B",
    });
    expect(publicMatchConclusion(expired)).toEqual({
      kind: "time_expired",
      label: "Zeit abgelaufen bei Teilnehmer B (Korp)",
      compactLabel: "Zeit: Teilnehmer B",
    });

    const unknown = entry("unknown", "finished", "2026-07-20T12:30:00.000Z");
    unknown.result = resultSnapshot(unknown, {
      winner: "draw",
      reason: "unknown",
    });
    expect(publicMatchConclusion(unknown)).toEqual({
      kind: "unknown",
      label: "Abschlussart unbekannt",
      compactLabel: "Unbekannter Abschluss",
    });
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

function resultSnapshot(
  match: ApiPublicMatchListEntry,
  overrides: {
    matchStatus?: "finished" | "forfeited";
    winner: "runner" | "corp" | "draw";
    winnerSide?: "runner" | "corp";
    loserSide?: "runner" | "corp";
    reason: "agenda_points" | "forfeit" | "time_expired" | "unknown";
    runnerDisplayName?: string;
    corpDisplayName?: string;
  },
): NonNullable<ApiPublicMatchListEntry["result"]> {
  return {
    schemaVersion: "netgrid-match-result-v1",
    matchId: match.matchId,
    matchStatus: overrides.matchStatus ?? "finished",
    matchMode: match.matchMode,
    matchFormat: match.matchFormat,
    finishedAt: match.updatedAt,
    startedAt: match.createdAt,
    winner: overrides.winner,
    ...(overrides.winnerSide ? { winnerSide: overrides.winnerSide } : {}),
    ...(overrides.loserSide ? { loserSide: overrides.loserSide } : {}),
    reason: overrides.reason,
    runner: {
      displayName: overrides.runnerDisplayName ?? "Runner",
      agendaPoints: 7,
      matchPoints: overrides.winner === "runner" ? 10 : 0,
    },
    corp: {
      displayName: overrides.corpDisplayName ?? "Korp",
      agendaPoints: 3,
      matchPoints: overrides.winner === "corp" ? 10 : 3,
    },
    actionCount: 12,
    runCount: 4,
    finalStateHash: "hash",
  };
}
