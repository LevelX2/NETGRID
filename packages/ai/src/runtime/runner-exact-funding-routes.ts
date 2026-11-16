import { type AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { runnerDrawProjectionFor } from "../actions/action-economy-projection";
import { createRunnerCreditDemand } from "../plans/credit-demand";
import {
  searchFundingRoutes,
  type FundingRoute,
  type PaymentWindowFundingSetup,
} from "../plans/funding-route";
import { runnerFundingPaymentWindowQuote } from "./runner-funding-payment-window-quote";
import { runnerFundingRouteCandidateIsMaterializable } from "../plans/runner-funding-candidates";
import type { RunnerFundingRouteAssessment } from "../plans/runner-funding-contracts";
import type { RunnerExactFundingRouteRequest } from "../plans/runner-funding-service-contract";
import { runnerReserveHandPreparation } from "./runner-reserve-hand-preparation";
import { runnerPaymentInstallSetups } from "../plans/runner-payment-install-planning";
import { quoteRunnerRunTarget } from "../runner-run-target-evaluation";
import {
  runnerCriticalDamageContestBlocked,
  runnerTerminalRemoteContestIsDirectlyMandatory,
  runnerTerminalRemoteContestVisibleHazardFundingGap,
} from "../runner/remote-contest/remote-contest-admission";
import { runnerRunTargetIsDirectlyConvertible } from "./runner-run-funding-admission";
import { createDeckCapabilitiesContext } from "./deck-capabilities-context";
import { runnerDebtFinancingProfile } from "./runner-canonical-card-facts";
import {
  advanceRunnerFundingCardBudget,
  compareRunnerFundingHandQuotes,
  runnerFundingHandQuote,
  type RunnerFundingCardBudget,
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
  const reserveDevelopment =
    request.reserveDevelopment !== undefined &&
    request.purpose === "phase_reserve" &&
    request.priority === "phase_reserve" &&
    request.deadline === "end_of_current_turn";
  const targetCredits = request.allowIncrementalProgress
    ? Math.min(
        request.targetCredits,
        input.playerView.own.credits +
          (reserveDevelopment ? request.remainingClicks : 1),
      )
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
      runnerFundingRouteConsumerBufferFits(
        input,
        candidates,
        request,
        route,
        paymentSetups,
      ),
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
  const preparedReserve = reserveDevelopment
    ? runnerReserveHandPreparation(input, candidates, request, targetCredits)
    : undefined;
  if (preparedReserve) return preparedReserve;
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
        runnerFundingRouteConsumerBufferFits(
          input,
          candidates,
          request,
          route,
          [],
        ),
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
          runnerDebtFinancingCandidateHasBoundRunSource(
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
    if (
      request.purpose === "current_run" &&
      request.paymentWindowTarget &&
      !runnerFundingCandidatePreservesConsumerSource(
        input,
        candidate,
        request.paymentWindowTarget.actionId,
      )
    ) {
      ordinaryFunding.evidence.push(
        `runner_funding_consumer_grip_source_not_preserved:${candidate.actionId}|consumer:${request.paymentWindowTarget.actionId}`,
      );
      continue;
    }
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
  paymentSetups: readonly PaymentWindowFundingSetup[],
): boolean {
  const payment = runnerFundingPaymentWindowQuote(route, paymentSetups);
  if (!payment) return false;
  const debts = route.steps.flatMap((step) => {
    const candidate = candidates.find(
      (entry) => entry.actionId === step.actionId,
    );
    return candidate &&
      runnerStrategicExchangeKinds(candidate).includes("debt_financing")
      ? [candidate]
      : [];
  });
  if (
    debts.some(
      (candidate) =>
        !runnerDebtFinancingCandidateHasBoundRunSource(
          input,
          candidate,
          request,
        ),
    )
  )
    return false;
  if (request.requiredEndTurnHandBuffer !== undefined) {
    const floor = request.requiredEndTurnHandBuffer;
    if (!Number.isSafeInteger(floor) || floor < 0) return false;
    let budget: RunnerFundingCardBudget = {
      hand: input.playerView.own.gripOrHq.length,
      stack: input.playerView.own.stackOrRdCount,
    };
    for (const step of route.steps) {
      if (step.kind === "future_projection") continue;
      const candidate = candidates.find(
        (entry) => entry.actionId === step.actionId,
      );
      if (step.ownTurnOffset !== 0 || !candidate?.economyProjection)
        return false;
      const next = advanceRunnerFundingCardBudget(
        budget,
        candidate.economyProjection,
        runnerCandidateSelfDamageAmount(candidate),
      );
      if (!next || next.hand < floor) return false;
      budget = next;
    }
  }
  if (
    request.requireCompleteKnownPath ||
    request.acceptFundedRun ||
    debts.length > 0
  ) {
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
          step.ownTurnOffset !== 0 ||
          (step.kind === "legal_action" &&
            !input.legalActions.some(
              (action) =>
                action.actionId === step.actionId &&
                action.expiresAtStateVersion === input.playerView.stateVersion,
            )),
      )
    )
      return false;
    // Only quote the resources of this admitted route. A blocked path's
    // first unpaid subroutine is a lower bound, never its complete price.
    const consumedSources = new Set(
      route.steps.flatMap((step) => {
        const candidate = candidates.find(
          (entry) => entry.actionId === step.actionId,
        );
        const action = input.legalActions.find(
          (entry) => entry.actionId === step.actionId,
        );
        return candidate?.economyProjection?.cardsConsumed === 1 && action
          ? [action.source]
          : [];
      }),
    );
    const cardBudget = runnerFundingProjectedCardBudget(
      input,
      candidates,
      route,
      target.actionId,
    );
    if (!cardBudget) return false;
    const fundedInput: AiDecisionInput = {
      ...input,
      playerView: {
        ...input.playerView,
        own: {
          ...input.playerView.own,
          // The exact compiled payment becomes liquid only inside this run.
          credits: route.projectedGeneralCredits + payment.creditGain,
          clicks: input.playerView.own.clicks - route.totalClickCost,
          stackOrRdCount: cardBudget.stack,
          gripOrHq: input.playerView.own.gripOrHq.filter(
            (card) =>
              !payment.installedCardIds.includes(card.instanceId) &&
              !consumedSources.has(card.instanceId),
          ),
        },
      },
    };
    const fundedTarget = quoteRunnerRunTarget({
      input: fundedInput,
      deckCapabilities:
        createDeckCapabilitiesContext().deckCapabilitiesForInput(input),
      quotedRunnerGripCount: cardBudget.hand,
      runActionId: target.actionId,
      targetServerId: target.targetServerId,
    })?.target;
    if (
      !fundedTarget ||
      debts.some(
        (candidate) =>
          !runnerDebtFinancingRouteHasSafeRunExit(
            fundedInput,
            fundedTarget,
            candidate,
          ),
      ) ||
      (request.acceptFundedRun &&
        !request.acceptFundedRun(fundedInput, fundedTarget)) ||
      (request.requireCompleteKnownPath &&
        ((fundedTarget.pathPassability !== "reachable" &&
          !runnerTerminalRemoteContestIsDirectlyMandatory(
            fundedInput,
            fundedTarget,
          )) ||
          fundedTarget.routeQuote?.reachability !== "guaranteed_access" ||
          fundedTarget.routeQuote.unknownIceCount !== 0 ||
          fundedTarget.routeQuote.fundingGap !== 0 ||
          fundedTarget.visibleTraceTagHazardUnavoidable === true ||
          (fundedTarget.unavoidableVisibleIceHazardCount ?? 0) > 0))
    )
      return false;
  }
  if (request.purpose !== "current_run") return true;
  const repair = runnerFundingBufferRepair(input, candidates, request, route);
  return (
    repair !== undefined &&
    route.totalClickCost + repair.clickCost <= request.remainingClicks &&
    route.projectedGeneralCredits >= repair.creditCost &&
    route.projectedGeneralCredits + payment.creditGain - repair.creditCost >=
      route.targetCredits
  );
}

/** Resource feasibility only. The existing hand owner performs later draws;
 * random damage and unknown drawn card identities are never simulated here. */
function runnerFundingProjectedCardBudget(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  route: FundingRoute,
  consumerActionId: string,
): RunnerFundingCardBudget | undefined {
  const fundingActions = route.steps
    .filter((step) => step.kind === "legal_action")
    .map((step) =>
      candidates.find((candidate) => candidate.actionId === step.actionId),
    );
  let budget: RunnerFundingCardBudget = {
    hand: input.playerView.own.gripOrHq.length,
    stack: input.playerView.own.stackOrRdCount,
  };
  let randomDamageOccurred = false;
  for (const candidate of fundingActions) {
    if (!candidate) return undefined;
    const projection = candidate.economyProjection;
    const damage = runnerCandidateSelfDamageAmount(candidate);
    // A later grip source may have been randomly discarded. Such a sequence
    // cannot be guaranteed; already consumed sources before damage are safe.
    if (!projection || (randomDamageOccurred && projection.cardsConsumed > 0))
      return undefined;
    // Funding guarantees the exact consumer, not just its numerical hand
    // buffer. Random damage cannot retain a named grip source, and a known
    // consumed source cannot be drawn back by a later unknown draw.
    if (
      !runnerFundingCandidatePreservesConsumerSource(
        input,
        candidate,
        consumerActionId,
      )
    )
      return undefined;
    const next = advanceRunnerFundingCardBudget(budget, projection, damage);
    if (!next) return undefined;
    budget = next;
    randomDamageOccurred ||= damage > 0;
  }
  return budget;
}

/** Resource feasibility of the exact current consumer, without choosing a
 * different run or assigning known identities to random surviving cards. */
function runnerFundingCandidatePreservesConsumerSource(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  consumerActionId: string,
): boolean {
  const consumer = input.legalActions.find(
    (action) => action.actionId === consumerActionId,
  );
  const gripSource = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === consumer?.source,
  );
  if (!gripSource) return true;
  const funding = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  return (
    runnerCandidateSelfDamageAmount(candidate) === 0 &&
    !(
      (candidate.economyProjection?.cardsConsumed ?? 0) > 0 &&
      funding?.source === gripSource.instanceId
    )
  );
}

function runnerFundingBufferRepair(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  request: RunnerExactFundingRouteRequest,
  route: FundingRoute,
): { clickCost: number; creditCost: number; evidence: string[] } | undefined {
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
    requiredHandBuffer < 0
  )
    return undefined;

  const cardBudget = runnerFundingProjectedCardBudget(
    input,
    candidates,
    route,
    target.actionId,
  );
  if (!cardBudget) return undefined;
  const gap = Math.max(0, requiredHandBuffer - cardBudget.hand);
  if (gap === 0)
    return {
      clickCost: 0,
      creditCost: 0,
      evidence: [
        `runner_funding_consumer_hand_buffer_preserved:${cardBudget.hand}|required:${requiredHandBuffer}`,
      ],
    };
  const draw = input.legalActions.find(
    (action) =>
      action.side === "runner" &&
      action.type === "draw_card" &&
      action.source === "basic_action" &&
      action.timingPoint === input.playerView.timingPoint &&
      action.expiresAtStateVersion === input.playerView.stateVersion,
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
    draws * projection.projectedGrossDrawCount > cardBudget.stack
  )
    return undefined;
  return {
    clickCost,
    creditCost,
    evidence: [
      `runner_funding_consumer_hand_after_funding:${cardBudget.hand}|required:${requiredHandBuffer}`,
      `runner_funding_consumer_buffer_repair_reserved:${draws}|clicks:${clickCost}|credits:${creditCost}|action:${draw.actionId}`,
    ],
  };
}

function runnerDebtFinancingCandidateHasBoundRunSource(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  request: RunnerExactFundingRouteRequest,
): boolean {
  const parent = request.debtFinancingParent;
  const profile = runnerDebtFinancingProfile(candidate.sourceDefinitionId);
  const projection = candidate.economyProjection;
  const terminalHazardFundingGap = request.paymentWindowTarget
    ? runnerTerminalRemoteContestVisibleHazardFundingGap(
        input,
        request.paymentWindowTarget,
      )
    : undefined;
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
        (parent.pathPassability === "blocked_unpayable" ||
          terminalHazardFundingGap !== undefined) &&
        parent.scoreThreat &&
        request.priority === "acute_hard_plan_blocker"
      )) ||
    (!parent.scoreThreat &&
      parent.accessPayoff !== "agenda" &&
      parent.accessPayoff !== "score_threat") ||
    parent.remainingClicksAfterRun < 0
  ) {
    return false;
  }
  const netGain = projection.netLiquidCreditGain;
  if (typeof netGain !== "number" || !Number.isFinite(netGain) || netGain <= 0)
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

  return (
    request.paymentWindowTarget?.actionId === parent.runActionId &&
    request.paymentWindowTarget.targetServerId === parent.targetServerId
  );
}

/** The exit belongs to the complete funding route, not to each income source
 * in isolation. The consumer quote includes all guaranteed costs and gains. */
function runnerDebtFinancingRouteHasSafeRunExit(
  fundedInput: AiDecisionInput,
  fundedTarget: RunnerRunTargetEvaluation,
  candidate: ActionSemanticCandidate,
): boolean {
  const profile = runnerDebtFinancingProfile(candidate.sourceDefinitionId);
  if (!profile) return false;
  const unknownIceCount = fundedTarget.routeQuote?.unknownIceCount;
  if (
    unknownIceCount === undefined ||
    !Number.isSafeInteger(unknownIceCount) ||
    unknownIceCount < 0
  )
    return false;
  if (
    unknownIceCount > 0 &&
    fundedTarget.prerunReserveQuote?.visibleCoverage !== "stable_universal" &&
    fundedTarget.prerunReserveQuote?.visibleCoverage !== "risky_universal"
  )
    return false;
  const mandatoryCompleteContest =
    runnerTerminalRemoteContestIsDirectlyMandatory(fundedInput, fundedTarget) &&
    fundedTarget.routeQuote?.reachability === "guaranteed_access" &&
    fundedTarget.routeQuote.fundingGap === 0 &&
    fundedTarget.routeQuote.unknownIceCount === 0;
  // A fully quoted last-chance contest may consume the repayment reserve:
  // preserving future debt cash cannot justify conceding the current game.
  // Every other route still has to retain the complete leave-play payment.
  const requiredExitReserve = mandatoryCompleteContest
    ? 0
    : profile.leavePlayPayCost;
  return (
    !runnerCriticalDamageContestBlocked(fundedInput, fundedTarget) &&
    (runnerRunTargetIsDirectlyConvertible({
      target: fundedTarget,
      economy: { minimumCreditFloor: requiredExitReserve },
      requiredPostRunReserve: requiredExitReserve,
    }) ||
      mandatoryCompleteContest) &&
    fundedTarget.pathPassability === "reachable" &&
    fundedTarget.prerunReserveQuote?.status !== "blocked" &&
    fundedTarget.creditsAfterRun >= requiredExitReserve
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
