import { describe, expect, it } from "vitest";
import { canonicalCapabilityId, capabilityKey } from "@netgrid/cards/engine";
import type {
  CardDefinitionId,
  CardInstanceId,
  LegalAction,
} from "@netgrid/shared";
import {
  IcebreakerAbilityBindingError,
  icebreakerAbilityBindingPayload,
  resolveIcebreakerAbilityBinding,
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
