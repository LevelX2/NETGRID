import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import { serverIdFromEvent } from "./public-event-history";

describe("serverIdFromEvent", () => {
  it("uses structured server ids and ignores label-only server text", () => {
    expect(serverIdFromEvent(event({ serverLabel: "R&D" }))).toBeUndefined();
    expect(serverIdFromEvent(event({ serverName: "HQ" }))).toBeUndefined();
    expect(serverIdFromEvent(event({ serverId: "rd" }))).toBe("rd");
    expect(serverIdFromEvent(event({ attackedServerId: "hq" }))).toBe("hq");
    expect(serverIdFromEvent(event({ targetServerId: "archives" }))).toBe(
      "archives",
    );
  });
});

function event(publicPayload: Record<string, unknown>): PublicGameEvent {
  return {
    eventId: `event-${JSON.stringify(publicPayload)}`,
    type: "start_run",
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: "test-hash",
    publicPayload,
  };
}
