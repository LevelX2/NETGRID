import { type AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

export function selectedFirstChoiceOptionId(
  selectableOptions: readonly PendingChoiceOption[],
): string | undefined {
  return selectableOptions[0]?.id;
}

export function selectedFallbackChoiceOptionIds(
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string[] {
  const count =
    choice.minSelections > 0
      ? choice.minSelections
      : Math.min(1, choice.maxSelections);
  if (count <= 1)
    return selectableOptions.slice(0, count).map((option) => option.id);
  const selected: PendingChoiceOption[] = [];
  const selectedIds = new Set<string>();
  const selectedGroups = new Set<string>();
  for (const option of selectableOptions) {
    const group = fallbackChoiceOptionGroup(option);
    if (group && selectedGroups.has(group)) continue;
    selected.push(option);
    selectedIds.add(option.id);
    if (group) selectedGroups.add(group);
    if (selected.length >= count) break;
  }
  if (selected.length < count) {
    for (const option of selectableOptions) {
      if (selectedIds.has(option.id)) continue;
      selected.push(option);
      if (selected.length >= count) break;
    }
  }
  return selected.map((option) => option.id);
}

export function selectedDefaultCardChoiceOptionIds(
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string[] {
  const count = Math.max(
    choice.minSelections,
    Math.min(choice.maxSelections, choice.maxSelections),
  );
  return selectableOptions.slice(0, count).map((option) => option.id);
}

function fallbackChoiceOptionGroup(
  option: PendingChoiceOption,
): string | undefined {
  if (typeof option.value !== "string") return undefined;
  const separator = option.value.indexOf("|");
  if (separator <= 0) return undefined;
  return option.value.slice(0, separator);
}
