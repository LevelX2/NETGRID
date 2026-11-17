import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";

import {
  chronicleTurnContextByEventId,
  chronicleTurnNumberForEvent,
} from "./chronicle-turn-context";

describe("chronicle turn context", () => {
  it("keeps all decisions in one turn together and increments only on side change", () => {
    const events = [
      event(1, "corp", "mandatory_draw"),
      event(2, "corp", "gain_credit"),
      event(3, "corp", "end_turn"),
      event(4, "runner", "gain_credit"),
      event(5, "runner", "end_turn"),
      event(6, "corp", "mandatory_draw"),
      event(7, "corp", "gain_credit"),
    ];

    const context = chronicleTurnContextByEventId(events);

    expect(context[2]).toEqual({
      turnNumber: 1,
      turnSide: "corp",
    });
    expect(context[3]).toEqual({
      turnNumber: 1,
      turnSide: "corp",
    });
    expect(context[5]).toEqual({
      turnNumber: 2,
      turnSide: "runner",
    });
    expect(context[7]).toEqual({
      turnNumber: 3,
      turnSide: "corp",
    });
    expect(chronicleTurnNumberForEvent(events, 8)).toBe(3);
  });

  it("keeps a discard resolution on the turn that just ended", () => {
    const events = [
      event(1, "corp", "end_turn"),
      event(2, "corp", "resolve_choice", {
        discardResolved: true,
      }),
      event(3, "runner", "gain_credit"),
    ];

    const context = chronicleTurnContextByEventId(events);

    expect(context[3]).toEqual({
      turnNumber: 1,
      turnSide: "corp",
    });
    expect(context[4]).toEqual({
      turnNumber: 2,
      turnSide: "runner",
    });
  });
});

function event(
  stateVersionAfter: number,
  actor: Side,
  actionType: string,
  extraPayload: Record<string, unknown> = {},
): PublicGameEvent {
  const eventId = stateVersionAfter + 1;
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
