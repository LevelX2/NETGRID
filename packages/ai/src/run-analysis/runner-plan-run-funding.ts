import { type AiDecisionInput } from "@netgrid/shared";
import {
  runnerGuaranteedUrgentRemoteCanSpendToZero,
  runnerTerminalRemoteContestIsDirectlyMandatory,
  runnerTerminalRemoteContestVisibleHazardFundingGap,
  runnerTerminalRemoteLastChanceKnownPathFundingGap,
} from "../runner/remote-contest/remote-contest-admission";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

import { createRunnerCreditDemand } from "../plans/credit-demand";

import { searchFundingRoutes } from "../plans/funding-route";

import type { RunnerRunFundingSupport } from "../plans/runner-funding-service-contract";

import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../runner-run-target-evaluation";

import { runnerExactFundingRouteContract } from "../runtime/runner-exact-funding-routes";

import {
  assessRunnerRunFundingAdmission,
  runnerRunTargetIsDirectlyConvertible,
} from "../runtime/runner-run-funding-admission";

import { runnerTerminalContestThreat } from "../runtime/runner-terminal-contest-threat";

export function runnerRunFundingSupport(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
  runTargets: readonly RunnerRunTargetEvaluation[],
  candidates: readonly ActionSemanticCandidate[],
): RunnerRunFundingSupport | undefined {
  const terminalVisibleHazardFundingGap =
    runnerTerminalRemoteContestVisibleHazardFundingGap(input, evaluation);
  const urgentPayoff = runnerRunHasExactUrgency(input, evaluation);
  const hasStructuredFundingNeed =
    evaluation.fundingNeed !== undefined &&
    evaluation.fundingNeed.reason !== "none";
  if (
    evaluation.knownAccessState === "known_no_current_payoff" ||
    evaluation.recommendation === "draw_for_damage_buffer" ||
    evaluation.accessTargetKind === "archives" ||
    input.playerView.own.clicks <= 1 ||
    (evaluation.score <= 0 &&
      !urgentPayoff &&
      terminalVisibleHazardFundingGap === undefined) ||
    (!hasStructuredFundingNeed &&
      evaluation.recommendation !== "gain_credits_first")
  ) {
    return undefined;
  }
  if (runnerRunTargetCanConvertNow(input, economy, evaluation, candidates)) {
    return undefined;
  }
  const requiredPostRunReserve = runnerRunRequiredPostRunReserve(
    input,
    candidates,
    economy,
    evaluation,
  );
  const admission = assessRunnerRunFundingAdmission({
    target: evaluation,
    runTargets,
    economy,
    urgentScoreThreat: urgentPayoff,
    ...(requiredPostRunReserve !== undefined ? { requiredPostRunReserve } : {}),
  });
  if (!admission.admitted && terminalVisibleHazardFundingGap === undefined) {
    return undefined;
  }
  const conservativeGap =
    terminalVisibleHazardFundingGap ?? admission.concreteFundingGap;
  const remote = evaluation.accessTargetKind === "remote";
  const dedupeKey = remote
    ? `remote:${evaluation.targetServerId}`
    : `central:${evaluation.targetServerId}`;
  const parentModule = remote
    ? "runner.contest_remote"
    : "runner.pressure_central";
  const parentPlanInstanceId = `plan:${parentModule}:${encodeURIComponent(dedupeKey)}`;
  let route = runnerExactFundingRouteContract(input, candidates, {
    demandId: `run-support:${dedupeKey}`,
    sourcePlanId: parentPlanInstanceId,
    purpose: "current_run",
    priority: urgentPayoff
      ? "acute_hard_plan_blocker"
      : "current_foreground_plan",
    hardness: "hard",
    deadline: "end_of_current_turn",
    targetCredits: input.playerView.own.credits + conservativeGap,
    remainingClicks: Math.max(0, input.playerView.own.clicks - 1),
    allowStrategicExchange: true,
    paymentWindowTarget: evaluation,
    debtFinancingParent: {
      planInstanceId: parentPlanInstanceId,
      runActionId: evaluation.actionId,
      targetServerId: evaluation.targetServerId,
      accessPayoff: evaluation.accessPayoff,
      scoreThreat: evaluation.scoreThreat,
      score: evaluation.score,
      pathPassability: evaluation.pathPassability,
      creditsAfterRun: evaluation.creditsAfterRun,
      unknownUnrezzedIceCount: evaluation.unknownUnrezzedIceCount ?? 0,
      riskyUniversalCoverage: evaluation.riskyUniversalCoverage,
      remainingClicksAfterRun: Math.max(0, input.playerView.own.clicks - 2),
    },
    evidence: [
      `runner_run_support_target:${evaluation.targetServerId}`,
      "runner_run_conversion_click_reserved:1",
      admission.reasonCode,
    ],
  });
  const terminalKnownPathGap =
    route.routeActionIds.length === 0
      ? runnerTerminalRemoteLastChanceKnownPathFundingGap(input, evaluation)
      : undefined;
  if (terminalKnownPathGap !== undefined) {
    const terminalRoute = runnerExactFundingRouteContract(input, candidates, {
      demandId: `run-support:${dedupeKey}`,
      sourcePlanId: parentPlanInstanceId,
      purpose: "current_run",
      priority: "acute_hard_plan_blocker",
      hardness: "hard",
      deadline: "end_of_current_turn",
      targetCredits: input.playerView.own.credits + terminalKnownPathGap,
      remainingClicks: Math.max(0, input.playerView.own.clicks - 1),
      allowStrategicExchange: true,
      paymentWindowTarget: evaluation,
      debtFinancingParent: {
        planInstanceId: parentPlanInstanceId,
        runActionId: evaluation.actionId,
        targetServerId: evaluation.targetServerId,
        accessPayoff: evaluation.accessPayoff,
        scoreThreat: evaluation.scoreThreat,
        score: evaluation.score,
        pathPassability: evaluation.pathPassability,
        creditsAfterRun: evaluation.creditsAfterRun,
        unknownUnrezzedIceCount: evaluation.unknownUnrezzedIceCount ?? 0,
        riskyUniversalCoverage: evaluation.riskyUniversalCoverage,
        remainingClicksAfterRun: Math.max(0, input.playerView.own.clicks - 2),
      },
      evidence: [
        `runner_run_support_target:${evaluation.targetServerId}`,
        "runner_run_conversion_click_reserved:1",
        "runner_terminal_remote_last_chance_known_path_funding",
      ],
    });
    if (terminalRoute.routeActionIds.length > 0) {
      route = terminalRoute;
    }
  }
  const gap =
    terminalKnownPathGap !== undefined && route.routeActionIds.length > 0
      ? terminalKnownPathGap
      : conservativeGap;
  const terminalKnownPathRouteSelected =
    terminalKnownPathGap !== undefined &&
    gap === terminalKnownPathGap &&
    route.routeActionIds.length > 0;
  return {
    needId: `run-support:${dedupeKey}`,
    gap,
    targetCredits: input.playerView.own.credits + gap,
    priorityClass: urgentPayoff ? "P2" : "P4",
    parentPlanInstanceId,
    driver: {
      kind: remote ? "contest" : "run",
      targetId: evaluation.targetServerId,
      reasonCode: terminalKnownPathRouteSelected
        ? "terminal_remote_last_chance_known_path_funding"
        : terminalVisibleHazardFundingGap !== undefined
          ? "terminal_remote_visible_hazard_funding_gap"
          : admission.reasonCode,
    },
    ...route,
    evidenceCode: terminalKnownPathRouteSelected
      ? `runner_run_support_terminal_last_chance_known_path_gap:${evaluation.targetServerId}:${gap}:${evaluation.actionId}`
      : terminalVisibleHazardFundingGap !== undefined
        ? `runner_run_support_terminal_visible_hazard_gap:${evaluation.targetServerId}:${terminalVisibleHazardFundingGap}:${evaluation.actionId}`
        : `runner_run_support_fund_concrete_gap:${evaluation.targetServerId}:${admission.reasonCode}`,
  };
}

export function runnerRunTargetCanConvertNow(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
  candidates: readonly ActionSemanticCandidate[],
): boolean {
  const terminalRemoteContestIsDirectlyMandatory =
    runnerTerminalRemoteContestIsDirectlyMandatory(input, evaluation);
  // The terminal route already converts if it can pay the known path and
  // retain liquid credits; a generic post-run floor top-up is not run support.
  if (
    terminalRemoteContestIsDirectlyMandatory &&
    evaluation.creditsAfterRun > 0
  ) {
    return true;
  }
  if (evaluation.prerunReserveQuote?.status === "blocked") {
    return false;
  }
  const allowCreditFloorOverride = runnerRunCreditFloorOverrideAllowed(
    input,
    evaluation,
  );
  if (
    evaluation.unrezzedIceRiskUnderfunded === true &&
    evaluation.creditsAfterRun <= 0 &&
    !allowCreditFloorOverride
  ) {
    return false;
  }
  const requiredPostRunReserve = runnerRunRequiredPostRunReserve(
    input,
    candidates,
    economy,
    evaluation,
  );
  return runnerRunTargetIsDirectlyConvertible({
    target: evaluation,
    economy,
    allowCreditFloorOverride:
      allowCreditFloorOverride ||
      runnerImmediatePaidAccessConversionCanUseReserve(evaluation),
    ...(requiredPostRunReserve !== undefined ? { requiredPostRunReserve } : {}),
  });
}

function runnerRunCreditFloorOverrideAllowed(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  if (
    runnerFreeCentralInformationRoutePreservesCurrentCredits(input, evaluation)
  )
    return true;
  if (!runnerRunHasExactUrgency(input, evaluation)) return false;
  if (evaluation.accessTargetKind === "remote" && evaluation.scoreThreat) {
    return (
      input.playerView.opponent.credits <= 1 ||
      runnerGuaranteedUrgentRemoteCanSpendToZero(evaluation)
    );
  }
  return true;
}

function runnerFreeCentralInformationRoutePreservesCurrentCredits(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  const routeQuote = evaluation.routeQuote;
  return (
    (evaluation.accessTargetKind === "hq" ||
      evaluation.accessTargetKind === "rd") &&
    evaluation.pathPassability === "reachable" &&
    routeQuote !== undefined &&
    routeQuote.reachability === "guaranteed_access" &&
    routeQuote.fundingGap === 0 &&
    routeQuote.unknownIceCount === 0 &&
    routeQuote.effects.length === 0 &&
    routeQuote.conditionalReasons.length === 0 &&
    (routeQuote.conditionalRiskReasons?.length ?? 0) === 0 &&
    evaluation.creditsAfterRun >= input.playerView.own.credits &&
    evaluation.score > 0 &&
    (evaluation.recommendation === "run_now" ||
      evaluation.recommendation === "run_if_free") &&
    (evaluation.knownAccessState === "unknown" ||
      evaluation.knownAccessState === "fresh") &&
    (evaluation.unknownUnrezzedIceCount ?? 0) === 0 &&
    (evaluation.visibleIceRunHazards?.length ?? 0) === 0 &&
    (evaluation.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
    evaluation.visibleTraceTagHazardUnavoidable !== true
  );
}

function runnerImmediatePaidAccessConversionCanUseReserve(
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.runActionProjection?.sourceKind === "event" &&
    evaluation.multiaccessAvailable &&
    evaluation.pathPassability === "reachable" &&
    evaluation.recommendation === "run_now" &&
    evaluation.knownAccessState !== "known_no_current_payoff" &&
    evaluation.creditsAfterRun >= 0 &&
    (evaluation.routeQuote?.fundingGap ?? 0) === 0
  );
}

export function runnerRunRequiredPostRunReserve(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  economy: RunnerEconomyPosture,
  evaluation: RunnerRunTargetEvaluation,
): number | undefined {
  if (runnerRunCreditFloorOverrideAllowed(input, evaluation)) {
    return undefined;
  }
  if (evaluation.fundingNeed?.reason !== "post_run_floor_gap") {
    return undefined;
  }
  const remoteScoreThreat =
    evaluation.accessTargetKind === "remote" &&
    evaluation.accessPayoff === "score_threat";
  if (
    evaluation.creditsAfterRun >= input.playerView.own.credits &&
    !remoteScoreThreat
  ) {
    return undefined;
  }
  const contestReserve = remoteScoreThreat
    ? economy.creditReservePolicy.contestReserve
    : 0;
  const phaseReserve = evaluation.fundingNeed.protectedLiquidReserve;
  const requiredReserve = Math.max(phaseReserve, contestReserve);
  const reserveGap = requiredReserve - evaluation.creditsAfterRun;
  if (reserveGap <= 0) return undefined;
  if (!runnerRunHasExactUrgency(input, evaluation)) return requiredReserve;

  const remainingFundingClicks = Math.max(0, input.playerView.own.clicks - 1);
  if (remainingFundingClicks <= 0) return undefined;
  const demand = createRunnerCreditDemand({
    demandId: `run-reserve:${evaluation.actionId}`,
    sourcePlanId:
      evaluation.accessTargetKind === "remote"
        ? `runner.contest_remote:${evaluation.targetServerId}`
        : `runner.pressure_central:${evaluation.targetServerId}`,
    purpose: "foreground_plan",
    priority: "acute_hard_plan_blocker",
    hardness: "hard",
    deadline: "end_of_current_turn",
    currentCredits: input.playerView.own.credits,
    targetCredits: input.playerView.own.credits + reserveGap,
    evidence: [
      `run_reserve_target:${requiredReserve}`,
      `run_reserve_gap:${reserveGap}`,
    ],
  });
  const route = searchFundingRoutes({
    demand,
    candidates,
    remainingClicks: remainingFundingClicks,
    maxSteps: remainingFundingClicks,
    maxRoutes: 8,
  }).routes.find(
    (candidateRoute) =>
      candidateRoute.status === "covered_guaranteed" &&
      candidateRoute.horizon === "same_turn",
  );
  return route ? requiredReserve : undefined;
}

export function runnerRunHasExactUrgency(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): boolean {
  return (
    evaluation.scoreThreat ||
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat" ||
    (evaluation.targetKind === "remote" &&
      runnerTerminalContestThreat(input)?.remoteServerIds.includes(
        evaluation.targetServerId,
      ) === true)
  );
}

export function bestRunTargetsByServer(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  evaluations: readonly RunnerRunTargetEvaluation[],
  candidates: readonly ActionSemanticCandidate[],
): RunnerRunTargetEvaluation[] {
  const byServer = new Map<string, RunnerRunTargetEvaluation>();
  const ranks = new Map<string, number>();
  const conversionRank = (evaluation: RunnerRunTargetEvaluation): number => {
    const existing = ranks.get(evaluation.actionId);
    if (existing !== undefined) return existing;
    const rank = runnerRunTargetCanConvertNow(
      input,
      economy,
      evaluation,
      candidates,
    )
      ? 2
      : (runnerRunFundingSupport(
            input,
            economy,
            evaluation,
            evaluations,
            candidates,
          )?.routeActionIds.length ?? 0) > 0
        ? 1
        : 0;
    ranks.set(evaluation.actionId, rank);
    return rank;
  };
  for (const evaluation of evaluations) {
    const previous = byServer.get(evaluation.targetServerId);
    const evaluationConversionRank = conversionRank(evaluation);
    const previousConversionRank = previous ? conversionRank(previous) : 0;
    const evaluationIsMandatoryTerminalContest =
      runnerTerminalRemoteContestIsDirectlyMandatory(input, evaluation);
    const previousIsMandatoryTerminalContest =
      previous !== undefined &&
      runnerTerminalRemoteContestIsDirectlyMandatory(input, previous);
    if (
      !previous ||
      (evaluationIsMandatoryTerminalContest &&
        !previousIsMandatoryTerminalContest) ||
      evaluationConversionRank > previousConversionRank ||
      (evaluationIsMandatoryTerminalContest ===
        previousIsMandatoryTerminalContest &&
        evaluationConversionRank === previousConversionRank &&
        evaluation.score > previous.score)
    ) {
      byServer.set(evaluation.targetServerId, evaluation);
    }
  }
  return [...byServer.values()];
}
