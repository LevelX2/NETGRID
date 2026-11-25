import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerOptionalChoiceResolution } from "./damage-prevention-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

const TAG_AVOIDANCE_CHOICE_SOURCE = "v120.event_modification.avoid";
const TAG_AVOIDANCE_OPTION_PREFIX = "card_implementation_avoid_tag_";

export function runnerTagAvoidanceChoiceResolution(
  input: AiDecisionInput,
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
  const corpCanStillAct =
    input.playerView.activeSide === "corp" &&
    input.playerView.opponent.clicks > 0;
  const optionId = selectableOptions.find(
    (option) =>
      option.id.startsWith(TAG_AVOIDANCE_OPTION_PREFIX) &&
      !(
        corpCanStillAct &&
        option.metadata?.tagAvoidanceSpendsMeatProtectionWhileTagged === true
      ),
  )?.id;
  return optionId ? { kind: "select", optionId } : { kind: "pass" };
}
