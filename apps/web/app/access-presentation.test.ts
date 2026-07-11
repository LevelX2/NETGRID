import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import {
  accessPresentationOutcomeAfter,
  publicAccessOwnsOutcomeEvent,
} from "./access-presentation";

describe("access presentation outcome ownership", () => {
  it("folds a public Setup trash into its access presentation", () => {
    const access = event("evt_9", "access_card", {
      actor: "runner",
      cardDefinitionId: "onr_v1_340_setup",
      title: "Setup!",
      serverLabel: "R&D",
    });
    const trash = event("evt_10", "trash_accessed_card", {
      actor: "runner",
      cardDefinitionId: "onr_v1_340_setup",
      title: "Setup!",
      serverLabel: "R&D",
    });

    expect(publicAccessOwnsOutcomeEvent([access, trash], trash)).toBe(true);
    expect(
      accessPresentationOutcomeAfter([access, trash], access, "corp"),
    ).toEqual({
      eventId: "evt_10",
      kind: "trashed",
      status: "Der Runner hat Setup! getrasht.",
    });
  });

  it("folds steal and decline outcomes into the same public access", () => {
    const access = event("evt_access", "access_card", {
      actor: "runner",
      cardDefinitionId: "agenda_1",
      title: "Public Agenda",
    });
    const steal = event("evt_steal", "steal_agenda", {
      actor: "runner",
      cardDefinitionId: "agenda_1",
    });
    const decline = event("evt_decline", "decline_trash", {
      actor: "runner",
      cardDefinitionId: "agenda_1",
    });

    expect(
      accessPresentationOutcomeAfter([access, steal], access, "runner")
        ?.status,
    ).toBe("Du hast Public Agenda gestohlen.");
    expect(
      accessPresentationOutcomeAfter([access, decline], access, "corp")
        ?.status,
    ).toBe("Public Agenda wurde nicht getrasht.");
  });

  it("does not fold outcomes into a redacted access", () => {
    const hiddenAccess = event("evt_hidden", "access_card", {
      actor: "runner",
      serverLabel: "R&D",
      redactedKind: "hidden_zone",
    });
    const trash = event("evt_trash", "trash_accessed_card", {
      actor: "runner",
      cardDefinitionId: "secret_asset",
      title: "Secret Asset",
    });

    expect(publicAccessOwnsOutcomeEvent([hiddenAccess, trash], trash)).toBe(
      false,
    );
    expect(
      accessPresentationOutcomeAfter(
        [hiddenAccess, trash],
        hiddenAccess,
        "corp",
      ),
    ).toBeNull();
  });

  it("stops ownership at the next access in a multiaccess sequence", () => {
    const first = event("evt_first", "access_card", {
      cardDefinitionId: "first",
      title: "First",
    });
    const second = event("evt_second", "access_card", {
      cardDefinitionId: "second",
      title: "Second",
    });
    const trash = event("evt_trash", "trash_accessed_card", {
      cardDefinitionId: "second",
      title: "Second",
    });

    expect(
      accessPresentationOutcomeAfter([first, second, trash], first, "corp"),
    ).toBeNull();
    expect(
      accessPresentationOutcomeAfter([first, second, trash], second, "corp")
        ?.kind,
    ).toBe("trashed");
  });
});

function event(
  eventId: string,
  actionType: string,
  payload: Record<string, unknown>,
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
