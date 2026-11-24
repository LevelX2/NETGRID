import type { CardDefinitionId } from "@netgrid/shared";
import type { AiCardHint } from "../ai-hints";
import { sortedUnique } from "./collection";

export function cardRolesForId(
  cardId: CardDefinitionId | undefined,
  aiHints: ReadonlyMap<CardDefinitionId, AiCardHint>,
): string[] {
  if (!cardId) return [];
  const hint = aiHints.get(cardId);
  return sortedUnique([...(hint?.roles ?? []), ...(hint?.planRoles ?? [])]);
}
