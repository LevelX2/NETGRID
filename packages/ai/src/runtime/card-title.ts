import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";

export function titleForCardId(cardId: string | undefined): string | undefined {
  if (!cardId) return undefined;
  return RUNTIME_CARDS[cardId]?.title ?? CARD_DEFINITIONS_BY_ID[cardId]?.title;
}
