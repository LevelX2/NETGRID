import type { PublicGameEvent, Side } from "@netgrid/shared";

export function chronicleTurnContextByEventId(
  events: readonly PublicGameEvent[],
): Record<string, { turnNumber: number; turnSide: Side }> {
  const numbers = chronicleTurnNumberByEventId(events);
  const sides = chronicleTurnSideByEventId(events);
  const result: Record<string, { turnNumber: number; turnSide: Side }> = {};
  for (const event of events) {
    const turnNumber = numbers[event.eventId];
    const turnSide = sides[event.eventId];
    if (turnNumber && turnSide) {
      result[event.eventId] = { turnNumber, turnSide };
    }
  }
  return result;
}

export function chronicleTurnNumberForEvent(
  events: readonly PublicGameEvent[],
  eventId: string,
): number | undefined {
  return chronicleTurnNumberByEventId(events)[eventId];
}

function chronicleTurnNumberByEventId(
  events: readonly PublicGameEvent[],
): Record<string, number> {
  const numbers: Record<string, number> = {};
  let activeSide: Side = "corp";
  let activeTurnNumber = 1;
  let justEndedTurn: { side: Side; turnNumber: number } | null = null;

  for (const event of events) {
    const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
    const actor = sideValue(event.publicPayload.actor);
    if (!actor) continue;

    if (
      justEndedTurn &&
      actor === justEndedTurn.side &&
      isDiscardPhaseResolution(event)
    ) {
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

function chronicleTurnSideByEventId(
  events: readonly PublicGameEvent[],
): Record<string, Side> {
  const sides: Record<string, Side> = {};
  let activeSide: Side = "corp";
  let justEndedTurn: { side: Side } | null = null;

  for (const event of events) {
    const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
    const actor = sideValue(event.publicPayload.actor);
    if (!actor) continue;

    if (
      justEndedTurn &&
      actor === justEndedTurn.side &&
      isDiscardPhaseResolution(event)
    ) {
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
  return (
    payload.discardResolved === true ||
    stringValue(payload.hiddenZoneAction) === "discard_phase"
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}
