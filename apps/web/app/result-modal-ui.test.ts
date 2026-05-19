import { describe, expect, it } from "vitest";
import { resultExitButtonUi, resultFooterOutcomeLabel, resultWinnerMotifFor, resultWinnerMotifUi, retentionProtectionUi } from "./result-modal-ui";

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
});
