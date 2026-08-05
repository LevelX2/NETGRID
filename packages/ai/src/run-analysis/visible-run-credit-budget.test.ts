import { describe, expect, it } from "vitest";
import {
  normalizeRunnerRunPathCreditBudget,
  spendBreakerCreditsAndApplySideEffects,
} from "./visible-run-credit-budget";
import type { BreakAssessment } from "./visible-run-analysis-contracts";

function assessment(
  sourceMode: "single_stealth_card" | "any_stealth_cards",
): BreakAssessment {
  return {
    cost: 0,
    breakerInstanceId: "breaker",
    breakerDefinitionId: "breaker",
    breakerSubtypes: ["icebreaker"],
    endingStrength: 0,
    carriesStrengthAcrossIce: false,
    postBreakStealthLosses: [
      {
        amount: 2,
        occurrences: 1,
        trigger: "per_subroutine",
        sourceMode,
        optionalIfUnavailable: true,
      },
    ],
  };
}

describe("visible run stealth-loss budget", () => {
  it("does not combine two stealth sources for a single-source loss", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      nonNoisyIcebreakerCredits: 2,
      stealthNonNoisyIcebreakerCredits: 2,
      stealthCreditsBySourceId: { cloak_a: 1, cloak_b: 1 },
    });

    spendBreakerCreditsAndApplySideEffects(
      budget,
      assessment("single_stealth_card"),
    );

    expect(budget.stealthCreditsBySourceId).toEqual({ cloak_a: 1, cloak_b: 1 });
  });

  it("can distribute a total stealth loss across visible sources", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      nonNoisyIcebreakerCredits: 2,
      stealthNonNoisyIcebreakerCredits: 2,
      stealthCreditsBySourceId: { cloak_a: 1, cloak_b: 1 },
    });

    spendBreakerCreditsAndApplySideEffects(
      budget,
      assessment("any_stealth_cards"),
    );

    expect(budget.stealthCreditsBySourceId).toEqual({ cloak_a: 0, cloak_b: 0 });
  });
});
