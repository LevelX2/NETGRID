import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { quoteCorpDefensePackageRetention } from "../defense/corp-defense-package-retention";
import { discardOptionInstanceId } from "../../runtime/discard-choice-option";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

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
  )
    return undefined;
  const fail = (): never => {
    throw new PlanResolutionFailure("invalid_player_view_card_projection", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "window_resolution",
      removalCondition:
        "Bind every HQ-retention option to its exact known owned card and validate the complete own Archives/HQ agenda-point inventory before comparing terminal exposure.",
    });
  };
  const absoluteAffordableCount = Math.min(
    choice.maxSelections,
    selectableOptions.length,
    Math.floor(input.playerView.own.credits / RETAIN_COST_PER_CARD),
  );
  const count = Math.max(
    choice.minSelections,
    Math.min(
      choice.maxSelections,
      selectableOptions.length,
      Math.max(
        0,
        Math.floor(
          (input.playerView.own.credits - CORP_REZ_AND_DEVELOPMENT_RESERVE) /
            RETAIN_COST_PER_CARD,
        ),
      ),
    ),
  );
  if (
    !Number.isSafeInteger(absoluteAffordableCount) ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    count > absoluteAffordableCount
  )
    return fail();
  if (absoluteAffordableCount === 0) return [];
  const handByInstanceId = new Map(
    input.playerView.own.gripOrHq.map((card) => [card.instanceId, card]),
  );
  const seen = new Set<string>();
  const ranked = selectableOptions
    .map((option) => {
      const instanceId = discardOptionInstanceId(option);
      const card = instanceId ? handByInstanceId.get(instanceId) : undefined;
      if (!card || card.known !== true || seen.has(card.instanceId))
        return fail();
      seen.add(card.instanceId);
      return { option, card, score: scoreKeepCandidate(input, card).total };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.option.label.localeCompare(right.option.label, "de") ||
        left.option.id.localeCompare(right.option.id),
    );
  const archives = input.playerView.servers.find(
    (server) => server.id === "archives",
  );
  const archivesOpen =
    archives !== undefined &&
    archives.ice.length === 0 &&
    archives.statuses?.some((status) => status.kind === "run_prohibited") !==
      true;
  const points = (card: VisibleCard): number => {
    if (card.known !== true || typeof card.type !== "string") return fail();
    if (card.type !== "agenda") return 0;
    if (
      typeof card.agendaPoints !== "number" ||
      !Number.isSafeInteger(card.agendaPoints) ||
      card.agendaPoints < 0
    )
      return fail();
    return card.agendaPoints;
  };
  // Own zones are complete. The public Archives mirror is not the inventory.
  let exposedBeforeRetention = 0;
  if (archivesOpen) {
    if (
      !Number.isSafeInteger(input.playerView.agendaPointsToWin) ||
      input.playerView.agendaPointsToWin < 1 ||
      !Number.isSafeInteger(input.playerView.opponent.agendaPoints) ||
      input.playerView.opponent.agendaPoints < 0
    )
      return fail();
    exposedBeforeRetention =
      input.playerView.opponent.agendaPoints +
      [
        ...input.playerView.own.heapOrArchives,
        ...input.playerView.own.gripOrHq,
      ].reduce((sum, card) => sum + points(card), 0);
  }
  const selectedSets = (selectionCount: number) =>
    combinations(ranked, selectionCount)
      .map((entries) => ({
        entries,
        terminalExposure:
          archivesOpen &&
          exposedBeforeRetention -
            entries.reduce((sum, entry) => sum + points(entry.card), 0) >=
            input.playerView.agendaPointsToWin,
        total:
          entries.reduce((sum, entry) => sum + entry.score, 0) +
          quoteCorpDefensePackageRetention(
            input,
            entries.map((entry) => entry.card),
          ).bonus,
        key: entries
          .map((entry) => entry.option.id)
          .sort()
          .join("|"),
      }))
      .sort(
        (left, right) =>
          right.total - left.total || left.key.localeCompare(right.key),
      );
  const baseline = selectedSets(count);
  if (!baseline.length) return fail();
  // Change neither ordinary reserve spending nor already unavoidable exposure.
  // Only the cheapest payable set that removes terminal open-Archives exposure
  // may consume additional reserve; at the same count safety precedes keep value.
  for (
    let selectionCount = count;
    selectionCount <= absoluteAffordableCount;
    selectionCount++
  ) {
    const sets =
      selectionCount === count ? baseline : selectedSets(selectionCount);
    const safe = sets.find((set) => !set.terminalExposure);
    if (safe) return safe.entries.map((entry) => entry.option.id);
    if (!archivesOpen) break;
  }
  return baseline[0]!.entries.map((entry) => entry.option.id);
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
    for (let index = start; index <= values.length - remaining; index++) {
      selected.push(values[index]!);
      visit(index + 1, selected);
      selected.pop();
    }
  };
  visit(0, []);
  return result;
}
