import { describe, expect, it } from "vitest";

import { quoteRunnerBreakerUpgradeEconomics } from "./runner-breaker-upgrade-economics";

describe("quoteRunnerBreakerUpgradeEconomics", () => {
  it("admits a strong midgame upgrade that repays itself and preserves reserve", () => {
    expect(
      quoteRunnerBreakerUpgradeEconomics({
        ...baseQuote(),
        currentPathCost: 8,
        projectedPathCost: 2,
        currentCredits: 20,
      }),
    ).toMatchObject({
      admitted: true,
      rejectionReasons: [],
      savingsPerRun: 6,
      grossRunSavings: 12,
      upfrontCreditCost: 5,
      actionOpportunityCost: 2,
      searchCardOpportunityCost: 1,
      totalInvestment: 8,
      netValueBeforeSafetyMargin: 4,
      projectedLiquidCreditsAfterUpgradeAndRun: 13,
    });
  });

  it("rejects a small improvement whose setup does not amortize", () => {
    expect(
      quoteRunnerBreakerUpgradeEconomics({
        ...baseQuote(),
        currentPathCost: 6,
        projectedPathCost: 5,
        currentCredits: 24,
      }),
    ).toMatchObject({
      admitted: false,
      savingsPerRun: 1,
      grossRunSavings: 2,
      totalInvestment: 8,
      rejectionReasons: expect.arrayContaining(["amortization_margin_not_met"]),
    });
  });

  it("rejects an otherwise profitable route when it spends the reserve", () => {
    expect(
      quoteRunnerBreakerUpgradeEconomics({
        ...baseQuote(),
        currentPathCost: 10,
        projectedPathCost: 2,
        currentCredits: 14,
      }),
    ).toMatchObject({
      admitted: false,
      projectedLiquidCreditsAfterUpgradeAndRun: 7,
      rejectionReasons: expect.arrayContaining(["reserve_breached"]),
    });
  });

  it("rejects opening, urgent, one-run and memory-displacing upgrades", () => {
    const opening = quoteRunnerBreakerUpgradeEconomics({
      ...baseQuote(),
      phase: "opening",
    });
    const urgent = quoteRunnerBreakerUpgradeEconomics({
      ...baseQuote(),
      scoreThreat: true,
    });
    const oneRun = quoteRunnerBreakerUpgradeEconomics({
      ...baseQuote(),
      plannedRunHorizon: 1,
    });
    const noMemory = quoteRunnerBreakerUpgradeEconomics({
      ...baseQuote(),
      memoryAvailable: 0,
    });

    expect(opening.rejectionReasons).toContain("not_midgame");
    expect(urgent.rejectionReasons).toContain("urgent_score_threat");
    expect(oneRun.rejectionReasons).toContain("insufficient_run_horizon");
    expect(noMemory.rejectionReasons).toContain("memory_unavailable");
  });
});

function baseQuote() {
  return {
    phase: "midgame" as const,
    scoreThreat: false,
    currentPathCost: 8,
    projectedPathCost: 2,
    plannedRunHorizon: 2,
    installCreditCost: 4,
    searchCreditCost: 1,
    installActionClicks: 1,
    searchActionClicks: 1,
    consumesSearchCard: true,
    currentCredits: 20,
    desiredCreditReserve: 10,
    memoryAvailable: 2,
    candidateMemoryCost: 1,
  };
}
