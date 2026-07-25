import { describe, expect, it } from "vitest";
import type { GameEvent } from "@netgrid/shared";
import { projectEngineEventToPublicEvent } from "./event-projection";

describe("server event projection", () => {
  it("preserves the Engine turn serial as a public cadence fact", () => {
    const event: GameEvent = {
      eventId: "event_turn_9",
      type: "start_run",
      stateVersionBefore: 20,
      stateVersionAfter: 21,
      turnSerial: 9,
      stateHashAfter: "hash" as never,
      publicPayload: {
        actor: "runner",
        actionType: "start_run",
        serverId: "hq",
      },
    };

    expect(projectEngineEventToPublicEvent(event)).toMatchObject({
      turnSerial: 9,
    });
  });
});
