import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import {
  type RunnerRunPathCreditBudget,
  visibleRunnerRunPathCreditBudgetForRig,
} from "../visible-run-analysis";
import { actionCreditCost } from "./action-cost";
import { breakerIdForEncounterAction } from "./encounter-action";

type MutableEncounterCreditBudget = Required<RunnerRunPathCreditBudget>;

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
    icebreakerCredits: visiblePools.icebreakerCredits,
    nonNoisyIcebreakerCredits: visiblePools.nonNoisyIcebreakerCredits,
    killerCredits: visiblePools.killerCredits,
    stealthNonNoisyIcebreakerCredits:
      visiblePools.stealthNonNoisyIcebreakerCredits,
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

export function spendRunnerEncounterActionCost(params: {
  input: AiDecisionInput;
  action: LegalAction;
  budget: RunnerRunPathCreditBudget;
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
  budget: RunnerRunPathCreditBudget;
  cost: number;
  actionType?: LegalAction["type"];
}): RunnerEncounterPaymentProjection {
  const budget = normalizeBudget(params.budget);
  const totalCost = normalizeCreditAmount(params.cost);
  let remaining = totalCost;
  let restrictedSpent = 0;
  const breaker = params.breakerId
    ? encounterBreakerForId(params.input, params.breakerId)
    : undefined;
  if (
    breaker &&
    (params.actionType === undefined ||
      params.actionType === "break_subroutine" ||
      params.actionType === "pump_breaker")
  ) {
    const spendRestricted = (
      key: Exclude<keyof MutableEncounterCreditBudget, "credits">,
    ) => {
      const spent = Math.min(budget[key], remaining);
      budget[key] -= spent;
      remaining -= spent;
      restrictedSpent += spent;
    };
    if (breakerHasSubtype(breaker, "killer")) spendRestricted("killerCredits");
    if (!breakerHasSubtype(breaker, "noisy")) {
      spendRestricted("nonNoisyIcebreakerCredits");
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
  budget: RunnerRunPathCreditBudget,
): MutableEncounterCreditBudget {
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
  };
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
