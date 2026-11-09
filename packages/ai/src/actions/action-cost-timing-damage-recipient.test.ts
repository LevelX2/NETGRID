import type { LegalAction } from "@netgrid/shared";
import { expect, it } from "vitest";
import { costProfileForAction } from "./action-cost-timing";

function action(
  side: "corp" | "runner",
  recipient?: "corp" | "runner",
): LegalAction {
  return {
    actionId: "bound.damage.activation",
    side,
    type: "activated_card_ability",
    label: "Damage activation",
    source: "scored_source",
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 5,
    payload: {
      damageType: "meat",
      damageAmount: 1,
      ...(recipient ? { damageRecipient: recipient } : {}),
    },
  };
}

it("keeps explicit damage to the opposing side out of the acting side's costs", () => {
  expect(costProfileForAction(action("corp", "runner"))).toMatchObject({
    costKnownStatus: "known",
    clickCost: 1,
    creditCost: 0,
    additionalCosts: [],
  });
  expect(
    costProfileForAction(action("corp", "runner")).selfDamage,
  ).toBeUndefined();
});

it.each(["own_corp", "own_runner", "recipient_missing"] as const)(
  "preserves unresolved or self damage cost facts: %s",
  (variant) => {
    const ownRunner = variant === "own_runner";
    const result = costProfileForAction(
      action(
        ownRunner ? "runner" : "corp",
        variant === "recipient_missing"
          ? undefined
          : ownRunner
            ? "runner"
            : "corp",
      ),
    );
    expect(result.additionalCosts).toEqual(
      expect.arrayContaining(["damageType", "damageAmount"]),
    );
    if (ownRunner)
      expect(result.selfDamage).toEqual([{ type: "meat", amount: 1 }]);
  },
);
