import { type AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

export function selectedForcedChoiceOptionIds(
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string[] | undefined {
  if (
    choice.minSelections === 0 &&
    (choice.maxSelections === 0 || selectableOptions.length === 0)
  ) {
    return [];
  }
  if (
    choice.minSelections > 0 &&
    selectableOptions.length === choice.minSelections &&
    choice.minSelections <= choice.maxSelections
  ) {
    return selectableOptions.map((option) => option.id);
  }
  return undefined;
}
