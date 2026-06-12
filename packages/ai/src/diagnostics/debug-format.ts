export function formatDebugFieldValue(value: string | number | boolean): string {
  return String(value)
    .replace(/[|\r\n]+/g, " ")
    .trim();
}

export function uniqueDebugStrings(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}
