import type { CounterCreditUse, VisibleCard } from "@netgrid/shared";
import type {
  BreakAssessment,
  CreditPaymentProjection,
  MutableRunnerRunPathCreditBudget,
  RunnerRunPathCreditBudget,
  RunnerRunPathCreditBudgetInput,
} from "./visible-run-analysis-contracts";
import { subtypeKey } from "./visible-run-breaker-path";

export function runnerRunPathCreditBudgetWithVisiblePools(
  credits: number,
  rigCards: readonly VisibleCard[],
): RunnerRunPathCreditBudget {
  const rigBudget = visibleRunnerRunPathCreditBudgetForRig(rigCards);
  return {
    credits: normalizeCreditAmount(credits),
    ...(rigBudget.icebreakerCredits > 0
      ? { icebreakerCredits: rigBudget.icebreakerCredits }
      : {}),
    ...(rigBudget.nonNoisyIcebreakerCredits > 0
      ? { nonNoisyIcebreakerCredits: rigBudget.nonNoisyIcebreakerCredits }
      : {}),
    ...(rigBudget.killerCredits > 0
      ? { killerCredits: rigBudget.killerCredits }
      : {}),
    ...(rigBudget.stealthNonNoisyIcebreakerCredits > 0
      ? {
          stealthNonNoisyIcebreakerCredits:
            rigBudget.stealthNonNoisyIcebreakerCredits,
        }
      : {}),
    ...(Object.keys(rigBudget.hostedIcebreakerCreditsByBreakerInstanceId)
      .length > 0
      ? {
          hostedIcebreakerCreditsByBreakerInstanceId:
            rigBudget.hostedIcebreakerCreditsByBreakerInstanceId,
        }
      : {}),
  };
}

export function visibleRunnerRunPathCreditBudgetForRig(
  rigCards: readonly VisibleCard[],
): Omit<Required<RunnerRunPathCreditBudget>, "credits"> {
  const budget = {
    icebreakerCredits: 0,
    nonNoisyIcebreakerCredits: 0,
    killerCredits: 0,
    stealthNonNoisyIcebreakerCredits: 0,
    hostedIcebreakerCreditsByBreakerInstanceId: {} as Record<string, number>,
  };
  for (const card of rigCards) {
    if (card.known === false) continue;
    for (const display of card.counterDisplays ?? []) {
      const amount = normalizeCreditAmount(display.amount);
      if (amount <= 0) continue;
      const use = runPathCreditPoolUse(display.creditPool?.uses ?? []);
      if (use) {
        if (
          use === "icebreakerCredits" &&
          display.creditPool?.requireHostedBreakerForIcebreakerUse
        ) {
          for (const hostedBreaker of rigCards.filter(
            (candidate) => candidate.hostedOn === card.instanceId,
          )) {
            budget.hostedIcebreakerCreditsByBreakerInstanceId[
              hostedBreaker.instanceId
            ] =
              (budget.hostedIcebreakerCreditsByBreakerInstanceId[
                hostedBreaker.instanceId
              ] ?? 0) + amount;
          }
          continue;
        }
        budget[use] += amount;
        if (
          use === "nonNoisyIcebreakerCredits" &&
          card.subtypes?.some((subtype) => subtypeKey(subtype) === "stealth")
        ) {
          budget.stealthNonNoisyIcebreakerCredits += amount;
        }
      }
    }
  }
  return budget;
}

export function runPathCreditPoolUse(
  uses: readonly CounterCreditUse[],
):
  | "icebreakerCredits"
  | "nonNoisyIcebreakerCredits"
  | "killerCredits"
  | undefined {
  if (uses.includes("using_icebreaker_during_run")) {
    return "icebreakerCredits";
  }
  if (uses.includes("using_icebreaker_during_run_non_noisy")) {
    return "nonNoisyIcebreakerCredits";
  }
  if (uses.includes("using_killer_during_run")) return "killerCredits";
  return undefined;
}

export function normalizeRunnerRunPathCreditBudget(
  budget: RunnerRunPathCreditBudgetInput,
): MutableRunnerRunPathCreditBudget {
  if (typeof budget === "number") {
    return {
      credits: normalizeCreditAmount(budget),
      icebreakerCredits: 0,
      nonNoisyIcebreakerCredits: 0,
      killerCredits: 0,
      stealthNonNoisyIcebreakerCredits: 0,
      hostedIcebreakerCreditsByBreakerInstanceId: {},
    };
  }
  return {
    credits: normalizeCreditAmount(budget.credits),
    icebreakerCredits: normalizeCreditAmount(budget.icebreakerCredits ?? 0),
    nonNoisyIcebreakerCredits: normalizeCreditAmount(
      budget.nonNoisyIcebreakerCredits ?? 0,
    ),
    killerCredits: normalizeCreditAmount(budget.killerCredits ?? 0),
    stealthNonNoisyIcebreakerCredits: normalizeCreditAmount(
      budget.stealthNonNoisyIcebreakerCredits ?? 0,
    ),
    hostedIcebreakerCreditsByBreakerInstanceId: Object.fromEntries(
      Object.entries(
        budget.hostedIcebreakerCreditsByBreakerInstanceId ?? {},
      ).map(([breakerId, amount]) => [breakerId, normalizeCreditAmount(amount)]),
    ),
  };
}

export function cloneRunnerRunPathCreditBudget(
  budget: MutableRunnerRunPathCreditBudget,
): MutableRunnerRunPathCreditBudget {
  return {
    ...budget,
    hostedIcebreakerCreditsByBreakerInstanceId: {
      ...budget.hostedIcebreakerCreditsByBreakerInstanceId,
    },
  };
}

export function normalizeCreditAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function projectGeneralCreditPayment(
  budget: MutableRunnerRunPathCreditBudget,
  cost: number,
): CreditPaymentProjection {
  const normalizedCost = normalizeCreditAmount(cost);
  const creditsAfterPath = budget.credits - normalizedCost;
  return {
    affordable: creditsAfterPath >= 0,
    cost: normalizedCost,
    cashSpent: normalizedCost,
    creditsAfterPath,
  };
}

export function spendGeneralCredits(
  budget: MutableRunnerRunPathCreditBudget,
  cost: number,
): void {
  budget.credits -= normalizeCreditAmount(cost);
}

export function projectBreakerCreditPayment(
  budget: MutableRunnerRunPathCreditBudget,
  breakAssessment: BreakAssessment,
): CreditPaymentProjection {
  const cost = normalizeCreditAmount(breakAssessment.cost);
  const restrictedCredits = applicableRestrictedBreakerCredits(
    budget,
    breakAssessment,
  );
  const cashNeeded = Math.max(0, cost - restrictedCredits);
  const creditsAfterPath = budget.credits - cashNeeded;
  return {
    affordable: creditsAfterPath >= 0,
    cost,
    cashSpent: Math.min(budget.credits, cashNeeded),
    creditsAfterPath,
  };
}

export function spendBreakerCredits(
  budget: MutableRunnerRunPathCreditBudget,
  breakAssessment: BreakAssessment,
): void {
  let remainingCost = normalizeCreditAmount(breakAssessment.cost);
  const hostedCredits = Math.min(
    budget.hostedIcebreakerCreditsByBreakerInstanceId[
      breakAssessment.breakerInstanceId
    ] ?? 0,
    remainingCost,
  );
  budget.hostedIcebreakerCreditsByBreakerInstanceId[
    breakAssessment.breakerInstanceId
  ] = Math.max(
    0,
    (budget.hostedIcebreakerCreditsByBreakerInstanceId[
      breakAssessment.breakerInstanceId
    ] ?? 0) - hostedCredits,
  );
  remainingCost -= hostedCredits;
  const spend = (
    key:
      | "icebreakerCredits"
      | "nonNoisyIcebreakerCredits"
      | "killerCredits"
      | "stealthNonNoisyIcebreakerCredits",
  ) => {
    if (key === "stealthNonNoisyIcebreakerCredits") return;
    const amount = Math.min(budget[key], remainingCost);
    budget[key] -= amount;
    if (key === "nonNoisyIcebreakerCredits") {
      budget.stealthNonNoisyIcebreakerCredits = Math.max(
        0,
        budget.stealthNonNoisyIcebreakerCredits - amount,
      );
    }
    remainingCost -= amount;
  };
  if (breakerCanUseKillerCredits(breakAssessment)) spend("killerCredits");
  if (breakerCanUseNonNoisyCredits(breakAssessment)) {
    spend("nonNoisyIcebreakerCredits");
  }
  spend("icebreakerCredits");
  const cash = Math.min(budget.credits, remainingCost);
  budget.credits -= cash;
}

export function spendBreakerCreditsAndApplySideEffects(
  budget: MutableRunnerRunPathCreditBudget,
  breakAssessment: BreakAssessment,
): void {
  spendBreakerCredits(budget, breakAssessment);
  const stealthLoss = Math.max(
    0,
    Math.floor(breakAssessment.postBreakStealthLoss ?? 0),
  );
  if (stealthLoss <= 0) return;
  const lostRestrictedCredits = Math.min(
    budget.stealthNonNoisyIcebreakerCredits,
    stealthLoss,
  );
  budget.stealthNonNoisyIcebreakerCredits -= lostRestrictedCredits;
  budget.nonNoisyIcebreakerCredits = Math.max(
    0,
    budget.nonNoisyIcebreakerCredits - lostRestrictedCredits,
  );
}

export function applicableRestrictedBreakerCredits(
  budget: MutableRunnerRunPathCreditBudget,
  breakAssessment: BreakAssessment,
): number {
  return (
    (budget.hostedIcebreakerCreditsByBreakerInstanceId[
      breakAssessment.breakerInstanceId
    ] ?? 0) +
    budget.icebreakerCredits +
    (breakerCanUseNonNoisyCredits(breakAssessment)
      ? budget.nonNoisyIcebreakerCredits
      : 0) +
    (breakerCanUseKillerCredits(breakAssessment) ? budget.killerCredits : 0)
  );
}

export function breakerCanUseNonNoisyCredits(
  breakAssessment: BreakAssessment,
): boolean {
  return !breakAssessment.breakerSubtypes.some(
    (subtype) => subtypeKey(subtype) === "noisy",
  );
}

export function breakerCanUseKillerCredits(
  breakAssessment: BreakAssessment,
): boolean {
  return breakAssessment.breakerSubtypes.some(
    (subtype) => subtypeKey(subtype) === "killer",
  );
}

export function bestAccessPreservingPayment(
  budget: MutableRunnerRunPathCreditBudget,
  payCost: number,
  breakAssessment: BreakAssessment | undefined,
): CreditPaymentProjection & { breakAssessment?: BreakAssessment } {
  const paymentOptions: Array<
    CreditPaymentProjection & { breakAssessment?: BreakAssessment }
  > = [projectGeneralCreditPayment(budget, payCost)];
  if (breakAssessment) {
    paymentOptions.push({
      ...projectBreakerCreditPayment(budget, breakAssessment),
      breakAssessment,
    });
  }
  const bestPayment = paymentOptions.sort((left, right) => {
    const affordabilityDelta =
      Number(right.affordable) - Number(left.affordable);
    if (affordabilityDelta !== 0) return affordabilityDelta;
    if (!left.affordable && !right.affordable) {
      return left.cost - right.cost || left.cashSpent - right.cashSpent;
    }
    return left.cashSpent - right.cashSpent || left.cost - right.cost;
  })[0];
  return bestPayment ?? projectGeneralCreditPayment(budget, payCost);
}
