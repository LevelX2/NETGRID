export function incrementStringCounter(
  counter: Record<string, number>,
  key: string,
): void {
  if (Object.hasOwn(counter, key)) {
    counter[key]! += 1;
  } else {
    Object.defineProperty(counter, key, {
      value: 1,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
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
