import { describe, expect, it } from "vitest";
import type { LegalAction } from "@netgrid/shared";
import { pumpStrengthAmountForAction } from "./encounter-action";

function pumpAction(pumpStrengthAmount?: number): LegalAction {
  return {
    actionId: "pump-matador",
    side: "runner",
    type: "pump_breaker",
    label: "Matador: Stärke +5",
    source: "runner-matador",
    timingPoint: "run.encounter_ice",
    costs: [{ credits: 3 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {
      breakerId: "runner-matador",
      ...(pumpStrengthAmount === undefined ? {} : { pumpStrengthAmount }),
    },
  };
}

describe("encounter action binding", () => {
  it("uses the exact pump strength projected by the Engine LegalAction", () => {
    expect(
      pumpStrengthAmountForAction(
        pumpAction(5),
        "onr_classic_028_matador",
      ),
    ).toBe(5);
  });

  it("does not invent a pump amount when neither action nor definition provides one", () => {
    expect(
      pumpStrengthAmountForAction(pumpAction(), "unknown-breaker"),
    ).toBeUndefined();
    expect(
      pumpStrengthAmountForAction(
        pumpAction(Number.NaN),
        "unknown-breaker",
      ),
    ).toBeUndefined();
  });
});
