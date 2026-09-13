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
export type DiscardChoiceKeepScore = {
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
  ) => DiscardChoiceKeepScore,
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
  return selectDiscardCardKeys(
    input,
    remaining.map(({ option, card }) => ({
      key: option.id,
      label: option.label,
      card,
    })),
    count,
    scoreDiscardCandidate,
  );
}

/** Shared sequential hand selection; keys bind current options or projected card identities. */
export function selectDiscardCardKeys(
  input: AiDecisionInput,
  candidates: readonly { key: string; label: string; card: VisibleCard }[],
  count: number,
  scoreDiscardCandidate: DiscardKeepScorer,
): string[] {
  const remaining = [...candidates];
  const selectedOptionIds: string[] = [];
  let scoringInput = input;
  while (selectedOptionIds.length < count && remaining.length > 0) {
    const ranked = remaining
      .map((entry) => ({
        ...entry,
        score: scoreDiscardCandidate(scoringInput, entry.card),
      }))
      .sort(
        (left, right) =>
          compareDiscardKeepScores(left.score, right.score) ||
          left.label.localeCompare(right.label, "de") ||
          left.key.localeCompare(right.key),
      );
    const selected = ranked[0]!;
    selectedOptionIds.push(selected.key);
    remaining.splice(
      remaining.findIndex((entry) => entry.key === selected.key),
      1,
    );
    scoringInput = inputWithoutDiscardedCard(
      scoringInput,
      selected.card.instanceId,
    );
  }
  return selectedOptionIds;
}

export function compareDiscardKeepScores(
  left: DiscardChoiceKeepScore,
  right: DiscardChoiceKeepScore,
): number {
  return (
    discardProtectionRank(left.planDisposition) -
      discardProtectionRank(right.planDisposition) || left.total - right.total
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

export type DiscardKeepScorer = (
  input: AiDecisionInput,
  card: VisibleCard,
) => DiscardChoiceKeepScore;
