import { runnerRunPathCreditBudgetAfterEncounter } from "../../run-analysis/visible-run-credit-budget";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { creditsToBreakVisibleSubroutinesWithBreaker } from "../../visible-run-analysis";
import {
  currentEncounteredIceCard,
  currentEncounterCompleteSubroutineIndexes,
  currentRunRemainingIce,
} from "../../runtime/current-encounter";
import {
  runnerEncounterCreditBudgetForInput,
  spendRunnerEncounterActionCost,
} from "../../runtime/runner-encounter-credit-budget";
import { runnerRigAfterEncounter } from "../../runtime/runner-rig-after-encounter";
import { breakSubroutineIndexesForAction } from "../../runtime/subroutine-indexes";

/** Complete current encounter payment facts. The Run Window owner alone
 * admits and ranks their route; this service never selects an action. */
export function completeEncounterBreakerPayment(
  input: AiDecisionInput,
  action: LegalAction,
) {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    (action.type !== "pump_breaker" && action.type !== "break_subroutine") ||
    action.payload?.runnerCostPenaltySupportContinuation === true
  )
    return undefined;
  const continuation = input.legalActions.find(
    (a) => a.type === "continue_run" && a.payload?.encounterContinue === true,
  );
  if (
    !continuation ||
    Number(continuation.payload?.encounterFullBreakDamage ?? 0) > 0
  )
    return undefined;
  const ice = currentEncounteredIceCard(input);
  if (!ice?.effectiveRunQuote) return undefined;
  const unbroken = currentEncounterCompleteSubroutineIndexes(input);
  if (!unbroken) return undefined;
  // The selected break must belong to the entire quoted remaining scope.
  if (action.type === "break_subroutine") {
    const targets = breakSubroutineIndexesForAction(action);
    if (!targets.size || [...targets].some((index) => !unbroken.has(index)))
      return undefined;
  }
  const subroutines = ice.effectiveRunQuote.subroutines.filter((_, i) =>
    unbroken.has(i),
  );
  if (subroutines.length === 0) return undefined;
  const breaker = input.playerView.own.rig?.find(
    (c) => c.instanceId === action.source,
  );
  if (!breaker) return undefined;
  const quote = creditsToBreakVisibleSubroutinesWithBreaker(
    breaker,
    { ...ice, strength: ice.effectiveRunQuote.effectiveStrength },
    subroutines,
    breaker.strength,
    ice.effectiveRunQuote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
  );
  if (
    !quote ||
    quote.conditionalRiskReason ||
    quote.conditionalAccessReason ||
    quote.postBreakStealthLosses?.length ||
    quote.futureClicksLost
  )
    return undefined;
  const payment = spendRunnerEncounterActionCost({
    input,
    action,
    budget: runnerEncounterCreditBudgetForInput(input),
    cost: quote.cost,
  });
  if (!payment.affordable) return undefined;
  const rig = runnerRigAfterEncounter(input.playerView.own.rig ?? []).map(
    (c) =>
      c.instanceId === breaker.instanceId && quote.carriesStrengthAcrossIce
        ? { ...c, strength: quote.endingStrength }
        : c,
  );
  return {
    cost: quote.cost,
    cashCost: payment.cashCost,
    liquidCreditsAfterPayment: payment.budget.credits,
    carriesStrengthAcrossIce: quote.carriesStrengthAcrossIce === true,
    rig,
    runEndTrashSourceIds: quote.runEndTrashSourceIfUsed
      ? [quote.breakerInstanceId]
      : [],
    budget: runnerRunPathCreditBudgetAfterEncounter(payment.budget),
  };
}

/** Equivalent complete current encounters are compared only after admission and
 * preservation of the same root risk contract. Carrying strength requires the
 * existing whole-path economics rather than a current-encounter shortcut. */
export function completeCurrentEncounterEconomics(
  input: AiDecisionInput,
  payment: NonNullable<ReturnType<typeof completeEncounterBreakerPayment>>,
) {
  const ice = currentEncounteredIceCard(input);
  if (
    !ice?.effectiveRunQuote ||
    (payment.carriesStrengthAcrossIce &&
      currentRunRemainingIce(input).length > 0) ||
    (payment.budget.paymentSupportCreditsGained ?? 0) > 0
  )
    return undefined;
  const alreadyBound = new Set(
    input.playerView.run?.runEndTrashUsedBreakerIdsThisRun ?? [],
  );
  const newRunEndTrashSourceCount = new Set(
    payment.runEndTrashSourceIds.filter((id) => !alreadyBound.has(id)),
  ).size;
  return {
    totalCost: payment.cost,
    cashCost: payment.cashCost,
    newRunEndTrashSourceCount,
    value:
      450 +
      payment.liquidCreditsAfterPayment * 10 +
      1 /
        (1 +
          payment.cost +
          newRunEndTrashSourceCount / (1 + newRunEndTrashSourceCount)),
  };
}
