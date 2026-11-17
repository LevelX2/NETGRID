import type { EditableDeck } from "@netgrid/decks";
import { describe, expect, it } from "vitest";

import { classifyLocalEditableBenchmarkDeck } from "./local-editable-benchmark-classification";

describe("classifyLocalEditableBenchmarkDeck", () => {
  it.each([
    [[], [], [], [], "runnable_ai_benchmark"],
    [[9101], [], [], [], "blocked_by_missing_cards"],
    [[], [9102], [], [], "blocked_by_unsupported_cards"],
    [[], [], [9103], [], "blocked_by_unsupported_cards"],
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
          deck: { cards: [{ cardId: 9104, quantity: 1 }] } as EditableDeck,
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
        missingCards: [9101],
        unsupportedCards: [9102],
        nonDeckLegalCards: [9103],
        validationErrors: ["invalid"],
      }),
    ).toBe("incomplete");
  });
});
