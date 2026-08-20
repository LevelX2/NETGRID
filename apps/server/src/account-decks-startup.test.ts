import { describe, expect, it, vi } from "vitest";

vi.mock("@netgrid/ai", () => ({
  DECK_STRATEGY_PROFILE_ANALYSIS_REVISION: "test-profile-revision",
  buildDeckStrategyProfile: () => {
    throw new Error(
      "Standarddeck-Profile dürfen beim Serverstart nicht laufen.",
    );
  },
}));

import {
  AccountDeckService,
  InMemoryAccountDeckStorage,
} from "./account-decks";

describe("AccountDeckService startup", () => {
  it("validiert Standarddeck-Guides ohne Strategieprofile zu berechnen", () => {
    const service = new AccountDeckService(new InMemoryAccountDeckStorage(), {
      standardDeckGuideManifest: {
        schemaVersion: "netgrid-standard-deck-guides-v1",
        guideSetId: "test-guides",
        catalogId: "test-catalog",
        analyzedAt: "2026-08-19",
        guides: [],
      },
    });

    expect(service.listStandards().length).toBeGreaterThan(40);
  });
});
