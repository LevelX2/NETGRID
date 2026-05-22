export function visibleKnownCardRulesText({
  catalogText,
  visibleRulesText,
}: {
  catalogText?: string | null;
  visibleRulesText?: string | null;
}): string | undefined {
  return catalogText ?? visibleRulesText ?? undefined;
}
