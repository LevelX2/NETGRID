import { CARD_DEFINITIONS_BY_ID } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { deterministicOnPlayResourcePayload } from "./card-implementation-runtime-shared";

describe("deterministic on-play action-capacity payload", () => {
  it("publishes Valu-Pak's exact restricted program-install bundle", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID["onr_v1_117_valu-pak-software-bundle"];

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
      CARD_DEFINITIONS_BY_ID["onr_v1_289_edgerunner-inc-temps"];

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
      CARD_DEFINITIONS_BY_ID["onr_v1_116_total-genetic-retrofit"];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      cardImplementationEffectKind: "remove_tags",
      cardImplementationTagMode: "all",
      cardImplementationTagAmount: "all",
    });
  });

  it("publishes exact on-play advancement distribution", () => {
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_305_team-restructuring"];

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
    const definition =
      CARD_DEFINITIONS_BY_ID["onr_proteus_108_faked-hit"];

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

  it("publishes an optional follow-up run as an action-bound fact", () => {
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_076_all-nighter"];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      followupRunOnEnd: "optional",
    });
  });

  it("publishes declarative run-duration effects for an on-play run", () => {
    const definition =
      CARD_DEFINITIONS_BY_ID["onr_v1_098_lucidrine-booster-drug"];

    expect(
      deterministicOnPlayResourcePayload(definition!, "runner"),
    ).toMatchObject({
      runTemporaryCredits: 9,
      afterRunUnpreventableCoreDamage: 1,
    });
  });
});
