import {
  CARD_DEFINITIONS_BY_ID,
  type CardInstanceId,
  type CounterType,
  type GameState,
  type Side,
  type Winner,
} from "@netgrid/shared";

export const BAD_PUBLICITY_LOSS_THRESHOLD = 7;

export function checkWinConditions(state: GameState): Winner | null {
  if (state.corp.badPublicity >= BAD_PUBLICITY_LOSS_THRESHOLD) {
    state.winner = "runner";
    state.gameEndReason = "bad_publicity_7";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    delete state.pendingChoice;
    delete state.run;
    return state.winner;
  }
  if (state.winner) {
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
    state.gameEndReason ??= "unknown";
    return state.winner;
  }
  const runnerPoints = agendaPoints(state, "runner");
  const corpPoints = agendaPoints(state, "corp");
  if (
    runnerPoints >= state.agendaPointsToWin &&
    corpPoints >= state.agendaPointsToWin
  )
    state.winner = "draw";
  else if (runnerPoints >= state.agendaPointsToWin) state.winner = "runner";
  else if (corpPoints >= state.agendaPointsToWin) state.winner = "corp";
  if (state.winner) {
    state.gameEndReason = "agenda_points";
    state.phase = "game_over";
    state.timingPoint = "game.checkpoint";
  }
  return state.winner;
}

function agendaPoints(state: GameState, side: Side): number {
  const ids = side === "corp" ? state.corp.scoreArea : state.runner.scoreArea;
  const scoredPoints = ids.reduce(
    (sum, id) => sum + agendaPointsForScoredCard(state, id),
    0,
  );
  return side === "corp"
    ? scoredPoints + Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0))
    : scoredPoints;
}

function agendaPointsForScoredCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const definition = definitionFor(state, cardId);
  const basePoints = definition.agendaPoints ?? 0;
  const bonusPoints = cardCounter(state, cardId, "agenda");
  const spentPoints = Math.max(
    0,
    Math.floor(state.cardInstances[cardId]?.agendaPointsSpent ?? 0),
  );
  return Math.max(0, basePoints + bonusPoints - spentPoints);
}

function cardCounter(
  state: GameState,
  cardId: CardInstanceId,
  counterType: CounterType,
): number {
  return state.cardInstances[cardId]?.counters?.[counterType] ?? 0;
}

function definitionFor(state: GameState, id: CardInstanceId) {
  const instance = state.cardInstances[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  const definition = CARD_DEFINITIONS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}
