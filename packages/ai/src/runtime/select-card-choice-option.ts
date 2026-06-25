import { type AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
type PendingChoiceOption = PendingChoice["options"][number];

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
