import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildAiDecisionInputDto } from "./input-dto";
import {
  legalAction,
  playerView,
} from "./semantic-ai-runtime-cutover.test-support";

describe("AI input DTO public event source binding", () => {
  it("preserves the structured actor-side source binding and drops unknown fields", () => {
    const action = legalAction(
      "runner.gain_credit",
      "runner",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const event: PublicGameEvent = {
      eventId: "actor-side-bank-load",
      type: "activated_card_ability",
      stateVersionBefore: 1,
      stateVersionAfter: 2,
      turnSerial: 4,
      stateHashAfter: "fnv1a:actor-side-bank-load",
      publicPayload: {
        actor: "runner",
        actionType: "activated_card_ability",
        sourceCardInstanceId: "broker-1",
        sourceDefinitionId: "onr_v1_154_broker",
        unapprovedSourceAlias: "must-not-cross-dto",
      },
    };
    const view = playerView("runner", [action]);
    view.turnSerial = 4;
    view.publicEvents = [event];

    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: view,
      eventTail: view.publicEvents,
      legalActions: [action],
      difficulty: "normal",
      seed: "actor-side-bank-load",
      decisionId: "actor-side-bank-load:runner:2",
      actionNumber: 2,
      profileId: "actor-side-bank-load-test",
    });

    expect(input.eventTail).toBe(input.playerView.publicEvents);
    expect(input.eventTail[0]?.publicPayload).toMatchObject({
      sourceCardInstanceId: "broker-1",
      sourceDefinitionId: "onr_v1_154_broker",
    });
    expect(input.eventTail[0]?.publicPayload).not.toHaveProperty(
      "unapprovedSourceAlias",
    );
  });
});
