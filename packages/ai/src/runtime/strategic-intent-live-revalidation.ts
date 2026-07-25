import type { PublicGameEvent, Side } from "@netgrid/shared";

import type { StrategicIntentRevalidation } from "../strategic-intent-state";

export function strategicIntentRevalidationPublicEventFacts(
  eventTail: readonly PublicGameEvent[],
): PublicGameEvent[] {
  return eventTail.map((event) => {
    const payload = event.publicPayload;
    return {
      eventId: event.eventId,
      type: event.type,
      stateVersionBefore: event.stateVersionBefore,
      stateVersionAfter: event.stateVersionAfter,
      ...(event.turnSerial === undefined
        ? {}
        : { turnSerial: event.turnSerial }),
      stateHashAfter: event.stateHashAfter,
      ...(event.visibilityClass === undefined
        ? {}
        : { visibilityClass: event.visibilityClass }),
      publicPayload: {
        ...(payload.actor === "runner" || payload.actor === "corp"
          ? { actor: payload.actor }
          : {}),
        ...(payload.setupSide === "runner" || payload.setupSide === "corp"
          ? { setupSide: payload.setupSide }
          : {}),
        ...(typeof payload.setupStep === "string"
          ? { setupStep: payload.setupStep }
          : {}),
        ...(typeof payload.setupStatus === "string"
          ? { setupStatus: payload.setupStatus }
          : {}),
      },
    };
  });
}

export function strategicIntentRevalidationFromCurrentPublicEvents(params: {
  side: Side;
  stateVersion: number;
  eventTail: readonly PublicGameEvent[];
}): StrategicIntentRevalidation | undefined {
  for (let index = params.eventTail.length - 1; index >= 0; index -= 1) {
    const event = params.eventTail[index];
    if (
      !event ||
      event.type !== "resolve_choice" ||
      event.stateVersionAfter !== params.stateVersion
    ) {
      continue;
    }
    const payload = event.publicPayload;
    if (
      payload.setupStep !== "mulligan" ||
      payload.setupStatus !== "complete"
    ) {
      continue;
    }
    return {
      observedAtStateVersion: params.stateVersion,
      reason: "phase_change",
      evidenceCodes: [
        `public_event:setup_mulligan_completed_for:${params.side}`,
      ],
    };
  }
  return undefined;
}
