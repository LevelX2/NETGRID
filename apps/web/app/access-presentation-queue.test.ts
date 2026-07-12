import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import {
  appendPendingAccessPresentationEvents,
  dismissPendingAccessPresentationEvent,
} from "./access-presentation-queue";

describe("access presentation queue", () => {
  it("keeps four public Rush Hour accesses in event order despite repeated definitions", () => {
    const incoming = [
      access("evt_11", "data_wall", "Data Wall", 0),
      access("evt_12", "urban_renewal", "Urban Renewal", 1),
      access("evt_13", "data_wall", "Data Wall", 2),
      access("evt_14", "urban_renewal", "Urban Renewal", 3),
    ];

    expect(
      appendPendingAccessPresentationEvents([], incoming, []).map(
        (event) => event.eventId,
      ),
    ).toEqual(["evt_11", "evt_12", "evt_13", "evt_14"]);
  });

  it("retains an access when later unrelated events arrive", () => {
    const pending = appendPendingAccessPresentationEvents(
      [],
      [access("evt_14", "urban_renewal", "Urban Renewal", 3)],
      [],
    );
    const next = appendPendingAccessPresentationEvents(
      pending,
      [event("evt_15", "install_card"), event("evt_16", "end_turn")],
      [],
    );

    expect(next.map((item) => item.eventId)).toEqual(["evt_14"]);
  });

  it("does not requeue dismissed or redacted accesses", () => {
    const redacted = event("evt_hidden", "access_card", {
      redactedKind: "accessed_card",
    });
    expect(
      appendPendingAccessPresentationEvents(
        [],
        [access("evt_13", "data_wall", "Data Wall", 2), redacted],
        ["evt_13"],
      ),
    ).toEqual([]);
  });

  it("removes only the acknowledged access", () => {
    const pending = [
      access("evt_13", "data_wall", "Data Wall", 2),
      access("evt_14", "urban_renewal", "Urban Renewal", 3),
    ];
    expect(
      dismissPendingAccessPresentationEvent(pending, "evt_13").map(
        (item) => item.eventId,
      ),
    ).toEqual(["evt_14"]);
  });
});

function access(
  eventId: string,
  cardDefinitionId: string,
  title: string,
  accessIndex: number,
): PublicGameEvent {
  return event(eventId, "access_card", {
    actor: "runner",
    cardDefinitionId,
    title,
    serverLabel: "R&D",
    accessIndex,
    baseAccessCount: 4,
    effectiveAccessCount: 4,
  });
}

function event(
  eventId: string,
  actionType: string,
  payload: Record<string, unknown> = {},
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 1,
    stateVersionAfter: 2,
    stateHashAfter: `hash:${eventId}`,
    publicPayload: { actionType, ...payload },
  };
}
