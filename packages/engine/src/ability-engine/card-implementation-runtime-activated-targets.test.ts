import { describe, expect, it } from "vitest";
import type { ActivatedCardAbilityImplementation } from "./definition-types";
import { activatedAbilityPayload } from "./card-implementation-runtime-activated-targets";

describe("activatedAbilityPayload advancement semantics", () => {
  it("publishes advancement distribution amount and mode", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "distribute_advancement_counters",
          amount: 2,
          target: "installed_advanceable_cards",
          distribution: "single_target",
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, 0),
    ).toMatchObject({
      cardImplementationEffectKind: "distribute_advancement_counters",
      advancementCounterAmount: 2,
      advancementCounterChoiceMode: "single_target",
      scoreConversionCapability: "place_advancement",
      scoreConversionAdvancementAmount: 2,
      scoreConversionAdvancementMode: "single_target",
      scoreConversionTargetMode: "installed_advanceable_cards",
      scoreConversionTiming: "immediate",
    });
  });

  it("publishes advancement transfer semantics", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "move_advancement_counters",
          source: "source_card",
          target: "chosen_installed_advanceable_card",
          maxAmount: "all",
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, 1),
    ).toMatchObject({
      cardImplementationEffectKind: "move_advancement_counters",
      advancementCounterMoveMaximum: "all",
      advancementCounterMoveSource: "source_card",
      advancementCounterMoveTarget: "chosen_installed_advanceable_card",
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
    });
  });

  it("publishes immediate Corp action-capacity semantics", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "corp_main",
      costs: [
        {
          kind: "source_counter",
          counterType: "boon",
          amount: 1,
          source: "source",
        },
      ],
      effects: [
        {
          kind: "gain_actions",
          recipient: "corp",
          amount: 2,
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, 2),
    ).toMatchObject({
      scoreConversionCapability: "gain_action_capacity",
      scoreConversionActionGainAmount: 2,
      scoreConversionTiming: "immediate",
    });
  });
});
