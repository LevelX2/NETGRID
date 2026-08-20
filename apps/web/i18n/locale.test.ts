import { describe, expect, it } from "vitest";

import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";
import {
  APP_LOCALE_COOKIE_MAX_AGE_SECONDS,
  APP_LOCALE_COOKIE_NAME,
  appLocaleCookie,
  isAppLocale,
  normalizeAppLocale,
} from "./locale";

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("app locale foundation", () => {
  it("accepts only supported locales and defaults fail-closed to German", () => {
    expect(isAppLocale("de")).toBe(true);
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
    expect(normalizeAppLocale("en")).toBe("en");
    expect(normalizeAppLocale("fr")).toBe("de");
    expect(normalizeAppLocale(undefined)).toBe("de");
  });

  it("persists the locale in a root-scoped same-site cookie", () => {
    expect(appLocaleCookie("en")).toBe(
      `${APP_LOCALE_COOKIE_NAME}=en; Path=/; Max-Age=${APP_LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`,
    );
  });

  it("keeps the foundation message catalogs structurally aligned", () => {
    expect(leafPaths(enMessages).sort()).toEqual(leafPaths(deMessages).sort());
  });
});

