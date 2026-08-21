import type { EditableDeck } from "@netgrid/decks";
import { describe, expect, it } from "vitest";

import { classifyLocalEditableBenchmarkDeck } from "./local-editable-benchmark-classification";

describe("classifyLocalEditableBenchmarkDeck", () => {
  it.each([
    [[], [], [], [], "runnable_ai_benchmark"],
    [["missing"], [], [], [], "blocked_by_missing_cards"],
    [[], ["unsupported"], [], [], "blocked_by_unsupported_cards"],
    [[], [], ["illegal"], [], "blocked_by_unsupported_cards"],
    [[], [], [], ["invalid"], "unclear"],
  ] as const)(
    "classifies a populated deck as %s/%s/%s/%s -> %s",
    (
      missingCards,
      unsupportedCards,
      nonDeckLegalCards,
      validationErrors,
      expected,
    ) => {
      expect(
        classifyLocalEditableBenchmarkDeck({
          deck: { cards: [{ cardId: "card", quantity: 1 }] } as EditableDeck,
          missingCards,
          unsupportedCards,
          nonDeckLegalCards,
          validationErrors,
        }),
      ).toBe(expected);
    },
  );

  it("classifies an empty deck as incomplete before card-level blockers", () => {
    expect(
      classifyLocalEditableBenchmarkDeck({
        deck: { cards: [] } as unknown as EditableDeck,
        missingCards: ["missing"],
        unsupportedCards: ["unsupported"],
        nonDeckLegalCards: ["illegal"],
        validationErrors: ["invalid"],
      }),
    ).toBe("incomplete");
  });
});
