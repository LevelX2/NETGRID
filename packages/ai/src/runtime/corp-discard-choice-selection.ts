import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import type { ProjectedHandDisposition } from "../plans/turn-projection";
import { boundedSelectionCount } from "./choice-option";
import { discardOptionInstanceId } from "./discard-choice-option";
import type { DiscardChoiceKeepScore } from "./discard-choice-selection";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;
type PendingChoiceOption = PendingChoice["options"][number];

export type CorpDiscardBatchSelection = {
  readonly selectedOptionIds: string[];
  readonly archivesReachable: boolean;
  readonly exposedAgendaPoints: number;
  readonly terminalAgendaExposure: boolean;
};

/**
 * Selects the exact discard payload for the already-owned Corp hand plan.
 *
 * This is deliberately a hand-plan policy rather than a generic choice
 * resolver. It preserves plan-bound cards first, then evaluates the cleanup
 * batch against the points it would expose in immediately reachable Archives.
 */
export function selectedCorpDiscardChoiceOptionIds(
  input: AiDecisionInput,
  choice: PendingChoice,
  selectableOptions: readonly PendingChoiceOption[],
  scoreDiscardCandidate: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => DiscardChoiceKeepScore,
): CorpDiscardBatchSelection | undefined {
  const count = boundedSelectionCount(
    choice.minSelections,
    choice.maxSelections,
    selectableOptions.length,
  );
  const archives = input.playerView.servers.find(
    (server) => server.id === "archives",
  );
  const archivesReachable =
    archives !== undefined &&
    archives.ice.length === 0 &&
    archives.statuses?.some((status) => status.kind === "run_prohibited") !==
      true;
  if (count <= 0) {
    return {
      selectedOptionIds: [],
      archivesReachable,
      exposedAgendaPoints: 0,
      terminalAgendaExposure: false,
    };
  }

  const handByInstanceId = new Map(
    input.playerView.own.gripOrHq
      .filter((card) => card.known && card.definitionId)
      .map((card) => [card.instanceId, card]),
  );
  const candidates = selectableOptions.flatMap((option) => {
    const instanceId = discardOptionInstanceId(option);
    const card = instanceId ? handByInstanceId.get(instanceId) : undefined;
    if (!card?.definitionId) return [];
    const agendaPoints = visibleAgendaPoints(card);
    if (agendaPoints === undefined) return [];
    return [{ option, card, agendaPoints }];
  });
  if (candidates.length !== selectableOptions.length) return undefined;

  const selectedOptionIds: string[] = [];
  let exposedAgendaPoints = 0;
  let scoringInput = input;
  while (selectedOptionIds.length < count && candidates.length > 0) {
    const ranked = candidates
      .map((candidate) => ({
        ...candidate,
        score: scoreDiscardCandidate(scoringInput, candidate.card),
      }))
      .sort((left, right) =>
        compareCorpDiscardCandidates({
          left,
          right,
          archivesReachable,
          exposedAgendaPoints,
          runnerAgendaPoints: input.playerView.opponent.agendaPoints,
          agendaPointsToWin: input.playerView.agendaPointsToWin,
        }),
      );
    const selected = ranked[0]!;
    selectedOptionIds.push(selected.option.id);
    exposedAgendaPoints += selected.agendaPoints;
    candidates.splice(
      candidates.findIndex(
        (candidate) => candidate.option.id === selected.option.id,
      ),
      1,
    );
    scoringInput = inputWithoutDiscardedCard(
      scoringInput,
      selected.card.instanceId,
    );
  }

  return {
    selectedOptionIds,
    archivesReachable,
    exposedAgendaPoints,
    terminalAgendaExposure:
      archivesReachable &&
      input.playerView.opponent.agendaPoints + exposedAgendaPoints >=
        input.playerView.agendaPointsToWin,
  };
}

function compareCorpDiscardCandidates(params: {
  left: {
    option: PendingChoiceOption;
    agendaPoints: number;
    score: DiscardChoiceKeepScore;
  };
  right: {
    option: PendingChoiceOption;
    agendaPoints: number;
    score: DiscardChoiceKeepScore;
  };
  archivesReachable: boolean;
  exposedAgendaPoints: number;
  runnerAgendaPoints: number;
  agendaPointsToWin: number;
}): number {
  const protectionDifference =
    discardProtectionRank(params.left.score.planDisposition) -
    discardProtectionRank(params.right.score.planDisposition);
  if (protectionDifference !== 0) return protectionDifference;

  const leftExposure = discardExposureCost(params, params.left.agendaPoints);
  const rightExposure = discardExposureCost(params, params.right.agendaPoints);
  return (
    Number(leftExposure.terminal) - Number(rightExposure.terminal) ||
    params.left.score.total +
      leftExposure.keepPenalty -
      (params.right.score.total + rightExposure.keepPenalty) ||
    params.left.option.label.localeCompare(params.right.option.label, "de") ||
    params.left.option.id.localeCompare(params.right.option.id)
  );
}

function discardExposureCost(
  params: {
    archivesReachable: boolean;
    exposedAgendaPoints: number;
    runnerAgendaPoints: number;
    agendaPointsToWin: number;
  },
  candidateAgendaPoints: number,
): { terminal: boolean; keepPenalty: number } {
  if (!params.archivesReachable || candidateAgendaPoints <= 0) {
    return { terminal: false, keepPenalty: 0 };
  }
  const projectedExposedPoints =
    params.exposedAgendaPoints + candidateAgendaPoints;
  return {
    terminal:
      params.runnerAgendaPoints + projectedExposedPoints >=
      params.agendaPointsToWin,
    // This is intentionally finite: a nonterminal agenda may still be the
    // correct discard when every alternative protects a materially stronger
    // current route. Terminal exposure is the separate strict batch guard.
    keepPenalty: candidateAgendaPoints * 180,
  };
}

function visibleAgendaPoints(card: VisibleCard): number | undefined {
  const definition = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
  const type = card.type ?? definition?.type;
  if (type !== "agenda") return 0;
  return card.agendaPoints ?? definition?.agendaPoints;
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
