import { describe, expect, it } from "vitest";
import { assessCreditBankInvestment } from "./credit-bank-investment";

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
