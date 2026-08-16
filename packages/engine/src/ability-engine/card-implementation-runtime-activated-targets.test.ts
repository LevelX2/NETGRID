import type { GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActivatedCardAbilityImplementation } from "./definition-types";
import { cardImplementationForDefinitionId } from "../card-implementations/registry";
import {
  activatedAbilityPayload,
  scoreConversionCapabilityPayloadForEffects,
} from "./card-implementation-runtime-activated-targets";
import { actionCapacityLegalActionPayloadForEffects } from "./card-implementation-action-capacity";
import {
  canonicalCapabilityId,
  capabilityKey,
} from "@netgrid/cards/engine";
import type { ActivatedAbilityBinding } from "./card-capability-binding";

function binding(
  ability: ActivatedCardAbilityImplementation,
): ActivatedAbilityBinding {
  const key = capabilityKey("test_activated_ability");
  return {
    kind: "card_spec_capability_key",
    ability,
    capabilityKey: key,
    sourceAbilityId: canonicalCapabilityId("test_card" as never, key),
  };
}

describe("activatedAbilityPayload advancement semantics", () => {
  it("publishes a deterministic controller draw for abstract action planning", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "draw_cards",
          recipient: "corp",
          amount: 2,
          visibility: "public",
        },
      ],
    };
    const state = {
      cardInstances: {
        source: { controller: "corp" },
      },
    } as unknown as GameState;

    expect(
      activatedAbilityPayload("source" as never, ability, binding(ability), state),
    ).toMatchObject({
      drawCardsAmount: 2,
    });
  });

  it("publishes the exact visible all-available hosted-credit cashout", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          mode: "all",
          visibility: "public",
        },
      ],
    };
    const state = {
      cardInstances: {
        source: { counters: { bit: 12 } },
      },
    } as unknown as GameState;

    expect(
      activatedAbilityPayload("source" as never, ability, binding(ability), state),
    ).toMatchObject({
      gainCreditsAmount: 12,
      hostedCreditTakeAmount: 12,
      hostedCreditTakeMode: "all",
      cardImplementationHostedCreditCashOutMaxUses: 1,
    });
  });

  it("publishes the finite current-state use ceiling for repeatable hosted-credit cashout", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "take_hosted_credits",
          source: "source",
          recipient: "controller",
          amount: 2,
          visibility: "public",
        },
      ],
    };
    const fullState = {
      cardInstances: {
        source: { counters: { bit: 12 } },
      },
    } as unknown as GameState;
    const partialState = {
      cardInstances: {
        source: { counters: { bit: 3 } },
      },
    } as unknown as GameState;

    expect(
      activatedAbilityPayload(
        "source" as never,
        ability,
        binding(ability),
        fullState,
      ),
    ).toMatchObject({
      gainCreditsAmount: 2,
      hostedCreditTakeAmount: 2,
      cardImplementationHostedCreditCashOutMaxUses: 6,
    });
    expect(
      activatedAbilityPayload(
        "source" as never,
        ability,
        binding(ability),
        partialState,
      ),
    ).toMatchObject({
      gainCreditsAmount: 2,
      hostedCreditTakeAmount: 2,
      cardImplementationHostedCreditCashOutMaxUses: 1,
    });
  });

  it("publishes an exact visible advancement-counter cashout", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "corp_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "gain_credits_per_advancement_counter_on_source",
          recipient: "corp",
          amountPerCounter: 4,
          visibility: "public",
        },
        {
          kind: "trash_source",
          visibility: "public",
        },
      ],
    };
    const state = {
      cardInstances: {
        source: { controller: "corp", advancementCounters: 2 },
      },
    } as unknown as GameState;

    expect(
      activatedAbilityPayload("source" as never, ability, binding(ability), state),
    ).toMatchObject({
      gainCreditsAmount: 8,
      advancementCounterCount: 2,
      cardImplementationEconomyKind:
        "gain_credits_per_advancement_counter_on_source",
      cardImplementationAmountPerAdvancementCounter: 4,
      cardImplementationTrashesSource: true,
    });
  });

  it("publishes a side-safe run projection for declarative run abilities", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "make_run",
          target: { kind: "central_server", server: "rd" },
          successfulRunAccessReplacement: "private_look_top_rd",
          successfulRunPrivateLookCount: 5,
          bypassFirstIce: true,
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, binding(ability)),
    ).toMatchObject({
      cardImplementationEffectKind: "make_run",
      runActionKind: "make_run",
      serverId: "rd",
      runServerId: "rd",
      successfulRunAccessReplacement: "private_look_top_rd",
      successfulRunPrivateLookCount: 5,
      bypassFirstIce: true,
    });
  });

  it("publishes a side-safe program-search projection for declarative stack tutors", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "runner_main",
      costs: [
        { kind: "action", amount: 1 },
        { kind: "credit", amount: 1 },
      ],
      effects: [
        {
          kind: "search_stack_to_grip",
          filter: "program",
          revealToCorp: true,
          shuffleAfterwards: true,
          visibility: "hidden_info_barrier",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, binding(ability)),
    ).toMatchObject({
      cardImplementationEffectKind: "search_stack_to_grip",
      cardImplementationSearchFilter: "program",
    });
  });

  it("publishes exact tag-removal semantics for an activated ability", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "remove_tags",
          recipient: "runner",
          mode: "up_to_amount",
          amount: 3,
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, binding(ability)),
    ).toMatchObject({
      cardImplementationEffectKind: "remove_tags",
      cardImplementationTagMode: "up_to_amount",
      cardImplementationTagAmount: 3,
    });
  });

  it("publishes scoring the visible source as an agenda", () => {
    const ability: ActivatedCardAbilityImplementation = {
      kind: "activated",
      timing: "runner_main",
      costs: [{ kind: "action", amount: 1 }],
      effects: [
        {
          kind: "score_source_as_agenda",
          visibility: "public",
        },
      ],
    };

    expect(
      activatedAbilityPayload("source" as never, ability, binding(ability)),
    ).toMatchObject({
      cardImplementationScoresSourceAsAgenda: true,
    });
  });

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
      activatedAbilityPayload("source" as never, ability, binding(ability)),
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
      activatedAbilityPayload("source" as never, ability, binding(ability)),
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
      activatedAbilityPayload("source" as never, ability, binding(ability)),
    ).toMatchObject({
      gainActionsAmount: 2,
      actionCapacityTiming: "immediate",
      actionCapacityRestriction: "unrestricted",
      actionCapacityReliability: "guaranteed",
      actionCapacityExpiresAt: "side_turn_end",
      scoreConversionCapability: "gain_action_capacity",
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
        gainActionsAmount: amount,
        actionCapacityTiming: "immediate",
        actionCapacityRestriction: "unrestricted",
        actionCapacityReliability: "guaranteed",
        scoreConversionCapability: "gain_action_capacity",
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
  return {
    ...scoreConversionCapabilityPayloadForEffects(ability!.effects),
    ...actionCapacityLegalActionPayloadForEffects(ability!.effects, "corp"),
  };
}
