import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  clampReplayFrame,
  nextReplayFrame,
  playbackDelayMs,
  publicEventsThroughReplayFrame,
} from "./replay-player-model";

describe("replay player model", () => {
  it("keeps stepping and seeking inside the available frame range", () => {
    expect(clampReplayFrame(-10, 5)).toBe(0);
    expect(clampReplayFrame(99, 5)).toBe(4);
    expect(nextReplayFrame(3, 5)).toBe(4);
    expect(nextReplayFrame(4, 5)).toBe(4);
  });

  it("converts playback speeds to stable timer delays", () => {
    expect(playbackDelayMs(0.5)).toBe(2000);
    expect(playbackDelayMs(1)).toBe(1000);
    expect(playbackDelayMs(2)).toBe(500);
  });

  it("reveals every repeated pump event at its own replay frame", () => {
    const events: PublicGameEvent[] = [1, 2, 3, 4].map((breakerStrengthAfter, index) => ({
      eventId: `evt_pump_${index + 1}`,
      type: "pump_breaker",
      stateVersionBefore: 20 + index,
      stateVersionAfter: 21 + index,
      stateHashAfter: `fnv1a:pump${index + 1}`,
      publicPayload: {
        actor: "runner",
        actionType: "pump_breaker",
        cardDefinitionId: "onr_v1_164_krash",
        pumpStrengthAmount: 1,
        pumpBreakerCreditCost: 1,
        breakerStrengthAfter,
      },
    }));

    expect(publicEventsThroughReplayFrame(events, 20)).toHaveLength(0);
    expect(publicEventsThroughReplayFrame(events, 21).map((event) => event.eventId)).toEqual([
      "evt_pump_1",
    ]);
    expect(publicEventsThroughReplayFrame(events, 24).map((event) => event.eventId)).toEqual([
      "evt_pump_1",
      "evt_pump_2",
      "evt_pump_3",
      "evt_pump_4",
    ]);
  });
});
