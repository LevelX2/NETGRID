import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import { parseSubroutineIndexes } from "../../runtime/subroutine-indexes";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  creditsToBreakVisibleSubroutinesWithBreaker,
} from "../../visible-run-analysis";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
  currentRunRemainingIce,
} from "../../runtime/current-encounter";
import {
  runnerEncounterCreditBudgetForInput,
  spendRunnerEncounterActionCost,
} from "../../runtime/runner-encounter-credit-budget";
import { runnerRigAfterEncounter } from "../../runtime/runner-rig-after-encounter";
import {
  isVisibleHardEndRunSubroutine,
  isVisiblePayEndRunSubroutine,
} from "../../run-analysis/visible-subroutine-semantics";
import { currentRunPathContext } from "../../run-analysis/current-run-path-context";

/** Quote the access-only payment before testing the bound continuation reserve.
 * Safety mitigation and mixed-effect encounters keep their existing owners.
 */
export function pureEndRunEncounterPayment(
  input: AiDecisionInput,
  action: LegalAction,
) {
  if (
    input.playerView.run?.phase !== "encounter_ice" ||
    (action.type !== "pump_breaker" &&
      action.type !== "break_subroutine" &&
      action.type !== "continue_run") ||
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
  const unbroken = currentEncounterUnbrokenSubroutineIndexes(input);
  const subroutines = ice.effectiveRunQuote.subroutines.filter((_, i) =>
    unbroken.has(i),
  );
  if (
    subroutines.length === 0 ||
    subroutines.some(
      (s) =>
        !isVisibleHardEndRunSubroutine(s) && !isVisiblePayEndRunSubroutine(s),
    )
  )
    return undefined;
  if (action.type === "continue_run") {
    const indexes = parseSubroutineIndexes(
      action.payload?.payOrEndRunSubroutineIndexes,
    );
    const cost = subroutines.reduce((sum, s) => sum + (s.amount ?? 0), 0);
    if (
      currentEncounterRequiresFullBreak(input) ||
      action.choiceRequirements?.length ||
      action.payload?.encounterContinue !== true ||
      action.payload?.encounterWillEndRun !== false ||
      subroutines.some((s) => !isVisiblePayEndRunSubroutine(s)) ||
      indexes.size !== unbroken.size ||
      [...unbroken].some((index) => !indexes.has(index)) ||
      action.payload?.payOrEndRunSubroutineIndexes !==
        [...unbroken].sort((a, b) => a - b).join(",") ||
      action.payload?.unbrokenSubroutineCount !== unbroken.size ||
      !Number.isSafeInteger(cost) ||
      cost <= 0 ||
      action.payload?.payOrEndRunSubroutinePayment !== cost ||
      Number(action.payload?.payOrTrashProgramSubroutinePayment ?? 0) !== 0 ||
      legalActionCreditCost(action) !== cost
    )
      return undefined;
    const payment = spendRunnerEncounterActionCost({
      input,
      action,
      budget: runnerEncounterCreditBudgetForInput(input),
      cost,
    });
    if (!payment.affordable) return undefined;
    return {
      cost,
      cashCost: payment.cashCost,
      liquidCreditsAfterPayment: payment.budget.credits,
      rig: runnerRigAfterEncounter(input.playerView.own.rig ?? []),
      runEndTrashSourceIds: [] as string[],
      budget: {
        ...payment.budget,
        credits: payment.budget.credits + payment.budget.runOnlyCredits,
      },
    };
  }
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
    rig,
    runEndTrashSourceIds: quote.runEndTrashSourceIfUsed
      ? [quote.breakerInstanceId]
      : [],
    budget: {
      ...payment.budget,
      credits: payment.budget.credits + payment.budget.runOnlyCredits,
    },
  };
}

/** Economic evidence for equivalent, fully paid pure-ETR continuations.
 * The Run Window owner consumes this value; this quote never selects an action.
 */
export function pureEndRunEncounterEconomics(
  input: AiDecisionInput,
  payment: NonNullable<ReturnType<typeof pureEndRunEncounterPayment>>,
) {
  const remainingIce = currentRunRemainingIce(input);
  if (
    remainingIce.some(
      (ice) =>
        !ice.known ||
        ice.rezzed !== true ||
        !ice.effectiveRunQuote ||
        ice.effectiveRunQuote.subroutines.some(
          (subroutine) =>
            !isVisibleHardEndRunSubroutine(subroutine) &&
            !isVisiblePayEndRunSubroutine(subroutine),
        ),
    ) ||
    (payment.budget.paymentSupportCreditsGained ?? 0) > 0
  )
    return undefined;
  const server = input.playerView.servers.find(
    (entry) => entry.id === input.playerView.run?.attackedServerId,
  );
  if (!server) return undefined;
  const path = assessKnownRezzedIcePath(
    remainingIce,
    payment.rig,
    payment.budget,
    server.root,
    input.playerView.opponent.credits,
    currentRunPathContext(input),
  );
  if (
    path.blocked ||
    !path.canReachAccess ||
    path.conditionalAccessReasons?.length ||
    path.conditionalRiskReasons?.length ||
    path.futureClicksLost ||
    (path.creditBudgetAfterPath?.paymentSupportCreditsGained ?? 0) > 0
  )
    return undefined;
  // The canonical path spends remaining run-only credits before cash. Its
  // general balance includes both; the liquid remainder cannot exceed the
  // cash that was left after the current complete encounter payment.
  const liquidCreditsAfterPath = Math.min(
    payment.liquidCreditsAfterPayment,
    path.creditsAfterPath,
  );
  const totalCost = payment.cost + (path.visibleBreakCost ?? 0);
  const alreadyBound = new Set(
    input.playerView.run?.runEndTrashUsedBreakerIdsThisRun ?? [],
  );
  const newRunEndTrashSources = new Set(
    [
      ...payment.runEndTrashSourceIds,
      ...(path.runEndTrashSourceIds ?? []),
    ].filter((id) => !alreadyBound.has(id)),
  );
  const newRunEndTrashSourceCount = newRunEndTrashSources.size;
  return {
    newRunEndTrashSourceCount,
    totalCost,
    cashCost: input.playerView.own.credits - liquidCreditsAfterPath,
    liquidCreditsAfterPath,
    // Cash and integer nominal spending precede a newly scheduled source loss.
    // The bounded fraction cannot outweigh a one-credit cheaper complete path.
    value:
      450 +
      liquidCreditsAfterPath * 10 +
      1 /
        (1 +
          totalCost +
          newRunEndTrashSourceCount / (1 + newRunEndTrashSourceCount)),
  };
}
