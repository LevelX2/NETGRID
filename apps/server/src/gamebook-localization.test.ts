import { describe, expect, it } from "vitest";
import {
  gamebookDownloadFilename,
  gamebookMessages,
  normalizeGamebookLocale,
} from "./gamebook-localization";

describe("gamebook localization contract", () => {
  it.each(["de", "en", "fr"] as const)(
    "accepts the supported locale %s",
    (locale) => {
      expect(normalizeGamebookLocale(locale)).toBe(locale);
    },
  );

  it.each([undefined, null, "", "es", "EN"])(
    "falls back to English for unsupported locale %s",
    (locale) => {
      expect(normalizeGamebookLocale(locale)).toBe("en");
    },
  );

  it("uses a language-marked, locale-neutral download filename", () => {
    expect(gamebookDownloadFilename("match_123", "fr")).toBe(
      "netgrid-gamebook-fr-match_123.md",
    );
  });

  it.each([
    {
      locale: "de" as const,
      title: "Spielprotokoll",
      setup: "Spielvorbereitung",
      draw: "zieht eine Karte",
      advance: "1 Fortschrittsmarker",
      effect: "erhält 2 Credits",
    },
    {
      locale: "en" as const,
      title: "Gamebook",
      setup: "Game setup",
      draw: "draws a card",
      advance: "1 advancement counter",
      effect: "gains 2 credits",
    },
    {
      locale: "fr" as const,
      title: "Livre de jeu",
      setup: "Préparation de la partie",
      draw: "pioche une carte",
      advance: "1 pion d'avancement",
      effect: "gagne 2 crédits",
    },
  ])("provides complete dynamic copy for $locale", (expected) => {
    const messages = gamebookMessages(expected.locale);

    expect(messages.title).toBe(expected.title);
    expect(messages.setupHeading).toBe(expected.setup);
    expect(messages.draws("", [])).toContain(expected.draw);
    expect(messages.advances("", 1, messages.unknownCard)).toContain(
      expected.advance,
    );
    expect(messages.gainsCredits("runner", 2)).toContain(expected.effect);
    expect(messages.resultReason("agenda_points")).not.toBe("");
    expect(messages.unknownEvent("", "custom_event")).toContain("custom_event");
  });
});
