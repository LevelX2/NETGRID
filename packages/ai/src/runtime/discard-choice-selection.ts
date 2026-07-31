import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { boundedSelectionCount } from "./choice-option";
import {
  discardOptionInstanceId,
  stableDiscardChoiceOptionIds,
} from "./discard-choice-option";
import type { ProjectedHandDisposition } from "../plans/turn-projection";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];
type DiscardScore = {
  readonly total: number;
  readonly planDisposition?: ProjectedHandDisposition;
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
  const candidates = selectableOptions.map((option) => {
    const instanceId = discardOptionInstanceId(option);
    const card = instanceId ? handByInstanceId.get(instanceId) : undefined;
    if (!card || !card.definitionId) return undefined;
    return { option, card };
  });
  if (candidates.some((entry) => !entry))
    return stableDiscardChoiceOptionIds(selectableOptions, count);
  const remaining = candidates.filter(
    (
      entry,
    ): entry is {
      option: (typeof selectableOptions)[number];
      card: VisibleCard;
    } => Boolean(entry),
  );
  const selectedOptionIds: string[] = [];
  let scoringInput = input;
  while (selectedOptionIds.length < count && remaining.length > 0) {
    const ranked = remaining
      .map((entry) => ({
        ...entry,
        score: scoreDiscardCandidate(scoringInput, entry.card),
      }))
      .sort(compareDiscardCandidates);
    const selected = ranked[0]!;
    selectedOptionIds.push(selected.option.id);
    remaining.splice(
      remaining.findIndex((entry) => entry.option.id === selected.option.id),
      1,
    );
    scoringInput = inputWithoutDiscardedCard(
      scoringInput,
      selected.card.instanceId,
    );
  }
  return selectedOptionIds;
}

function compareDiscardCandidates(
  left: { option: PendingChoiceOption; score: DiscardScore },
  right: { option: PendingChoiceOption; score: DiscardScore },
): number {
  return (
    discardProtectionRank(left.score.planDisposition) -
      discardProtectionRank(right.score.planDisposition) ||
    left.score.total - right.score.total ||
    left.option.label.localeCompare(right.option.label, "de") ||
    left.option.id.localeCompare(right.option.id)
  );
}

function discardProtectionRank(
  disposition: ProjectedHandDisposition | undefined,
): number {
  switch (disposition) {
    case "current_plan_route":
      return 5;
    case "support_for_need":
    case "campaign_hold":
      return 4;
    case "blocked_but_developable":
      return 2;
    case "assessment_unknown":
      return 1;
    case "redundant":
    case "currently_dead":
    case "discard_candidate":
    case undefined:
      return 0;
  }
}

function inputWithoutDiscardedCard(
  input: AiDecisionInput,
  instanceId: string,
): AiDecisionInput {
  return {
    ...input,
    playerView: {
      ...input.playerView,
      own: {
        ...input.playerView.own,
        gripOrHq: input.playerView.own.gripOrHq.filter(
          (card) => card.instanceId !== instanceId,
        ),
      },
    },
  };
}
