import {
  runnerGeneralCreditsAfterCompletedPath,
  runnerRunPathCreditBudgetAfterEncounter,
} from "../../run-analysis/visible-run-credit-budget";

import { completeEncounterBreakerPayment } from "./run-window-encounter-payment";
import { legalActionCreditCost } from "../../runtime/legal-action-credit-cost";
import { parseSubroutineIndexes } from "../../runtime/subroutine-indexes";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import {
  currentEncounteredIceCard,
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
  currentEncounterCompleteSubroutineIndexes,
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
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
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
  const unbroken = currentEncounterCompleteSubroutineIndexes(input);
  if (!unbroken) return undefined;
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
    const next = currentEncounterUnbrokenSubroutineIndexes(input);
    const nextSubroutines = ice.effectiveRunQuote.subroutines.filter((_, i) =>
      next.has(i),
    );
    const indexes = parseSubroutineIndexes(
      action.payload?.payOrEndRunSubroutineIndexes,
    );
    const cost = subroutines.reduce((sum, s) => sum + (s.amount ?? 0), 0);
    const immediateCost = nextSubroutines.reduce(
      (sum, s) => sum + (s.amount ?? 0),
      0,
    );
    if (
      currentEncounterRequiresFullBreak(input) ||
      action.choiceRequirements?.length ||
      action.payload?.encounterContinue !== true ||
      action.payload?.encounterWillEndRun !== false ||
      nextSubroutines.some((s) => !isVisiblePayEndRunSubroutine(s)) ||
      indexes.size !== next.size ||
      [...next].some((index) => !indexes.has(index)) ||
      action.payload?.payOrEndRunSubroutineIndexes !==
        [...next].sort((a, b) => a - b).join(",") ||
      action.payload?.unbrokenSubroutineCount !== next.size ||
      !Number.isSafeInteger(cost) ||
      cost <= 0 ||
      action.payload?.payOrEndRunSubroutinePayment !== immediateCost ||
      Number(action.payload?.payOrTrashProgramSubroutinePayment ?? 0) !== 0 ||
      legalActionCreditCost(action) !== immediateCost
    )
      return undefined;
    if (subroutines.some(isVisibleHardEndRunSubroutine))
      return completeEncounterAfterFixedPayment(input, action, next);
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
      carriesStrengthAcrossIce: false,
      rig: runnerRigAfterEncounter(input.playerView.own.rig ?? []),
      runEndTrashSourceIds: [] as string[],
      budget: runnerRunPathCreditBudgetAfterEncounter(payment.budget),
    };
  }
  return completeEncounterBreakerPayment(input, action);
}

/** Bind the real fixed-payment head before quoting only its exact remaining
 * pure-ETR scope through the existing path-cost service. This is neither a
 * speculative future Action nor a second action chooser. */
function completeEncounterAfterFixedPayment(
  input: AiDecisionInput,
  action: LegalAction,
  next: ReadonlySet<number>,
) {
  const ice = currentEncounteredIceCard(input)!;
  const complete = currentEncounterCompleteSubroutineIndexes(input)!;
  const remaining = ice.effectiveRunQuote!.subroutines.filter(
    (_, index) => complete.has(index) && !next.has(index),
  );
  const first = spendRunnerEncounterActionCost({
    input,
    action,
    budget: runnerEncounterCreditBudgetForInput(input),
    cost: legalActionCreditCost(action),
  });
  if (
    !first.affordable ||
    ice.effectiveRunQuote!.conditionalEncounterEffects?.length
  )
    return undefined;
  const path = assessKnownRezzedIcePath(
    [
      {
        ...ice,
        effectiveRunQuote: {
          ...ice.effectiveRunQuote!,
          subroutines: remaining,
        },
      },
    ],
    input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetAfterEncounter(first.budget),
    [],
    input.playerView.opponent.credits,
    currentRunPathContext(input),
  );
  if (
    path.blocked ||
    !path.canReachAccess ||
    path.conditionalAccessReasons?.length ||
    path.conditionalRiskReasons?.length ||
    path.futureClicksLost ||
    path.preRunPreparation ||
    (path.creditBudgetAfterPath?.paymentSupportCreditsGained ?? 0) > 0
  )
    return undefined;
  if (!path.creditBudgetAfterPath || !path.carriedBreakerStrengthAfterPath)
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      owner: "rules_contract",
      removalCondition:
        "A completed current encounter quote must return its exact credit ledger and carried breaker strength.",
    });
  const after = runnerGeneralCreditsAfterCompletedPath(
    path.creditBudgetAfterPath,
  );
  return {
    cost: legalActionCreditCost(action) + (path.visibleBreakCost ?? 0),
    cashCost: input.playerView.own.credits - after,
    liquidCreditsAfterPayment: after,
    carriesStrengthAcrossIce:
      Object.keys(path.carriedBreakerStrengthAfterPath).length > 0,
    rig: runnerRigAfterEncounter(
      input.playerView.own.rig ?? [],
      path.carriedBreakerStrengthAfterPath,
    ),
    runEndTrashSourceIds: path.runEndTrashSourceIds ?? [],
    budget: path.creditBudgetAfterPath,
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
  const liquidCreditsAfterPath = runnerGeneralCreditsAfterCompletedPath(
    path.creditBudgetAfterPath,
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
