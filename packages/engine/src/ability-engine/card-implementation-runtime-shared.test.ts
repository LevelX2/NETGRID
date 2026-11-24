import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
import { describe, expect, it } from "vitest";

import { deterministicOnPlayResourcePayload } from "./card-implementation-runtime-shared";
import { createGameAfterSetup } from "../index";

describe("deterministic on-play action-capacity payload", () => {
  it.each([0, 1, 3, 8])(
    "quotes only drawable Runner cards with stack size %s",
    (stackSize) => {
      const definition = CARD_DEFINITIONS_BY_ID[307]!;
      const state = createGameAfterSetup({
        seed: `bounded-on-play:${stackSize}`,
      });
      state.runner.stack = state.runner.stack.slice(0, stackSize);
      expect(
        deterministicOnPlayResourcePayload(definition, "runner", state),
      ).toMatchObject({ drawCardsAmount: Math.min(3, stackSize) });
      expect(() =>
        deterministicOnPlayResourcePayload(definition, "runner"),
      ).toThrow("requires the current game state");
    },
  );

  it.each([
    [301, "any_card"],
    [299, "program"],
  ])("publishes the canonical heap recovery filter for %s", (id, filter) => {
    expect(
      deterministicOnPlayResourcePayload(
        CARD_DEFINITIONS_BY_ID[id!]!,
        "runner",
      ),
    ).toMatchObject({
      cardImplementationEffectKind: "search_trash_to_grip",
      cardImplementationSearchFilter: filter,
    });
  });

  it("publishes Valu-Pak's exact restricted program-install bundle", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID[329];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      gainActionsAmount: 5,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "program_install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
    });
  });

  it("publishes Edgerunner's exact restricted Corp-install bundle", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID[501];

    expect(
      deterministicOnPlayResourcePayload(definition!, "corp"),
    ).toMatchObject({
      gainActionsAmount: 3,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "install_only",
      actionCapacityAllowedActionType: "install_card",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
    });
  });

  it("publishes exact on-play tag removal without a card-id contract", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID[328];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      cardImplementationEffectKind: "remove_tags",
      cardImplementationTagMode: "all",
      cardImplementationTagAmount: "all",
    });
  });

  it("publishes exact on-play advancement distribution", () => {
    const definition = CARD_DEFINITIONS_BY_ID[517];

    expect(
      deterministicOnPlayResourcePayload(definition!, "corp"),
    ).toMatchObject({
      cardImplementationEffectKind: "distribute_advancement_counters",
      advancementCounterAmount: 2,
      advancementCounterChoiceMode: "up_to_distinct_targets_one_each",
      scoreConversionCapability: "place_advancement",
      scoreConversionAdvancementAmount: 2,
      scoreConversionTargetMode: "installed_advanceable_cards",
    });
  });

  it("publishes exact deterministic bad-publicity and self-damage effects", () => {
    const definition = CARD_DEFINITIONS_BY_ID[166];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      badPublicityAdded: 1,
      damageAmount: 2,
      damageType: "core",
      preventableDamage: false,
      unpreventableDamage: true,
    });
  });

  it("projects every deterministic make-run context field before run start", () => {
    expect(
      deterministicOnPlayResourcePayload(
        CARD_DEFINITIONS_BY_ID[47]!,
        "runner",
      ),
    ).toMatchObject({
      corpRezCostSurchargeKind: "matching_printed_rez_cost",
    });
    expect(
      deterministicOnPlayResourcePayload(
        CARD_DEFINITIONS_BY_ID[178]!,
        "runner",
      ),
    ).toMatchObject({ runnerCreditGainOnCorpRez: 1 });
    expect(
      deterministicOnPlayResourcePayload(
        CARD_DEFINITIONS_BY_ID[185]!,
        "runner",
      ),
    ).toMatchObject({ damagePreventionPool: 7 });
    expect(
      deterministicOnPlayResourcePayload(
        CARD_DEFINITIONS_BY_ID[162]!,
        "runner",
      ),
    ).toMatchObject({ eventApproachIceExposeBeforeRez: true });
  });

  it("publishes an optional follow-up run as an action-bound fact", () => {
    const definition = CARD_DEFINITIONS_BY_ID[288];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      followupRunOnEnd: "optional",
    });
  });

  it("publishes declarative run-duration effects for an on-play run", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID[310];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      runTemporaryCredits: 9,
      afterRunUnpreventableCoreDamage: 1,
    });
  });
});
