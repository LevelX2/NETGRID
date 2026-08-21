import { describe, expect, it } from "vitest";

import { benchmarkDeckFromLocalEditableDeck } from "./benchmark-local-editable-deck-resolver";

describe("benchmarkDeckFromLocalEditableDeck", () => {
  it.each(["../outside.json", "nested/deck.json", "nested\\deck.json"])(
    "rejects a deck path outside the configured directory (%s)",
    (fileName) => {
      const result = benchmarkDeckFromLocalEditableDeck({
        kind: "local_editable_deck",
        localDeckId: "local-test",
        expectedName: "Local Test",
        baseDir: "C:\\benchmark-decks",
        fileName,
      });

      expect(result).toMatchObject({
        ok: false,
        classification: "unclear",
        reason:
          "Local Deck-Editor deck fileName must be a plain file name inside the configured decks directory.",
      });
    },
  );
});
