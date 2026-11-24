// ARCH-6 read-only View-Helfer.
// Keine State-Mutation, keine LegalAction-Erzeugung, kein Import aus index.ts,
// keine PublicPayload-Vertragsaenderung.
import {
  type GameEvent,
  type LegalAction,
  type PublicGameEvent,
  type Side,
} from "@netgrid/shared";
import {
  assertSafeEventPayloadForSurface,
  sanitizeEventPayloadForSurface,
} from "./surface-policy";
import { parseCardDefinitionIdToken } from "../choices/card-definition-id-token";

export function toPublicEvent(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    ...(Number.isSafeInteger(event.turnSerial) && (event.turnSerial ?? -1) >= 0
      ? { turnSerial: event.turnSerial }
      : {}),
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
  if (privateProjection) {
    assertSafeEventPayloadForSurface(privateProjection, "public_event");
    Object.assign(publicEvent.publicPayload, privateProjection);
  }
  return redactPublicEventForSide(publicEvent, viewerSide);
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
  if (event.publicPayload.actor !== viewerSide) return undefined;
  const privatePayload = event.privatePayload?.[viewerSide];
  const legalAction =
    privatePayload &&
    typeof privatePayload.legalAction === "object" &&
    privatePayload.legalAction !== null
      ? (privatePayload.legalAction as LegalAction)
      : undefined;
  const action =
    privatePayload &&
    typeof privatePayload.action === "object" &&
    privatePayload.action !== null
      ? (privatePayload.action as {
          actionId?: unknown;
          side?: unknown;
          clientKnownStateVersion?: unknown;
        })
      : undefined;
  const payload = legalAction?.payload;
  const sourceCardInstanceId = activatedAbilitySourceCardInstanceId({
    event,
    viewerSide,
    legalAction,
    action,
  });
  const result: Record<string, unknown> = {
    ...(sourceCardInstanceId ? { sourceCardInstanceId } : {}),
  };
  if (
    viewerSide !== "runner" ||
    payload?.hiddenZoneAction !== "p3_33_private_look"
  ) {
    return Object.keys(result).length > 0 ? result : undefined;
  }
  const zone = payload.privateLookZone;
  if (zone !== "hq" && zone !== "rd")
    return Object.keys(result).length > 0 ? result : undefined;
  const encodedDefinitionIds = payload.knownPrivateLookDefinitionIdsCsv;
  if (encodedDefinitionIds === undefined || encodedDefinitionIds === "")
    return Object.keys(result).length > 0 ? result : undefined;
  if (typeof encodedDefinitionIds !== "string")
    throw new Error("Ungültige Kartenreferenzen in der privaten Sicht.");
  const knownHqDefinitionIds = encodedDefinitionIds.split("|").map((value) => {
    const id = parseCardDefinitionIdToken(value);
    if (id === undefined)
      throw new Error("Ungültige Kartenreferenzen in der privaten Sicht.");
    return id;
  });
  if (zone === "rd") {
    return {
      ...result,
      knownRndDefinitionIds: knownHqDefinitionIds,
      knownRndTopDefinitionId: knownHqDefinitionIds[0],
      knownRndCardCount: knownHqDefinitionIds.length,
    };
  }
  return {
    ...result,
    knownHqDefinitionIds,
    knownHqCardCount: knownHqDefinitionIds.length,
  };
}

function activatedAbilitySourceCardInstanceId(params: {
  event: GameEvent;
  viewerSide: Side;
  legalAction: LegalAction | undefined;
  action:
    | {
        actionId?: unknown;
        side?: unknown;
        clientKnownStateVersion?: unknown;
      }
    | undefined;
}): string | undefined {
  const { event, viewerSide, legalAction, action } = params;
  if (
    event.type !== "activated_card_ability" ||
    event.publicPayload.actor !== viewerSide ||
    legalAction?.type !== "activated_card_ability" ||
    legalAction.side !== viewerSide ||
    action?.side !== viewerSide ||
    action.actionId !== legalAction.actionId ||
    action.clientKnownStateVersion !== event.stateVersionBefore ||
    legalAction.expiresAtStateVersion !== event.stateVersionBefore ||
    typeof legalAction.source !== "string" ||
    legalAction.payload?.cardId !== legalAction.source
  ) {
    return undefined;
  }
  return legalAction.source;
}
