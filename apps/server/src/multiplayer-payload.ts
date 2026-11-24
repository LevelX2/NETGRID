import {
  getPlayerView,
  hashState,
  redactPublicEventForSide,
} from "@netgrid/engine";
import type {
  PublicGameEvent,
  Side,
  StandardDeckGuideRef,
} from "@netgrid/shared";
import type { ApiPlayerClockSnapshot } from "@netgrid/shared";
import type {
  AiTurnPresentationState,
  GameResultSummary,
  SidePayload,
  StoredMatch,
} from "./multiplayer";
import { chronicleTurnContextByEventId } from "./chronicle-turn-context";
import { advancePublicEventHistory, initialPublicEventHistory } from "./public-event-history";

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
  ownDeckGuideRef?: StandardDeckGuideRef;
};

export function buildSidePayload(
  record: StoredMatch,
  side: Side,
  deps: SidePayloadBuilderDeps,
): SidePayload {
  if (!record.gameState) throw new Error("match_not_active");
  const opponentSide = opposite(side);
  const tail = record.eventLog.slice(-SIDE_PAYLOAD_EVENT_TAIL_LIMIT);
  let prefix = tail[0]?.history?.before;
  if (!prefix) {
    prefix = record.publicHistoryPrefix ?? initialPublicEventHistory();
    for (const event of record.eventLog.slice(0, -SIDE_PAYLOAD_EVENT_TAIL_LIMIT))
      prefix = advancePublicEventHistory(prefix, event.publicPayload).after;
  }
  const chronicleTurnContext = tail.every((event) => event.history !== undefined)
    ? Object.fromEntries(tail.flatMap((event) => event.history!.context
        ? [[event.eventId, event.history!.context]] : []))
    : chronicleTurnContextByEventId(
        tail.map((event) => event.publicPayload), prefix.chronicle,
      );
  const eventTail = tail
    .map((event) =>
      withChronicleTurnContext(
        redactPublicEventForSide(event.publicPayload, side),
        chronicleTurnContext[event.eventId],
      ),
    );
  const engineView = getPlayerView(record.gameState, side, { publicEventLimit: 0 });
  const playerView = {
    ...engineView,
    legalActions:
      record.match.status === "active" && !deps.isAiSide(side)
        ? engineView.legalActions
        : [],
    ...(deps.ownDeckGuideRef
      ? { ownDeckGuideRef: { ...deps.ownDeckGuideRef } }
      : {}),
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
    opponentStatus: {
      side: opponentSide,
      connected: opponentIsAi || (opponent?.connected ?? false),
      ...(opponentDisplayName ? { displayName: opponentDisplayName } : {}),
    },
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
