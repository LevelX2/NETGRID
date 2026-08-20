import { describe, expect, it } from "vitest";

import {
  appLocaleTag,
  createAppCollator,
  formatAppDateTime,
  lowercaseInitial,
} from "./format";

describe("locale-aware presentation formatting", () => {
  it("maps app locales to explicit regional formatting locales", () => {
    expect(appLocaleTag("de")).toBe("de-DE");
    expect(appLocaleTag("en")).toBe("en-US");
    expect(appLocaleTag("fr")).toBe("fr-FR");
  });

  it("formats the same timestamp according to the selected locale", () => {
    const value = new Date("2026-08-20T18:30:00.000Z");
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    };
    expect(formatAppDateTime(value, "de", options)).toBe("20.08.2026");
    expect(formatAppDateTime(value, "en", options)).toBe("08/20/2026");
    expect(formatAppDateTime(value, "fr", options)).toBe("20/08/2026");
  });

  it("keeps invalid dates visible for diagnosis", () => {
    expect(formatAppDateTime("invalid", "de", {})).toBe("invalid");
  });

  it("provides locale-aware collation and casing helpers", () => {
    expect(createAppCollator("de").compare("Ähre", "Zebra")).toBeLessThan(0);
    expect(lowercaseInitial("Die Korp", "de")).toBe("die Korp");
  });
});
