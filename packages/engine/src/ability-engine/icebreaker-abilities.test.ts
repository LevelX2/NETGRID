import { describe, expect, it } from "vitest";
import { canonicalCapabilityId, capabilityKey } from "@netgrid/cards/engine";
import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import type {
  CardIcebreakerBreakMatcherImplementation,
  CardIcebreakerBreakSpecialImplementation,
} from "./definition-types";
import {
  IcebreakerAbilityBindingError,
  breakMatcherFields,
  icebreakerAbilityBindingPayload,
  resolveIcebreakerAbilityBinding,
  specialEffectsForImplementation,
  type RuntimeIcebreakerAbility,
} from "./icebreaker-abilities";

const definitionId = "test_breaker" as CardDefinitionId;
const breakerId = "breaker_instance" as CardInstanceId;

function canonicalPump(key: string, amount: number): RuntimeIcebreakerAbility {
  return {
    id: canonicalCapabilityId(definitionId, capabilityKey(key)),
    type: "pump_strength",
    cost: { credits: 1 },
    amount,
    timingPoint: "run.encounter_ice",
    source: "card_spec_capability",
  };
}

function actionFor(
  ability: RuntimeIcebreakerAbility,
  overrides: Partial<LegalAction> = {},
): LegalAction {
  const key = ability.id.slice(ability.id.indexOf(":") + 1);
  return {
    actionId: "test-action",
    side: "runner",
    type: "pump_breaker",
    label: "Pump",
    source: breakerId,
    timingPoint: "run.encounter_ice",
    costs: [{ credits: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 4,
    payload: {
      cardId: breakerId,
      breakerId,
      cardImplementationCapabilityBindingKind: "card_spec_capability_key",
      cardImplementationAbilityKey: key,
      cardImplementationAbilityId: ability.id,
    },
    abilityRef: {
      sourceCardInstanceId: breakerId,
      sourceAbilityId: ability.id,
    },
    ...overrides,
  };
}

describe("icebreaker ability identity binding", () => {
  it.each<
    [
      CardIcebreakerBreakMatcherImplementation,
      Partial<RuntimeIcebreakerAbility>,
    ]
  >([
    [{ kind: "any" }, {}],
    [{ kind: "ice_subtype", subtype: "barrier" }, { iceSubtype: "barrier" }],
    [{ kind: "selected_ice_subtype" }, { selectedIceSubtypeFromBreaker: true }],
    [
      { kind: "ice_subtype_any_of", subtypes: ["barrier", "sentry"] },
      { iceSubtypes: ["barrier", "sentry"] },
    ],
    [
      {
        kind: "ice_definition_any_of",
        definitionIds: ["ice_a", "ice_b"] as CardDefinitionId[],
      },
      { iceDefinitionIds: ["ice_a", "ice_b"] },
    ],
    [
      { kind: "subroutine_tag", tag: "damage" },
      { subroutineBreakTags: ["damage"] },
    ],
    [
      { kind: "subroutine_tag_any_of", tags: ["tag", "damage"] },
      { subroutineBreakTags: ["tag", "damage"] },
    ],
    [{ kind: "subroutine_traces" }, { subroutineBreakTags: ["trace"] }],
  ])("maps matcher %j explicitly", (matcher, expected) => {
    expect(breakMatcherFields(matcher)).toEqual(expected);
  });

  it.each<
    [
      CardIcebreakerBreakSpecialImplementation,
      NonNullable<RuntimeIcebreakerAbility["specialEffects"]>[number]["kind"],
    ]
  >([
    [
      { kind: "run_start_random_strength_bonus" },
      "run_start_random_strength_bonus",
    ],
    [{ kind: "blink_random_break_or_net_damage" }, "random_break_or_damage"],
    [
      { kind: "bartmoss_post_encounter_self_trash_check" },
      "post_encounter_self_trash_check",
    ],
    [
      { kind: "snowball_run_strength_per_successful_break" },
      "strength_bonus_per_successful_break_this_run",
    ],
    [
      { kind: "once_per_run_break_tag_and_all_stealth_loss" },
      "once_per_run_break_tag_and_all_stealth_loss",
    ],
    [{ kind: "run_end_trash_source_if_used" }, "run_end_trash_source_if_used"],
    [
      { kind: "set_next_sentry_free_break_after_fully_breaking_wall" },
      "set_next_sentry_free_break_after_fully_breaking_wall",
    ],
  ])("maps special %j explicitly", (special, expectedKind) => {
    expect(specialEffectsForImplementation(special)?.[0]?.kind).toBe(
      expectedKind,
    );
  });

  it("returns no special effects only when the contract has no special", () => {
    expect(specialEffectsForImplementation(undefined)).toBeUndefined();
  });

  it("projects the exact bound pump strength into the LegalAction payload", () => {
    expect(
      icebreakerAbilityBindingPayload(
        canonicalPump("matador_pump", 5),
        breakerId,
      ),
    ).toMatchObject({
      cardId: breakerId,
      pumpStrengthAmount: 5,
    });
  });

  it("rejects a pump binding without a valid strength amount", () => {
    expect(() =>
      icebreakerAbilityBindingPayload(
        { ...canonicalPump("invalid_pump", 1), amount: 0 },
        breakerId,
      ),
    ).toThrow(IcebreakerAbilityBindingError);
  });

  it("selects the exact canonical capability independent of same-kind ordering", () => {
    const low = canonicalPump("pump_low", 1);
    const high = canonicalPump("pump_high", 3);
    const legalAction = actionFor(high);
    expect(
      resolveIcebreakerAbilityBinding(
        [low, high],
        definitionId,
        breakerId,
        legalAction,
        "pump_strength",
      ),
    ).toBe(high);
    expect(
      resolveIcebreakerAbilityBinding(
        [high, low],
        definitionId,
        breakerId,
        legalAction,
        "pump_strength",
      ),
    ).toBe(high);
  });

  it("rejects missing, wrong, hybrid and stale canonical bindings", () => {
    const ability = canonicalPump("pump", 1);
    const exact = actionFor(ability);
    const { abilityRef: _missingAbilityRef, ...missingAbilityRef } = exact;
    const invalidActions: LegalAction[] = [
      missingAbilityRef,
      {
        ...exact,
        abilityRef: {
          sourceCardInstanceId: "other" as CardInstanceId,
          sourceAbilityId: ability.id,
        },
      },
      {
        ...exact,
        abilityRef: {
          sourceCardInstanceId: breakerId,
          sourceAbilityId: ability.id,
          abilityId: "legacy",
        } as never,
      },
      {
        ...exact,
        payload: { ...exact.payload, cardId: "other" },
      },
      {
        ...exact,
        payload: {
          ...exact.payload,
          cardImplementationAbilityKey: "wrong",
        },
      },
      {
        ...exact,
        payload: {
          ...exact.payload,
          cardImplementationLifecycleAbilityIndex: 0,
        },
      },
    ];
    for (const invalid of invalidActions)
      expect(() =>
        resolveIcebreakerAbilityBinding(
          [ability],
          definitionId,
          breakerId,
          invalid,
          "pump_strength",
        ),
      ).toThrow();
    expect(() =>
      resolveIcebreakerAbilityBinding(
        [ability],
        definitionId,
        breakerId,
        actionFor(canonicalPump("stale", 2)),
        "pump_strength",
      ),
    ).toThrow();
  });

});
