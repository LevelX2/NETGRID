import { describe, expect, it } from "vitest";
import { isCardDefinitionId } from "./index";
import { ORIGINALSET_DEFAULT_DECKS } from "./originalset-default-decks";

describe("Originalset defaults", () => {
  it("contain numeric definition references and the technical system identities", () => {
    expect(ORIGINALSET_DEFAULT_DECKS.runner.identity).toBe(587);
    expect(ORIGINALSET_DEFAULT_DECKS.corp.identity).toBe(3);
    for (const deck of Object.values(ORIGINALSET_DEFAULT_DECKS)) {
      expect(deck.cards.length).toBeGreaterThan(0);
      expect(deck.cards.every((entry) => isCardDefinitionId(entry.id))).toBe(
        true,
      );
    }
  });
});
