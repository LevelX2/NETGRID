import { describe, expect, it } from "vitest";
import {
  assessAutomaticCreditBankInvestment,
  assessCreditBankInvestment,
} from "./credit-bank-investment";

describe("demand-bound bank investment economics", () => {
  const base = {
    liquidCredits: 5,
    storedCredits: 0,
    otherStoredCredits: 0,
    creditsPerLoad: 3,
    loadActionCost: 1,
    cashoutActionCost: 1,
    alternativeCreditsPerAction: 1,
  };
  it("derives different finite load budgets from different spending needs", () => {
    expect(
      [8, 11, 17].map(
        (desiredLiquidity) =>
          assessCreditBankInvestment({ ...base, desiredLiquidity })
            .additionalLoadExecutions,
      ),
    ).toEqual([1, 2, 4]);
  });
  it("counts sibling reserves once and stops investing when the budget is funded", () => {
    expect(
      assessCreditBankInvestment({
        ...base,
        desiredLiquidity: 14,
        storedCredits: 6,
        otherStoredCredits: 3,
      }).additionalLoadExecutions,
    ).toBe(0);
  });
  it("compares the complete remaining investment with the actual alternative", () => {
    expect(
      assessCreditBankInvestment({
        ...base,
        desiredLiquidity: 8,
        alternativeCreditsPerAction: 2,
      }).incrementalCreditsOverAlternative,
    ).toBeLessThan(0);
    expect(
      assessCreditBankInvestment({
        ...base,
        desiredLiquidity: 14,
        alternativeCreditsPerAction: 2,
      }).incrementalCreditsOverAlternative,
    ).toBeGreaterThan(0);
  });
});

describe("marginal automatic bank payout economics", () => {
  const base = {
    liquidCredits: 5,
    desiredLiquidity: 20,
    storedCredits: 0,
    creditsPerLoad: 3,
    loadActionCost: 1,
    creditsPerTrigger: 1,
    horizonTurns: 3,
    alternativeCreditsPerAction: 1,
  };
  it("counts only extra payouts, excluding the existing queue", () => {
    expect(
      [0, 1, 2, 11].map(
        (storedCredits) =>
          assessAutomaticCreditBankInvestment({ ...base, storedCredits })
            .incrementalCreditsOverAlternative,
      ),
    ).toEqual([2, 1, 0, -1]);
  });
  it("adapts to payout rate and permits multiple profitable loads", () => {
    expect(
      [0, 3, 6, 9].map(
        (storedCredits) =>
          assessAutomaticCreditBankInvestment({
            ...base,
            storedCredits,
            creditsPerTrigger: 3,
          }).incrementalCreditsOverAlternative,
      ),
    ).toEqual([2, 2, 2, -1]);
    expect(
      assessAutomaticCreditBankInvestment({
        ...base,
        storedCredits: 4,
        creditsPerTrigger: 2,
      }),
    ).toMatchObject({
      status: "quoted",
      marginalPayout: 2,
      incrementalCreditsOverAlternative: 1,
    });
  });
  it("respects a shorter public horizon and the actual spending budget", () => {
    expect(
      assessAutomaticCreditBankInvestment({ ...base, horizonTurns: 1 }),
    ).toMatchObject({
      status: "quoted",
      marginalPayout: 1,
      incrementalCreditsOverAlternative: 0,
    });
    expect(
      assessAutomaticCreditBankInvestment({ ...base, horizonTurns: 0 }),
    ).toMatchObject({
      status: "quoted",
      marginalPayout: 0,
      incrementalCreditsOverAlternative: -1,
    });
    expect(
      assessAutomaticCreditBankInvestment({ ...base, desiredLiquidity: 6 }),
    ).toMatchObject({
      status: "quoted",
      marginalPayout: 1,
      incrementalCreditsOverAlternative: 0,
    });
  });
  it("compares against offered income and the complete load action cost", () => {
    expect(
      assessAutomaticCreditBankInvestment({
        ...base,
        storedCredits: 1,
        alternativeCreditsPerAction: 2,
      }),
    ).toMatchObject({
      status: "quoted",
      marginalPayout: 2,
      incrementalCreditsOverAlternative: 0,
    });
    expect(
      assessAutomaticCreditBankInvestment({ ...base, loadActionCost: 2 }),
    ).toMatchObject({
      status: "quoted",
      marginalPayout: 3,
      incrementalCreditsOverAlternative: 1,
    });
  });
  it("rejects missing or invalid projection facts explicitly", () => {
    expect(
      assessAutomaticCreditBankInvestment({
        ...base,
        creditsPerTrigger: Number.NaN,
      }),
    ).toEqual({
      status: "unavailable",
      reason: "invalid_automatic_payout_projection",
    });
    expect(
      assessAutomaticCreditBankInvestment({ ...base, horizonTurns: -1 }),
    ).toEqual({
      status: "unavailable",
      reason: "invalid_automatic_payout_projection",
    });
  });
});
