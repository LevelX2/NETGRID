import type { CardDefinitionId } from "@netgrid/shared";
import { cardInstanceIdForCopy } from "../../../../engine/src/game/state/card-instance-id";

export function referencesDefaultDeckCard(
  value: string | undefined,
  definitionId: CardDefinitionId,
  copy?: number,
): boolean {
  if (value === undefined) return false;
  const tokens = new Set(value.split(/%3A|[.:/_]/i));
  const copies = copy === undefined ? [1, 2, 3] : [copy];
  return copies.some(
    (number) =>
      tokens.has(cardInstanceIdForCopy("runner", definitionId, number)) ||
      tokens.has(cardInstanceIdForCopy("corp", definitionId, number)),
  );
}
