export function formatDebugFieldValue(
  value: string | number | boolean,
): string {
  return String(value)
    .replace(/[|\r\n]+/g, " ")
    .trim();
}

export function uniqueDebugStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
