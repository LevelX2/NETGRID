import {
  getLegalActions,
  getPlayerView,
  hashState,
  redactPublicEventForSide,
} from "@netgrid/engine";
import type { PublicGameEvent, Side } from "@netgrid/shared";
import type { ApiPlayerClockSnapshot } from "@netgrid/shared";
import type {
  AiTurnPresentationState,
  GameResultSummary,
  SidePayload,
  StoredMatch,
} from "./multiplayer";

export const SIDE_PAYLOAD_EVENT_TAIL_LIMIT = 80;

export type SidePayloadBuilderDeps = {
  isAiSide: (side: Side) => boolean;
  safeDisplayNameFor: (side: Side) => string | undefined;
  aiTurnPresentationFor: (side: Side) => AiTurnPresentationState | undefined;
  resultSummaryFor: (
    side: Side,
    finalStateHash: string,
  ) => GameResultSummary | undefined;
  retentionProtectionPayload: {
    retentionProtected: boolean;
    retentionProtectedAt?: string;
  };
  playerClockSnapshot?: ApiPlayerClockSnapshot;
};

export function buildSidePayload(
  record: StoredMatch,
  side: Side,
  deps: SidePayloadBuilderDeps,
): SidePayload {
  if (!record.gameState) throw new Error("match_not_active");
  const opponentSide = opposite(side);
  const chronicleTurnContext = chronicleTurnContextByEventId(record.eventLog.map((event) => event.publicPayload));
  const eventTail = record.eventLog
    .slice(-SIDE_PAYLOAD_EVENT_TAIL_LIMIT)
    .map((event) => withChronicleTurnContext(redactPublicEventForSide(event.publicPayload, side), chronicleTurnContext[event.eventId]));
  const playerView = {
    ...getPlayerView(record.gameState, side),
    publicEvents: eventTail,
  };
  const opponent = record.sessions.find(
    (session) => session.side === opponentSide,
  );
  const opponentIsAi = deps.isAiSide(opponentSide);
  const pendingUndo = record.pendingUndo
    ? opponentIsAi
      ? undefined
      : {
          ...record.pendingUndo,
          needsResponse: record.pendingUndo.requestedBy !== side,
        }
    : undefined;
  const lifecycleFinalHash = record.lifecycleResult?.finalEngineStateHash;
  const terminalWinner =
    record.lifecycleResult?.winnerSide ??
    (record.match.status === "forfeited"
      ? record.lifecycleResult?.winnerSide
      : record.gameState.winner);
  const finalStateHash = terminalWinner
    ? lifecycleFinalHash ?? hashState(record.gameState)
    : undefined;
  const resultSummary =
    terminalWinner && finalStateHash
      ? deps.resultSummaryFor(side, finalStateHash)
      : undefined;
  const aiTurnPresentation = deps.aiTurnPresentationFor(side);
  const opponentDisplayName = deps.safeDisplayNameFor(opponentSide);

  return {
    matchId: record.match.matchId,
    matchStatus: record.match.status,
    matchVersion: record.match.matchVersion,
    side,
    playerView,
    legalActions:
      record.match.status === "active" ? getLegalActions(record.gameState, side) : [],
    eventTail,
    opponentStatus: {
      side: opponentSide,
      connected: opponentIsAi || (opponent?.connected ?? false),
      ...(opponentDisplayName ? { displayName: opponentDisplayName } : {}),
    },
    ...(playerView.pendingChoice ? { pendingChoice: playerView.pendingChoice } : {}),
    ...(pendingUndo ? { pendingUndo } : {}),
    ...(aiTurnPresentation ? { aiTurnPresentation } : {}),
    ...(deps.playerClockSnapshot ? { playerClock: deps.playerClockSnapshot } : {}),
    ...(terminalWinner && finalStateHash
      ? { winner: terminalWinner, finalStateHash }
      : {}),
    ...(resultSummary ? { resultSummary } : {}),
    ...(record.lifecycleResult ? { lifecycleResult: record.lifecycleResult } : {}),
    ...deps.retentionProtectionPayload,
  };
}

function opposite(side: Side): Side {
  return side === "corp" ? "runner" : "corp";
}

function withChronicleTurnContext(
  event: PublicGameEvent,
  context: { turnNumber: number; turnSide: Side } | undefined,
): PublicGameEvent {
  if (!context) return event;
  return {
    ...event,
    publicPayload: {
      ...event.publicPayload,
      chronicleTurnNumber: context.turnNumber,
      chronicleTurnSide: context.turnSide,
    },
  };
}

function chronicleTurnContextByEventId(events: PublicGameEvent[]): Record<string, { turnNumber: number; turnSide: Side }> {
  const numbers = chronicleTurnNumberByEventId(events);
  const sides = chronicleTurnSideByEventId(events);
  const result: Record<string, { turnNumber: number; turnSide: Side }> = {};
  for (const event of events) {
    const turnNumber = numbers[event.eventId];
    const turnSide = sides[event.eventId];
    if (turnNumber && turnSide) result[event.eventId] = { turnNumber, turnSide };
  }
  return result;
}

function chronicleTurnNumberByEventId(events: PublicGameEvent[]): Record<string, number> {
  const numbers: Record<string, number> = {};
  let activeSide: Side = "corp";
  let activeTurnNumber = 1;
  let justEndedTurn: { side: Side; turnNumber: number } | null = null;

  for (const event of events) {
    const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
    const actor = sideValue(event.publicPayload.actor);
    if (!actor) continue;

    if (justEndedTurn && actor === justEndedTurn.side && isDiscardPhaseResolution(event)) {
      numbers[event.eventId] = justEndedTurn.turnNumber;
      continue;
    }
    justEndedTurn = null;

    if (actionType === "mandatory_draw" && actor === "corp") {
      if (activeSide !== "corp") {
        activeSide = "corp";
        activeTurnNumber += 1;
      }
      numbers[event.eventId] = activeTurnNumber;
      continue;
    }

    numbers[event.eventId] = activeTurnNumber;

    if (actionType === "end_turn") {
      if (activeSide !== actor) activeSide = actor;
      justEndedTurn = { side: actor, turnNumber: activeTurnNumber };
      activeSide = actor === "corp" ? "runner" : "corp";
      activeTurnNumber += 1;
    }
  }

  return numbers;
}

function chronicleTurnSideByEventId(events: PublicGameEvent[]): Record<string, Side> {
  const sides: Record<string, Side> = {};
  let activeSide: Side = "corp";
  let justEndedTurn: { side: Side } | null = null;

  for (const event of events) {
    const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
    const actor = sideValue(event.publicPayload.actor);
    if (!actor) continue;

    if (justEndedTurn && actor === justEndedTurn.side && isDiscardPhaseResolution(event)) {
      sides[event.eventId] = justEndedTurn.side;
      continue;
    }
    justEndedTurn = null;

    if (actionType === "mandatory_draw" && actor === "corp") {
      activeSide = "corp";
      sides[event.eventId] = activeSide;
      continue;
    }

    if (actionType === "end_turn" && activeSide !== actor) activeSide = actor;
    sides[event.eventId] = activeSide;

    if (actionType === "end_turn") {
      justEndedTurn = { side: actor };
      activeSide = actor === "corp" ? "runner" : "corp";
    }
  }

  return sides;
}

function isDiscardPhaseResolution(event: PublicGameEvent): boolean {
  const payload = event.publicPayload ?? {};
  return payload.discardResolved === true || stringValue(payload.hiddenZoneAction) === "discard_phase";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}
