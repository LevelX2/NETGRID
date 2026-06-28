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
  return playfulAiGainValueFromOptionId(option.id);
}

function playfulAiGainValueFromOptionId(optionId: string): number {
  const parts = optionId.split("_");
  if (
    parts.length !== 5 ||
    parts[0] !== "gain" ||
    parts[2] !== "set" ||
    parts[3] !== "aside" ||
    !onlyAsciiDigits(parts[1] ?? "") ||
    !onlyAsciiDigits(parts[4] ?? "")
  ) {
    return 0;
  }
  return Number(parts[1]);
}

function onlyAsciiDigits(value: string): boolean {
  return (
    value.length > 0 &&
    [...value].every((character) => character >= "0" && character <= "9")
  );
}

export function boundedSelectionCount(
  minSelections: number,
  maxSelections: number,
  available: number,
): number {
  const requested = Math.max(minSelections, maxSelections);
  return Math.max(0, Math.min(requested, available));
}
