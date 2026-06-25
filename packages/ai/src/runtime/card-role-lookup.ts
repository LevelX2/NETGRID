import { CARD_ROLES_BY_CARD, type AiCardHint } from "../ai-hints";
import { sortedUnique } from "./collection";

export function cardRolesForId(
  cardId: string | undefined,
  aiHints: ReadonlyMap<string, AiCardHint>,
): string[] {
  if (!cardId) return [];
  const roleRecord = CARD_ROLES_BY_CARD.get(cardId);
  const hint = aiHints.get(cardId);
  return sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
    ...(hint?.planRoles ?? []),
  ]);
}
