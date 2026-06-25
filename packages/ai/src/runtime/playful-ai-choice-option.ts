import { type AiDecisionInput } from "@netgrid/shared";

import { playfulAiGainValue } from "./choice-option";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

export function selectedPlayfulAiChoiceOptionId(
  choice: PendingChoice,
): string | undefined {
  return (
    choice.options.slice().sort((left, right) => {
      const leftValue = playfulAiGainValue(left);
      const rightValue = playfulAiGainValue(right);
      return rightValue - leftValue || left.id.localeCompare(right.id);
    })[0] ?? choice.options[0]
  )?.id;
}
