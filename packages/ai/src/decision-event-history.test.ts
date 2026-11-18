import type { AiDecisionInput, PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { decisionEventHistory } from "./decision-event-history";
import { withDecisionDerivedCache } from "./decision-derived-cache";

describe("actor-safe decision chronology", () => {
  it("retains observations before the recent tail and takes the latest matching event once", () => {
    const earlier = Array.from({ length: 100 }, (_, index) => event(index + 1));
    const updated = { ...earlier[99]!, publicPayload: { actor: "corp", marker: "latest" } };
    const input = {
      playerView: { publicEvents: earlier }, eventTail: [updated, event(101)],
    } as AiDecisionInput;
    const history = decisionEventHistory(input);
    expect(history).toHaveLength(101);
    expect(history[0]).toBe(earlier[0]);
    expect(history[99]).toBe(updated);
    expect(history.at(-1)?.eventId).toBe(101);
    expect(input.playerView.publicEvents[99]).toBe(earlier[99]);
  });

  it("shares a chronology inside one decision and rebuilds it for the next input generation", () => {
    const input = { playerView: { publicEvents: [event(1)] }, eventTail: [] } as unknown as AiDecisionInput;
    const first = withDecisionDerivedCache(() => {
      const history = decisionEventHistory(input);
      expect(decisionEventHistory(input)).toBe(history);
      return history;
    });
    input.eventTail.push(event(2));
    const second = withDecisionDerivedCache(() => decisionEventHistory(input));
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
    expect(second).not.toBe(first);
  });
});

function event(eventId: number): PublicGameEvent {
  return {
    eventId, type: "gain_credit", stateVersionBefore: eventId - 1,
    stateVersionAfter: eventId, stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public", publicPayload: { actor: "corp" },
  };
}
