import { type LegalAction } from "@netgrid/shared";

export function parseSubroutineIndexes(value: unknown): Set<number> {
  if (value === undefined) return new Set();
  if (!Array.isArray(value))
    throw new Error("Invalid Engine subroutine indexes.");
  const indexes = new Set<number>();
  for (const index of value) {
    if (!Number.isSafeInteger(index) || index < 0 || indexes.has(index))
      throw new Error("Invalid Engine subroutine indexes.");
    indexes.add(index);
  }
  return indexes;
}

export function breakSubroutineIndexesForAction(
  action: LegalAction,
): Set<number> {
  const indexes = parseSubroutineIndexes(action.subroutineIndexes);
  const singleIndex = action.payload?.subroutineIndex;
  if (
    typeof singleIndex === "number" &&
    Number.isSafeInteger(singleIndex) &&
    singleIndex >= 0
  )
    indexes.add(singleIndex);
  return indexes;
}
