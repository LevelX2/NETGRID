import { describe, expect, it } from "vitest";
import {
  normalizeRunnerRunPathCreditBudget,
  projectBreakerCreditPayment,
  spendBreakerCreditsAndApplySideEffects,
} from "./visible-run-credit-budget";
import type { BreakAssessment } from "./visible-run-analysis-contracts";

function assessment(
  sourceMode: "single_stealth_card" | "any_stealth_cards",
  options: {
    cost?: number;
    optionalIfUnavailable?: boolean;
    includeStealthLoss?: boolean;
  } = {},
): BreakAssessment {
  return {
    cost: options.cost ?? 0,
    breakerInstanceId: "breaker",
    breakerDefinitionId: "breaker",
    breakerSubtypes: ["icebreaker"],
    endingStrength: 0,
    carriesStrengthAcrossIce: false,
    ...(options.includeStealthLoss === false
      ? {}
      : {
          postBreakStealthLosses: [
            {
              amount: 2,
              occurrences: 1,
              trigger: "per_subroutine",
              sourceMode,
              optionalIfUnavailable: options.optionalIfUnavailable ?? true,
            },
          ],
        }),
  };
}

describe("visible run stealth-loss budget", () => {
  it("spends ordinary non-noisy credits before retaining stealth sources", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      nonNoisyIcebreakerCredits: 5,
      nonStealthNonNoisyIcebreakerCredits: 3,
      stealthNonNoisyIcebreakerCredits: 2,
      stealthCreditsBySourceId: { cloak: 2 },
    });

    spendBreakerCreditsAndApplySideEffects(
      budget,
      assessment("any_stealth_cards", { cost: 3, includeStealthLoss: false }),
    );

    expect(budget.nonStealthNonNoisyIcebreakerCredits).toBe(0);
    expect(budget.stealthCreditsBySourceId).toEqual({ cloak: 2 });
    expect(budget.stealthNonNoisyIcebreakerCredits).toBe(2);
    expect(budget.nonNoisyIcebreakerCredits).toBe(2);
  });

  it("spends stealth sources only after ordinary non-noisy credits are exhausted", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      nonNoisyIcebreakerCredits: 3,
      nonStealthNonNoisyIcebreakerCredits: 1,
      stealthNonNoisyIcebreakerCredits: 2,
      stealthCreditsBySourceId: { cloak: 2 },
    });

    spendBreakerCreditsAndApplySideEffects(
      budget,
      assessment("any_stealth_cards", { cost: 3, includeStealthLoss: false }),
    );

    expect(budget.stealthCreditsBySourceId).toEqual({ cloak: 0 });
    expect(budget.stealthNonNoisyIcebreakerCredits).toBe(0);
    expect(budget.nonNoisyIcebreakerCredits).toBe(0);
  });

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

  it("uses one sufficient stealth source for a single-source loss", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      nonNoisyIcebreakerCredits: 3,
      stealthNonNoisyIcebreakerCredits: 3,
      stealthCreditsBySourceId: { cloak_a: 2, cloak_b: 1 },
    });

    spendBreakerCreditsAndApplySideEffects(
      budget,
      assessment("single_stealth_card"),
    );

    expect(budget.stealthCreditsBySourceId).toEqual({ cloak_a: 0, cloak_b: 1 });
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

  it("applies a later total stealth loss to the real remaining source ledger", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      nonNoisyIcebreakerCredits: 4,
      nonStealthNonNoisyIcebreakerCredits: 2,
      stealthNonNoisyIcebreakerCredits: 2,
      stealthCreditsBySourceId: { cloak_a: 1, cloak_b: 1 },
    });

    spendBreakerCreditsAndApplySideEffects(
      budget,
      assessment("any_stealth_cards", { cost: 2, includeStealthLoss: false }),
    );
    spendBreakerCreditsAndApplySideEffects(
      budget,
      assessment("any_stealth_cards"),
    );

    expect(budget.stealthCreditsBySourceId).toEqual({ cloak_a: 0, cloak_b: 0 });
    expect(budget.nonNoisyIcebreakerCredits).toBe(0);
  });

  it("rejects a non-optional single-source loss that has no sufficient source", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      nonNoisyIcebreakerCredits: 2,
      stealthNonNoisyIcebreakerCredits: 2,
      stealthCreditsBySourceId: { cloak_a: 1, cloak_b: 1 },
    });

    expect(
      projectBreakerCreditPayment(
        budget,
        assessment("single_stealth_card", { optionalIfUnavailable: false }),
      ).affordable,
    ).toBe(false);
  });

  it("keeps hosted, killer, and generic icebreaker credits available", () => {
    const budget = normalizeRunnerRunPathCreditBudget({
      credits: 0,
      icebreakerCredits: 1,
      killerCredits: 1,
      hostedIcebreakerCreditsByBreakerInstanceId: { breaker: 1 },
    });
    const killerAssessment: BreakAssessment = {
      ...assessment("any_stealth_cards", {
        cost: 3,
        includeStealthLoss: false,
      }),
      breakerSubtypes: ["icebreaker", "killer"],
    };

    spendBreakerCreditsAndApplySideEffects(budget, killerAssessment);

    expect(budget.hostedIcebreakerCreditsByBreakerInstanceId.breaker).toBe(0);
    expect(budget.killerCredits).toBe(0);
    expect(budget.icebreakerCredits).toBe(0);
  });
});
