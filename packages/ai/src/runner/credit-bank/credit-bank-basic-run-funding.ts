import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import {
  runnerRunTargetIsDirectlyConvertible,
  type RunnerRunFundingAdmission,
} from "../../runtime/runner-run-funding-admission";
import { createRunnerCreditDemand } from "../../plans/credit-demand";
import { searchFundingRoutes } from "../../plans/funding-route";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

/** The bank owner may replace an admitted repeated basic-credit prefix. The
 * existing run admission and a fresh quote still own payoff and run safety. */
export function creditBankReplacesBasicRunFunding(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  economy: RunnerEconomyPosture;
  target: RunnerRunTargetEvaluation;
  admission: RunnerRunFundingAdmission;
  cashOutActionIds: readonly string[];
  requiredPostRunReserve?: number;
  quoteAfterCashouts: (
    target: RunnerRunTargetEvaluation,
    actionIds: readonly string[],
  ) => RunnerRunTargetEvaluation | undefined;
}):
  | {
      priorityClass: "P4";
      evidenceCodes: string[];
      runFunding: NonNullable<RunnerCreditBankSignal["runFunding"]>;
    }
  | undefined {
  const { input, target, admission } = params;
  if (
    !admission.admitted ||
    admission.urgentScoreThreat ||
    admission.concreteFundingGap < 2 ||
    (target.accessTargetKind !== "hq" && target.accessTargetKind !== "rd") ||
    target.recommendation !== "gain_credits_first"
  )
    return undefined;
  const remainingClicks = input.playerView.own.clicks - 1;
  if (remainingClicks < 2) return undefined;
  const needId = `run-support:central:${target.targetServerId}`;
  const parentPlanInstanceId = `plan:runner.pressure_central:${encodeURIComponent(`central:${target.targetServerId}`)}`;
  const demand = createRunnerCreditDemand({
    demandId: needId,
    sourcePlanId: parentPlanInstanceId,
    purpose: "current_run",
    priority: "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    currentCredits: input.playerView.own.credits,
    targetCredits: input.playerView.own.credits + admission.concreteFundingGap,
  });
  const search = (candidates: readonly ActionSemanticCandidate[]) =>
    searchFundingRoutes({
      demand,
      candidates,
      remainingClicks,
      maxSteps: remainingClicks,
      maxRoutes: 16,
    }).routes.filter(
      (route) =>
        route.status === "covered_guaranteed" && route.horizon === "same_turn",
    );
  const basic = search(
    params.candidates.filter(
      (candidate) => candidate.actionType === "gain_credit",
    ),
  ).sort((left, right) => left.totalClickCost - right.totalClickCost)[0];
  if (!basic || basic.totalClickCost < 2) return undefined;
  const cashOutIds = new Set(params.cashOutActionIds);
  const alternative = search(
    params.candidates.filter(
      (candidate) => !cashOutIds.has(candidate.actionId),
    ),
  ).sort((left, right) => left.totalClickCost - right.totalClickCost)[0];
  if (!alternative) return undefined;
  const bankRoutes = search(
    params.candidates.filter(
      (candidate) =>
        cashOutIds.has(candidate.actionId) &&
        candidate.economyProjection?.payoutMode === "all_available" &&
        candidate.economyProjection.sourcePool === "finite",
    ),
  );
  for (const route of bankRoutes) {
    if (
      route.totalClickCost >= basic.totalClickCost ||
      route.totalClickCost >= alternative.totalClickCost
    )
      continue;
    const actionIds = route.steps.map((step) => step.actionId);
    if (actionIds.some((id) => id === undefined)) continue;
    const funded = params.quoteAfterCashouts(target, actionIds as string[]);
    if (
      !funded ||
      funded.actionId !== target.actionId ||
      funded.targetServerId !== target.targetServerId ||
      !funded.prerunReserveQuote ||
      !runnerRunTargetIsDirectlyConvertible({
        target: funded,
        economy: params.economy,
        ...(params.requiredPostRunReserve !== undefined
          ? { requiredPostRunReserve: params.requiredPostRunReserve }
          : {}),
      })
    )
      continue;
    return {
      priorityClass: "P4",
      evidenceCodes: [
        "runner_credit_bank_replaces_basic_run_funding",
        `runner_credit_bank_replaced_basic_clicks:${basic.totalClickCost}`,
        `runner_credit_bank_cashout_clicks:${route.totalClickCost}`,
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
  return undefined;
}
