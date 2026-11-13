import type { LegalAction, PublicGameEvent, Side } from "@netgrid/shared";

import {
  actionSoundForActionType,
  type ActionSoundKind,
} from "../../app/action-cues";

export function publicEventsAfter(
  events: PublicGameEvent[],
  lastPresentedEventId: string | null,
): PublicGameEvent[] {
  if (!lastPresentedEventId) return events;
  const index = events.findIndex(
    (event) => event.eventId === lastPresentedEventId,
  );
  return index >= 0 ? events.slice(index + 1) : [];
}

export function eventActionType(event: PublicGameEvent): string {
  return payloadString(event.publicPayload, "actionType") ?? event.type;
}

export function localActionSoundKey(
  side: Side,
  stateVersion: number,
  actionType: string,
): string {
  return `${side}:${stateVersion}:${actionType}`;
}

export function localActionSoundKind(
  action: LegalAction,
): ActionSoundKind | undefined {
  if (action.type === "end_turn") return undefined;
  const visibility =
    action.side === "corp" &&
    (action.type === "install_card" || action.type === "advance_card")
      ? "redacted"
      : "public";
  return actionSoundForActionType(action.type, visibility) ?? "choice";
}

export function resourceEffectSounds(event: PublicGameEvent): Array<{
  sound: "credit" | "draw";
  soundCount: number;
}> {
  const primarySound = actionSoundForActionType(
    eventActionType(event),
    "public",
  );
  const counts = new Map<"credit" | "draw", number>();
  for (const effect of event.publicPayload.resolvedEffects ?? []) {
    const amount = effect.amount;
    if (
      effect.visibility !== "public" ||
      typeof amount !== "number" ||
      !Number.isSafeInteger(amount) ||
      amount <= 0
    )
      continue;
    const sound =
      effect.kind === "gain_credits"
        ? "credit"
        : effect.kind === "draw_cards"
          ? "draw"
          : undefined;
    // Basic credit/draw actions already play their primary sound. Card effects
    // are confirmed separately, even when the local play sound ran on submit.
    if (!sound || sound === primarySound) continue;
    counts.set(
      sound,
      sound === "credit" ? 1 : Math.min(5, (counts.get(sound) ?? 0) + amount),
    );
  }
  return Array.from(counts, ([sound, soundCount]) => ({ sound, soundCount }));
}

function payloadString(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}
