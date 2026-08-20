import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";

import {
  type RunnerRunPathCreditBudget,
  visibleRunnerRunPathCreditBudgetForRig,
} from "../visible-run-analysis";
import { actionCreditCost } from "./action-cost";
import { breakerIdForEncounterAction } from "./encounter-action";

type EncounterCreditBudget = RunnerRunPathCreditBudget & {
  runOnlyCredits?: number;
};

type MutableEncounterCreditBudget = Omit<
  Required<RunnerRunPathCreditBudget>,
  "hostedIcebreakerCreditsByBreakerInstanceId" | "stealthCreditsBySourceId"
> & {
  hostedIcebreakerCreditsByBreakerInstanceId: Record<string, number>;
  stealthCreditsBySourceId: Record<string, number>;
  runOnlyCredits: number;
};

export type RunnerEncounterPaymentProjection = {
  affordable: boolean;
  totalCost: number;
  cashCost: number;
  restrictedSpent: number;
  creditsAfterPayment: number;
  budget: MutableEncounterCreditBudget;
};

export function runnerEncounterCreditBudgetForInput(
  input: AiDecisionInput,
): MutableEncounterCreditBudget {
  const visiblePools = visibleRunnerRunPathCreditBudgetForRig(
    input.playerView.own.rig ?? [],
  );
  return {
    credits: normalizeCreditAmount(input.playerView.own.credits),
    runOnlyCredits: normalizeCreditAmount(
      input.playerView.run?.badPublicityCredits ?? 0,
    ),
    icebreakerCredits: visiblePools.icebreakerCredits,
    nonNoisyIcebreakerCredits: visiblePools.nonNoisyIcebreakerCredits,
    nonStealthNonNoisyIcebreakerCredits:
      visiblePools.nonStealthNonNoisyIcebreakerCredits,
    killerCredits: visiblePools.killerCredits,
    stealthNonNoisyIcebreakerCredits:
      visiblePools.stealthNonNoisyIcebreakerCredits,
    stealthCreditsBySourceId: { ...visiblePools.stealthCreditsBySourceId },
    hostedIcebreakerCreditsByBreakerInstanceId: {
      ...visiblePools.hostedIcebreakerCreditsByBreakerInstanceId,
    },
  };
}

export function runnerEncounterPaymentForAction(
  input: AiDecisionInput,
  action: LegalAction,
): RunnerEncounterPaymentProjection {
  return spendRunnerEncounterActionCost({
    input,
    action,
    budget: runnerEncounterCreditBudgetForInput(input),
    cost: actionCreditCost(action),
  });
}

export function runnerEncounterPaymentForActions(
  input: AiDecisionInput,
  actions: readonly LegalAction[],
): RunnerEncounterPaymentProjection {
  let budget = runnerEncounterCreditBudgetForInput(input);
  let totalCost = 0;
  let cashCost = 0;
  let restrictedSpent = 0;
  let affordable = true;
  for (const action of actions) {
    const payment = spendRunnerEncounterActionCost({
      input,
      action,
      budget,
      cost: actionCreditCost(action),
    });
    budget = payment.budget;
    totalCost += payment.totalCost;
    cashCost += payment.cashCost;
    restrictedSpent += payment.restrictedSpent;
    affordable &&= payment.affordable;
  }
  return {
    affordable,
    totalCost,
    cashCost,
    restrictedSpent,
    creditsAfterPayment: budget.credits,
    budget,
  };
}

export function spendRunnerEncounterGeneralCost(
  budget: EncounterCreditBudget,
  cost: number,
): RunnerEncounterPaymentProjection {
  const nextBudget = normalizeBudget(budget);
  const totalCost = normalizeCreditAmount(cost);
  let remaining = totalCost;
  const runOnlySpent = Math.min(nextBudget.runOnlyCredits, remaining);
  nextBudget.runOnlyCredits -= runOnlySpent;
  remaining -= runOnlySpent;
  const cashCost = Math.min(nextBudget.credits, remaining);
  nextBudget.credits -= cashCost;
  remaining -= cashCost;
  return {
    affordable: remaining === 0,
    totalCost,
    cashCost,
    restrictedSpent: runOnlySpent,
    creditsAfterPayment: nextBudget.credits,
    budget: nextBudget,
  };
}

export function spendRunnerEncounterActionCost(params: {
  input: AiDecisionInput;
  action: LegalAction;
  budget: EncounterCreditBudget;
  cost: number;
}): RunnerEncounterPaymentProjection {
  return spendRunnerEncounterBreakerCost({
    input: params.input,
    breakerId: breakerIdForEncounterAction(params.action),
    budget: params.budget,
    cost: params.cost,
    actionType: params.action.type,
  });
}

export function spendRunnerEncounterBreakerCost(params: {
  input: AiDecisionInput;
  breakerId: string | undefined;
  budget: EncounterCreditBudget;
  cost: number;
  actionType?: LegalAction["type"];
}): RunnerEncounterPaymentProjection {
  const budget = normalizeBudget(params.budget);
  const totalCost = normalizeCreditAmount(params.cost);
  let remaining = totalCost;
  let restrictedSpent = 0;
  const runOnlySpent = Math.min(budget.runOnlyCredits, remaining);
  budget.runOnlyCredits -= runOnlySpent;
  remaining -= runOnlySpent;
  restrictedSpent += runOnlySpent;
  const breaker = params.breakerId
    ? encounterBreakerForId(params.input, params.breakerId)
    : undefined;
  if (
    breaker &&
    (params.actionType === undefined ||
      params.actionType === "break_subroutine" ||
      params.actionType === "pump_breaker")
  ) {
    const hostedCredits = Math.min(
      budget.hostedIcebreakerCreditsByBreakerInstanceId[
        params.breakerId ?? ""
      ] ?? 0,
      remaining,
    );
    if (params.breakerId) {
      budget.hostedIcebreakerCreditsByBreakerInstanceId[params.breakerId] =
        Math.max(
          0,
          (budget.hostedIcebreakerCreditsByBreakerInstanceId[
            params.breakerId
          ] ?? 0) - hostedCredits,
        );
    }
    remaining -= hostedCredits;
    restrictedSpent += hostedCredits;
    const spendRestricted = (key: "icebreakerCredits" | "killerCredits") => {
      const spent = Math.min(budget[key], remaining);
      budget[key] -= spent;
      remaining -= spent;
      restrictedSpent += spent;
    };
    if (breakerHasSubtype(breaker, "killer")) spendRestricted("killerCredits");
    if (!breakerHasSubtype(breaker, "noisy")) {
      spendNonNoisyCredits(
        budget,
        () => remaining,
        (spent) => {
          remaining -= spent;
          restrictedSpent += spent;
        },
      );
    }
    spendRestricted("icebreakerCredits");
  }
  const cashCost = Math.min(budget.credits, remaining);
  budget.credits -= cashCost;
  remaining -= cashCost;
  return {
    affordable: remaining === 0,
    totalCost,
    cashCost,
    restrictedSpent,
    creditsAfterPayment: budget.credits,
    budget,
  };
}

function encounterBreakerForId(
  input: AiDecisionInput,
  breakerId: string,
): VisibleCard | undefined {
  return (input.playerView.own.rig ?? []).find(
    (card) => card.instanceId === breakerId,
  );
}

function normalizeBudget(
  budget: EncounterCreditBudget,
): MutableEncounterCreditBudget {
  return {
    credits: normalizeCreditAmount(budget.credits),
    runOnlyCredits: normalizeCreditAmount(budget.runOnlyCredits ?? 0),
    icebreakerCredits: normalizeCreditAmount(budget.icebreakerCredits ?? 0),
    nonNoisyIcebreakerCredits: normalizeCreditAmount(
      budget.nonNoisyIcebreakerCredits ?? 0,
    ),
    nonStealthNonNoisyIcebreakerCredits: normalizeCreditAmount(
      budget.nonStealthNonNoisyIcebreakerCredits ??
        Math.max(
          0,
          normalizeCreditAmount(budget.nonNoisyIcebreakerCredits ?? 0) -
            totalStealthCredits(budget.stealthCreditsBySourceId ?? {}),
        ),
    ),
    killerCredits: normalizeCreditAmount(budget.killerCredits ?? 0),
    stealthNonNoisyIcebreakerCredits: normalizeCreditAmount(
      budget.stealthNonNoisyIcebreakerCredits ?? 0,
    ),
    stealthCreditsBySourceId: Object.fromEntries(
      Object.entries(budget.stealthCreditsBySourceId ?? {}).map(
        ([sourceId, amount]) => [sourceId, normalizeCreditAmount(amount)],
      ),
    ),
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

function spendNonNoisyCredits(
  budget: MutableEncounterCreditBudget,
  remaining: () => number,
  recordSpend: (spent: number) => void,
): void {
  const ordinarySpent = Math.min(
    budget.nonStealthNonNoisyIcebreakerCredits,
    remaining(),
  );
  budget.nonStealthNonNoisyIcebreakerCredits -= ordinarySpent;
  budget.nonNoisyIcebreakerCredits -= ordinarySpent;
  recordSpend(ordinarySpent);
  let stillNeeded = remaining();
  for (const sourceId of Object.keys(budget.stealthCreditsBySourceId).sort()) {
    const spent = Math.min(
      budget.stealthCreditsBySourceId[sourceId] ?? 0,
      stillNeeded,
    );
    budget.stealthCreditsBySourceId[sourceId] =
      (budget.stealthCreditsBySourceId[sourceId] ?? 0) - spent;
    budget.stealthNonNoisyIcebreakerCredits -= spent;
    budget.nonNoisyIcebreakerCredits -= spent;
    recordSpend(spent);
    stillNeeded -= spent;
    if (stillNeeded === 0) break;
  }
}

function totalStealthCredits(
  sources: Readonly<Record<string, number>>,
): number {
  return Object.values(sources).reduce(
    (sum, amount) => sum + normalizeCreditAmount(amount),
    0,
  );
}

function breakerHasSubtype(breaker: VisibleCard, subtype: string): boolean {
  return (breaker.subtypes ?? []).some(
    (candidate) => subtypeKey(candidate) === subtype,
  );
}

function subtypeKey(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeCreditAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
