import type { PublicGameEvent, Side } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  strategicIntentRevalidationFromCurrentPublicEvents,
  strategicIntentRevalidationPublicEventFacts,
} from "./strategic-intent-live-revalidation";

describe("live strategic-intent revalidation", () => {
  it("derives an exact current-state phase trigger from the side's public mulligan completion", () => {
    const revalidation = strategicIntentRevalidationFromCurrentPublicEvents({
      side: "corp",
      stateVersion: 2,
      eventTail: [setupEvent()],
    });

    expect(revalidation).toEqual({
      observedAtStateVersion: 2,
      reason: "phase_change",
      evidenceCodes: ["public_event:setup_mulligan_completed_for:corp"],
    });
    expect(Object.keys(revalidation ?? {}).sort()).toEqual([
      "evidenceCodes",
      "observedAtStateVersion",
      "reason",
    ]);
  });

  it("binds the global public setup completion to Runner even when Corp resolved the final mulligan choice", () => {
    expect(
      strategicIntentRevalidationFromCurrentPublicEvents({
        side: "runner",
        stateVersion: 2,
        eventTail: [setupEvent()],
      }),
    ).toEqual({
      observedAtStateVersion: 2,
      reason: "phase_change",
      evidenceCodes: ["public_event:setup_mulligan_completed_for:runner"],
    });
  });

  it("projects only public revalidation facts and drops unrelated or private event data", () => {
    const event = {
      ...setupEvent({
        publicPayload: {
          cardDefinitionId: "must-not-cross-the-sensor-boundary",
        },
      }),
      privatePayload: {
        corp: {
          hiddenCardIds: ["secret-card"],
        },
      },
    };

    const [facts] = strategicIntentRevalidationPublicEventFacts([event]);

    expect(facts?.publicPayload).toEqual({
      actor: "corp",
      setupSide: "corp",
      setupStep: "mulligan",
      setupStatus: "complete",
    });
    expect(facts).not.toHaveProperty("privatePayload");
  });

  it.each([
    ["stale event", setupEvent({ stateVersionAfter: 1 })],
    ["future event", setupEvent({ stateVersionAfter: 3 })],
    ["wrong event type", setupEvent({ type: "play_card" })],
    [
      "unfinished setup",
      setupEvent({ publicPayload: { setupStatus: "mulligan_corp" } }),
    ],
    [
      "non-mulligan choice",
      setupEvent({ publicPayload: { setupStep: "trace_bid" } }),
    ],
  ])("does not derive a trigger from a %s", (_label, event) => {
    expect(
      strategicIntentRevalidationFromCurrentPublicEvents({
        side: "corp",
        stateVersion: 2,
        eventTail: [event],
      }),
    ).toBeUndefined();
  });
});

function setupEvent(overrides?: {
  type?: string;
  stateVersionAfter?: number;
  publicPayload?: Partial<Record<string, unknown> & { actor?: Side }>;
}): PublicGameEvent {
  return {
    eventId: "evt_setup",
    type: overrides?.type ?? "resolve_choice",
    stateVersionBefore: 1,
    stateVersionAfter: overrides?.stateVersionAfter ?? 2,
    stateHashAfter: "fnv1a:test",
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "corp",
      setupSide: "corp",
      setupStep: "mulligan",
      setupStatus: "complete",
      redactedKind: "hidden_zone",
      hiddenZoneBarrier: true,
      ...overrides?.publicPayload,
    },
  };
}
