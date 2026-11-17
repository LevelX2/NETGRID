import type { DeckDefinition } from "@netgrid/shared";
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
    identityCardId: number;
    cards: Array<{ cardId: number; quantity: number }>;
  }>;
};

export function shadoeTagAndBagDeckForTest(): DeckDefinition {
  const deck = metaTenStandardDecks.decks.find(
    (entry) => entry.standardDeckId === "standard_corp_shadoe_tag_bag",
  );
  if (!deck) throw new Error("Missing Shadoe Tag & Bag fixture deck");
  return {
    id: deck.standardDeckId,
    name: deck.name,
    side: deck.side,
    identity: deck.identityCardId,
    cards: deck.cards.map(({ cardId, quantity }) => ({ id: cardId, quantity })),
  };
}
