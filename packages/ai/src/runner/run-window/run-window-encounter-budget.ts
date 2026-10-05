import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import { breakSubroutineIndexesForAction } from "../../runtime/subroutine-indexes";
import { currentEncounterRequiresDamagePreservingBreak } from "../../runtime/current-encounter-damage";
import { currentEncounterMitigationForAction } from "../../runtime/runner-encounter-mitigation";
import { isAcceptableNonlethalDamageSubroutine } from "../../runtime/encounter-subroutine";
import type { RunnerRunContinuationPayment } from "./run-window-services";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { creditsToBreakVisibleSubroutinesWithBreaker } from "../../visible-run-analysis";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
} from "../../runtime/current-encounter";
import {
  runnerEncounterCreditBudgetForInput,
  spendRunnerEncounterActionCost,
} from "../../runtime/runner-encounter-credit-budget";
import { runnerRigAfterEncounter } from "../../runtime/runner-rig-after-encounter";
import { isVisibleHardEndRunSubroutine } from "../../run-analysis/visible-subroutine-semantics";

/** Quote optional damage prevention together with every payable current ETR.
 * The run owner then checks its bound reserve; this service never selects a route.
 */
export function optionalDamageBreakContinuationPayments(
  input: AiDecisionInput,
  action: LegalAction,
  requiredHandFloor?: number,
): RunnerRunContinuationPayment[] {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    action.type !== "break_subroutine" ||
    action.choiceRequirements?.length ||
    action.payload?.runnerCostPenaltySupportContinuation === true ||
    currentEncounterRequiresFullBreak(input) ||
    currentEncounterRequiresDamagePreservingBreak(input, requiredHandFloor) ||
    currentEncounterMitigationForAction(input, action, requiredHandFloor)
  )
    return [];
  const ice = currentEncounteredIceCard(input);
  if (!ice?.effectiveRunQuote) return [];
  const quote = ice.effectiveRunQuote;
  const unbroken = currentEncounterUnbrokenSubroutineIndexes(input);
  const targets = breakSubroutineIndexesForAction(action);
  const optionalDamage = (index: number) => {
    const subroutine = quote.subroutines[index];
    return (
      subroutine?.type === "do_damage" &&
      (subroutine.damageType === "net" || subroutine.damageType === "meat") &&
      Number.isFinite(subroutine.amount) &&
      subroutine.amount! > 0 &&
      isAcceptableNonlethalDamageSubroutine(
        input,
        subroutine,
        requiredHandFloor,
      ) &&
      Object.entries(subroutine.unbrokenRunEffect ?? {}).every(
        ([key, value]) => key === "causesDamageOrProgramTrash" || !value,
      )
    );
  };
  if (
    !targets.size ||
    [...targets].some((i) => !unbroken.has(i) || !optionalDamage(i))
  )
    return [];
  if (
    [...unbroken].some(
      (i) =>
        !optionalDamage(i) &&
        !isVisibleHardEndRunSubroutine(quote.subroutines[i]!),
    )
  )
    return [];
  const sourceBreaker = input.playerView.own.rig?.find(
    (c) => c.instanceId === action.source,
  );
  if (!sourceBreaker) return [];
  const optionalCost = creditsToBreakVisibleSubroutinesWithBreaker(
    sourceBreaker,
    { ...ice, strength: quote.effectiveStrength },
    [...targets].map((i) => quote.subroutines[i]!),
    sourceBreaker.strength,
    quote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
  );
  if (
    !optionalCost ||
    optionalCost.conditionalRiskReason ||
    optionalCost.conditionalAccessReason ||
    optionalCost.postBreakStealthLosses?.length ||
    optionalCost.futureClicksLost ||
    optionalCost.cost !== legalActionCreditCost(action)
  )
    return [];
  const initial = spendRunnerEncounterActionCost({
    input,
    action,
    budget: runnerEncounterCreditBudgetForInput(input),
    cost: legalActionCreditCost(action),
  });
  if (!initial.affordable) return [];
  const remaining = new Set(
    [...unbroken].filter(
      (i) =>
        !targets.has(i) && isVisibleHardEndRunSubroutine(quote.subroutines[i]!),
    ),
  );
  const alternatives = input.legalActions.flatMap<
    | { uncertified: true }
    | { uncertified: false; candidate: LegalAction; indexes: Set<number> }
  >((candidate) => {
    if (candidate.type !== "break_subroutine") return [];
    const indexes = breakSubroutineIndexesForAction(candidate);
    if (!indexes.size || [...indexes].some((i) => !remaining.has(i))) return [];
    if (
      candidate.choiceRequirements?.length ||
      candidate.payload?.runnerCostPenaltySupportContinuation === true
    )
      return [{ uncertified: true as const }];
    const breaker = input.playerView.own.rig?.find(
      (c) => c.instanceId === candidate.source,
    );
    if (!breaker) return [{ uncertified: true as const }];
    const costs = creditsToBreakVisibleSubroutinesWithBreaker(
      breaker,
      { ...ice, strength: quote.effectiveStrength },
      [...indexes].map((i) => quote.subroutines[i]!),
      breaker.strength,
      quote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
    );
    // Any uncertified current alternative prevents an exhaustive reserve veto.
    if (
      !costs ||
      costs.conditionalRiskReason ||
      costs.conditionalAccessReason ||
      costs.postBreakStealthLosses?.length ||
      costs.futureClicksLost ||
      costs.cost !== legalActionCreditCost(candidate)
    )
      return [{ uncertified: true as const }];
    return [{ uncertified: false as const, candidate, indexes }];
  });
  if (alternatives.some((a) => a.uncertified)) return [];
  const pending = [
    { remaining, budget: initial.budget, cost: legalActionCreditCost(action) },
  ];
  const visited = new Set<string>();
  const results: RunnerRunContinuationPayment[] = [];
  while (pending.length) {
    const state = pending.pop()!;
    const key = JSON.stringify([
      [...state.remaining].sort((a, b) => a - b),
      state.budget,
    ]);
    if (visited.has(key)) continue;
    visited.add(key);
    if (!state.remaining.size) {
      results.push({
        cost: state.cost,
        rig: runnerRigAfterEncounter(input.playerView.own.rig ?? []),
        budget: {
          ...state.budget,
          credits: state.budget.credits + state.budget.runOnlyCredits,
        },
      });
      continue;
    }
    for (const alternative of alternatives) {
      if (
        alternative.uncertified ||
        [...alternative.indexes].some((i) => !state.remaining.has(i))
      )
        continue;
      const cost = legalActionCreditCost(alternative.candidate);
      const payment = spendRunnerEncounterActionCost({
        input,
        action: alternative.candidate,
        budget: state.budget,
        cost,
      });
      if (!payment.affordable) continue;
      pending.push({
        remaining: new Set(
          [...state.remaining].filter((i) => !alternative.indexes.has(i)),
        ),
        budget: payment.budget,
        cost: state.cost + cost,
      });
    }
  }
  return results;
}
