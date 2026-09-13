import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { createRunnerCreditDemand } from "../plans/credit-demand";
import { searchFundingRoutes } from "../plans/funding-route";
import { runnerFundingRouteCandidateIsMaterializable } from "../plans/runner-funding-candidates";
import type { RunnerFundingRouteAssessment } from "../plans/runner-funding-contracts";
import type { RunnerExactFundingRouteRequest } from "../plans/runner-funding-service-contract";
import { runnerPaymentInstallSetups } from "../plans/runner-payment-install-planning";
import { runnerDebtFinancingProfile } from "./runner-canonical-card-facts";
import {
  runnerStrategicExchangeKinds,
  runnerStrategicExchangeRequiresBoundParent,
} from "./runner-strategic-exchange";

export function runnerExactFundingRouteContract(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
): {
  routeActionIds: string[];
  routeAssessment: RunnerFundingRouteAssessment;
} {
  const targetCredits = request.allowIncrementalProgress
    ? Math.min(request.targetCredits, input.playerView.own.credits + 1)
    : request.targetCredits;
  const demand = createRunnerCreditDemand({
    demandId: request.demandId,
    purpose: request.purpose,
    priority: request.priority,
    hardness: request.hardness,
    deadline: request.deadline,
    currentCredits: input.playerView.own.credits,
    targetCredits,
    ...(request.sourcePlanId !== undefined
      ? { sourcePlanId: request.sourcePlanId }
      : {}),
    ...(request.evidence !== undefined ? { evidence: request.evidence } : {}),
  });
  const paymentTarget = request.paymentWindowTarget;
  const runCandidate = candidates.find(
    (entry) => entry.actionId === paymentTarget?.actionId,
  );
  const paymentSetups =
    request.purpose === "current_run" &&
    request.sourcePlanId &&
    paymentTarget?.runActionProjection.structure === "direct_start_run" &&
    paymentTarget.routeQuote &&
    paymentTarget.routeQuote.knownCost > 0 &&
    paymentTarget.routeQuote?.knownCost ===
      paymentTarget.routeQuote?.guaranteedKnownCost &&
    paymentTarget.routeQuote?.unknownIceCount === 0 &&
    paymentTarget.routeQuote?.conditionalReasons.length === 0 &&
    (paymentTarget.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
    !paymentTarget.visibleTraceTagHazardUnavoidable &&
    runCandidate?.costProfile.costKnownStatus === "known" &&
    runCandidate.costProfile.creditCost === 0
      ? runnerPaymentInstallSetups(input, candidates)
      : [];
  const routeCandidates = runnerExactFundingRouteCandidates(
    candidates,
    request,
    demand,
  );
  const result = searchFundingRoutes({
    demand: paymentSetups.length
      ? { ...demand, acceptedCreditRestrictions: ["general", "restricted"] }
      : demand,
    candidates: [
      ...routeCandidates,
      ...candidates.filter((candidate) =>
        paymentSetups.some((setup) => setup.actionId === candidate.actionId),
      ),
    ],
    paymentWindowSetups: paymentSetups,
    remainingClicks: request.remainingClicks,
    maxSteps: Math.max(
      1,
      request.remainingClicks + (paymentSetups.length ? 1 : 0),
    ),
    maxRoutes: 8,
  });
  const bestRoute = result.bestRoute;
  const firstStepActionId =
    bestRoute.status === "covered_guaranteed" &&
    bestRoute.reliability === "guaranteed" &&
    bestRoute.horizon === "same_turn" &&
    bestRoute.projectedGap === 0
      ? bestRoute.steps.find(
          (step) =>
            step.kind === "legal_action" &&
            step.ownTurnOffset === 0 &&
            step.actionId !== undefined,
        )?.actionId
      : undefined;
  const paymentInstall = paymentSetups.find(
    (setup) => setup.actionId === firstStepActionId,
  );
  return {
    routeActionIds: firstStepActionId === undefined ? [] : [firstStepActionId],
    routeAssessment: {
      stateVersion: input.playerView.stateVersion,
      routeId: bestRoute.routeId,
      status: bestRoute.status,
      reliability: bestRoute.reliability,
      horizon: bestRoute.horizon,
      projectedGap: bestRoute.projectedGap,
      totalClickCost: bestRoute.totalClickCost,
      ...(firstStepActionId !== undefined ? { firstStepActionId } : {}),
      ...(paymentInstall && paymentTarget
        ? {
            paymentInstall: {
              ...paymentInstall,
              targetServerId: paymentTarget.targetServerId,
              runActionId: paymentTarget.actionId,
            },
          }
        : {}),
      evidenceCodes: [...new Set([...result.evidence, ...bestRoute.evidence])],
    },
  };
}

function runnerExactFundingRouteCandidates(
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
  demand: ReturnType<typeof createRunnerCreditDemand>,
): ActionSemanticCandidate[] {
  const materializable = candidates.filter(
    runnerFundingRouteCandidateIsMaterializable,
  );
  const ordinary = materializable.filter(
    (candidate) => !runnerStrategicExchangeRequiresBoundParent(candidate),
  );
  if (request.allowStrategicExchange !== true) return ordinary;

  const routeCoversDemand = (
    routeCandidates: readonly ActionSemanticCandidate[],
  ): boolean => {
    const result = searchFundingRoutes({
      demand,
      candidates: routeCandidates,
      remainingClicks: request.remainingClicks,
      maxSteps: Math.max(1, request.remainingClicks),
      maxRoutes: 8,
    });
    return (
      result.bestRoute.status === "covered_guaranteed" &&
      result.bestRoute.reliability === "guaranteed" &&
      result.bestRoute.horizon === "same_turn" &&
      result.bestRoute.projectedGap === 0
    );
  };
  if (routeCoversDemand(ordinary)) return ordinary;

  const parentBoundCandidates = materializable
    .filter((candidate) => {
      const kinds = runnerStrategicExchangeKinds(candidate);
      return (
        kinds.includes("self_damage") ||
        (kinds.includes("debt_financing") &&
          runnerDebtFinancingCandidateHasSafeBoundRunExit(candidate, request))
      );
    })
    .sort(
      (left, right) =>
        runnerCandidateStrategicExchangeBurden(left) -
          runnerCandidateStrategicExchangeBurden(right) ||
        (left.economyProjection?.netLiquidCreditGain ?? 0) -
          (right.economyProjection?.netLiquidCreditGain ?? 0) ||
        left.actionId.localeCompare(right.actionId),
    );
  const smallestSufficientExchange = parentBoundCandidates.find((candidate) =>
    routeCoversDemand([...ordinary, candidate]),
  );
  return smallestSufficientExchange === undefined
    ? ordinary
    : [...ordinary, smallestSufficientExchange];
}

function runnerDebtFinancingCandidateHasSafeBoundRunExit(
  candidate: ActionSemanticCandidate,
  request: RunnerExactFundingRouteRequest,
): boolean {
  const parent = request.debtFinancingParent;
  const profile = runnerDebtFinancingProfile(candidate.sourceDefinitionId);
  const projection = candidate.economyProjection;
  if (
    !parent ||
    !request.sourcePlanId ||
    parent.planInstanceId !== request.sourcePlanId ||
    candidate.semanticActionType !== "install.card" ||
    !profile ||
    projection?.source !== "legal_action_payload" ||
    projection.reliability !== "guaranteed" ||
    projection.confidence !== "high" ||
    projection.grossLiquidCreditGain !== profile.installCreditGain ||
    projection.creditCost !== profile.installCost ||
    (parent.pathPassability !== "reachable" &&
      parent.pathPassability !== "blocked_unpayable") ||
    (parent.score <= 0 &&
      !(
        parent.pathPassability === "blocked_unpayable" &&
        parent.scoreThreat &&
        request.priority === "acute_hard_plan_blocker"
      )) ||
    (!parent.scoreThreat &&
      parent.accessPayoff !== "agenda" &&
      parent.accessPayoff !== "score_threat") ||
    (parent.unknownUnrezzedIceCount > 0 && !parent.riskyUniversalCoverage) ||
    parent.remainingClicksAfterRun < 0
  ) {
    return false;
  }
  const netGain = projection.netLiquidCreditGain;
  // Funding may close a certified credit-only path gap. Requiring the
  // unfunded parent to be payable first would exclude the very consumer
  // this route finances. Coverage and hazard failures remain excluded.
  return (
    typeof netGain === "number" &&
    Number.isFinite(netGain) &&
    parent.creditsAfterRun + netGain >= profile.leavePlayPayCost
  );
}

function runnerCandidateStrategicExchangeBurden(
  candidate: ActionSemanticCandidate,
): number {
  const debt = runnerDebtFinancingProfile(candidate.sourceDefinitionId);
  if (debt) {
    return debt.leavePlayPayCost + debt.startOfTurnCreditLoss;
  }
  return runnerCandidateSelfDamageAmount(candidate) * 1_000;
}

function runnerCandidateSelfDamageAmount(
  candidate: ActionSemanticCandidate,
): number {
  return (candidate.costProfile.selfDamage ?? []).reduce(
    (total, damage) =>
      total +
      (typeof damage.amount === "number" && Number.isFinite(damage.amount)
        ? Math.max(0, damage.amount)
        : Number.POSITIVE_INFINITY),
    0,
  );
}

export function runnerImmediateGeneralLiquidEconomyRoute(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    typeof projection.netLiquidCreditGain === "number" &&
    Number.isFinite(projection.netLiquidCreditGain) &&
    projection.netLiquidCreditGain > 0
  );
}
