import type { CardDefinitionId } from "@netgrid/shared";
import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import { RUNTIME_CARDS } from "../ai-hints";

export function titleForCardId(cardId: CardDefinitionId | undefined): string | undefined {
  if (!cardId) return undefined;
  return RUNTIME_CARDS[cardId]?.title ?? planningCardFactsByDefinitionId(cardId)?.title;
}
