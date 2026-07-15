import type { AiDecisionInput } from "@netgrid/shared";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const TAG_AVOIDANCE_CHOICE_SOURCE = "v120.event_modification.avoid";
const TAG_AVOIDANCE_OPTION_PREFIX = "card_implementation_avoid_tag_";

export function selectedRunnerTagAvoidanceChoiceOptionId(
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): string | undefined {
  if (
    choice.source !== TAG_AVOIDANCE_CHOICE_SOURCE ||
    choice.kind !== "select_option" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1
  ) {
    return undefined;
  }
  return selectableOptions.find((option) =>
    option.id.startsWith(TAG_AVOIDANCE_OPTION_PREFIX),
  )?.id;
}
