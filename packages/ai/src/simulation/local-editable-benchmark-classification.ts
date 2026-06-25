import { type EditableDeck } from "@netgrid/decks";

export type LocalEditableBenchmarkDeckClassification =
  | "runnable_ai_benchmark"
  | "blocked_by_missing_cards"
  | "blocked_by_unsupported_cards"
  | "incomplete"
  | "unclear";

export function classifyLocalEditableBenchmarkDeck(input: {
  readonly deck: EditableDeck;
  readonly missingCards: readonly string[];
  readonly unsupportedCards: readonly string[];
  readonly nonDeckLegalCards: readonly string[];
  readonly validationErrors: readonly string[];
}): LocalEditableBenchmarkDeckClassification {
  if (!input.deck.cards || input.deck.cards.length === 0) return "incomplete";
  if (input.missingCards.length > 0) return "blocked_by_missing_cards";
  if (input.unsupportedCards.length > 0 || input.nonDeckLegalCards.length > 0)
    return "blocked_by_unsupported_cards";
  if (input.validationErrors.length > 0) return "unclear";
  return "runnable_ai_benchmark";
}
