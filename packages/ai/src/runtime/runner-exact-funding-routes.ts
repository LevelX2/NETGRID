import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { runnerDrawProjectionFor } from "../actions/action-economy-projection";
import { createRunnerCreditDemand } from "../plans/credit-demand";
import { searchFundingRoutes, type FundingRoute } from "../plans/funding-route";
import { runnerFundingRouteCandidateIsMaterializable } from "../plans/runner-funding-candidates";
import type { RunnerFundingRouteAssessment } from "../plans/runner-funding-contracts";
import type { RunnerExactFundingRouteRequest } from "../plans/runner-funding-service-contract";
import { runnerPaymentInstallSetups } from "../plans/runner-payment-install-planning";
import {
  assessRunnerRunAfterGuaranteedFunding,
  evaluateRunnerRunTargets,
} from "../runner-run-target-evaluation";
import {
  runnerCriticalDamageContestBlocked,
  runnerTerminalRemoteContestIsDirectlyMandatory,
} from "../runner/remote-contest/remote-contest-admission";
import { runnerRunTargetIsDirectlyConvertible } from "./runner-run-funding-admission";
import { createDeckCapabilitiesContext } from "./deck-capabilities-context";
import { runnerDebtFinancingProfile } from "./runner-canonical-card-facts";
import {
  compareRunnerFundingHandQuotes,
  runnerFundingHandQuote,
} from "./runner-funding-hand-quote";
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
  const funding = runnerExactFundingRouteCandidates(
    input,
    candidates,
    request,
    demand,
  );
  const result = searchFundingRoutes({
    demand: paymentSetups.length
      ? {
          ...funding.demand,
          acceptedCreditRestrictions: ["general", "restricted"],
        }
      : funding.demand,
    candidates: [
      ...funding.candidates,
      ...candidates.filter((candidate) =>
        paymentSetups.some((setup) => setup.actionId === candidate.actionId),
      ),
    ],
    paymentWindowSetups: paymentSetups,
    remainingClicks: funding.remainingClicks,
    maxSteps: Math.max(
      1,
      funding.remainingClicks + (paymentSetups.length ? 1 : 0),
    ),
    maxRoutes: 8,
    acceptRoute: (route) =>
      runnerFundingRouteConsumerBufferFits(input, candidates, request, route),
    compareEquivalentRoutes: (left, right) =>
      compareRunnerFundingHandQuotes(
        runnerFundingHandQuote(input, candidates, left),
        runnerFundingHandQuote(input, candidates, right),
      ),
  });
  const bestRoute = result.bestRoute;
  const handQuote = runnerFundingHandQuote(input, candidates, bestRoute);
  const bufferRepair = runnerFundingBufferRepair(
    input,
    candidates,
    request,
    bestRoute,
  );
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
      evidenceCodes: [
        ...new Set([
          ...result.evidence,
          ...bestRoute.evidence,
          ...funding.evidence,
          handQuote.status === "known"
            ? `runner_funding_known_retained_hand_gain:${handQuote.retainedGain}`
            : `runner_funding_hand_collateral_not_comparable:${handQuote.reason}`,
          ...(request.requireCompleteKnownPath
            ? ["runner_funding_complete_known_path_required"]
            : []),
          ...(bufferRepair?.evidence ?? []),
        ]),
      ],
    },
  };
}

function runnerExactFundingRouteCandidates(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
  demand: ReturnType<typeof createRunnerCreditDemand>,
): {
  candidates: ActionSemanticCandidate[];
  demand: ReturnType<typeof createRunnerCreditDemand>;
  remainingClicks: number;
  evidence: string[];
} {
  const materializable = candidates.filter(
    runnerFundingRouteCandidateIsMaterializable,
  );
  const ordinary = materializable.filter(
    (candidate) => !runnerStrategicExchangeRequiresBoundParent(candidate),
  );
  const ordinaryFunding = {
    candidates: ordinary,
    demand,
    remainingClicks: request.remainingClicks,
    evidence: [] as string[],
  };
  if (request.allowStrategicExchange !== true) return ordinaryFunding;

  const routeCoversDemand = (
    routeCandidates: readonly ActionSemanticCandidate[],
  ): boolean => {
    const result = searchFundingRoutes({
      demand,
      candidates: routeCandidates,
      remainingClicks: request.remainingClicks,
      maxSteps: Math.max(1, request.remainingClicks),
      maxRoutes: 8,
      acceptRoute: (route) =>
        runnerFundingRouteConsumerBufferFits(input, candidates, request, route),
    });
    return (
      result.bestRoute.status === "covered_guaranteed" &&
      result.bestRoute.reliability === "guaranteed" &&
      result.bestRoute.horizon === "same_turn" &&
      result.bestRoute.projectedGap === 0
    );
  };
  if (routeCoversDemand(ordinary)) return ordinaryFunding;

  const parentBoundCandidates = materializable
    .filter((candidate) => {
      const kinds = runnerStrategicExchangeKinds(candidate);
      return (
        kinds.includes("self_damage") ||
        (kinds.includes("debt_financing") &&
          runnerDebtFinancingCandidateHasSafeBoundRunExit(
            input,
            candidate,
            request,
          ))
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
  for (const candidate of parentBoundCandidates) {
    if (!routeCoversDemand([...ordinary, candidate])) {
      ordinaryFunding.evidence.push(
        `runner_funding_consumer_buffer_budget_uncovered:${candidate.actionId}`,
      );
      continue;
    }
    return {
      candidates: [...ordinary, candidate],
      demand,
      remainingClicks: request.remainingClicks,
      evidence: ordinaryFunding.evidence,
    };
  }
  return ordinaryFunding;
}

function runnerFundingRouteConsumerBufferFits(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
  route: FundingRoute,
): boolean {
  if (request.requiredEndTurnHandBuffer !== undefined) {
    const floor = request.requiredEndTurnHandBuffer;
    if (!Number.isSafeInteger(floor) || floor < 0) return false;
    let hand = input.playerView.own.gripOrHq.length;
    for (const step of route.steps) {
      const candidate = candidates.find(
        (entry) => entry.actionId === step.actionId,
      );
      const delta = candidate?.economyProjection?.netHandDelta;
      if (
        step.kind !== "legal_action" ||
        step.ownTurnOffset !== 0 ||
        delta === undefined ||
        !Number.isSafeInteger(delta)
      )
        return false;
      hand += delta - runnerCandidateSelfDamageAmount(candidate!);
      if (hand < floor) return false;
    }
  }
  if (request.requireCompleteKnownPath) {
    const target = request.paymentWindowTarget;
    const runAction = input.legalActions.find(
      (action) => action.actionId === target?.actionId,
    );
    if (
      request.purpose !== "current_run" ||
      !request.sourcePlanId ||
      !target ||
      !runAction ||
      runAction.expiresAtStateVersion !== input.playerView.stateVersion ||
      route.reliability !== "guaranteed" ||
      route.horizon !== "same_turn" ||
      input.playerView.own.clicks - route.totalClickCost < 1 ||
      route.steps.some(
        (step) =>
          step.kind !== "legal_action" ||
          step.ownTurnOffset !== 0 ||
          !input.legalActions.some(
            (action) =>
              action.actionId === step.actionId &&
              action.expiresAtStateVersion === input.playerView.stateVersion,
          ),
      )
    )
      return false;
    // Only quote the resources of this admitted route. A blocked path's
    // first unpaid subroutine is a lower bound, never its complete price.
    const fundedInput: AiDecisionInput = {
      ...input,
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          credits: route.projectedGeneralCredits,
          clicks: input.playerView.own.clicks - route.totalClickCost,
        },
      },
    };
    const fundedTarget = evaluateRunnerRunTargets({
      input: fundedInput,
      deckCapabilities:
        createDeckCapabilitiesContext().deckCapabilitiesForInput(input),
    }).find((entry) => entry.actionId === target.actionId);
    if (
      fundedTarget?.pathPassability !== "reachable" ||
      fundedTarget.routeQuote?.reachability !== "guaranteed_access" ||
      fundedTarget.routeQuote.unknownIceCount !== 0 ||
      fundedTarget.routeQuote.fundingGap !== 0
    )
      return false;
  }
  if (request.purpose !== "current_run") return true;
  const repair = runnerFundingBufferRepair(input, candidates, request, route);
  return (
    repair !== undefined &&
    route.totalClickCost + repair.clickCost <= request.remainingClicks &&
    route.projectedGeneralCredits - repair.creditCost >= route.targetCredits
  );
}

/** Resource feasibility only. The existing hand owner performs later draws;
 * random damage and unknown drawn card identities are never simulated here. */
function runnerFundingBufferRepair(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
  route: FundingRoute,
): { clickCost: number; creditCost: number; evidence: string[] } | undefined {
  const fundingActions = route.steps
    .filter((step) => step.kind === "legal_action")
    .map((step) =>
      candidates.find((candidate) => candidate.actionId === step.actionId),
    );
  if (request.purpose !== "current_run")
    return { clickCost: 0, creditCost: 0, evidence: [] };

  const target = request.paymentWindowTarget;
  const requiredHandBuffer = target?.prerunReserveQuote?.requiredHandBuffer;
  if (
    !request.sourcePlanId ||
    !target ||
    !input.legalActions.some((action) => action.actionId === target.actionId) ||
    !Number.isSafeInteger(requiredHandBuffer) ||
    requiredHandBuffer === undefined ||
    requiredHandBuffer < 0 ||
    fundingActions.some((candidate) => !candidate)
  )
    return undefined;

  let handAfter = input.playerView.own.gripOrHq.length;
  let randomDamageOccurred = false;
  for (const candidate of fundingActions) {
    if (!candidate) return undefined;
    const projection = candidate.economyProjection;
    const netHandDelta = projection?.netHandDelta;
    const damage = runnerCandidateSelfDamageAmount(candidate);
    // A later grip source may have been randomly discarded. Such a sequence
    // cannot be guaranteed; already consumed sources before damage are safe.
    if (
      !Number.isSafeInteger(netHandDelta) ||
      netHandDelta === undefined ||
      !Number.isSafeInteger(damage) ||
      damage < 0 ||
      (randomDamageOccurred && (projection?.cardsConsumed ?? 0) > 0)
    )
      return undefined;
    handAfter += netHandDelta - damage;
    if (handAfter < 0) return undefined;
    randomDamageOccurred ||= damage > 0;
  }
  if (handAfter < 0) return undefined;
  const gap = Math.max(0, requiredHandBuffer - handAfter);
  if (gap === 0)
    return {
      clickCost: 0,
      creditCost: 0,
      evidence: [
        `runner_funding_consumer_hand_buffer_preserved:${handAfter}|required:${requiredHandBuffer}`,
      ],
    };
  const draw = input.legalActions.find(
    (action) =>
      action.side === "runner" &&
      action.type === "draw_card" &&
      action.source === "basic_action",
  );
  const projection = draw && runnerDrawProjectionFor(draw);
  if (!draw || !projection || projection.projectedNetHandDelta <= 0)
    return undefined;
  const draws = Math.ceil(gap / projection.projectedNetHandDelta);
  const drawClicks = draw.costs.reduce(
    (total, cost) => total + (cost.clicks ?? 0),
    0,
  );
  const drawCredits = draw.costs.reduce(
    (total, cost) => total + (cost.credits ?? 0),
    0,
  );
  const clickCost = draws * drawClicks;
  const creditCost =
    draws *
    (drawCredits +
      projection.projectedGrossDrawCount *
        projection.visibleDrawTaxSourceCount);
  if (
    !Number.isSafeInteger(drawClicks) ||
    drawClicks <= 0 ||
    !Number.isSafeInteger(drawCredits) ||
    drawCredits < 0 ||
    clickCost > request.remainingClicks ||
    draws * projection.projectedGrossDrawCount >
      input.playerView.own.stackOrRdCount
  )
    return undefined;
  return {
    clickCost,
    creditCost,
    evidence: [
      `runner_funding_consumer_hand_after_funding:${handAfter}|required:${requiredHandBuffer}`,
      `runner_funding_consumer_buffer_repair_reserved:${draws}|clicks:${clickCost}|credits:${creditCost}|action:${draw.actionId}`,
    ],
  };
}

function runnerDebtFinancingCandidateHasSafeBoundRunExit(
  input: AiDecisionInput,
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
  if (
    typeof netGain !== "number" ||
    !Number.isFinite(netGain) ||
    parent.creditsAfterRun + netGain < profile.leavePlayPayCost
  )
    return false;
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const source = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === action?.source,
  );
  if (
    !action ||
    !source ||
    source.definitionId !== candidate.sourceDefinitionId
  )
    return false;

  // An unfunded path can stop at its first unaffordable subroutine. Its
  // remaining balance therefore cannot certify the debt's exit reserve.
  // Requote this exact consumer with the guaranteed funding and hand cost;
  // this is prospective assessment only, never a replacement LegalAction.
  const funded = assessRunnerRunAfterGuaranteedFunding({
    input,
    deckCapabilities:
      createDeckCapabilitiesContext().deckCapabilitiesForInput(input),
    fundingCandidate: candidate,
    runActionId: parent.runActionId,
    targetServerId: parent.targetServerId,
  });
  if (!funded) return false;
  const fundedTarget = funded.target;
  return (
    !runnerCriticalDamageContestBlocked(funded.input, fundedTarget) &&
    (runnerRunTargetIsDirectlyConvertible({
      target: fundedTarget,
      economy: { minimumCreditFloor: profile.leavePlayPayCost },
      requiredPostRunReserve: profile.leavePlayPayCost,
    }) ||
      runnerTerminalRemoteContestIsDirectlyMandatory(
        funded.input,
        fundedTarget,
      )) &&
    fundedTarget.pathPassability === "reachable" &&
    fundedTarget.prerunReserveQuote?.status !== "blocked" &&
    fundedTarget.creditsAfterRun >= profile.leavePlayPayCost
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
