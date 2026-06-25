import { type LegalAction } from "@netgrid/shared";

export function parseSubroutineIndexes(value: unknown): Set<number> {
  if (typeof value !== "string") return new Set();
  const indexes = new Set<number>();
  for (const rawIndex of value.split(",")) {
    if (!rawIndex) continue;
    const index = Number(rawIndex);
    if (!Number.isFinite(index) || !Number.isInteger(index) || index < 0)
      continue;
    indexes.add(index);
  }
  return indexes;
}

export function breakSubroutineIndexesForAction(
  action: LegalAction,
): Set<number> {
  const indexes = parseSubroutineIndexes(action.payload?.subroutineIndexes);
  const singleIndex = Number(action.payload?.subroutineIndex);
  if (Number.isInteger(singleIndex) && singleIndex >= 0)
    indexes.add(singleIndex);
  return indexes;
}
