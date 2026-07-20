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
import { chronicleTurnContextByEventId } from "./chronicle-turn-context";

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
  const chronicleTurnContext = chronicleTurnContextByEventId(
    record.eventLog.map((event) => event.publicPayload),
  );
  const eventTail = record.eventLog
    .slice(-SIDE_PAYLOAD_EVENT_TAIL_LIMIT)
    .map((event) =>
      withChronicleTurnContext(
        redactPublicEventForSide(event.publicPayload, side),
        chronicleTurnContext[event.eventId],
      ),
    );
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
    ? (lifecycleFinalHash ?? hashState(record.gameState))
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
    isPublic: record.match.isPublic,
    side,
    playerView,
    legalActions:
      record.match.status === "active" && !deps.isAiSide(side)
        ? getLegalActions(record.gameState, side)
        : [],
    eventTail,
    opponentStatus: {
      side: opponentSide,
      connected: opponentIsAi || (opponent?.connected ?? false),
      ...(opponentDisplayName ? { displayName: opponentDisplayName } : {}),
    },
    ...(playerView.pendingChoice
      ? { pendingChoice: playerView.pendingChoice }
      : {}),
    ...(pendingUndo ? { pendingUndo } : {}),
    ...(aiTurnPresentation ? { aiTurnPresentation } : {}),
    ...(deps.playerClockSnapshot
      ? { playerClock: deps.playerClockSnapshot }
      : {}),
    ...(terminalWinner && finalStateHash
      ? { winner: terminalWinner, finalStateHash }
      : {}),
    ...(resultSummary ? { resultSummary } : {}),
    ...(record.lifecycleResult
      ? { lifecycleResult: record.lifecycleResult }
      : {}),
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
