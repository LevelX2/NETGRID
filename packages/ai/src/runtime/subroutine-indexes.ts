import { type LegalAction } from "@netgrid/shared";

export function parseSubroutineIndexes(value: unknown): Set<number> {
  if (typeof value !== "string") return new Set();
  const indexes = new Set<number>();
  for (const rawIndex of value.split(",")) {
    if (!/^(0|[1-9][0-9]*)$/.test(rawIndex)) continue;
    const index = Number(rawIndex);
    if (!Number.isSafeInteger(index)) continue;
    indexes.add(index);
  }
  return indexes;
}

export function breakSubroutineIndexesForAction(
  action: LegalAction,
): Set<number> {
  const indexes = parseSubroutineIndexes(action.payload?.subroutineIndexes);
  const singleIndex = action.payload?.subroutineIndex;
  if (
    typeof singleIndex === "number" &&
    Number.isSafeInteger(singleIndex) &&
    singleIndex >= 0
  )
    indexes.add(singleIndex);
  return indexes;
}
