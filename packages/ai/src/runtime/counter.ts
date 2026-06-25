export function incrementStringCounter(
  counter: Record<string, number>,
  key: string,
): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

export function incrementTypedCounter<T extends string>(
  counter: Record<T, number>,
  key: T,
): void {
  counter[key] += 1;
}

export function addStringsToCounter(
  values: readonly string[],
  counter: Record<string, number>,
): void {
  for (const value of values) incrementStringCounter(counter, value);
}
