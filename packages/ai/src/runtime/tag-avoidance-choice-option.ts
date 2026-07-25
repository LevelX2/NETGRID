import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerOptionalChoiceResolution } from "./damage-prevention-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const TAG_AVOIDANCE_CHOICE_SOURCE = "v120.event_modification.avoid";
const TAG_AVOIDANCE_OPTION_PREFIX = "card_implementation_avoid_tag_";

export function runnerTagAvoidanceChoiceResolution(
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
): RunnerOptionalChoiceResolution | undefined {
  if (
    choice.source !== TAG_AVOIDANCE_CHOICE_SOURCE ||
    choice.kind !== "select_option" ||
    choice.minSelections !== 1 ||
    choice.maxSelections !== 1
  ) {
    return undefined;
  }
  const optionId = selectableOptions.find((option) =>
    option.id.startsWith(TAG_AVOIDANCE_OPTION_PREFIX),
  )?.id;
  return optionId ? { kind: "select", optionId } : { kind: "pass" };
}
