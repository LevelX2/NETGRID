import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { coalesceAiPumpPresentationEvents } from "./ai-pump-presentation";

describe("coalesceAiPumpPresentationEvents", () => {
  it("combines contiguous pumps by the same AI-controlled breaker", () => {
    const events = [
      pumpEvent("evt_10", 1, 1),
      pumpEvent("evt_11", 2, 1),
      pumpEvent("evt_12", 3, 1),
      event("evt_13", "break_subroutine", { actor: "runner" }),
    ];

    const presentationEvents = coalesceAiPumpPresentationEvents(events);

    expect(presentationEvents).toHaveLength(2);
    expect(presentationEvents[0]?.eventId).toBe("evt_10");
    expect(presentationEvents[0]?.stateVersionAfter).toBe(12);
    expect(presentationEvents[0]?.publicPayload).toMatchObject({
      aiPumpPresentation: true,
      pumpCount: 3,
      pumpStrengthStart: 0,
      pumpStrengthTotal: 3,
      breakerStrengthAfter: 3,
      pumpCreditCostTotal: 6,
    });
    expect(presentationEvents[1]?.eventId).toBe("evt_13");
    expect(events[0]?.publicPayload).not.toHaveProperty("aiPumpPresentation");
  });

  it("keeps pumps separate when the source changes or an effect occurs", () => {
    const differentBreaker = {
      ...pumpEvent("evt_21", 2, 1),
      publicPayload: {
        ...pumpEvent("evt_21", 2, 1).publicPayload,
        pumpBreakerId: "other_breaker",
      },
    };
    const effectPump = {
      ...pumpEvent("evt_22", 3, 1),
      publicPayload: {
        ...pumpEvent("evt_22", 3, 1).publicPayload,
        resolvedEffects: [
          {
            effectId: "public-effect",
            kind: "add_tags" as const,
            visibility: "public" as const,
          },
        ],
      },
    };

    expect(
      coalesceAiPumpPresentationEvents([
        pumpEvent("evt_20", 1, 1),
        differentBreaker,
        effectPump,
      ]),
    ).toHaveLength(3);
  });
});

function pumpEvent(
  eventId: string,
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
  eventId: string,
  actionType: string,
  payload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: Number(eventId.slice(-2)) - 1,
    stateVersionAfter: Number(eventId.slice(-2)),
    stateHashAfter: `fnv1a:${eventId}`,
    publicPayload: { actionType, ...payload },
  };
}
