import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { boundedSelectionCount } from "./choice-option";
import {
  discardOptionInstanceId,
  stableDiscardChoiceOptionIds,
} from "./discard-choice-option";

type PendingChoice = NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;
type PendingChoiceOption = PendingChoice["options"][number];
type DiscardScore = {
  readonly total: number;
};

export function selectedDiscardChoiceOptionIds(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
  scoreDiscardCandidate: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => DiscardScore,
): string[] {
  const count = boundedSelectionCount(
    choice.minSelections,
    choice.maxSelections,
    selectableOptions.length,
  );
  if (count <= 0) return [];
  const handByInstanceId = new Map(
    input.playerView.own.gripOrHq
      .filter((card) => card.known)
      .map((card) => [card.instanceId, card]),
  );
  const scored = selectableOptions.map((option) => {
    const instanceId = discardOptionInstanceId(option);
    const card = instanceId ? handByInstanceId.get(instanceId) : undefined;
    if (!card || !card.definitionId) return undefined;
    return { option, score: scoreDiscardCandidate(input, card) };
  });
  if (scored.some((entry) => !entry))
    return stableDiscardChoiceOptionIds(selectableOptions, count);
  return scored
    .filter(
      (
        entry,
      ): entry is {
        option: (typeof selectableOptions)[number];
        score: DiscardScore;
      } => Boolean(entry),
    )
    .sort(
      (left, right) =>
        left.score.total - right.score.total ||
        left.option.label.localeCompare(right.option.label, "de") ||
        left.option.id.localeCompare(right.option.id),
    )
    .slice(0, count)
    .map((entry) => entry.option.id);
}
