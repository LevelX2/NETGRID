import { type CardDefinitionId } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import {
  appendPendingAccessPresentationEvents,
  dismissPendingAccessPresentationEvent,
} from "./access-presentation-queue";

describe("access presentation queue", () => {
  it("keeps four public Rush Hour accesses in event order despite repeated definitions", () => {
    const incoming = [
      access(12, 9143, "Data Wall", 0),
      access(13, 9144, "Urban Renewal", 1),
      access(14, 9143, "Data Wall", 2),
      access(15, 9144, "Urban Renewal", 3),
    ];

    expect(
      appendPendingAccessPresentationEvents([], incoming, []).map(
        (event) => event.eventId,
      ),
    ).toEqual([12, 13, 14, 15]);
  });

  it("retains an access when later unrelated events arrive", () => {
    const pending = appendPendingAccessPresentationEvents(
      [],
      [access(15, 9144, "Urban Renewal", 3)],
      [],
    );
    const next = appendPendingAccessPresentationEvents(
      pending,
      [event(16, "install_card"), event(17, "end_turn")],
      [],
    );

    expect(next.map((item) => item.eventId)).toEqual([15]);
  });

  it("does not requeue dismissed or redacted accesses", () => {
    const redacted = event(100, "access_card", {
      redactedKind: "accessed_card",
    });
    expect(
      appendPendingAccessPresentationEvents(
        [],
        [access(14, 9143, "Data Wall", 2), redacted],
        [14],
      ),
    ).toEqual([]);
  });

  it("removes only the acknowledged access", () => {
    const pending = [
      access(14, 9143, "Data Wall", 2),
      access(15, 9144, "Urban Renewal", 3),
    ];
    expect(
      dismissPendingAccessPresentationEvent(pending, 14).map(
        (item) => item.eventId,
      ),
    ).toEqual([15]);
  });
});

function access(
  eventId: number,
  cardDefinitionId: CardDefinitionId,
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
  eventId: number,
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
