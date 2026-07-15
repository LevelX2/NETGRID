import type { AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const DAMAGE_PREVENTION_CHOICE_SOURCE = "v120.event_modification.prevent";

export function selectedRunnerDamagePreventionChoiceOptionId(
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string | undefined {
  if (
    choice.source !== DAMAGE_PREVENTION_CHOICE_SOURCE ||
    choice.kind !== "select_option" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1
  ) {
    return undefined;
  }
  return selectableOptions.find((option) => option.id !== "pass")?.id;
}
