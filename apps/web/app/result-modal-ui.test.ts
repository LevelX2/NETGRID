import { describe, expect, it } from "vitest";
import { gameStandingForResult, resultExitButtonUi, resultFooterOutcomeLabel, resultOutcomeHeadline, resultOutcomeText, resultPlayerRoleLabel, resultWinnerMotifFor, resultWinnerMotifUi, retentionProtectionUi, seriesResultHeadline } from "./result-modal-ui";

describe("result modal UI helpers", () => {
  it("selects winner motifs for runner, corp and draw results", () => {
    expect(resultWinnerMotifFor("runner")).toBe("runner");
    expect(resultWinnerMotifFor("corp")).toBe("corp");
    expect(resultWinnerMotifFor("draw")).toBe("draw");
  });

  it("uses bitmap result motifs only for side wins", () => {
    expect(resultWinnerMotifUi("runner")).toMatchObject({
      ariaLabel: "Runner-Sieg",
      caption: "Runner",
      imageSrc: "/result-motifs/result-runner-victory.png"
    });
    expect(resultWinnerMotifUi("corp")).toMatchObject({
      ariaLabel: "Korp-Sieg",
      caption: "Korp",
      imageSrc: "/result-motifs/result-corp-victory.png"
    });
    expect(resultWinnerMotifUi("draw")).toEqual({
      ariaLabel: "Unentschieden",
      caption: "Draw"
    });
  });

  it("keeps the result footer neutral instead of repeating win wording", () => {
    expect(resultFooterOutcomeLabel("runner", "runner")).toBe("Deine Seite");
    expect(resultFooterOutcomeLabel("corp", "runner", "Korp-KI")).toBe("Korp-KI");
    expect(resultFooterOutcomeLabel("draw", "runner")).toBe("Draw");
  });

  it("uses the finished series winner as the primary result headline", () => {
    expect(seriesResultHeadline(series("won"), "Korp-KI")).toBe("Du hast die Match-Serie gewonnen.");
    expect(seriesResultHeadline(series("won"), "Korp-KI", "Ludwig")).toBe("Ludwig hat die Match-Serie gewonnen.");
    expect(seriesResultHeadline(series("lost"), "Korp-KI")).toBe("Korp-KI hat die Match-Serie gewonnen.");
    expect(seriesResultHeadline(series("draw"), "Korp-KI")).toBe("Die Match-Serie endet unentschieden.");
    expect(seriesResultHeadline({ ...series("won"), status: "between_games" }, "Korp-KI")).toBeNull();
    expect(resultOutcomeText("runner")).toBe("Runner gewinnt.");
  });

  it("uses player names and sides for single-game result headlines", () => {
    expect(resultOutcomeHeadline("corp", "runner", "Ludwig", "Korp-KI")).toBe("Korp-KI gewinnt als Korp.");
    expect(resultOutcomeHeadline("runner", "runner", "Ludwig", "Korp-KI")).toBe("Ludwig gewinnt als Runner.");
    expect(resultOutcomeHeadline("runner", "runner")).toBe("Du gewinnst als Runner.");
    expect(resultOutcomeHeadline("draw", "runner", "Ludwig", "Korp-KI")).toBe("Das Spiel endet unentschieden.");
  });

  it("formats player labels with side context", () => {
    expect(resultPlayerRoleLabel("runner", "runner", "Ludwig", "Korp-KI")).toBe("Ludwig (Runner)");
    expect(resultPlayerRoleLabel("corp", "runner", "Ludwig", "Korp-KI")).toBe("Korp-KI (Korp)");
    expect(resultPlayerRoleLabel("corp", "runner")).toBe("Gegenseite (Korp)");
  });

  it("uses replay-safe retention labels without the old aufheben wording", () => {
    expect(retentionProtectionUi(false).label).toBe("Spiel für Replay sichern");
    expect(retentionProtectionUi(true).label).toBe("Replay-Sicherung entfernen");
    expect(retentionProtectionUi(false).title).toContain("Replay");
    expect(retentionProtectionUi(true).title).not.toContain("aufheben");
  });

  it("makes the start-screen path secondary when a next series game is available", () => {
    expect(resultExitButtonUi(true)).toMatchObject({
      label: "Serie verlassen",
      needsConfirmation: true
    });
    expect(resultExitButtonUi(false)).toMatchObject({
      label: "Zurück zum Startbildschirm",
      needsConfirmation: false
    });
  });

  it("shows normal single-game match points for side wins", () => {
    expect(
      gameStandingForResult(
        {
          winner: "runner",
          runnerAgendaPoints: 7,
          corpAgendaPoints: 2
        },
        "runner",
        "Ludwig",
        "Korp-KI"
      )
    ).toEqual({
      summary: "Ludwig (Runner): 10 Matchpunkte. Korp-KI (Korp): 2 Agenda-Punkte aus gescorten Agendas.",
      viewerMatchPoints: 10,
      opponentMatchPoints: 2,
      viewerAgendaPoints: 7,
      opponentAgendaPoints: 2
    });
  });

  it("scores forfeits like normal side wins from the terminal result", () => {
    expect(
      gameStandingForResult(
        {
          winner: "corp",
          runnerAgendaPoints: 0,
          corpAgendaPoints: 4
        },
        "runner",
        "Ludwig",
        "Korp-KI"
      )
    ).toEqual({
      summary: "Korp-KI (Korp): 10 Matchpunkte. Ludwig (Runner): 0 Agenda-Punkte aus gestohlenen Agendas.",
      viewerMatchPoints: 0,
      opponentMatchPoints: 10,
      viewerAgendaPoints: 0,
      opponentAgendaPoints: 4
    });
  });

  it("scores draws by each side's agenda points", () => {
    expect(
      gameStandingForResult(
        {
          winner: "draw",
          runnerAgendaPoints: 4,
          corpAgendaPoints: 3
        },
        "corp"
      )
    ).toEqual({
      summary: "Draw: beide Seiten erhalten ihre Agenda-Punkte.",
      viewerMatchPoints: 3,
      opponentMatchPoints: 4,
      viewerAgendaPoints: 3,
      opponentAgendaPoints: 4
    });
  });
});

function series(viewerSeriesOutcome: "won" | "lost" | "draw") {
  return {
    seriesId: "series_1",
    mode: "two_game_side_swap" as const,
    status: "finished" as const,
    gameNumber: 2,
    gamesPlanned: 2,
    viewerPlayer: "player_a" as const,
    viewerWins: viewerSeriesOutcome === "won" ? 1 : 0,
    opponentWins: viewerSeriesOutcome === "lost" ? 1 : 0,
    draws: viewerSeriesOutcome === "draw" ? 1 : 0,
    viewerMatchPoints: viewerSeriesOutcome === "won" ? 12 : 10,
    opponentMatchPoints: viewerSeriesOutcome === "lost" ? 12 : 10,
    viewerAgendaPoints: 7,
    opponentAgendaPoints: 6,
    viewerSeriesOutcome,
    seriesDecision: viewerSeriesOutcome === "draw" ? "draw" as const : "match_points" as const,
    nextAvailable: false,
  };
}
