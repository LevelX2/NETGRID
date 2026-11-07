import { runnerRunPathCreditBudgetAfterEncounter } from "../../run-analysis/visible-run-credit-budget";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import { runnerRunStrengthPumpSavingsForAction } from "./run-window-strength-preparation";
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

type CompleteEncounterPayment = {
  cost: number;
  cashCost: number;
  liquidCreditsAfterPayment: number;
  carriesStrengthAcrossIce: boolean;
  rig: VisibleCard[];
  runEndTrashSourceIds: string[];
  budget: ReturnType<typeof runnerRunPathCreditBudgetAfterEncounter>;
};

/** Complete current encounter payment facts. The Run Window owner alone
 * admits and ranks their route; this service never selects an action. */
export function completeEncounterBreakerPayment(
  input: AiDecisionInput,
  action: LegalAction,
): CompleteEncounterPayment | undefined {
  const strengthPreparation = runStrengthPreparation(input, action);
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    (action.type !== "pump_breaker" &&
      action.type !== "break_subroutine" &&
      !strengthPreparation) ||
    action.payload?.runnerCostPenaltySupportContinuation === true
  )
    return undefined;
  if (strengthPreparation) {
    const { source, breaker, amount } = strengthPreparation;
    const pump = input.legalActions.find(
      (entry) =>
        entry.type === "pump_breaker" && entry.source === breaker.instanceId,
    );
    if (!pump) return undefined;
    const preparation = spendRunnerEncounterActionCost({
      input,
      action,
      budget: runnerEncounterCreditBudgetForInput(input),
      cost: legalActionCreditCost(action),
    });
    if (!preparation.affordable || preparation.restrictedSpent > 0)
      return undefined;
    const boundaryBreaker = runnerRigAfterEncounter(
      input.playerView.own.rig!,
    ).find((card) => card.instanceId === breaker.instanceId)!;
    const projectedRig = input.playerView.own
      .rig!.filter((card) => card.instanceId !== source.instanceId)
      .map((card) =>
        card.instanceId === breaker.instanceId
          ? {
              ...card,
              strength: card.strength! + amount,
              strengthAfterEncounter: boundaryBreaker.strength! + amount,
            }
          : card,
      );
    const payment = completeEncounterBreakerPayment(
      {
        ...input,
        playerView: {
          ...input.playerView,
          own: {
            ...input.playerView.own,
            credits: preparation.budget.credits,
            rig: projectedRig,
          },
        },
      },
      pump,
    );
    if (!payment) return undefined;
    return {
      ...payment,
      cost: legalActionCreditCost(action) + payment.cost,
      cashCost: preparation.cashCost + payment.cashCost,
      // The run boost is already in the projected boundary base. Keep the
      // ordinary pump's carry flag: a carry-pump still needs whole-path pricing,
      // while proven current savings need no speculative future boost benefit.
    };
  }
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
  // An optional loss from an empty Stealth ledger has no effect. Dropping
  // that otherwise complete quote would also drop its bound run-reserve
  // check. Real losses still require their separate continuation binding.
  if (
    quote.postBreakStealthLosses?.some(
      (loss) =>
        loss.amount > 0 &&
        loss.occurrences > 0 &&
        (!loss.optionalIfUnavailable ||
          Object.values(payment.budget.stealthCreditsBySourceId).some(
            (amount) => amount > 0,
          )),
    )
  )
    return undefined;
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

/** A currently offered, canonical self-consuming boost uses the same complete
 * payment comparison as its ordinary pump alternative. No action is invented. */
function runStrengthPreparation(input: AiDecisionInput, action: LegalAction) {
  if (
    action.type !== "trigger_ability" ||
    action.payload?.runnerAbility !== "boost_icebreaker_for_run"
  )
    return undefined;
  const source = input.playerView.own.rig?.find(
    (card) => card.known && card.instanceId === action.source,
  );
  const boost = source?.definitionId
    ? cardSpecPlanningCardByDefinitionId(source.definitionId)?.planning.engine
        .runnerRunStrengthBoost
    : undefined;
  const breaker = input.playerView.own.rig?.find(
    (card) => card.known && card.instanceId === action.payload?.targetCardId,
  );
  if (
    !source ||
    !boost?.cost.trashSelf ||
    boost.duration !== "current_run" ||
    !Number.isSafeInteger(boost.amount) ||
    boost.amount <= 0 ||
    !breaker ||
    !Number.isSafeInteger(breaker.strength) ||
    runnerRunStrengthPumpSavingsForAction(
      input,
      action,
      source.definitionId!,
    ) === undefined
  )
    return undefined;
  return { source, breaker, amount: boost.amount };
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
