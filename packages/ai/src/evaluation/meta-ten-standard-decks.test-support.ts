import { readFileSync } from "node:fs";

/** Bounded test data shape; do not infer every catalog record as a union. */
export const metaTenStandardDecks = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/decks/standard-deck-catalog-1.0.0.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  decks: Array<{
    standardDeckId: string;
    name: string;
    side: "runner" | "corp";
    identityCardId: string;
    cards: Array<{ cardId: string; quantity: number }>;
  }>;
};
