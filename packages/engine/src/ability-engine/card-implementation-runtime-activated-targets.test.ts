import { describe, expect, it } from "vitest";
import type { ActivatedCardAbilityImplementation } from "./definition-types";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import {
  activatedAbilityPayload,
  scoreConversionCapabilityPayloadForEffects,
} from "./card-implementation-runtime-activated-targets";

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

describe("score-conversion card-family contract", () => {
  it.each([
    ["onr_v1_304_systematic-layoffs", 2, "any_combination"],
    ["onr_v1_292_management-shake-up", 3, "any_combination"],
    ["onr_v1_300_project-consultants", 4, "any_combination"],
    ["onr_v1_305_team-restructuring", 2, "up_to_distinct_targets_one_each"],
    ["onr_v1_312_chicago-branch", 2, "single_target"],
  ] as const)(
    "%s publishes its exact placement amount and distribution",
    (definitionId, amount, distribution) => {
      expect(scoreConversionPayload(definitionId)).toMatchObject({
        scoreConversionCapability: "place_advancement",
        scoreConversionAdvancementAmount: amount,
        scoreConversionAdvancementMode: distribution,
        scoreConversionTiming: "immediate",
      });
    },
  );

  it.each([
    ["onr_v1_291_falsified-transactions-expert", "chosen_card", 3],
    ["onr_v1_347_vapor-ops", "source_card", "all"],
  ] as const)(
    "%s publishes its exact transfer source and maximum",
    (definitionId, sourceMode, maximum) => {
      expect(
        scoreConversionPayload(definitionId, "move_advancement_counters"),
      ).toMatchObject({
        scoreConversionCapability: "move_advancement",
        scoreConversionAdvancementMaximum: maximum,
        scoreConversionSourceMode: sourceMode,
        scoreConversionTiming: "immediate",
      });
    },
  );

  it.each([
    ["onr_v1_297_overtime-incentives", 2],
    ["onr_v1_334_pacifica-regional-ai", 1],
    ["onr_v1_192_corporate-boon", 1],
  ] as const)(
    "%s publishes immediate action capacity",
    (definitionId, amount) => {
      expect(
        scoreConversionPayload(definitionId, "gain_actions"),
      ).toMatchObject({
        scoreConversionCapability: "gain_action_capacity",
        scoreConversionActionGainAmount: amount,
        scoreConversionTiming: "immediate",
      });
    },
  );
});

function scoreConversionPayload(
  definitionId: string,
  effectKind?: string,
): Record<string, string | number | boolean> {
  const implementation = cardImplementationForDefinitionId(
    definitionId as never,
  );
  const ability = implementation?.abilities?.find((candidate) =>
    effectKind
      ? candidate.effects.some((effect) => effect.kind === effectKind)
      : candidate.effects.some(
          (effect) => effect.kind === "distribute_advancement_counters",
        ),
  );
  expect(
    ability,
    `missing score-conversion ability on ${definitionId}`,
  ).toBeDefined();
  return scoreConversionCapabilityPayloadForEffects(ability!.effects);
}
