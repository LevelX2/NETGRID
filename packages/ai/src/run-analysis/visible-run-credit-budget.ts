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
  options: { excludeStealthCredits?: boolean } = {},
): RunnerRunPathCreditBudget {
  const rigBudget = visibleRunnerRunPathCreditBudgetForRig(rigCards);
  const stealthCreditsBySourceId = options.excludeStealthCredits
    ? {}
    : rigBudget.stealthCreditsBySourceId;
  const stealthNonNoisyIcebreakerCredits = options.excludeStealthCredits
    ? 0
    : rigBudget.stealthNonNoisyIcebreakerCredits;
  const nonNoisyIcebreakerCredits =
    rigBudget.nonStealthNonNoisyIcebreakerCredits +
    stealthNonNoisyIcebreakerCredits;
  return {
    credits: normalizeCreditAmount(credits),
    ...(rigBudget.icebreakerCredits > 0
      ? { icebreakerCredits: rigBudget.icebreakerCredits }
      : {}),
    ...(nonNoisyIcebreakerCredits > 0
      ? { nonNoisyIcebreakerCredits }
      : {}),
    ...(rigBudget.nonStealthNonNoisyIcebreakerCredits > 0
      ? {
          nonStealthNonNoisyIcebreakerCredits:
            rigBudget.nonStealthNonNoisyIcebreakerCredits,
        }
      : {}),
    ...(rigBudget.killerCredits > 0
      ? { killerCredits: rigBudget.killerCredits }
      : {}),
    ...(stealthNonNoisyIcebreakerCredits > 0
      ? {
          stealthNonNoisyIcebreakerCredits,
        }
      : {}),
    ...(Object.keys(stealthCreditsBySourceId).length > 0
      ? { stealthCreditsBySourceId }
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
    nonStealthNonNoisyIcebreakerCredits: 0,
    killerCredits: 0,
    stealthNonNoisyIcebreakerCredits: 0,
    stealthCreditsBySourceId: {} as Record<string, number>,
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
          budget.stealthCreditsBySourceId[card.instanceId] =
            (budget.stealthCreditsBySourceId[card.instanceId] ?? 0) + amount;
        } else if (use === "nonNoisyIcebreakerCredits") {
          budget.nonStealthNonNoisyIcebreakerCredits += amount;
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
      nonStealthNonNoisyIcebreakerCredits: 0,
      killerCredits: 0,
      stealthNonNoisyIcebreakerCredits: 0,
      stealthCreditsBySourceId: {},
      hostedIcebreakerCreditsByBreakerInstanceId: {},
    };
  }
  const stealthCreditsBySourceId = Object.fromEntries(
    Object.entries(budget.stealthCreditsBySourceId ?? {}).map(
      ([sourceId, amount]) => [sourceId, normalizeCreditAmount(amount)],
    ),
  );
  const stealthNonNoisyIcebreakerCredits = totalStealthCredits(
    stealthCreditsBySourceId,
  );
  const declaredStealthCredits = normalizeCreditAmount(
    budget.stealthNonNoisyIcebreakerCredits ?? 0,
  );
  if (
    declaredStealthCredits > 0 &&
    declaredStealthCredits !== stealthNonNoisyIcebreakerCredits
  ) {
    throw new Error(
      "Stealth-Credit-Ledger stimmt nicht mit seinen Quellkonten ueberein.",
    );
  }
  const declaredNonNoisyCredits = normalizeCreditAmount(
    budget.nonNoisyIcebreakerCredits ?? 0,
  );
  const nonStealthNonNoisyIcebreakerCredits = normalizeCreditAmount(
    budget.nonStealthNonNoisyIcebreakerCredits ??
      Math.max(0, declaredNonNoisyCredits - stealthNonNoisyIcebreakerCredits),
  );
  const nonNoisyIcebreakerCredits =
    nonStealthNonNoisyIcebreakerCredits + stealthNonNoisyIcebreakerCredits;
  if (
    budget.nonStealthNonNoisyIcebreakerCredits !== undefined &&
    declaredNonNoisyCredits > 0 &&
    declaredNonNoisyCredits !== nonNoisyIcebreakerCredits
  ) {
    throw new Error(
      "Non-Noisy-Credit-Ledger stimmt nicht mit seinen Teilpools ueberein.",
    );
  }
  return {
    credits: normalizeCreditAmount(budget.credits),
    icebreakerCredits: normalizeCreditAmount(budget.icebreakerCredits ?? 0),
    nonNoisyIcebreakerCredits,
    nonStealthNonNoisyIcebreakerCredits,
    killerCredits: normalizeCreditAmount(budget.killerCredits ?? 0),
    stealthNonNoisyIcebreakerCredits,
    stealthCreditsBySourceId,
    hostedIcebreakerCreditsByBreakerInstanceId: Object.fromEntries(
      Object.entries(
        budget.hostedIcebreakerCreditsByBreakerInstanceId ?? {},
      ).map(([breakerId, amount]) => [
        breakerId,
        normalizeCreditAmount(amount),
      ]),
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
    stealthCreditsBySourceId: { ...budget.stealthCreditsBySourceId },
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
  const budgetAfterPayment = cloneRunnerRunPathCreditBudget(budget);
  spendBreakerCredits(budgetAfterPayment, breakAssessment);
  return {
    affordable:
      creditsAfterPath >= 0 &&
      canApplyPostBreakStealthLosses(budgetAfterPayment, breakAssessment),
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
  const spend = (key: "icebreakerCredits" | "killerCredits") => {
    const amount = Math.min(budget[key] ?? 0, remainingCost);
    budget[key] -= amount;
    remainingCost -= amount;
  };
  if (breakerCanUseKillerCredits(breakAssessment)) spend("killerCredits");
  if (breakerCanUseNonNoisyCredits(breakAssessment)) {
    const nonStealthSpend = Math.min(
      budget.nonStealthNonNoisyIcebreakerCredits,
      remainingCost,
    );
    budget.nonStealthNonNoisyIcebreakerCredits -= nonStealthSpend;
    remainingCost -= nonStealthSpend;
    const stealthSpend = Math.min(
      totalStealthCredits(budget.stealthCreditsBySourceId),
      remainingCost,
    );
    spendStealthCredits(budget, stealthSpend);
    remainingCost -= stealthSpend;
    refreshNonNoisyCreditTotals(budget);
  }
  spend("icebreakerCredits");
  const cash = Math.min(budget.credits, remainingCost);
  budget.credits -= cash;
}

export function spendBreakerCreditsAndApplySideEffects(
  budget: MutableRunnerRunPathCreditBudget,
  breakAssessment: BreakAssessment,
): void {
  const projectedBudget = cloneRunnerRunPathCreditBudget(budget);
  spendBreakerCredits(projectedBudget, breakAssessment);
  if (!canApplyPostBreakStealthLosses(projectedBudget, breakAssessment)) {
    throw new Error("Verpflichtender Stealth-Credit-Verlust ist nicht bezahlbar.");
  }
  spendBreakerCredits(budget, breakAssessment);
  for (const loss of breakAssessment.postBreakStealthLosses ?? []) {
    for (let occurrence = 0; occurrence < loss.occurrences; occurrence += 1) {
      const amount = normalizeCreditAmount(loss.amount);
      const sources = Object.keys(budget.stealthCreditsBySourceId).sort();
      if (loss.sourceMode === "single_stealth_card") {
        const source = sources.find(
          (sourceId) => (budget.stealthCreditsBySourceId[sourceId] ?? 0) >= amount,
        );
        if (!source) {
          if (loss.optionalIfUnavailable) continue;
          throw new Error("Verpflichtender Stealth-Credit-Verlust hat keine Quelle.");
        }
        spendStealthCreditsFromSource(budget, source, amount);
        continue;
      }
      let remaining = amount;
      for (const source of sources) {
        const spent = Math.min(
          budget.stealthCreditsBySourceId[source] ?? 0,
          remaining,
        );
        spendStealthCreditsFromSource(budget, source, spent);
        remaining -= spent;
        if (remaining === 0) break;
      }
    }
  }
}

function canApplyPostBreakStealthLosses(
  budget: MutableRunnerRunPathCreditBudget,
  breakAssessment: BreakAssessment,
): boolean {
  for (const loss of breakAssessment.postBreakStealthLosses ?? []) {
    if (loss.optionalIfUnavailable) continue;
    for (let occurrence = 0; occurrence < loss.occurrences; occurrence += 1) {
      const amount = normalizeCreditAmount(loss.amount);
      if (loss.sourceMode === "single_stealth_card") {
        const source = Object.keys(budget.stealthCreditsBySourceId)
          .sort()
          .find(
            (sourceId) =>
              (budget.stealthCreditsBySourceId[sourceId] ?? 0) >= amount,
          );
        if (!source) return false;
        spendStealthCreditsFromSource(budget, source, amount);
      } else {
        if (totalStealthCredits(budget.stealthCreditsBySourceId) < amount)
          return false;
        spendStealthCredits(budget, amount);
      }
    }
  }
  return true;
}

function spendStealthCredits(
  budget: MutableRunnerRunPathCreditBudget,
  amount: number,
): void {
  let remaining = normalizeCreditAmount(amount);
  for (const sourceId of Object.keys(budget.stealthCreditsBySourceId).sort()) {
    const spent = Math.min(
      budget.stealthCreditsBySourceId[sourceId] ?? 0,
      remaining,
    );
    spendStealthCreditsFromSource(budget, sourceId, spent);
    remaining -= spent;
    if (remaining === 0) break;
  }
}

function spendStealthCreditsFromSource(
  budget: MutableRunnerRunPathCreditBudget,
  sourceId: string,
  amount: number,
): void {
  const spent = Math.min(
    budget.stealthCreditsBySourceId[sourceId] ?? 0,
    normalizeCreditAmount(amount),
  );
  budget.stealthCreditsBySourceId[sourceId] =
    (budget.stealthCreditsBySourceId[sourceId] ?? 0) - spent;
  refreshNonNoisyCreditTotals(budget);
}

function refreshNonNoisyCreditTotals(
  budget: MutableRunnerRunPathCreditBudget,
): void {
  budget.stealthNonNoisyIcebreakerCredits = totalStealthCredits(
    budget.stealthCreditsBySourceId,
  );
  budget.nonNoisyIcebreakerCredits =
    budget.nonStealthNonNoisyIcebreakerCredits +
    budget.stealthNonNoisyIcebreakerCredits;
}

function totalStealthCredits(
  stealthCreditsBySourceId: Readonly<Record<string, number>>,
): number {
  return Object.values(stealthCreditsBySourceId).reduce(
    (total, amount) => total + normalizeCreditAmount(amount),
    0,
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
