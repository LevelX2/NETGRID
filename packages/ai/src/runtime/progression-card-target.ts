export type ProgressionCardTargetType =
  | "agenda"
  | "asset"
  | "upgrade"
  | "ice"
  | "unknown";

export function progressionCardTargetType(
  type: string | undefined,
): ProgressionCardTargetType {
  if (
    type === "agenda" ||
    type === "asset" ||
    type === "upgrade" ||
    type === "ice"
  )
    return type;
  return "unknown";
}

export function sortedUniqueProgressionCardTargetTypes(
  values: ProgressionCardTargetType[],
): ProgressionCardTargetType[] {
  return [...new Set(values)].sort();
}
