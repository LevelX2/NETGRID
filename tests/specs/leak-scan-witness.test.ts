import type { Page } from "@playwright/test";
import { describe, expect, it } from "vitest";
import {
  expectNoDomOrLocalStorageLeaks,
  expectNoServerPayloadLeaks,
  expectRecentSessionsAreSanitized,
} from "../e2e/helpers/leak-scan";

describe("browser leak scanner mutation witnesses", () => {
  it("accepts a clean DOM, local storage and WebSocket sample", async () => {
    const page = pageReturning("Aktives Spiel ohne private Daten");

    await expectNoDomOrLocalStorageLeaks(page);
    await expectRecentSessionsAreSanitized(page);
    expectNoServerPayloadLeaks({ received: ['{"type":"state_updated","stateVersion":7}'] });
  });

  it("fails when a forbidden token is planted in each observed surface", async () => {
    const contaminatedPage = pageReturning("sessionToken=planted-secret");

    await expect(expectNoDomOrLocalStorageLeaks(contaminatedPage)).rejects.toThrow(/sessionToken/i);
    await expect(expectRecentSessionsAreSanitized(contaminatedPage)).rejects.toThrow(/sessionToken/i);
    expect(() => expectNoServerPayloadLeaks({ received: ['{"privatePayload":"planted-secret"}'] })).toThrow(/privatePayload/i);
  });

  it("fails when the exact hidden card title is planted without a generic token", async () => {
    const page = pageReturning("Verdeckte Karte: Project Junebug");

    await expect(expectNoDomOrLocalStorageLeaks(page, ["Project Junebug"])).rejects.toThrow(/Project Junebug/);
  });
});

function pageReturning(surface: string): Page {
  return {
    evaluate: async () => surface,
  } as unknown as Page;
}
