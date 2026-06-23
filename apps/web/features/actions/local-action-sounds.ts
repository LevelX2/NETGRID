import type { LegalAction, PublicGameEvent, Side } from "@netgrid/shared";

import { actionSoundForActionType, type ActionSoundKind } from "../../app/action-cues";

export function publicEventsAfter(events: PublicGameEvent[], lastPresentedEventId: string | null): PublicGameEvent[] {
  if (!lastPresentedEventId) return events;
  const index = events.findIndex((event) => event.eventId === lastPresentedEventId);
  return index >= 0 ? events.slice(index + 1) : [];
}

export function eventActionType(event: PublicGameEvent): string {
  return payloadString(event.publicPayload, "actionType") ?? event.type;
}

export function localActionSoundKey(side: Side, stateVersion: number, actionType: string): string {
  return `${side}:${stateVersion}:${actionType}`;
}

export function localActionSoundKind(action: LegalAction): ActionSoundKind | undefined {
  if (action.type === "end_turn") return undefined;
  const visibility = action.side === "corp" && (action.type === "install_card" || action.type === "advance_card") ? "redacted" : "public";
  return actionSoundForActionType(action.type, visibility) ?? "choice";
}

function payloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}
