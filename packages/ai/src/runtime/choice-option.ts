export function selectableChoiceOptions<T extends { selectable?: boolean }>(
  options: T[],
): T[] {
  return options.filter((option) => option.selectable !== false);
}

export function playfulAiGainValue(option: {
  id: string;
  value?: string | number | boolean;
  label: string;
}): number {
  if (typeof option.value === "number") return option.value;
  const splitMatch = /^gain_(\d+)_set_aside_\d+$/.exec(option.id);
  if (splitMatch) return Number(splitMatch[1]);
  return 0;
}

export function boundedSelectionCount(
  minSelections: number,
  maxSelections: number,
  available: number,
): number {
  const requested = Math.max(minSelections, maxSelections);
  return Math.max(0, Math.min(requested, available));
}
