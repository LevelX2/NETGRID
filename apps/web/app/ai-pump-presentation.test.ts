import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { coalesceAiPumpPresentationEvents } from "./ai-pump-presentation";

describe("coalesceAiPumpPresentationEvents", () => {
  it("combines contiguous pumps by the same AI-controlled breaker", () => {
    const events = [
      pumpEvent(11, 1, 1),
      pumpEvent(12, 2, 1),
      pumpEvent(13, 3, 1),
      event(14, "break_subroutine", { actor: "runner" }),
    ];

    const presentationEvents = coalesceAiPumpPresentationEvents(events);

    expect(presentationEvents).toHaveLength(2);
    expect(presentationEvents[0]?.eventId).toBe(11);
    expect(presentationEvents[0]?.stateVersionAfter).toBe(12);
    expect(presentationEvents[0]?.publicPayload).toMatchObject({
      aiPumpPresentation: true,
      pumpCount: 3,
      pumpStrengthStart: 0,
      pumpStrengthTotal: 3,
      breakerStrengthAfter: 3,
      pumpCreditCostTotal: 6,
    });
    expect(presentationEvents[1]?.eventId).toBe(14);
    expect(events[0]?.publicPayload).not.toHaveProperty("aiPumpPresentation");
  });

  it("keeps pumps separate when the source changes or an effect occurs", () => {
    const differentBreaker = {
      ...pumpEvent(22, 2, 1),
      publicPayload: {
        ...pumpEvent(22, 2, 1).publicPayload,
        pumpBreakerId: "other_breaker",
      },
    };
    const effectPump = {
      ...pumpEvent(23, 3, 1),
      publicPayload: {
        ...pumpEvent(23, 3, 1).publicPayload,
        resolvedEffects: [
          {
            effectId: 0,
            kind: "add_tags" as const,
            visibility: "public" as const,
          },
        ],
      },
    };

    expect(
      coalesceAiPumpPresentationEvents([
        pumpEvent(21, 1, 1),
        differentBreaker,
        effectPump,
      ]),
    ).toHaveLength(3);
  });
});

function pumpEvent(
  eventId: number,
  breakerStrengthAfter: number,
  pumpStrengthAmount: number,
): PublicGameEvent {
  return event(eventId, "pump_breaker", {
    actor: "runner",
    aiReasonCode: "runner.encounter.pump_breaker",
    pumpBreakerId: "breaker_1",
    pumpStrengthAmount,
    pumpBreakerCreditCost: 2,
    breakerStrengthAfter,
  });
}

function event(
  eventId: number,
  actionType: string,
  payload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: eventId - 2,
    stateVersionAfter: eventId - 1,
    stateHashAfter: `fnv1a:${eventId}`,
    publicPayload: { actionType, ...payload },
  };
}
