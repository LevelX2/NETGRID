import type { AiDecisionInput, MatchEventId, PublicGameEvent } from "@netgrid/shared";
import { decisionDerivedValue } from "./decision-derived-cache";

const EVENT_HISTORY_CACHE_KEY = Symbol("decision-event-history");

/** One actor-safe chronology shared by belief and history consumers in a decision. */
export function decisionEventHistory(input: AiDecisionInput): PublicGameEvent[] {
  return decisionDerivedValue(input, EVENT_HISTORY_CACHE_KEY, () => {
    const events = new Map<MatchEventId, PublicGameEvent>();
    for (const source of [input.playerView.publicEvents, input.eventTail]) {
      for (const event of source) {
        const previous = events.get(event.eventId);
        if (!previous || previous.stateVersionAfter <= event.stateVersionAfter)
          events.set(event.eventId, event);
      }
    }
    return [...events.values()].sort((left, right) =>
      left.stateVersionBefore - right.stateVersionBefore || left.eventId - right.eventId,
    );
  });
}
