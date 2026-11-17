import type { CardDefinitionId } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { RUNTIME_CARDS } from "../ai-hints";

export function titleForCardId(cardId: CardDefinitionId | undefined): string | undefined {
  if (!cardId) return undefined;
  return RUNTIME_CARDS[cardId]?.title ?? CARD_DEFINITIONS_BY_ID[cardId]?.title;
}
