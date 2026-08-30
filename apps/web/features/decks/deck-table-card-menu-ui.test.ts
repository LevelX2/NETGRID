import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const boardSource = readFileSync(
  new URL("./DeckTableBoard.tsx", import.meta.url),
  "utf8",
);
const globalStyles = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const germanMessages = JSON.parse(
  readFileSync(new URL("../../messages/de.json", import.meta.url), "utf8"),
) as { Decks: { table: { upToThree: string } } };

describe("deck table card menu contract", () => {
  it("lets the context menu extend beyond its narrow pile", () => {
    expect(globalStyles).toMatch(
      /\.deckTablePileCards\s*{[^}]*overflow:\s*visible;/s,
    );
  });

  it("describes the shortcut as filling the card count to three", () => {
    expect(boardSource).toMatch(
      /onDuplicateCard\(\s*pile\.id,\s*entry\.cardId,\s*entry\.order,\s*DECK_TABLE_MAX_COPIES_PER_CARD,?\s*\)/,
    );
    expect(germanMessages.Decks.table.upToThree).toBe("Auf 3 auffüllen");
  });
});
