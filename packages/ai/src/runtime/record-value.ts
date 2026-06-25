export function stringRecordValue(
  value: unknown,
  key: string,
): string | undefined {
  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? record[key] : undefined;
}
