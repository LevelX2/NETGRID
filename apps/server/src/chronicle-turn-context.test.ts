import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";

import {
  chronicleTurnContextByEventId,
  chronicleTurnNumberForEvent,
} from "./chronicle-turn-context";

describe("chronicle turn context", () => {
  it("keeps all decisions in one turn together and increments only on side change", () => {
    const events = [
      event("corp-draw-1", 1, "corp", "mandatory_draw"),
      event("corp-credit-1", 2, "corp", "gain_credit"),
      event("corp-end-1", 3, "corp", "end_turn"),
      event("runner-credit-1", 4, "runner", "gain_credit"),
      event("runner-end-1", 5, "runner", "end_turn"),
      event("corp-draw-2", 6, "corp", "mandatory_draw"),
      event("corp-credit-2", 7, "corp", "gain_credit"),
    ];

    const context = chronicleTurnContextByEventId(events);

    expect(context["corp-draw-1"]).toEqual({
      turnNumber: 1,
      turnSide: "corp",
    });
    expect(context["corp-credit-1"]).toEqual({
      turnNumber: 1,
      turnSide: "corp",
    });
    expect(context["runner-credit-1"]).toEqual({
      turnNumber: 2,
      turnSide: "runner",
    });
    expect(context["corp-draw-2"]).toEqual({
      turnNumber: 3,
      turnSide: "corp",
    });
    expect(chronicleTurnNumberForEvent(events, "corp-credit-2")).toBe(3);
  });

  it("keeps a discard resolution on the turn that just ended", () => {
    const events = [
      event("corp-end", 1, "corp", "end_turn"),
      event("corp-discard", 2, "corp", "resolve_choice", {
        discardResolved: true,
      }),
      event("runner-action", 3, "runner", "gain_credit"),
    ];

    const context = chronicleTurnContextByEventId(events);

    expect(context["corp-discard"]).toEqual({
      turnNumber: 1,
      turnSide: "corp",
    });
    expect(context["runner-action"]).toEqual({
      turnNumber: 2,
      turnSide: "runner",
    });
  });
});

function event(
  eventId: string,
  stateVersionAfter: number,
  actor: Side,
  actionType: string,
  extraPayload: Record<string, unknown> = {},
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: { actor, actionType, ...extraPayload },
  };
}
