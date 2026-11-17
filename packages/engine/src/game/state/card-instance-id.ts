import {
  isCardDefinitionId,
  type CardDefinitionId,
  type CardInstanceId,
  type Side,
} from "@netgrid/shared";

export function cardInstanceIdForCopy(
  side: Side,
  definitionId: CardDefinitionId,
  copy: number,
): CardInstanceId {
  const card = definitionId * 2 + (side === "corp" ? 1 : 0);
  const compact = card * 4 + Math.min(copy, 3);
  if (
    !isCardDefinitionId(definitionId) ||
    !Number.isSafeInteger(copy) ||
    copy < 0 ||
    !Number.isSafeInteger(compact)
  )
    throw new Error("Ungültige Kartenkopie bei der Instanzvergabe.");
  return copy <= 3
    ? `c${compact.toString(36)}`
    : `c${card.toString(36)}_${copy.toString(36)}`;
}

export function hiddenCardReference(
  id: CardInstanceId,
  prefix: "h" | "s",
): CardInstanceId {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${prefix}${(hash >>> 0).toString(36)}`;
}
