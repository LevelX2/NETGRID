import type { creditBankReplacesBasicRunFunding } from "./credit-bank-basic-run-funding";
import { createRunnerCreditDemand } from "../../plans/credit-demand";
import { searchFundingRoutes } from "../../plans/funding-route";
import { runnerRunTargetIsDirectlyConvertible } from "../../runtime/runner-run-funding-admission";

/** An unfunded route's score is not its funded payoff. Only a complete fresh
 * same-run quote can certify this Bank-owned, current-turn funding prefix. */
export function creditBankFundsKnownUrgentRun(
  params: Parameters<typeof creditBankReplacesBasicRunFunding>[0],
): ReturnType<typeof creditBankReplacesBasicRunFunding> {
  const { input, target, admission } = params;
  const remainingClicks = input.playerView.own.clicks - 1;
  if (
    !admission.admitted ||
    !admission.urgentScoreThreat ||
    target.accessTargetKind !== "remote" ||
    !target.routeQuote ||
    target.routeQuote.unknownIceCount !== 0 ||
    target.routeQuote.conditionalReasons.length !== 0 ||
    remainingClicks < 1 ||
    params.cashOutActionIds.length === 0
  )
    return undefined;
  const needId = `run-support:remote:${target.targetServerId}`;
  const parentPlanInstanceId = `plan:runner.contest_remote:${encodeURIComponent(`remote:${target.targetServerId}`)}`;
  const cashOutIds = new Set(params.cashOutActionIds);
  const demand = createRunnerCreditDemand({
    demandId: needId,
    sourcePlanId: parentPlanInstanceId,
    purpose: "current_run",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "end_of_current_turn",
    currentCredits: input.playerView.own.credits,
    targetCredits: input.playerView.own.credits + admission.concreteFundingGap,
  });
  const routes = searchFundingRoutes({
    demand,
    candidates: params.candidates.filter(
      (candidate) =>
        candidate.planOwnerBinding?.owner === "runner.credit_bank" &&
        candidate.planOwnerBinding.route === "cash_out" &&
        candidate.economyProjection?.payoutMode === "all_available" &&
        candidate.economyProjection.sourcePool === "finite" &&
        candidate.economyProjection.cardsConsumed === 0,
    ),
    remainingClicks,
    maxSteps: remainingClicks,
    maxRoutes: 16,
    acceptRoute: (route) => {
      if (!cashOutIds.has(route.steps[0]?.actionId ?? "")) return false;
      const actionIds = route.steps.map((step) => step.actionId);
      if (actionIds.some((id) => id === undefined)) return false;
      const funded = params.quoteAfterCashouts(target, actionIds as string[]);
      return (
        funded !== undefined &&
        funded.actionId === target.actionId &&
        funded.targetServerId === target.targetServerId &&
        funded.routeQuote?.reachability === "guaranteed_access" &&
        funded.routeQuote.unknownIceCount === 0 &&
        funded.routeQuote.conditionalReasons.length === 0 &&
        funded.visibleTraceTagHazardUnavoidable !== true &&
        (funded.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
        runnerRunTargetIsDirectlyConvertible({
          target: funded,
          economy: params.economy,
          allowCreditFloorOverride: admission.urgentScoreThreat,
          ...(params.requiredPostRunReserve !== undefined
            ? { requiredPostRunReserve: params.requiredPostRunReserve }
            : {}),
        })
      );
    },
  }).routes;
  const route = routes.find(
    (entry) =>
      entry.status === "covered_guaranteed" &&
      entry.horizon === "same_turn" &&
      cashOutIds.has(entry.steps[0]?.actionId ?? ""),
  );
  if (!route) return undefined;
  return {
    priorityClass: "P4",
    evidenceCodes: [
      "runner_credit_bank_complete_known_run_after_cashout",
      ...admission.evidenceCodes,
    ],
    runFunding: {
      parentPlanInstanceId,
      needId,
      runActionId: target.actionId,
      stateVersion: input.playerView.stateVersion,
      gap: admission.concreteFundingGap,
      routeAssessment: {
        stateVersion: input.playerView.stateVersion,
        routeId: route.routeId,
        status: route.status,
        reliability: route.reliability,
        horizon: route.horizon,
        projectedGap: route.projectedGap,
        totalClickCost: route.totalClickCost,
        firstStepActionId: route.steps[0]!.actionId!,
        evidenceCodes: route.evidence,
      },
    },
  };
}
