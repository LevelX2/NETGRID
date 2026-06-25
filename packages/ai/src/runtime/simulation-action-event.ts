import type { LegalAction, PublicGameEvent } from "@netgrid/shared";

export function advancementCountersAddedForSimulationAction(
  action: LegalAction,
  event: PublicGameEvent,
): number {
  const candidates = [
    action.payload?.addedAdvancementCounters,
    action.payload?.advancementCountersAdded,
    event.publicPayload.addedAdvancementCounters,
    event.publicPayload.advancementCountersAdded,
  ];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0)
      return value;
  }
  return action.type === "advance_card" ? 1 : 0;
}
