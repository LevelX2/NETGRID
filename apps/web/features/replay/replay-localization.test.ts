import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import deMessages from "../../messages/de.json";
import enMessages from "../../messages/en.json";
import frMessages from "../../messages/fr.json";

const replayPage = readFileSync(
  new URL("../../app/replays/page.tsx", import.meta.url),
  "utf8",
);

describe("replay localization", () => {
  it("binds replay controls to the locale catalog", () => {
    expect(replayPage).toContain('useTranslations("Replay")');
    expect(replayPage).not.toContain("currentStep?.label");
    expect(replayPage).not.toContain("currentStep?.learningHint");
  });

  it("provides distinct labels in German, English, and French", () => {
    expect(deMessages.Replay.backToGames).toBe("Zur Spieleübersicht");
    expect(enMessages.Replay.backToGames).toBe("Back to games");
    expect(deMessages.Replay.board.hashVerified).toBe("verifiziert");
    expect(enMessages.Replay.board.hashVerified).toBe("verified");
    expect(frMessages.Replay.backToGames).toBe("Retour aux parties");
    expect(frMessages.Replay.board.hashVerified).toBe("vérifié");
  });
});
