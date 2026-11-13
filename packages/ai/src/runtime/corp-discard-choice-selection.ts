import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { corpArchivesHasCertifiedPaidAccess } from "../corp/defense/corp-defense-layer-certification";
import { corpHandDispositionScore } from "../corp/hand-management/hand-disposition-score";
import { prepareCorpPunishHandRetention } from "../corp/punish/punish-hand-retention";
import { prepareCorpScoreHandRetention } from "../corp/score/score-hand-retention";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import type { ProjectedHandDisposition } from "../plans/turn-projection";
import { boundedSelectionCount } from "./choice-option";
import { discardOptionInstanceId } from "./discard-choice-option";
import type { DiscardKeepScorer } from "./discard-choice-selection";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

export type CorpDiscardBatchSelection = {
  readonly selectedOptionIds: string[];
  readonly archivesReachable: boolean;
  readonly exposedAgendaPoints: number;
  readonly terminalAgendaExposure: boolean;
  readonly evidenceCodes: readonly string[];
};

type DiscardGroup = {
  picks: number[];
  agendaPoints: number;
  keepCost: number;
  protections: number[];
};

const fullComparisonLimit = 128;
const largeHandGroupsPerExposure = 8;

/**
 * Selects the exact discard payload for the already-owned Corp hand plan.
 *
 * This is deliberately a hand-plan policy rather than a generic choice
 * resolver. It rejects avoidable terminal Archives exposure before preserving
 * plan-bound cards and comparing the remaining cleanup candidates.
 */
export function selectedCorpDiscardChoiceOptionIds(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
  scoreDiscardCandidate: DiscardKeepScorer,
  handOptions?: Readonly<{
    requiredCardIds: ReadonlySet<string>;
    acuteDefenseCardIds: ReadonlySet<string>;
  }>,
): CorpDiscardBatchSelection | undefined {
  const count = boundedSelectionCount(
    choice.minSelections,
    choice.maxSelections,
    selectableOptions.length,
  );
  const archives = input.playerView.servers.find(
    (server) => server.id === "archives",
  );
  const openArchives =
    archives !== undefined &&
    archives.ice.length === 0 &&
    archives.statuses?.some((status) => status.kind === "run_prohibited") !==
      true;
  const archivesReachable =
    openArchives ||
    (archives !== undefined &&
      corpArchivesHasCertifiedPaidAccess(input, archives));
  if (count <= 0) {
    return {
      selectedOptionIds: [],
      archivesReachable,
      exposedAgendaPoints: 0,
      terminalAgendaExposure: false,
      evidenceCodes: [],
    };
  }

  let archivesAgendaPoints = 0;
  if (archivesReachable) {
    for (const card of input.playerView.own.heapOrArchives) {
      const points = card.known ? visibleAgendaPoints(card) : undefined;
      if (points === undefined) return undefined;
      archivesAgendaPoints += points;
    }
  }

  const handByInstanceId = new Map(
    input.playerView.own.gripOrHq
      .filter((card) => card.known && card.definitionId)
      .map((card) => [card.instanceId, card]),
  );
  const candidates = selectableOptions
    .flatMap((option) => {
      const instanceId = discardOptionInstanceId(option);
      const card = instanceId ? handByInstanceId.get(instanceId) : undefined;
      if (!card?.definitionId) return [];
      const agendaPoints = visibleAgendaPoints(card);
      if (agendaPoints === undefined) return [];
      return [{ option, card, agendaPoints }];
    })
    .sort(
      (left, right) =>
        left.option.label.localeCompare(right.option.label, "de") ||
        left.option.id.localeCompare(right.option.id),
    );
  if (
    candidates.length !== selectableOptions.length ||
    new Set(candidates.map(({ card }) => card.instanceId)).size !==
      candidates.length ||
    new Set(candidates.map(({ option }) => option.id)).size !==
      candidates.length
  )
    return undefined;

  const pointsToLose = Math.max(
    0,
    input.playerView.agendaPointsToWin -
      input.playerView.opponent.agendaPoints -
      archivesAgendaPoints,
  );
  const terminal = (group: DiscardGroup) =>
    archivesReachable && group.agendaPoints >= pointsToLose;
  const score = candidates.map(({ card, agendaPoints }) => {
    const keep = corpHandDispositionScore({
      input,
      card,
      destination: "archives",
      baseKeepScore: scoreDiscardCandidate(input, card, "corp_discard_group"),
    });
    return {
      rank: handOptions?.requiredCardIds.has(card.instanceId)
        ? 5
        : discardProtectionRank(keep.planDisposition),
      cost: keep.total + (openArchives ? agendaPoints * 180 : 0),
      duplicateDiscount: keep.duplicateDiscountPerExtraCopy ?? 0,
    };
  });
  const fullComparison = combinationCountWithinLimit(candidates.length, count);
  const width = fullComparison
    ? fullComparisonLimit
    : largeHandGroupsPerExposure;
  const groups = Array.from(
    { length: count + 1 },
    () => new Map<number, DiscardGroup[]>(),
  );
  groups[0]!.set(0, [
    {
      picks: [],
      agendaPoints: 0,
      keepCost: 0,
      protections: [0, 0, 0, 0, 0, 0],
    },
  ]);

  // Separate the exact reachable-exposure classes at every depth. Capping the
  // frontier within a class cannot eliminate the only nonterminal batch.
  for (const [index, candidate] of candidates.entries()) {
    const { rank, cost, duplicateDiscount } = score[index]!;
    for (let size = Math.min(count, index + 1); size >= 1; size -= 1) {
      if (candidates.length - index - 1 < count - size) continue;
      const byExposure = groups[size]!;
      for (const prefix of groups[size - 1]!.values()) {
        for (const prior of prefix) {
          const agendaPoints = prior.agendaPoints + candidate.agendaPoints;
          const exposure = archivesReachable
            ? Math.min(pointsToLose, agendaPoints)
            : 0;
          const protections = [...prior.protections];
          protections[rank]! += 1;
          // A pair of discarded copies already lowered each other's base
          // keep score. Charge that pair's discount once, regardless of order.
          const sameDefinitionDiscarded =
            duplicateDiscount === 0
              ? 0
              : prior.picks.filter(
                  (pick) =>
                    candidates[pick]!.card.definitionId ===
                    candidate.card.definitionId,
                ).length;
          const group = {
            picks: [...prior.picks, index],
            agendaPoints,
            keepCost:
              prior.keepCost +
              cost +
              sameDefinitionDiscarded * duplicateDiscount,
            protections,
          };
          const bucket = byExposure.get(exposure);
          if (!bucket) byExposure.set(exposure, [group]);
          else {
            bucket.push(group);
            if (bucket.length > width) {
              bucket.sort(compareDiscardGroups);
              bucket.pop();
            }
          }
        }
      }
    }
  }

  const punishRetention = prepareCorpPunishHandRetention(input);
  const scoreRetention = prepareCorpScoreHandRetention(input);
  const complete = [...groups[count]!.values()].flat();
  const hasNonterminalBatch = complete.some((group) => !terminal(group));
  const best = complete
    .filter((group) => !hasNonterminalBatch || !terminal(group))
    .map((group) => {
      const discarded = new Set(
        group.picks.map((index) => candidates[index]!.card.instanceId),
      );
      const remaining = input.playerView.own.gripOrHq.filter(
        (card) => !discarded.has(card.instanceId),
      );
      const punish = punishRetention(remaining);
      const acuteDefense = remaining.some((card) =>
        handOptions?.acuteDefenseCardIds.has(card.instanceId),
      );
      const score = scoreRetention(remaining);
      const totalCost =
        group.keepCost - punish.value - score - (acuteDefense ? 580 : 0);
      return { group, punish, score, acuteDefense, totalCost };
    })
    .sort(
      (left, right) =>
        compareProtections(left.group, right.group) ||
        // Both are retention values on the existing keep-score scale. Exact
        // routes and terminal exposure stay outside this finite comparison.
        left.totalCost - right.totalCost ||
        comparePickOrder(left.group, right.group),
    )[0];
  if (!best) return undefined;
  return {
    selectedOptionIds: best.group.picks.map(
      (index) => candidates[index]!.option.id,
    ),
    archivesReachable,
    exposedAgendaPoints: best.group.agendaPoints,
    terminalAgendaExposure: terminal(best.group),
    evidenceCodes: [
      fullComparison
        ? "corp_discard_group_search:complete"
        : "corp_discard_group_search:bounded",
      `corp_discard_retained_punish_damage:${best.punish.damage}`,
      `corp_discard_retained_punish_draw_options:${best.punish.drawOptions}`,
      `corp_discard_retained_score_support:${best.score}`,
      ...(best.acuteDefense ? ["corp_discard_retained_acute_defense"] : []),
    ],
  };
}

function combinationCountWithinLimit(n: number, k: number): boolean {
  const factors = Math.min(k, n - k);
  let combinations = 1;
  for (let index = 1; index <= factors; index += 1) {
    combinations = (combinations * (n - index + 1)) / index;
    if (combinations > fullComparisonLimit) return false;
  }
  return true;
}

function compareDiscardGroups(left: DiscardGroup, right: DiscardGroup): number {
  return (
    compareProtections(left, right) ||
    left.keepCost - right.keepCost ||
    comparePickOrder(left, right)
  );
}

function compareProtections(left: DiscardGroup, right: DiscardGroup): number {
  for (let rank = left.protections.length - 1; rank > 0; rank -= 1) {
    const difference = left.protections[rank]! - right.protections[rank]!;
    if (difference !== 0) return difference;
  }
  return 0;
}

function comparePickOrder(left: DiscardGroup, right: DiscardGroup): number {
  for (const [index, pick] of left.picks.entries()) {
    const difference = pick - right.picks[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}

function visibleAgendaPoints(card: VisibleCard): number | undefined {
  const definition = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
  const type = card.type ?? definition?.type;
  if (type !== "agenda") return 0;
  const points = card.agendaPoints ?? definition?.agendaPoints;
  return typeof points === "number" &&
    Number.isSafeInteger(points) &&
    points >= 0
    ? points
    : undefined;
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
