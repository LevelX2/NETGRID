import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import { latestAiDecisionDebugEventTrace } from "./ai-decision-debug-event-trace";

describe("actual AI decision event trace", () => {
  it("uses the newest recorded AI action rather than creating an advisor preview", () => {
    const trace = latestAiDecisionDebugEventTrace({
      matchId: "match_debug",
      matchVersion: 9,
      observedAt: "2026-07-26T20:20:00.000Z",
      eventTail: [humanEvent(), aiEvent(4), aiEvent(7)],
    });

    expect(trace).toMatchObject({
      traceId: "event_trace_ai_7",
      eventId: "ai_7",
      side: "corp",
      stateVersion: 7,
      selectedActionId: "corp.draw",
      selectedActionType: "draw_card",
      planKind: "corp.economy",
      detail: {
        planFirstDecision: {
          selectionAuthority: "resident_plan_instance",
          route: { actionId: "corp.draw" },
        },
      },
    });
  });

  it("fails closed when no projected AI debug event exists", () => {
    expect(
      latestAiDecisionDebugEventTrace({
        matchId: "match_debug",
        matchVersion: 9,
        observedAt: "2026-07-26T20:20:00.000Z",
        eventTail: [humanEvent()],
      }),
    ).toBeNull();
  });
});

function humanEvent(): PublicGameEvent {
  return {
    eventId: "human_1",
    type: "action",
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "hash_human",
    publicPayload: { actor: "runner", actionType: "gain_credit" },
  };
}

function aiEvent(stateVersion: number): PublicGameEvent {
  return {
    eventId: `ai_${stateVersion}`,
    type: "action",
    stateVersionBefore: stateVersion,
    stateVersionAfter: stateVersion + 1,
    stateHashAfter: `hash_ai_${stateVersion}`,
    publicPayload: {
      actor: "corp",
      actionType: "draw_card",
      chronicleTurnNumber: 3,
      aiDecisionDebug: {
        schemaVersion: "netgrid-ai-decision-debug-v1",
        confidence: 1,
        planFirstDecision: {
          selectionAuthority: "resident_plan_instance",
          selectedPlan: { moduleId: "corp.economy" },
          route: { actionId: "corp.draw", actionType: "draw_card" },
        },
      },
    },
  };
}
