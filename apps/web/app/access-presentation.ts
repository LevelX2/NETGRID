import type { PublicGameEvent, Side } from "@netgrid/shared";

export type AccessPresentationOutcomeKind =
  | "trashed"
  | "stolen"
  | "declined";

export type AccessPresentationOutcome = {
  eventId: string;
  kind: AccessPresentationOutcomeKind;
  status: string;
};

const ACCESS_OUTCOME_ACTION_TYPES = new Set([
  "trash_accessed_card",
  "steal_agenda",
  "decline_trash",
]);

export function publicAccessOwnsOutcomeEvent(
  events: PublicGameEvent[],
  outcomeEvent: PublicGameEvent,
): boolean {
  return Boolean(publicAccessEventForOutcome(events, outcomeEvent));
}

export function accessPresentationOutcomeAfter(
  events: PublicGameEvent[],
  accessEvent: PublicGameEvent,
  viewerSide: Side,
): AccessPresentationOutcome | null {
  if (!isPublicCardAccessEvent(accessEvent)) return null;
  const accessIndex = events.findIndex(
    (event) => event.eventId === accessEvent.eventId,
  );
  if (accessIndex < 0) return null;
  for (let index = accessIndex + 1; index < events.length; index += 1) {
    const event = events[index];
    if (!event) continue;
    if (event.publicPayload.actionType === "access_card") return null;
    if (
      !ACCESS_OUTCOME_ACTION_TYPES.has(
        stringValue(event.publicPayload.actionType) ?? "",
      )
    )
      continue;
    if (publicAccessEventForOutcome(events, event)?.eventId !== accessEvent.eventId)
      continue;
    return accessOutcome(event, accessEvent, viewerSide);
  }
  return null;
}

function publicAccessEventForOutcome(
  events: PublicGameEvent[],
  outcomeEvent: PublicGameEvent,
): PublicGameEvent | null {
  const actionType = stringValue(outcomeEvent.publicPayload.actionType) ?? "";
  if (!ACCESS_OUTCOME_ACTION_TYPES.has(actionType)) return null;
  const outcomeIndex = events.findIndex(
    (event) => event.eventId === outcomeEvent.eventId,
  );
  if (outcomeIndex < 0) return null;
  const outcomeCardId = stringValue(
    outcomeEvent.publicPayload.cardDefinitionId,
  );
  for (let index = outcomeIndex - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!event) continue;
    if (event.publicPayload.actionType !== "access_card") continue;
    if (!isPublicCardAccessEvent(event)) return null;
    const accessCardId = stringValue(event.publicPayload.cardDefinitionId);
    if (outcomeCardId && outcomeCardId !== accessCardId) return null;
    return event;
  }
  return null;
}

function accessOutcome(
  outcomeEvent: PublicGameEvent,
  accessEvent: PublicGameEvent,
  viewerSide: Side,
): AccessPresentationOutcome {
  const actionType = outcomeEvent.publicPayload.actionType ?? "";
  const title = String(accessEvent.publicPayload.title);
  const actor = sideValue(outcomeEvent.publicPayload.actor) ?? "runner";
  const subject = actor === viewerSide ? "Du hast" : actor === "runner" ? "Der Runner hat" : "Die Korp hat";
  if (actionType === "trash_accessed_card") {
    return {
      eventId: outcomeEvent.eventId,
      kind: "trashed",
      status: `${subject} ${title} getrasht.`,
    };
  }
  if (actionType === "steal_agenda") {
    return {
      eventId: outcomeEvent.eventId,
      kind: "stolen",
      status: `${subject} ${title} gestohlen.`,
    };
  }
  return {
    eventId: outcomeEvent.eventId,
    kind: "declined",
    status: `${title} wurde nicht getrasht.`,
  };
}

function isPublicCardAccessEvent(event: PublicGameEvent): boolean {
  return (
    event.publicPayload.actionType === "access_card" &&
    Boolean(stringValue(event.publicPayload.cardDefinitionId)) &&
    Boolean(stringValue(event.publicPayload.title))
  );
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function sideValue(value: unknown): Side | null {
  return value === "corp" || value === "runner" ? value : null;
}
