import type { MatchEventId, PublicGameEvent, Side } from "@netgrid/shared";

export type ChronicleTurnContext = { turnNumber: number; turnSide: Side };
export type ChronicleTurnCursor = {
  activeSide: Side;
  turnNumber: number;
  justEndedTurn?: { side: Side; turnNumber: number };
};

export function initialChronicleTurnCursor(): ChronicleTurnCursor {
  return { activeSide: "corp", turnNumber: 1 };
}

/** Includes a pending end-turn discard, so bounded tails retain its actual turn. */
export function advanceChronicleTurnContext(
  previous: ChronicleTurnCursor,
  event: PublicGameEvent,
): { cursor: ChronicleTurnCursor; context?: ChronicleTurnContext } {
  const actor = event.publicPayload.actor;
  if (actor !== "corp" && actor !== "runner") return { cursor: previous };
  const payload = event.publicPayload;
  const actionType = typeof payload.actionType === "string"
    ? payload.actionType : event.type;
  if (
    previous.justEndedTurn?.side === actor &&
    (payload.discardResolved === true || payload.hiddenZoneAction === "discard_phase")
  ) return {
    cursor: previous,
    context: {
      turnNumber: previous.justEndedTurn.turnNumber,
      turnSide: previous.justEndedTurn.side,
    },
  };
  let activeSide = previous.activeSide;
  let turnNumber = previous.turnNumber;
  if (actionType === "mandatory_draw" && actor === "corp" && activeSide !== "corp") {
    activeSide = "corp";
    turnNumber += 1;
  }
  if (actionType === "end_turn") activeSide = actor;
  const context = { turnNumber, turnSide: activeSide };
  return {
    context,
    cursor: actionType === "end_turn"
      ? {
          activeSide: actor === "corp" ? "runner" : "corp",
          turnNumber: turnNumber + 1,
          justEndedTurn: { side: actor, turnNumber },
        }
      : { activeSide, turnNumber },
  };
}

export function chronicleTurnContextByEventId(
  events: readonly PublicGameEvent[],
  initial = initialChronicleTurnCursor(),
): Record<MatchEventId, ChronicleTurnContext> {
  const result: Record<MatchEventId, ChronicleTurnContext> = {};
  let cursor = initial;
  for (const event of events) {
    const next = advanceChronicleTurnContext(cursor, event);
    cursor = next.cursor;
    if (next.context) result[event.eventId] = next.context;
  }
  return result;
}

export function chronicleTurnNumberForEvent(
  events: readonly PublicGameEvent[],
  eventId: MatchEventId,
  initial = initialChronicleTurnCursor(),
): number | undefined {
  return chronicleTurnContextByEventId(events, initial)[eventId]?.turnNumber;
}
