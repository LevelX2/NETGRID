import { isCardDefinitionId, type CardDefinitionId } from "@netgrid/shared";

export function cardDefinitionIdValue(value: unknown): CardDefinitionId | undefined {
  return isCardDefinitionId(value) ? value : undefined;
}

export function cardDefinitionIdsFromCsv(value: unknown): CardDefinitionId[] {
  if (typeof value !== "string" || value.length === 0) return [];
  const parts = value.split(",");
  const ids = parts.map(Number);
  return ids.every((id, index) => isCardDefinitionId(id) && String(id) === parts[index])
    ? ids
    : [];
}
