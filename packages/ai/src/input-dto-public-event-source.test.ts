import type { PublicGameEvent } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildAiDecisionInputDto } from "./input-dto";
import {
  legalAction,
  playerView,
} from "./semantic-ai-runtime-cutover.test-support";

describe("AI input DTO public event source binding", () => {
  it("preserves the Engine-owned post-pass ICE lifecycle quote", () => {
    const action = legalAction(
      "corp.datacomb.pay",
      "corp",
      "continue_run",
      "Keep the passed ICE",
      { credits: 1, clicks: 0 },
    );
    action.source = "datacomb-ice";
    action.payload = {
      corpPostPassIceAbility: "return_passed_ice_to_hq",
      sourceDefinitionId: "onr_proteus_018_datacomb",
      decision: "pay",
      paymentAmount: 1,
      serverId: "rd",
      unapprovedLifecycleAlias: "must-not-cross-dto",
    };
    const view = playerView("corp", [action]);
    action.expiresAtStateVersion = view.stateVersion;

    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: view,
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "post-pass-lifecycle",
      decisionId: "post-pass-lifecycle:corp:1",
      actionNumber: 1,
      profileId: "post-pass-lifecycle-test",
    });

    expect(input.legalActions[0]?.payload).toEqual({
      corpPostPassIceAbility: "return_passed_ice_to_hq",
      sourceDefinitionId: "onr_proteus_018_datacomb",
      decision: "pay",
      paymentAmount: 1,
      serverId: "rd",
    });
  });

  it("preserves exact actor-side canonical capability binding and rejects hybrid AbilityRef", () => {
    const action = legalAction(
      "canonical-action",
      "runner",
      "activated_card_ability",
      "Use ability",
      { credits: 0, clicks: 0 },
    );
    action.source = "source";
    action.payload = {
      cardId: "source",
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationAbilityId: "test_card:gain",
      cardImplementationAbilityKey: "gain",
    };
    action.abilityRef = {
      sourceCardInstanceId: "source",
      sourceAbilityId: "test_card:gain",
    };
    const view = playerView("runner", [action]);
    const build = () =>
      buildAiDecisionInputDto({
        side: "runner",
        playerView: view,
        eventTail: [],
        legalActions: [action],
        difficulty: "normal",
        seed: "canonical-binding",
        decisionId: "canonical-binding:runner:1",
        actionNumber: 1,
        profileId: "canonical-binding-test",
      });
    expect(build().legalActions[0]).toMatchObject({
      abilityRef: {
        sourceCardInstanceId: "source",
        sourceAbilityId: "test_card:gain",
      },
      payload: {
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityId: "test_card:gain",
        cardImplementationAbilityKey: "gain",
      },
    });
    action.payload.cardImplementationAbilityIndex = 0;
    expect(build).toThrow(/conflicts with its AbilityRef/);
    delete action.payload.cardImplementationAbilityIndex;
    const exactPayload = action.payload;
    delete action.payload;
    expect(build).toThrow(/requires an exact payload binding/);
    action.payload = exactPayload;
    action.abilityRef = {
      sourceCardInstanceId: "source",
      abilityId: "legacy",
      sourceAbilityId: "test_card:gain",
    } as never;
    expect(build).toThrow(/AbilityRef/);
  });

  it("does not expose legacy implementation identity through the AI DTO", () => {
    const action = legalAction(
      "legacy-action",
      "runner",
      "activated_card_ability",
      "Use legacy ability",
      { credits: 0, clicks: 0 },
    );
    action.payload = {
      cardImplementationAbilityId: "legacy-primitive",
      cardImplementationAbilityKey: "legacy-key",
      cardImplementationAbilityIndex: 2,
      cardImplementationLifecycleAbilityIndex: 3,
    };
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView("runner", [action]),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "legacy-binding",
      decisionId: "legacy-binding:runner:1",
      actionNumber: 1,
      profileId: "legacy-binding-test",
    });
    expect(input.legalActions[0]?.payload).toEqual({});
  });

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
