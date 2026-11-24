import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import { corpDefensePackageRetentionPairs } from "../defense/corp-defense-package-retention";
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
  if (!Number.isSafeInteger(exposedBeforeRetention)) return fail();
  const requiredRetainedPoints = archivesOpen
    ? Math.max(
        0,
        exposedBeforeRetention - input.playerView.agendaPointsToWin + 1,
      )
    : 0;
  const rankedOptions = ranked.map((entry, index) => ({
    index,
    instanceId: entry.card.instanceId,
    optionId: entry.option.id,
    score: entry.score,
    agendaPoints: archivesOpen ? points(entry.card) : 0,
  }));
  if (rankedOptions.some((option) => !Number.isFinite(option.score)))
    return fail();

  const byInstance = new Map(
    rankedOptions.map((option) => [option.instanceId, option]),
  );
  const maximumCount =
    requiredRetainedPoints > 0 ? absoluteAffordableCount : count;
  const selections = retentionSelections(
    rankedOptions,
    maximumCount,
    requiredRetainedPoints,
    [],
    0,
  );
  // A package's value is its best eligible pair. Maximizing over each forced
  // pair and the unbonused selection preserves the same portfolio scoring.
  for (const pair of corpDefensePackageRetentionPairs(
    input,
    ranked.map(({ card }) => card),
  )) {
    const ice = byInstance.get(pair.iceInstanceId);
    const support = byInstance.get(pair.supportInstanceId);
    if (!ice || !support || ice === support || maximumCount < 2) continue;
    const withPair = retentionSelections(
      rankedOptions,
      maximumCount,
      requiredRetainedPoints,
      [ice, support],
      pair.bonus,
    );
    for (let size = 2; size <= maximumCount; size++) {
      for (const [agendaPoints, selection] of withPair[size]!) {
        keepBetterSelection(selections[size]!, agendaPoints, selection);
      }
    }
  }
  for (let size = count; size <= maximumCount; size++) {
    const safe = selections[size]!.get(requiredRetainedPoints);
    if (safe) return selectedOptionIds(safe);
  }
  const baseline = [...selections[count]!.values()].sort(compareSelections)[0];
  return baseline ? selectedOptionIds(baseline) : fail();
}

type RankedRetentionOption = {
  index: number;
  instanceId: string;
  optionId: string;
  score: number;
  agendaPoints: number;
};

type RetentionSelection = {
  options: readonly RankedRetentionOption[];
  value: number;
  tieKey: string;
};

function retentionSelections(
  options: readonly RankedRetentionOption[],
  maximumCount: number,
  requiredPoints: number,
  forced: readonly RankedRetentionOption[],
  bonus: number,
): Array<Map<number, RetentionSelection>> {
  const selections = Array.from(
    { length: maximumCount + 1 },
    () => new Map<number, RetentionSelection>(),
  );
  const initialPoints = Math.min(
    requiredPoints,
    forced.reduce((sum, entry) => sum + entry.agendaPoints, 0),
  );
  const initialValue = forced.reduce((sum, entry) => sum + entry.score, bonus);
  selections[forced.length]!.set(
    initialPoints,
    retentionSelection(forced, initialValue),
  );
  for (const option of options) {
    if (forced.includes(option)) continue;
    for (let count = maximumCount; count > forced.length; count--) {
      for (const [points, prior] of selections[count - 1]!) {
        const nextPoints = Math.min(
          requiredPoints,
          points + option.agendaPoints,
        );
        const next = retentionSelection(
          [...prior.options, option],
          prior.value + option.score,
        );
        keepBetterSelection(selections[count]!, nextPoints, next);
      }
    }
  }
  return selections;
}

function retentionSelection(
  options: readonly RankedRetentionOption[],
  value: number,
): RetentionSelection {
  return {
    options,
    value,
    tieKey: options
      .map(({ optionId }) => optionId)
      .sort()
      .join("|"),
  };
}

function compareSelections(
  left: RetentionSelection,
  right: RetentionSelection,
): number {
  return right.value - left.value || left.tieKey.localeCompare(right.tieKey);
}

function keepBetterSelection(
  selections: Map<number, RetentionSelection>,
  points: number,
  candidate: RetentionSelection,
): void {
  const prior = selections.get(points);
  if (!prior || compareSelections(candidate, prior) < 0)
    selections.set(points, candidate);
}

function selectedOptionIds(selection: RetentionSelection): string[] {
  return [...selection.options]
    .sort((left, right) => left.index - right.index)
    .map(({ optionId }) => optionId);
}
