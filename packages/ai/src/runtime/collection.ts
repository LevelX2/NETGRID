export function countValue<T>(values: readonly T[], value: T): number {
  return values.filter((candidate) => candidate === value).length;
}

export function sortedUnique(values: readonly string[]): string[];
export function sortedUnique(values: readonly number[]): number[];
export function sortedUnique(
  values: readonly (number | string)[],
): (number | string)[] {
  return [...new Set(values)].sort((left, right) => {
    if (typeof left === "number" && typeof right === "number") {
      return left - right;
    }
    return left < right ? -1 : left > right ? 1 : 0;
  });
}

export function minNumberOrZero(values: readonly number[]): number {
  return values.reduce(
    (minimum, value) => Math.min(minimum, value),
    values[0] ?? 0,
  );
}

export function uniqueBy<T, Key>(
  values: readonly T[],
  keyForValue: (value: T) => Key,
): T[] {
  return [
    ...new Map(values.map((value) => [keyForValue(value), value])).values(),
  ];
}
