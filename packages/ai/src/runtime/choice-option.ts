export function selectableChoiceOptions<T extends { selectable?: boolean }>(
  options: T[],
): T[] {
  return options.filter((option) => option.selectable !== false);
}

export function boundedSelectionCount(
  minSelections: number,
  maxSelections: number,
  available: number,
): number {
  const requested = Math.max(minSelections, maxSelections);
  return Math.max(0, Math.min(requested, available));
}
