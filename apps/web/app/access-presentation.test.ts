import { describe, expect, it } from "vitest";
import type { PublicGameEvent } from "@netgrid/shared";

import {
  actionCueAfterAiAdvanceRequest,
  accessPresentationOwnsActionCue,
  accessPresentationOutcomeAfter,
  coalesceAccessActionCues,
  interactionPresentationBlocksAi,
  observerAccessAutoDismissMs,
  publicAccessOwnsOutcomeEvent,
} from "./access-presentation";

describe("access presentation outcome ownership", () => {
  it("auto-dismisses access windows only while an observed simulation is running", () => {
    expect(observerAccessAutoDismissMs({ observerMode: true, pacingMode: "paced", configuredAutoDismissMs: 2500 })).toBe(2500);
    expect(observerAccessAutoDismissMs({ observerMode: true, pacingMode: "fast", configuredAutoDismissMs: 0 })).toBe(750);
    expect(observerAccessAutoDismissMs({ observerMode: true, pacingMode: "manual", configuredAutoDismissMs: 2500 })).toBeNull();
    expect(observerAccessAutoDismissMs({ observerMode: false, pacingMode: "paced", configuredAutoDismissMs: 2500 })).toBeNull();
  });

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
    ).toBe("Du hast die Agenda Public Agenda erbeutet.");
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

  it("defines access-owned cues and blocking presentation stages", () => {
    expect(accessPresentationOwnsActionCue("start_run")).toBe(true);
    expect(accessPresentationOwnsActionCue("trash_accessed_card")).toBe(true);
    expect(accessPresentationOwnsActionCue("pump_breaker")).toBe(false);
    expect(
      interactionPresentationBlocksAi({
        damageOpen: true,
        accessOutcomeOpen: false,
      }),
    ).toBe(true);
    expect(
      interactionPresentationBlocksAi({
        damageOpen: false,
        accessOutcomeOpen: true,
      }),
    ).toBe(true);
    expect(
      interactionPresentationBlocksAi({
        damageOpen: false,
        accessOutcomeOpen: false,
        successfulRunOutcomeOpen: true,
      }),
    ).toBe(true);
    expect(
      interactionPresentationBlocksAi({
        damageOpen: false,
        accessOutcomeOpen: false,
      }),
    ).toBe(false);
  });

  it("keeps run and hidden-access cues mounted while AI resolves the access", () => {
    const run = { actionType: "start_run", id: "run" };
    const access = { actionType: "access_card", id: "access" };
    const stolen = { actionType: "steal_agenda", id: "stolen" };

    expect(actionCueAfterAiAdvanceRequest(run)).toBe(run);
    expect(actionCueAfterAiAdvanceRequest(access)).toBe(access);
    expect(actionCueAfterAiAdvanceRequest(stolen)).toBeNull();
    expect(actionCueAfterAiAdvanceRequest(null)).toBeNull();
  });

  it("updates one cue slot from run through hidden access to trash", () => {
    const run = { actionType: "start_run", id: "run" };
    const access = { actionType: "access_card", id: "access" };
    const trash = { actionType: "trash_accessed_card", id: "trash" };

    const accessed = coalesceAccessActionCues(run, [], [access]);
    expect(accessed).toEqual({ current: access, queue: [] });
    expect(
      coalesceAccessActionCues(accessed.current, accessed.queue, [trash]),
    ).toEqual({ current: trash, queue: [] });
  });

  it("updates one mounted cue from hidden R&D access to the stolen agenda", () => {
    const access = { actionType: "access_card", id: "redacted-access" };
    const stolen = { actionType: "steal_agenda", id: "viral-breeding-ground" };

    const waiting = actionCueAfterAiAdvanceRequest(access);
    expect(coalesceAccessActionCues(waiting, [], [stolen])).toEqual({
      current: stolen,
      queue: [],
    });
  });

  it("releases a mounted hidden-access cue when the next AI action is unrelated", () => {
    const access = { actionType: "access_card", id: "redacted-access" };
    const economy = { actionType: "play_event", id: "economy-event" };

    const waiting = actionCueAfterAiAdvanceRequest(access);
    expect(coalesceAccessActionCues(waiting, [], [economy])).toEqual({
      current: economy,
      queue: [],
    });
  });

  it("coalesces a batched run and access while retaining unrelated cues", () => {
    const credit = { actionType: "gain_credit", id: "credit" };
    const run = { actionType: "start_run", id: "run" };
    const access = { actionType: "access_card", id: "access" };

    expect(
      coalesceAccessActionCues(null, [credit], [run, access]),
    ).toEqual({
      current: null,
      queue: [credit, access],
    });
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
