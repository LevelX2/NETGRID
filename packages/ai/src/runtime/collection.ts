export function countValue<T>(values: readonly T[], value: T): number {
  return values.filter((candidate) => candidate === value).length;
}

export function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function minNumberOrZero(values: readonly number[]): number {
  return values.length > 0 ? Math.min(...values) : 0;
}

export function uniqueBy<T>(
  values: readonly T[],
  keyForValue: (value: T) => string,
): T[] {
  return [
    ...new Map(values.map((value) => [keyForValue(value), value])).values(),
  ];
}
