import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { quoteCorpDefensePackageRetention } from "./corp-defense-package-retention";
import { discardOptionInstanceId } from "./discard-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];
type KeepScore = { readonly total: number };

const RETAIN_COST_PER_CARD = 2;
const CORP_REZ_AND_DEVELOPMENT_RESERVE = 5;

export function selectedCorpHqRetainPaymentOptionIds(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
  scoreKeepCandidate: (input: AiDecisionInput, card: VisibleCard) => KeepScore,
): string[] | undefined {
  if (
    input.side !== "corp" ||
    choice.kind !== "select_cards" ||
    !choice.source.startsWith("runner.successful_hq_run_corp_pay_to_retain_hq:")
  ) {
    return undefined;
  }

  const affordableAboveReserve = Math.max(
    0,
    Math.floor(
      (input.playerView.own.credits - CORP_REZ_AND_DEVELOPMENT_RESERVE) /
        RETAIN_COST_PER_CARD,
    ),
  );
  const count = Math.max(
    choice.minSelections,
    Math.min(
      choice.maxSelections,
      selectableOptions.length,
      affordableAboveReserve,
    ),
  );
  if (count <= 0) return [];

  const handByInstanceId = new Map(
    input.playerView.own.gripOrHq
      .filter((card) => card.known !== false)
      .map((card) => [card.instanceId, card]),
  );
  const ranked = selectableOptions
    .map((option) => {
      const instanceId = discardOptionInstanceId(option);
      const card = instanceId ? handByInstanceId.get(instanceId) : undefined;
      return card
        ? { option, card, score: scoreKeepCandidate(input, card).total }
        : undefined;
    })
    .filter(
      (
        entry,
      ): entry is {
        option: PendingChoiceOption;
        card: VisibleCard;
        score: number;
      } => entry !== undefined,
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.option.label.localeCompare(right.option.label, "de") ||
        left.option.id.localeCompare(right.option.id),
    );
  if (ranked.length !== selectableOptions.length) {
    return selectableOptions
      .slice()
      .sort(
        (left, right) =>
          left.label.localeCompare(right.label, "de") ||
          left.id.localeCompare(right.id),
      )
      .slice(0, count)
      .map((option) => option.id);
  }
  const selectedSet = combinations(ranked, count)
    .map((entries) => {
      const defenseQuote = quoteCorpDefensePackageRetention(
        input,
        entries.map((entry) => entry.card),
      );
      return {
        entries,
        total:
          entries.reduce((sum, entry) => sum + entry.score, 0) +
          defenseQuote.bonus,
        key: entries
          .map((entry) => entry.option.id)
          .sort()
          .join("|"),
      };
    })
    .sort(
      (left, right) =>
        right.total - left.total || left.key.localeCompare(right.key),
    )[0];
  return selectedSet?.entries.map((entry) => entry.option.id) ?? [];
}

function combinations<T>(values: readonly T[], count: number): T[][] {
  if (count === 0) return [[]];
  if (count < 0 || count > values.length) return [];
  const result: T[][] = [];
  const visit = (start: number, selected: T[]): void => {
    if (selected.length === count) {
      result.push([...selected]);
      return;
    }
    const remaining = count - selected.length;
    for (let index = start; index <= values.length - remaining; index += 1) {
      selected.push(values[index]!);
      visit(index + 1, selected);
      selected.pop();
    }
  };
  visit(0, []);
  return result;
}
