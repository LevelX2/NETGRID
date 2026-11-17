import { isCardDefinitionId, type CardDefinitionId } from "@netgrid/shared";

export function cardDefinitionIdValue(
  value: unknown,
): CardDefinitionId | undefined {
  return isCardDefinitionId(value) ? value : undefined;
}

export function parseCardDefinitionId(
  value: string,
): CardDefinitionId | undefined {
  const id = Number(value);
  return isCardDefinitionId(id) && String(id) === value ? id : undefined;
}

export function parseCardDefinitionIdCsv(
  value: string,
): CardDefinitionId[] | undefined {
  if (value.length === 0) return [];
  const ids = value.split(",").map(parseCardDefinitionId);
  return ids.every((id) => id !== undefined) ? ids : undefined;
}

export function validOptionalCardDefinitionIds(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every(
        (id, index) =>
          isCardDefinitionId(id) && (index === 0 || value[index - 1] < id),
      ))
  );
}

export function parseOptionalCardDefinitionIdCsv(
  value: unknown,
): CardDefinitionId[] | undefined {
  if (value === undefined) return [];
  if (typeof value !== "string" || value.length === 0) return undefined;
  const ids = parseCardDefinitionIdCsv(value);
  return ids !== undefined && validOptionalCardDefinitionIds(ids)
    ? ids
    : undefined;
}
