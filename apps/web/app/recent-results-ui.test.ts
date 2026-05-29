import { describe, expect, it } from "vitest";
import type { ApiRecentSeriesResult } from "@netgrid/shared";
import { recentResultsEmptyText, recentSeriesWinnerLabel, seriesStatusLabel, singleRecentMatchPoints } from "./recent-results-ui";

describe("recent result UI helpers", () => {
  it("formats single-game match points like the result window contract", () => {
    expect(singleRecentMatchPoints("runner", "runner", 7)).toBe(10);
    expect(singleRecentMatchPoints("runner", "corp", 3)).toBe(3);
    expect(singleRecentMatchPoints("draw", "corp", 4)).toBe(4);
  });

  it("labels series cards and empty or loading states", () => {
    const result = {
      outcome: "player_a",
      players: {
        player_a: { displayName: "Ludwig", matchPoints: 20, agendaPoints: 8, wins: 2 },
        player_b: { displayName: "Runner-KI", matchPoints: 5, agendaPoints: 5, wins: 0 }
      }
    } satisfies Pick<ApiRecentSeriesResult, "outcome" | "players">;

    expect(recentSeriesWinnerLabel(result)).toBe("Ludwig gewinnt die Serie");
    expect(recentSeriesWinnerLabel({ ...result, outcome: "draw" })).toBe("Serie unentschieden");
    expect(seriesStatusLabel("finished")).toBe("abgeschlossen");
    expect(recentResultsEmptyText(true)).toBe("Lade letzte Spiele ...");
    expect(recentResultsEmptyText(false)).toBe("Noch keine vollständig beendeten Spiele gefunden.");
  });
});
