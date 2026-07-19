import type { AiCardHint } from "../ai-hints";
import { sortedUnique } from "./collection";

export function cardRolesForId(
  cardId: string | undefined,
  aiHints: ReadonlyMap<string, AiCardHint>,
): string[] {
  if (!cardId) return [];
  const hint = aiHints.get(cardId);
  return sortedUnique([...(hint?.roles ?? []), ...(hint?.planRoles ?? [])]);
}
