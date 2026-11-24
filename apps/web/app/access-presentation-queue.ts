import type { AccessPresentationId } from "./access-reveal-ui";
import { isCardDefinitionId, type PublicGameEvent } from "@netgrid/shared";

export function appendPendingAccessPresentationEvents(
  current: PublicGameEvent[],
  incoming: PublicGameEvent[],
  dismissedEventIds: AccessPresentationId[],
): PublicGameEvent[] {
  const seen = new Set([
    ...dismissedEventIds,
    ...current.map((event) => event.eventId),
  ]);
  const appended = [...current];
  for (const event of incoming) {
    if (seen.has(event.eventId) || !isPublicCardAccessEvent(event)) continue;
    seen.add(event.eventId);
    appended.push(event);
  }
  return appended;
}

export function dismissPendingAccessPresentationEvent(
  current: PublicGameEvent[],
  eventId: AccessPresentationId,
): PublicGameEvent[] {
  return current.filter((event) => event.eventId !== eventId);
}

function isPublicCardAccessEvent(event: PublicGameEvent): boolean {
  return (
    event.publicPayload.actionType === "access_card" &&
    isCardDefinitionId(event.publicPayload.cardDefinitionId) &&
    nonEmptyString(event.publicPayload.title)
  );
}

function nonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
