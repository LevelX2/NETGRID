import { describe, expect, it } from "vitest";
import { ORIGINALSET_DEFAULT_DECKS } from "./originalset-default-decks";

describe("Originalset defaults", () => {
  it("contain only real Originalset cards plus the technical system identity", () => {
    expect(ORIGINALSET_DEFAULT_DECKS.runner.identity).toBe(
      "runner_identity_001",
    );
    expect(ORIGINALSET_DEFAULT_DECKS.corp.identity).toBe("corp_identity_001");
    for (const deck of Object.values(ORIGINALSET_DEFAULT_DECKS)) {
      expect(deck.cards.length).toBeGreaterThan(0);
      expect(deck.cards.every((entry) => entry.id.startsWith("onr_v1_"))).toBe(
        true,
      );
    }
  });
});
