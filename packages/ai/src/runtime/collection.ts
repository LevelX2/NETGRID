export function countValue<T>(values: readonly T[], value: T): number {
  return values.filter((candidate) => candidate === value).length;
}

export function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function minNumberOrZero(values: readonly number[]): number {
  return values.length > 0 ? Math.min(...values) : 0;
}
