import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";

import { RUNTIME_CARDS } from "../ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";

export type CorpScorelineDeadline =
  | "open"
  | "last_draw_window"
  | "current_turn_only";

export type CorpScorelineFeasibility = {
  feasible: boolean;
  totalAgendaPoints: number;
  maxReachablePoints: number;
  currentAgendaPoints: number;
  opponentAgendaPoints: number;
  pointsToWin: number;
  pointsNeeded: number;
  remainingAgendaPoints: number;
  remainingMandatoryDraws?: number;
  currentClicks: number;
  deadline: CorpScorelineDeadline;
  legalScoreActionIds: string[];
  affordableScoreActionIds: string[];
  currentTurnClosableActionIds: string[];
  evidence: string[];
};

type CorpScorelineFeasibilityInput = {
  side: Side;
  playerView: PlayerView;
  legalActions: readonly LegalAction[];
  deckSnapshot?: AiDeckStrategyDeckSnapshot;
};

type EnrichedAiDecisionInput = AiDecisionInput & {
  ownDeckSnapshot?: AiDeckStrategyDeckSnapshot;
};

export function corpScorelineFeasibilityForDecisionInput(
  input: AiDecisionInput,
): CorpScorelineFeasibility | undefined {
  const deckSnapshot = (input as EnrichedAiDecisionInput).ownDeckSnapshot;
  return assessCorpScorelineFeasibility({
    side: input.side,
    playerView: input.playerView,
    legalActions: input.legalActions,
    ...(deckSnapshot ? { deckSnapshot } : {}),
  });
}

export function assessCorpScorelineFeasibility(
  input: CorpScorelineFeasibilityInput,
): CorpScorelineFeasibility | undefined {
  if (input.side !== "corp" || !input.deckSnapshot) return undefined;
  const totalAgendaPoints = input.deckSnapshot.cards.reduce((sum, entry) => {
    const agendaPoints = RUNTIME_CARDS[entry.cardId]?.numeric.agendaPoints;
    return (
      sum +
      (typeof agendaPoints === "number" ? agendaPoints * entry.quantity : 0)
    );
  }, 0);
  if (totalAgendaPoints <= 0) return undefined;

  const currentAgendaPoints = nonNegativeNumber(
    input.playerView.own.agendaPoints,
  );
  const opponentAgendaPoints = nonNegativeNumber(
    input.playerView.opponent.agendaPoints,
  );
  const pointsToWin = Math.max(
    1,
    nonNegativeNumber(input.playerView.agendaPointsToWin),
  );
  const remainingAgendaPoints = Math.max(
    0,
    totalAgendaPoints - currentAgendaPoints - opponentAgendaPoints,
  );
  const maxReachablePoints = currentAgendaPoints + remainingAgendaPoints;
  const remainingDeckCards = optionalNonNegativeNumber(
    input.playerView.own.stackOrRdCount,
  );
  const mandatoryDrawCardsPerWindow = currentCorpMandatoryDrawCardsPerWindow(
    input.playerView,
  );
  const remainingMandatoryDraws =
    remainingDeckCards === undefined
      ? undefined
      : Math.floor(remainingDeckCards / mandatoryDrawCardsPerWindow);
  const deadline = scorelineDeadline(remainingMandatoryDraws);
  const legalScoreActions = input.legalActions.filter((action) =>
    actionAdvancesConcreteScoreline(input.playerView, action),
  );
  const affordableScoreActions = legalScoreActions.filter((action) =>
    actionIsCurrentlyAffordable(input.playerView, action),
  );
  const currentTurnClosableActionIds = affordableScoreActions
    .filter((action) =>
      actionCanCloseScorelineThisTurn(input.playerView, action),
    )
    .map((action) => action.actionId)
    .sort();

  return {
    feasible: maxReachablePoints >= pointsToWin,
    totalAgendaPoints,
    maxReachablePoints,
    currentAgendaPoints,
    opponentAgendaPoints,
    pointsToWin,
    pointsNeeded: Math.max(0, pointsToWin - currentAgendaPoints),
    remainingAgendaPoints,
    ...(remainingMandatoryDraws !== undefined
      ? { remainingMandatoryDraws }
      : {}),
    currentClicks: nonNegativeNumber(input.playerView.own.clicks),
    deadline,
    legalScoreActionIds: legalScoreActions
      .map((action) => action.actionId)
      .sort(),
    affordableScoreActionIds: affordableScoreActions
      .map((action) => action.actionId)
      .sort(),
    currentTurnClosableActionIds,
    evidence: [
      `scoreline_feasible:${maxReachablePoints >= pointsToWin}`,
      `scoreline_total_agenda_points:${totalAgendaPoints}`,
      `scoreline_current_agenda_points:${currentAgendaPoints}`,
      `scoreline_opponent_agenda_points:${opponentAgendaPoints}`,
      `scoreline_remaining_agenda_points:${remainingAgendaPoints}`,
      `scoreline_max_reachable_points:${maxReachablePoints}`,
      `scoreline_points_to_win:${pointsToWin}`,
      `scoreline_points_needed:${Math.max(0, pointsToWin - currentAgendaPoints)}`,
      `scoreline_deadline:${deadline}`,
      `scoreline_current_clicks:${nonNegativeNumber(input.playerView.own.clicks)}`,
      `scoreline_mandatory_draw_cards_per_window:${mandatoryDrawCardsPerWindow}`,
      `scoreline_legal_actions:${legalScoreActions.length}`,
      `scoreline_affordable_actions:${affordableScoreActions.length}`,
      `scoreline_current_turn_closeouts:${currentTurnClosableActionIds.length}`,
      ...(remainingMandatoryDraws !== undefined
        ? [`scoreline_remaining_mandatory_draws:${remainingMandatoryDraws}`]
        : []),
    ],
  };
}

function currentCorpMandatoryDrawCardsPerWindow(
  playerView: PlayerView,
): number {
  for (let index = playerView.publicEvents.length - 1; index >= 0; index -= 1) {
    const event = playerView.publicEvents[index];
    if (
      event?.type !== "mandatory_draw" ||
      event.publicPayload?.actor !== "corp"
    ) {
      continue;
    }
    const total = event.publicPayload.corpMandatoryTotalBaseDrawCount;
    if (typeof total === "number" && Number.isSafeInteger(total) && total > 0) {
      return total;
    }
  }
  return 1;
}

export function corpScorelineAllowsMultiTurnDevelopment(
  feasibility: CorpScorelineFeasibility | undefined,
): boolean {
  return (
    feasibility?.feasible !== false &&
    feasibility?.deadline !== "current_turn_only"
  );
}

export function corpScorelineActionCanCloseThisTurn(
  feasibility: CorpScorelineFeasibility | undefined,
  actionId: string,
): boolean {
  return feasibility?.currentTurnClosableActionIds.includes(actionId) === true;
}

function actionAdvancesConcreteScoreline(
  playerView: PlayerView,
  action: LegalAction,
): boolean {
  if (action.type === "score_agenda" || action.type === "advance_card") {
    return visibleCardForAction(playerView, action)?.type === "agenda";
  }
  return (
    action.type === "install_card" &&
    action.payload?.placement !== "ice" &&
    visibleCardForAction(playerView, action)?.type === "agenda"
  );
}

function actionCanCloseScorelineThisTurn(
  playerView: PlayerView,
  action: LegalAction,
): boolean {
  if (action.type === "score_agenda") return true;
  const agenda = visibleCardForAction(playerView, action);
  if (agenda?.type !== "agenda") return false;
  const requirement = optionalNonNegativeNumber(agenda.advancementRequirement);
  if (requirement === undefined) return false;
  const counters = nonNegativeNumber(agenda.advancementCounters);
  const clicks = nonNegativeNumber(playerView.own.clicks);
  const credits = nonNegativeNumber(playerView.own.credits);
  const actionClicks = actionCost(action, "clicks");
  const actionCredits = actionCost(action, "credits");
  const remainingAdvancements =
    action.type === "advance_card"
      ? Math.max(0, requirement - counters - 1)
      : action.type === "install_card"
        ? requirement
        : Number.POSITIVE_INFINITY;
  return (
    Number.isFinite(remainingAdvancements) &&
    actionClicks + remainingAdvancements <= clicks &&
    actionCredits + remainingAdvancements <= credits
  );
}

function actionIsCurrentlyAffordable(
  playerView: PlayerView,
  action: LegalAction,
): boolean {
  return (
    actionCost(action, "clicks") <= nonNegativeNumber(playerView.own.clicks) &&
    actionCost(action, "credits") <= nonNegativeNumber(playerView.own.credits)
  );
}

function visibleCardForAction(
  playerView: PlayerView,
  action: LegalAction,
): VisibleCard | undefined {
  const sourceId = String(action.source);
  return [
    playerView.own.gripOrHq,
    playerView.own.scoreArea,
    ...playerView.servers.flatMap((server) => [server.root, server.ice]),
  ]
    .flat()
    .find((card) => card.instanceId === sourceId);
}

function scorelineDeadline(
  remainingMandatoryDraws: number | undefined,
): CorpScorelineDeadline {
  if (remainingMandatoryDraws === 0) return "current_turn_only";
  if (remainingMandatoryDraws === 1) return "last_draw_window";
  return "open";
}

function actionCost(
  action: LegalAction,
  resource: "clicks" | "credits",
): number {
  return (action.costs ?? []).reduce(
    (sum, cost) => sum + nonNegativeNumber(cost[resource]),
    0,
  );
}

function nonNegativeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

function optionalNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}
