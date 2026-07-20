import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  AI_DECISION_EVENT_TAIL_LIMIT,
  aiDecisionEventTail,
} from "./ai-decision-input";

describe("aiDecisionEventTail", () => {
  it("keeps the full history canonical and returns a bounded suffix", () => {
    const history = Array.from(
      { length: AI_DECISION_EVENT_TAIL_LIMIT + 3 },
      (_, index) => publicEvent(index),
    );

    const tail = aiDecisionEventTail(history);

    expect(history).toHaveLength(AI_DECISION_EVENT_TAIL_LIMIT + 3);
    expect(tail).toHaveLength(AI_DECISION_EVENT_TAIL_LIMIT);
    expect(tail).toEqual(history.slice(-AI_DECISION_EVENT_TAIL_LIMIT));
    expect(tail[0]).toBe(history[3]);
  });

  it("does not copy a history that already fits into the tail", () => {
    const history = [publicEvent(0), publicEvent(1)];
    expect(aiDecisionEventTail(history)).toBe(history);
  });
});

function publicEvent(index: number): PublicGameEvent {
  return {
    eventId: `event-${index}`,
    type: "test_event",
    stateVersionBefore: index,
    stateVersionAfter: index + 1,
    stateHashAfter: `hash-${index}`,
    publicPayload: {},
  };
}
