// ARCH-6 read-only View-Helfer.
// Keine State-Mutation, keine LegalAction-Erzeugung, kein Import aus index.ts,
// keine PublicPayload-Vertragsaenderung.
import {
  type GameEvent,
  type PublicGameEvent,
  type Side,
} from "@netgrid/shared";

export function toPublicEvent(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass
      ? { visibilityClass: event.visibilityClass }
      : {}),
    publicPayload: event.publicPayload,
  };
}

export function redactPublicEventForSide(
  event: PublicGameEvent,
  viewerSide: Side,
): PublicGameEvent {
  const actor = event.publicPayload.actor;
  const actionType = event.publicPayload.actionType;
  if (
    actionType !== "access_card" ||
    actor !== "runner" ||
    viewerSide !== "corp"
  )
    return event;
  const serverLabel =
    typeof event.publicPayload.serverLabel === "string"
      ? event.publicPayload.serverLabel
      : "";
  const serverId =
    typeof event.publicPayload.serverId === "string"
      ? event.publicPayload.serverId
      : "";
  const rdHiddenAccess =
    serverId === "rd" ||
    serverLabel === "R&D" ||
    serverLabel === "F&E (R&D)" ||
    serverLabel === "F&E";
  if (!rdHiddenAccess) return event;
  const {
    cardDefinitionId: _cardDefinitionId,
    title: _title,
    ...publicPayload
  } = event.publicPayload;
  void _cardDefinitionId;
  void _title;
  return {
    ...event,
    publicPayload: {
      ...publicPayload,
      redactedKind: "accessed_card",
    },
  };
}
