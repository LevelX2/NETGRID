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
          event("evt_weather", actionType, 4),
        ),
      ).toEqual({
        eventId: "evt_weather",
        sourceDefinitionId: "onr_v1_118_weather-to-finance-pipe",
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
        event("evt_partial", "play_event", 1),
      )?.resultText,
    ).toBe("Korp verliert 1 Credit. Kein Karten-Access auf HQ.");
  });

  it("rejects unresolved, failed and unrelated events", () => {
    const unresolved = event("evt_unresolved", "play_event", 4);
    delete unresolved.publicPayload.runSuccessful;
    const failed = event("evt_failed", "continue_run", 4);
    failed.publicPayload.runSuccessful = false;
    const unrelated = event("evt_other", "continue_run", 4);
    unrelated.publicPayload.sourceDefinitionId =
      "onr_v1_084_edited-shipping-manifests";

    expect(successfulRunOutcomePresentationFromEvent(unresolved)).toBeNull();
    expect(successfulRunOutcomePresentationFromEvent(failed)).toBeNull();
    expect(successfulRunOutcomePresentationFromEvent(unrelated)).toBeNull();
  });

  it("retains the latest result until that local event is dismissed", () => {
    const earlierPresentationEvent = event("evt_earlier", "play_event", 4);
    const presentationEvent = event("evt_weather", "continue_run", 4);
    const laterEvent: PublicGameEvent = {
      ...event("evt_later", "gain_credit", 0),
      publicPayload: { actionType: "gain_credit", actor: "runner" },
    };

    expect(
      latestSuccessfulRunOutcomePresentation(
        [earlierPresentationEvent, presentationEvent, laterEvent],
        null,
      )?.eventId,
    ).toBe("evt_weather");
    expect(
      latestSuccessfulRunOutcomePresentation(
        [earlierPresentationEvent, presentationEvent, laterEvent],
        "evt_weather",
      ),
    ).toBeNull();
  });
});

function event(
  eventId: string,
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
      sourceDefinitionId: "onr_v1_118_weather-to-finance-pipe",
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
