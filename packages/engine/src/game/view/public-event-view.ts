// ARCH-6 read-only View-Helfer.
// Keine State-Mutation, keine LegalAction-Erzeugung, kein Import aus index.ts,
// keine PublicPayload-Vertragsaenderung.
import {
  type GameEvent,
  type PublicGameEvent,
  type Side,
} from "@netgrid/shared";
import { sanitizeEventPayloadForSurface } from "./surface-policy";

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
    publicPayload: sanitizeEventPayloadForSurface(
      event.publicPayload,
      "public_event",
    ),
  };
}

export function toPublicEventForSide(
  event: GameEvent,
  viewerSide: Side,
): PublicGameEvent {
  const publicEvent = toPublicEvent(event);
  const privateProjection = sidePrivatePublicPayload(event, viewerSide);
  return redactPublicEventForSide(
    privateProjection
      ? {
          ...publicEvent,
          publicPayload: sanitizeEventPayloadForSurface(
            {
              ...publicEvent.publicPayload,
              ...privateProjection,
            },
            "public_event",
          ),
        }
      : publicEvent,
    viewerSide,
  );
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

function sidePrivatePublicPayload(
  event: GameEvent,
  viewerSide: Side,
): Record<string, unknown> | undefined {
  const privatePayload = event.privatePayload?.[viewerSide];
  const legalAction =
    privatePayload &&
    typeof privatePayload.legalAction === "object" &&
    privatePayload.legalAction !== null
      ? (privatePayload.legalAction as { payload?: Record<string, unknown> })
      : undefined;
  const payload = legalAction?.payload;
  if (
    viewerSide !== "runner" ||
    event.publicPayload.actor !== "runner" ||
    payload?.hiddenZoneAction !== "p3_33_private_look"
  ) {
    return undefined;
  }
  const zone = payload.privateLookZone;
  if (zone !== "hq" && zone !== "rd") return undefined;
  const definitionIds = payload.knownHqDefinitionIds;
  const csvDefinitionIds =
    typeof payload.knownPrivateLookDefinitionIdsCsv === "string"
      ? payload.knownPrivateLookDefinitionIdsCsv
          .split("|")
          .filter((value) => value.length > 0)
      : [];
  const knownHqDefinitionIds = Array.isArray(definitionIds)
    ? definitionIds.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      )
    : csvDefinitionIds;
  if (knownHqDefinitionIds.length === 0) return undefined;
  if (zone === "rd") {
    return {
      knownRndDefinitionIds: knownHqDefinitionIds,
      knownRndTopDefinitionId: knownHqDefinitionIds[0],
      knownRndCardCount: knownHqDefinitionIds.length,
    };
  }
  return {
    knownHqDefinitionIds,
    knownHqCardCount: knownHqDefinitionIds.length,
  };
}
