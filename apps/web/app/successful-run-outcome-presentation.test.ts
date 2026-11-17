import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  latestSuccessfulRunOutcomePresentation,
  successfulRunOutcomePresentationFromEvent,
} from "./successful-run-outcome-presentation";

describe("successful run outcome presentation", () => {
  it.each(["play_event", "continue_run"])(
    "derives the same Weather-to-Finance result from %s",
    (actionType) => {
      expect(
        successfulRunOutcomePresentationFromEvent(
          event(100, actionType, 4),
        ),
      ).toEqual({
        eventId: 100,
        sourceDefinitionId: 330,
        sourceTitle: "Weather-to-Finance Pipe",
        headline: "Erfolgreicher HQ-Run",
        resultText: "Korp verliert 4 Credits. Kein Karten-Access auf HQ.",
        creditLoss: 4,
        serverLabel: "HQ",
      });
    },
  );

  it("uses the actual partial credit loss", () => {
    expect(
      successfulRunOutcomePresentationFromEvent(
        event(101, "play_event", 1),
      )?.resultText,
    ).toBe("Korp verliert 1 Credit. Kein Karten-Access auf HQ.");
  });

  it("rejects unresolved, failed and unrelated events", () => {
    const unresolved = event(102, "play_event", 4);
    delete unresolved.publicPayload.runSuccessful;
    const failed = event(103, "continue_run", 4);
    failed.publicPayload.runSuccessful = false;
    const unrelated = event(104, "continue_run", 4);
    unrelated.publicPayload.sourceDefinitionId =
      296;

    expect(successfulRunOutcomePresentationFromEvent(unresolved)).toBeNull();
    expect(successfulRunOutcomePresentationFromEvent(failed)).toBeNull();
    expect(successfulRunOutcomePresentationFromEvent(unrelated)).toBeNull();
  });

  it("retains the latest result until that local event is dismissed", () => {
    const earlierPresentationEvent = event(105, "play_event", 4);
    const presentationEvent = event(100, "continue_run", 4);
    const laterEvent: PublicGameEvent = {
      ...event(106, "gain_credit", 0),
      publicPayload: { actionType: "gain_credit", actor: "runner" },
    };

    expect(
      latestSuccessfulRunOutcomePresentation(
        [earlierPresentationEvent, presentationEvent, laterEvent],
        null,
      )?.eventId,
    ).toBe(100);
    expect(
      latestSuccessfulRunOutcomePresentation(
        [earlierPresentationEvent, presentationEvent, laterEvent],
        100,
      ),
    ).toBeNull();
  });
});

function event(
  eventId: number,
  actionType: string,
  creditLoss: number,
): PublicGameEvent {
  return {
    eventId,
    type: actionType,
    stateVersionBefore: 5,
    stateVersionAfter: 6,
    stateHashAfter: "fnv1a:test",
    publicPayload: {
      actionType,
      actor: "runner",
      sourceDefinitionId: 330,
      sourceTitle: "Weather-to-Finance Pipe",
      serverId: "hq",
      accessReplacement: "corp_lose_credits",
      creditLoss,
      corpCreditsAfter: 2,
      runSuccessful: true,
      accessSkipped: true,
      hiddenZoneBarrier: true,
    },
  };
}
