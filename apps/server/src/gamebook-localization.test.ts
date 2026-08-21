import { describe, expect, it } from "vitest";
import {
  gamebookDownloadFilename,
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
});
