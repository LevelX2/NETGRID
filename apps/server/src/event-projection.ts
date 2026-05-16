import { redactPublicEventForSide } from "@netgrid/engine";
import type { GameEvent, PublicGameEvent, Side } from "@netgrid/shared";

export type EngineEvent = GameEvent;

export type ReplayPerspective = Side | "local_analysis";

export type ServerEventRecord = {
  eventId: string;
  matchId: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  stateHashAfter: string;
  publicPayload: PublicGameEvent;
  privatePayloadLocalOnly: boolean;
  hiddenInfoBarrier: boolean;
};

export function projectEngineEventToServerRecord(
  matchId: string,
  event: EngineEvent,
  hiddenInfoBarrier: boolean,
): ServerEventRecord {
  return {
    eventId: event.eventId,
    matchId,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    publicPayload: projectEngineEventToPublicEvent(event),
    privatePayloadLocalOnly: Boolean(event.privatePayload),
    hiddenInfoBarrier,
  };
}

export function projectEngineEventToPublicEvent(event: EngineEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass ? { visibilityClass: event.visibilityClass } : {}),
    publicPayload: event.publicPayload,
  };
}

export function projectReplayEventsForPerspective(
  events: ServerEventRecord[],
  perspective: ReplayPerspective,
): PublicGameEvent[] {
  if (perspective === "local_analysis") return events.map((event) => event.publicPayload);
  return events.map((event) => redactPublicEventForSide(event.publicPayload, perspective));
}
