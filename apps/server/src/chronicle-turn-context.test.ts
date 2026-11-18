import { describe, expect, it } from "vitest";
import type { PublicGameEvent, Side } from "@netgrid/shared";

import {
  chronicleTurnContextByEventId,
  chronicleTurnNumberForEvent,
  advanceChronicleTurnContext,
  initialChronicleTurnCursor,
} from "./chronicle-turn-context";

describe("chronicle turn context", () => {
  it("continues from a persisted prefix at every boundary, including end-turn discards", () => {
    const events = [
      event(1, "corp", "mandatory_draw"),
      event(2, "corp", "end_turn"),
      event(3, "corp", "resolve_choice", { discardResolved: true }),
      event(4, "corp", "resolve_choice", { hiddenZoneAction: "discard_phase" }),
      event(5, "runner", "gain_credit"),
      event(6, "runner", "end_turn"),
      event(7, "corp", "mandatory_draw"),
    ];
    const full = chronicleTurnContextByEventId(events);
    for (let split = 0; split <= events.length; split += 1) {
      let cursor = initialChronicleTurnCursor();
      for (const entry of events.slice(0, split))
        cursor = advanceChronicleTurnContext(cursor, entry).cursor;
      const tail = events.slice(split);
      const continued = chronicleTurnContextByEventId(tail, JSON.parse(JSON.stringify(cursor)));
      for (const entry of tail) expect(continued[entry.eventId]).toEqual(full[entry.eventId]);
    }
  });

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
