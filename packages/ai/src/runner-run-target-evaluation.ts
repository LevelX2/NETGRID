import {
  type AiDecisionInput,
  type LegalAction,
  type PublicGameEvent,
  type VisibleCard,
} from "@netgrid/shared";
import {
  reconstructBeliefState,
  type BeliefState,
  type RunnerOpponentModel,
} from "./belief-state";
import {
  evaluateKnownCentralAccessPayoff,
  type KnownCentralAccessPayoff,
} from "./known-central-access-payoff";
import {
  evaluateKnownRemoteAccessPayoff,
  type KnownRemoteAccessPayoff,
} from "./known-remote-access-payoff";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import {
  deriveObservedRemoteNoProgressAccessMemory,
  type AccessOutcomeMemoryStatus,
} from "./access/access-outcome-memory";
import type { RankedKnownRemoteAccessCandidate } from "./access/access-target-ranking";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import { createAiHintsByCard, type AiCardHint } from "./ai-hints";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
  type VisibleIceRunHazard,
} from "./visible-run-analysis";
import { buildRunnerEconomyPosture } from "./runner-economy-posture";
import {
  assessRandomBreakOrDamageRiskForRunAction,
  randomBreakOrDamageRiskCanCarryRunPath,
  randomBreakOrDamageRiskScorePenalty,
  randomBreakOrDamageRiskShouldAvoidRun,
} from "./actions/risk-action-projection";
import {
  projectInternalRunnerRunActions,
  publicRunActionProjection,
  type InternalRunActionProjection,
} from "./actions/run-action-projection";
import {
  RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION,
  RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION,
  RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION,
  type RandomBreakOrDamageRiskAssessment,
  type EvaluateRunnerRunTargetsParams,
  type RunActionProjection,
  type RunnerAccessPayoff,
  type RunnerRandomBreakRecoveryAssessment,
  type RunnerCreditBaseHandCandidate,
  type RunnerCreditBasePlan,
  type RunnerCreditBasePlanRecommendation,
  type RunnerCreditReservePhase,
  type RunnerCreditReservePolicy,
  type RunnerEconomyPosture,
  type RunnerEconomyRoute,
  type RunnerEconomyTransitionAssessment,
  type RunnerInstalledRunPayoff,
  type RunnerKnownAccessState,
  type RunnerPathPassability,
  type RunnerPrerunReserveQuote,
  type RunnerRemoteScoreThreat,
  type RunnerRunActionSourceKind,
  type RunnerRunActionStructure,
  type RunnerRunTargetEvaluation,
  type RunnerRunTargetFundingNeed,
  type RunnerRunTargetKind,
  type RunnerRunTargetRecommendation,
} from "./run-analysis/runner-run-target-types";
import { quoteRunnerRunRoute } from "./run-analysis/runner-run-route-quote";
import { quoteRunnerRunRiskReserve } from "./run-analysis/runner-run-risk-reserve";
import { quoteRunnerConsumableRunOpportunity } from "./run-analysis/runner-consumable-run-opportunity";
import { runnerVisibleLethalIceDamageAssessment } from "./runner-damage-threat-assessment";

export * from "./run-analysis/runner-run-target-types";

const INSTALLED_RUN_PAYOFF_SCORE_CAP = 180;
/** Strategic installed-card payoff metadata; never used for run rules. */
const AI_HINTS_BY_CARD = createAiHintsByCard();
export {
  DEFAULT_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE,
  assessRandomBreakOrDamageRiskForRunAction,
  randomBreakOrDamageRiskScorePenalty,
  randomBreakOrDamageRiskShouldAvoidRun,
  buildRandomBreakOrDamageRiskAssessment,
  randomBreakOrDamageRiskProfileForDefinitionId,
  runnerRandomBreakRecoveryAssessment,
} from "./actions/risk-action-projection";
export type { RandomBreakOrDamageRiskProfile } from "./actions/risk-action-projection";

export { buildRunnerEconomyPosture } from "./runner-economy-posture";

export function evaluateRunnerRunTargets(
  params: EvaluateRunnerRunTargetsParams,
): RunnerRunTargetEvaluation[] {
  const economyPosture = buildRunnerEconomyPosture(params);
  const beliefState =
    params.beliefState ?? reconstructBeliefState(params.input);
  const unrezzedIceRiskModel =
    beliefState.runnerOpponentModel?.unrezzedIceRiskModel ?? [];
  return projectInternalRunnerRunActions(params)
    .filter(
      (projection) =>
        projection.projectionStatus === "concrete_target" &&
        projection.targetServerId !== undefined,
    )
    .map((projection) =>
      evaluateRunnerRunTarget(
        params,
        projection,
        economyPosture,
        unrezzedIceRiskModel,
      ),
    )
    .filter(
      (evaluation): evaluation is RunnerRunTargetEvaluation =>
        evaluation !== undefined,
    )
    .sort(
      (left, right) =>
        recommendationRank(right.recommendation) -
          recommendationRank(left.recommendation) ||
        right.score - left.score ||
        left.targetServerId.localeCompare(right.targetServerId) ||
        left.actionId.localeCompare(right.actionId),
    );
}

export { projectRunnerRunActions } from "./actions/run-action-projection";

function evaluateRunnerRunTarget(
  params: EvaluateRunnerRunTargetsParams,
  projection: InternalRunActionProjection,
  economyPosture: RunnerEconomyPosture,
  unrezzedIceRiskModel: RunnerOpponentModel["unrezzedIceRiskModel"],
): RunnerRunTargetEvaluation | undefined {
  const targetServerId = projection.targetServerId;
  if (!targetServerId) return undefined;
  const targetKind = targetKindForServerId(targetServerId);
  if (!targetKind) return undefined;
  const accessServerId = projection.accessServerId ?? targetServerId;
  const accessTargetKind = targetKindForServerId(accessServerId);
  if (!accessTargetKind) return undefined;
  const server = params.input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const accessServer = params.input.playerView.servers.find(
    (candidate) => candidate.id === accessServerId,
  );
  const actionCreditCost = projection.action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.credits ?? 0),
    0,
  );
  const actionClickCost = projection.action.costs.reduce(
    (sum, cost) => sum + Math.max(0, cost.clicks ?? 0),
    0,
  );
  const creditsAfterAction = Math.max(
    0,
    params.input.playerView.own.credits - actionCreditCost,
  );
  const temporaryRunCredits = Math.max(0, projection.temporaryRunCredits ?? 0);
  const badPublicityRunCredits = Math.max(
    0,
    params.input.playerView.own.availableBadPublicityRunCredits ?? 0,
  );
  const runOnlyCredits = temporaryRunCredits + badPublicityRunCredits;
  const creditsAvailableDuringRun = creditsAfterAction + runOnlyCredits;
  const visibleServerIce = server?.ice ?? [];
  const serverIceForVisibleRezProjection = projection.bypassFirstIce
    ? visibleServerIce.slice(0, -1)
    : visibleServerIce;
  const projectedServerIce = serverIceForVisibleRezProjection;
  const bypassedFirstIce =
    projection.bypassFirstIce && visibleServerIce.length > 0;
  const stealthCreditsBlocked =
    server?.statuses?.some(
      (status) =>
        status.kind === "run_payment_restriction" &&
        status.restriction === "runner_stealth_bit_payment_sources",
    ) === true;
  const path = assessKnownRezzedIcePath(
    projectedServerIce,
    params.input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      creditsAvailableDuringRun,
      params.input.playerView.own.rig ?? [],
      { excludeStealthCredits: stealthCreditsBlocked },
    ),
    server?.root ?? [],
    params.input.playerView.opponent.credits,
    {
      visibleRemoteServerCount: params.input.playerView.servers.filter(
        (candidate) => candidate.id.startsWith("remote_"),
      ).length,
      visibleCorpCredits: params.input.playerView.opponent.credits,
      netOrCoreDamagePreventionRemaining: Math.max(
        0,
        params.input.playerView.own.freeNetOrCoreDamagePreventionRemaining ?? 0,
      ),
      runDamagePreventionRemaining: Math.max(
        0,
        projection.damagePreventionPool ?? 0,
      ),
      prohibitNoisyIcebreakers: projection.noNoisyBreakers,
      availableRunnerClicks: Math.max(
        0,
        params.input.playerView.own.clicks - actionClickCost,
      ),
      ...(params.input.playerView.own.runnerTraceSupportQuote
        ? {
            runnerTraceSupportQuote:
              params.input.playerView.own.runnerTraceSupportQuote,
          }
        : {}),
      ...(stealthCreditsBlocked ? { excludeStealthTraceCredits: true } : {}),
      ...(projection.runTraceLinkBonus !== undefined
        ? { runTraceLinkBonus: projection.runTraceLinkBonus }
        : {}),
    },
  );
  const visibleLethalIceDamage = runnerVisibleLethalIceDamageAssessment(
    params.input,
    projectedServerIce,
    {
      generalCredits: creditsAvailableDuringRun,
      runDamagePreventionRemaining: Math.max(
        0,
        projection.damagePreventionPool ?? 0,
      ),
    },
  );
  const payoff =
    accessReplacementPayoffForTarget(
      params,
      projection,
      accessServerId,
      accessTargetKind,
    ) ?? payoffForTarget(params, accessServerId, accessTargetKind);
  const installedRunPayoff = installedRunPayoffForTarget(
    params.input,
    accessTargetKind,
  );
  const runActionPayoff = runActionPayoffForTarget(
    projection,
    accessTargetKind,
    bypassedFirstIce,
  );
  const combinedRunPayoff = combineRunPayoffs(
    installedRunPayoff,
    runActionPayoff,
  );
  const scoreThreat =
    accessTargetKind === "remote" && remoteHasScoreThreat(accessServer);
  const accessPayoff = accessPayoffWithInstalledRunPayoff({
    basePayoff: payoff.accessPayoff,
    knownAccessState: payoff.knownAccessState,
    accessNoveltyRatio: payoff.accessNoveltyRatio,
    installedRunPayoff: combinedRunPayoff,
    scoreThreat,
  });
  const rankedAccessTarget = rankedAccessTargetForServer(
    params.rankedAccessTargets,
    accessServerId,
  );
  const accessOutcomeMemory =
    params.accessOutcomeMemory ??
    deriveObservedRemoteNoProgressAccessMemory(params.input, accessServerId);
  const randomBreakOrDamageRiskAssessment =
    assessRandomBreakOrDamageRiskForRunAction(params.input, projection.action, {
      accessPayoff,
      scoreThreat,
    });
  const riskyUniversalCoverage =
    hasRiskyUniversalPressure(params) && (server?.ice.length ?? 0) > 0;
  const basePathPassability = pathPassabilityFor(path);
  const spendLimitBlocksPath =
    projection.spendLimit !== undefined &&
    (path.visibleBreakCost ?? 0) > projection.spendLimit;
  const probabilisticUniversalPathReachable = Boolean(
    randomBreakOrDamageRiskCanCarryRunPath(randomBreakOrDamageRiskAssessment),
  );
  let pathPassability = randomBreakOrDamageRiskAssessment?.blockedByHandBuffer
    ? "blocked_by_random_break_damage_hand_buffer"
    : probabilisticUniversalPathReachable
      ? "reachable"
      : spendLimitBlocksPath
        ? "blocked_unpayable"
        : basePathPassability;
  if (visibleLethalIceDamage) pathPassability = "blocked_unbreakable";
  const creditsAfterRun = generalCreditsRemainingAfterRun(
    creditsAfterAction,
    runOnlyCredits,
    path.creditsAfterPath,
  );
  const unknownUnrezzedIceCount = projectedServerIce.filter(
    (card) => card.rezzed !== true && card.known === false,
  ).length;
  const unknownUnrezzedIcePositions = projectedServerIce.flatMap(
    (card, index) =>
      card.rezzed !== true && card.known === false ? [index] : [],
  );
  const visibleDuringRunRezSupport =
    server?.statuses?.some(
      (status) => status.kind === "during_run_ice_rez_support",
    ) === true;
  const baseRouteQuote = quoteRunnerRunRoute({
    path,
    availableCredits: creditsAvailableDuringRun,
    unknownIceCount: unknownUnrezzedIceCount,
    runnerGripCount: params.input.playerView.own.gripOrHq.length,
  });
  const { noAccessReason: _noAccessReason, ...conditionalBaseRouteQuote } =
    baseRouteQuote;
  const routeQuote =
    probabilisticUniversalPathReachable &&
    baseRouteQuote.reachability === "no_access"
      ? {
          ...conditionalBaseRouteQuote,
          reachability: "conditional_access" as const,
          conditionalReasons: ["probabilistic_breaker_route"],
          evidence: [
            ...baseRouteQuote.evidence,
            "route_reachability:conditional_access",
            "route_conditional:probabilistic_breaker_route",
          ],
        }
      : baseRouteQuote;
  if (
    pathPassability === "reachable" &&
    routeQuote.reachability === "guaranteed_access" &&
    (routeQuote.fundingGap > 0 || creditsAfterRun < 0)
  ) {
    pathPassability = "blocked_unpayable";
  }
  const runCommitment =
    unknownUnrezzedIceCount > 0 ? "probe_only" : "full_path";
  const unrezzedIceRisk =
    unrezzedIceRiskModel.find((entry) => entry.serverId === targetServerId)
      ?.risk ?? 0;
  const corpCanRezUnknownIce =
    params.input.playerView.opponent.credits > 0 || visibleDuringRunRezSupport;
  const unrezzedIceRiskCreditBuffer =
    unknownUnrezzedIceCount > 0 && corpCanRezUnknownIce
      ? Math.max(1, Math.ceil(unrezzedIceRisk * 4))
      : 0;
  if (
    pathPassability === "reachable" &&
    unknownUnrezzedIceCount > 0 &&
    visibleDuringRunRezSupport &&
    params.input.playerView.opponent.credits > 0 &&
    creditsAvailableDuringRun <= 0
  ) {
    pathPassability = "blocked_unpayable";
  }
  const multiaccessAvailable = combinedRunPayoff.multiaccessAvailable;
  const stealOrTrashAffordable = stealOrTrashAffordableFor(
    accessPayoff,
    payoff.accessPayoffContestable,
  );
  const unproductiveVisibleRunPath =
    runnerRunTargetPathIsUnproductive(path) &&
    !probabilisticUniversalPathReachable;
  const visibleTraceEndRunLockUnavoidable =
    path.knownPathBlockedByUnavoidableTraceRunLock === true;
  const visibleIceHazardPenalty = path.visibleIceHazardPenalty ?? 0;
  const visibleIceHazardAvoidanceCost = path.visibleIceHazardAvoidanceCost ?? 0;
  const creditsAfterAvoidingVisibleIceHazards =
    path.creditsAfterAvoidingVisibleIceHazards !== undefined
      ? generalCreditsRemainingAfterRun(
          creditsAfterAction,
          runOnlyCredits,
          path.creditsAfterAvoidingVisibleIceHazards,
        )
      : creditsAfterRun;
  const expectedTagsFromVisibleIce = path.expectedTagsFromVisibleIce ?? 0;
  const unavoidableVisibleIceHazardCount =
    path.unavoidableVisibleIceHazardCount ?? 0;
  const visibleTraceTagHazardUnavoidable =
    path.visibleTraceTagHazardUnavoidable === true;
  const futureClicksLost = path.futureClicksLost ?? 0;
  const runnerMatchpointCentralAccess =
    (accessTargetKind === "rd" || accessTargetKind === "hq") &&
    payoff.knownAccessState !== "known_no_current_payoff" &&
    params.input.playerView.own.agendaPoints >=
      params.input.playerView.agendaPointsToWin - 2;
  const prerunReserveQuote = quoteRunnerPrerunReserve({
    input: params.input,
    deckCapabilities: params.deckCapabilities,
    projection,
    accessPayoff,
    scoreThreat,
    multiaccessAvailable,
    runnerMatchpointCentralAccess,
    knownPathCost: routeQuote.guaranteedKnownCost,
    creditsAfterKnownPath: creditsAfterRun,
    unknownIceCount: unknownUnrezzedIceCount,
    unknownIcePositions: unknownUnrezzedIcePositions,
    unrezzedIceRiskCreditBuffer,
    riskyUniversalCoverage,
    visibleDuringRunRezSupport,
  });
  const unrezzedIceRiskUnderfunded = prerunReserveQuote.creditGap > 0;
  const targetFundingNeed = runnerRunTargetFundingNeed({
    routeQuote,
    creditsAfterRun,
    economyPosture,
  });
  const recommendation = recommendationForRunTarget({
    targetKind: accessTargetKind,
    accessPayoff,
    ...(payoff.accessPayoffContestable !== undefined
      ? { accessPayoffContestable: payoff.accessPayoffContestable }
      : {}),
    ...(payoff.knownAccessDamageSurvivable !== undefined
      ? {
          knownAccessDamageSurvivable: payoff.knownAccessDamageSurvivable,
        }
      : {}),
    knownAccessState: payoff.knownAccessState,
    accessNoveltyRatio: payoff.accessNoveltyRatio,
    pathPassability,
    creditsAfterRun,
    economyPosture,
    installedRunPayoff: combinedRunPayoff,
    scoreThreat,
    unproductiveVisibleRunPath,
    visibleIceHazardPenalty,
    futureClicksLost,
    visibleIceHazardAvoidanceCost,
    creditsAfterAvoidingVisibleIceHazards,
    expectedTagsFromVisibleIce,
    unavoidableVisibleIceHazardCount,
    visibleTraceTagHazardUnavoidable,
    ...(futureClicksLost > 0 ? { futureClicksLost } : {}),
    runnerMatchpointCentralAccess,
    routeQuote,
    targetFundingNeed,
    unrezzedIceRiskUnderfunded,
    prerunReserveQuote,
    ...(accessOutcomeMemory ? { accessOutcomeMemory } : {}),
    ...(rankedAccessTarget ? { rankedAccessTarget } : {}),
    ...(randomBreakOrDamageRiskAssessment
      ? { randomBreakOrDamageRiskAssessment }
      : {}),
  });
  const rawRouteScore = scoreRunTargetEvaluation({
    targetKind: accessTargetKind,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    pathPassability,
    creditsAfterRun,
    economyPosture,
    scoreThreat,
    recommendation,
    multiaccessAvailable,
    installedRunPayoffScore: combinedRunPayoff.scoreBonus,
    installedImmediateAccessValue: combinedRunPayoff.immediateAccessValue,
    accessNoveltyRatio: payoff.accessNoveltyRatio,
    accessPayoffScoreAdjustment: payoff.scoreAdjustment,
    visibleIceHazardPenalty,
    futureClicksLost,
    ...(accessOutcomeMemory ? { accessOutcomeMemory } : {}),
    ...(randomBreakOrDamageRiskAssessment
      ? { randomBreakOrDamageRiskAssessment }
      : {}),
  });
  const consumableRunOpportunityQuote = quoteRunnerConsumableRunOpportunity({
    input: params.input,
    projection,
    bypassedFirstIce,
    accessPayoff,
    scoreThreat,
    multiaccessAvailable,
    runnerMatchpointCentralAccess,
    rawRouteScore,
  });
  const score =
    consumableRunOpportunityQuote?.effectiveRouteScore ?? rawRouteScore;
  const publicProjection = publicRunActionProjection(projection);
  return {
    schemaVersion: RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION,
    targetServerId,
    targetKind,
    accessServerId,
    accessTargetKind,
    actionId: projection.actionId,
    accessPayoff,
    ...(payoff.accessPayoffContestable !== undefined
      ? { accessPayoffContestable: payoff.accessPayoffContestable }
      : {}),
    knownAccessState: payoff.knownAccessState,
    accessNoveltyRatio: payoff.accessNoveltyRatio,
    multiaccessAvailable,
    pathPassability,
    pathCost: routeQuote.guaranteedKnownCost,
    ...(futureClicksLost > 0 ? { futureClicksLost } : {}),
    routeQuote,
    creditsAfterRun,
    runCommitment,
    unknownUnrezzedIceCount,
    unrezzedIceRisk,
    unrezzedIceRiskCreditBuffer,
    unrezzedIceRiskUnderfunded,
    visibleDuringRunRezSupport,
    prerunReserveQuote,
    fundingNeed: targetFundingNeed,
    ...(path.visibleIceRunHazards?.length
      ? { visibleIceRunHazards: path.visibleIceRunHazards }
      : {}),
    visibleIceHazardPenalty,
    visibleIceHazardAvoidanceCost,
    creditsAfterAvoidingVisibleIceHazards,
    expectedTagsFromVisibleIce,
    unavoidableVisibleIceHazardCount,
    visibleTraceTagHazardUnavoidable,
    stealOrTrashAffordable,
    installedRunPayoff,
    runActionPayoff,
    runActionProjection: publicProjection,
    ...(consumableRunOpportunityQuote ? { consumableRunOpportunityQuote } : {}),
    bypassedFirstIce,
    riskyUniversalCoverage,
    ...(randomBreakOrDamageRiskAssessment
      ? { randomBreakOrDamageRiskAssessment }
      : {}),
    scoreThreat,
    recommendation,
    score,
    evidence: [
      `target:${targetServerId}`,
      `target_kind:${targetKind}`,
      `access_server:${accessServerId}`,
      `access_target_kind:${accessTargetKind}`,
      `access_payoff:${accessPayoff}`,
      ...(payoff.accessPayoffContestable !== undefined
        ? [`access_payoff_contestable:${payoff.accessPayoffContestable}`]
        : []),
      `known_access_state:${payoff.knownAccessState}`,
      `central_access_novelty_ratio:${payoff.accessNoveltyRatio}`,
      `path_passability:${pathPassability}`,
      ...(visibleLethalIceDamage
        ? [
            `runner_visible_lethal_ice_damage_blocks_run_start:${targetServerId}`,
            visibleLethalIceDamage.evidenceCode,
          ]
        : []),
      ...(path.missingCoverage?.length
        ? [`missing_coverage:${path.missingCoverage.join("|")}`]
        : []),
      `path_cost:${routeQuote.guaranteedKnownCost}`,
      `visible_break_cost:${path.visibleBreakCost ?? 0}`,
      ...routeQuote.evidence,
      `run_action_credit_cost:${actionCreditCost}`,
      `credits_after_run_action:${creditsAfterAction}`,
      `temporary_run_credits:${temporaryRunCredits}`,
      `bad_publicity_run_credits:${badPublicityRunCredits}`,
      `credits_after_run:${creditsAfterRun}`,
      ...(economyPosture.creditReservePolicy.remotePressureReserveActive ===
      true
        ? [
            `remote_pressure_liquid_credits_after_run:${creditsAfterRun}`,
            `rd_pressure_runway_ready:${
              economyPosture.creditReservePolicy.liquidCredits >=
              (economyPosture.creditReservePolicy.pressureRunwayTarget ?? 0)
            }`,
            `rd_preserves_remote_pressure_reserve:${
              accessTargetKind !== "rd" ||
              (economyPosture.creditReservePolicy.liquidCredits >=
                (economyPosture.creditReservePolicy.pressureRunwayTarget ??
                  0) &&
                creditsAfterRun >=
                  (economyPosture.creditReservePolicy.remotePressureReserve ??
                    0))
            }`,
          ]
        : []),
      `unknown_unrezzed_ice_count:${unknownUnrezzedIceCount}`,
      ...(projection.eventApproachIceExposeBeforeRez
        ? ["run_approach_ice_expose_before_rez:true"]
        : []),
      ...(projection.corpRezCostSurcharge
        ? [`run_corp_rez_surcharge:${projection.corpRezCostSurcharge.kind}`]
        : []),
      ...(projection.runnerCreditGainOnCorpRez !== undefined
        ? [
            `run_runner_credit_gain_on_corp_rez:${projection.runnerCreditGainOnCorpRez}`,
          ]
        : []),
      `run_commitment:${runCommitment}`,
      `unrezzed_ice_risk:${unrezzedIceRisk}`,
      `unrezzed_ice_risk_credit_buffer:${unrezzedIceRiskCreditBuffer}`,
      `unrezzed_ice_risk_underfunded:${unrezzedIceRiskUnderfunded}`,
      ...prerunReserveQuote.evidence,
      `visible_during_run_rez_support:${visibleDuringRunRezSupport}`,
      `visible_ice_hazard_penalty:${visibleIceHazardPenalty}`,
      `visible_ice_hazard_avoidance_cost:${visibleIceHazardAvoidanceCost}`,
      `credits_after_avoiding_visible_ice_hazards:${creditsAfterAvoidingVisibleIceHazards}`,
      `expected_tags_from_visible_ice:${expectedTagsFromVisibleIce}`,
      `unavoidable_visible_ice_hazard_count:${unavoidableVisibleIceHazardCount}`,
      `visible_trace_tag_hazard_unavoidable:${visibleTraceTagHazardUnavoidable}`,
      `runner_matchpoint_central_access:${runnerMatchpointCentralAccess}`,
      `run_target_funding_need:${targetFundingNeed.reason}`,
      `run_target_route_funding_gap:${targetFundingNeed.routeFundingGap}`,
      `run_target_post_run_floor_gap:${targetFundingNeed.postRunFloorGap}`,
      `run_target_protected_liquid_reserve:${targetFundingNeed.protectedLiquidReserve}`,
      `global_economy_funding_need:${economyPosture.fundingNeed}`,
      ...(path.visibleIceRunHazards ?? [])
        .flatMap((hazard) => hazard.evidence)
        .slice(0, 16),
      `multiaccess_available:${multiaccessAvailable}`,
      `installed_run_payoff_score:${installedRunPayoff.scoreBonus}`,
      `run_action_payoff_score:${runActionPayoff.scoreBonus}`,
      `combined_run_payoff_score:${combinedRunPayoff.scoreBonus}`,
      `access_payoff_score_adjustment:${payoff.scoreAdjustment}`,
      `run_action_projection_status:${projection.projectionStatus}`,
      `run_action_projection_source_kind:${projection.sourceKind}`,
      `run_action_projection_structure:${projection.structure}`,
      ...(projection.sourceCardId
        ? [`run_action_projection_source_card:${projection.sourceCardId}`]
        : []),
      ...(projection.spendLimit !== undefined
        ? [`run_action_projection_spend_limit:${projection.spendLimit}`]
        : []),
      `run_action_projection_spend_limit_blocks_path:${spendLimitBlocksPath}`,
      `run_action_projection_no_noisy_breakers:${projection.noNoisyBreakers}`,
      `run_action_projection_bypass_first_ice:${projection.bypassFirstIce}`,
      `run_action_projection_bypassed_first_ice:${bypassedFirstIce}`,
      `server_stealth_credits_blocked:${stealthCreditsBlocked}`,
      `risky_universal_coverage:${riskyUniversalCoverage}`,
      `probabilistic_universal_path_reachable:${probabilisticUniversalPathReachable}`,
      ...(randomBreakOrDamageRiskAssessment?.evidence ?? []),
      `unproductive_visible_run_path:${unproductiveVisibleRunPath}`,
      `future_clicks_lost:${futureClicksLost}`,
      `visible_trace_end_run_lock_unavoidable:${visibleTraceEndRunLockUnavoidable}`,
      ...(path.hardUnbrokenRunEffects?.length
        ? [`hard_unbroken_run_effect:${path.hardUnbrokenRunEffects.join("|")}`]
        : []),
      ...(path.hardUnbrokenEffectIceTitle
        ? [`hard_unbroken_run_effect_ice:${path.hardUnbrokenEffectIceTitle}`]
        : []),
      `score_threat:${scoreThreat}`,
      `recommendation:${recommendation}`,
      ...accessOutcomeMemoryEvaluationEvidence(accessOutcomeMemory),
      ...(accessOutcomeMemorySuppressesCurrentPayoff({
        accessPayoff,
        knownAccessState: payoff.knownAccessState,
        ...(accessOutcomeMemory ? { accessOutcomeMemory } : {}),
      })
        ? []
        : accessOutcomeMemory?.applies === true &&
            accessOutcomeMemory.suppressesPlanBonus
          ? ["run_target_access_memory_overridden_by_current_payoff:true"]
          : []),
      ...rankedAccessTargetEvaluationEvidence(rankedAccessTarget),
      ...economyPosture.creditReservePolicy.evidence.slice(0, 12),
      ...payoff.evidence.slice(0, 36),
      ...installedRunPayoff.evidence.slice(0, 8),
      ...runActionPayoff.evidence.slice(0, 8),
      ...projection.evidence.slice(0, 12),
      ...(consumableRunOpportunityQuote?.evidence ?? []),
    ],
  };
}

function generalCreditsRemainingAfterRun(
  creditsAfterAction: number,
  temporaryRunCredits: number,
  routeCreditsAfter: number,
): number {
  const availableDuringRun = creditsAfterAction + temporaryRunCredits;
  const spentDuringRun = Math.max(0, availableDuringRun - routeCreditsAfter);
  const generalCreditsSpent = Math.max(0, spentDuringRun - temporaryRunCredits);
  return creditsAfterAction - generalCreditsSpent;
}

function runActionPayoffForTarget(
  projection: RunActionProjection,
  targetKind: RunnerRunTargetKind,
  bypassedFirstIce: boolean,
): RunnerInstalledRunPayoff {
  const values = emptyRunPayoffValues();
  const evidence = new Set<string>();
  if (projectionHasAccessSignal(projection, targetKind, "multiaccess")) {
    values.immediateAccessValue += 90;
    evidence.add(`run_action_payoff:${targetKind}:multiaccess`);
  }
  if (projectionHasAccessSignal(projection, targetKind, "hq_info")) {
    values.immediateAccessValue += 60;
    evidence.add("run_action_payoff:hq:hq_info");
  }
  if (projectionHasAccessSignal(projection, targetKind, "topdeck_info")) {
    values.immediateAccessValue += 60;
    evidence.add("run_action_payoff:rd:topdeck_info");
  }
  if (projectionHasAccessSignal(projection, targetKind, "free_trash")) {
    values.immediateAccessValue += 70;
    evidence.add(`run_action_payoff:${targetKind}:access_trash`);
  }
  if (bypassedFirstIce) {
    values.futureSetupValue += 35;
    evidence.add(`run_action_payoff:${targetKind}:bypass_first_ice`);
  }
  if (projection.structure === "multi_run_sequence") {
    values.futureSetupValue += 35;
    evidence.add(`run_action_payoff:${targetKind}:multi_run_sequence`);
  }
  if ((projection.postRunSelfDamage ?? 0) > 0) {
    values.riskPenalty += 120 * projection.postRunSelfDamage!;
    evidence.add(
      `run_action_payoff:${targetKind}:post_run_self_damage:${projection.postRunSelfDamage}`,
    );
  } else if (
    projection.riskSignals.some(
      (signal) =>
        projectionSignalHasToken(signal, "tag") ||
        projectionSignalHasToken(signal, "damage"),
    )
  ) {
    values.riskPenalty += 25;
    evidence.add(`run_action_payoff:${targetKind}:risk_penalty`);
  }
  const multiaccessAvailable = projectionHasAccessSignal(
    projection,
    targetKind,
    "multiaccess",
  );
  return finalizeRunPayoff(values, multiaccessAvailable, [...evidence].sort());
}

function projectionHasAccessSignal(
  projection: RunActionProjection,
  targetKind: RunnerRunTargetKind,
  kind: "multiaccess" | "hq_info" | "topdeck_info" | "free_trash",
): boolean {
  const signals = projection.accessPayoffSignals.map((signal) =>
    signal.toLowerCase(),
  );
  if (kind === "multiaccess") {
    return signals.some((signal) => {
      if (!projectionSignalHasToken(signal, "multiaccess")) return false;
      if (
        projectionSignalHasToken(signal, "hq") ||
        projectionSignalHasToken(signal, "hand")
      ) {
        return targetKind === "hq";
      }
      if (
        projectionSignalHasToken(signal, "rnd") ||
        projectionSignalHasToken(signal, "rd") ||
        projectionSignalHasToken(signal, "topdeck")
      ) {
        return targetKind === "rd";
      }
      if (projectionSignalHasToken(signal, "archives"))
        return targetKind === "archives";
      if (projectionSignalHasToken(signal, "remote"))
        return targetKind === "remote";
      return true;
    });
  }
  if (kind === "hq_info") {
    return (
      targetKind === "hq" &&
      signals.some((signal) =>
        projectionSignalHasPhrase(signal, ["hq", "info"]),
      )
    );
  }
  if (kind === "topdeck_info") {
    return (
      targetKind === "rd" &&
      signals.some(
        (signal) =>
          projectionSignalHasToken(signal, "topdeck") ||
          projectionSignalHasPhrase(signal, ["rnd", "topdeck"]),
      )
    );
  }
  return signals.some(
    (signal) =>
      projectionSignalHasPhrase(signal, ["free", "trash"]) ||
      projectionSignalHasPhrase(signal, ["access", "trash"]),
  );
}

function projectionSignalHasToken(signal: string, token: string): boolean {
  const signalTokenSet = new Set(projectionSignalTokens(signal));
  return signalTokenSet.has(token);
}

function projectionSignalHasPhrase(
  signal: string,
  phrase: readonly string[],
): boolean {
  const tokens = projectionSignalTokens(signal);
  return tokens.some(
    (entry, index) =>
      entry === phrase[0] &&
      phrase.every(
        (phraseToken, offset) => tokens[index + offset] === phraseToken,
      ),
  );
}

function projectionSignalTokens(signal: string): string[] {
  return signal
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function combineRunPayoffs(
  installedRunPayoff: RunnerInstalledRunPayoff,
  runActionPayoff: RunnerInstalledRunPayoff,
): RunnerInstalledRunPayoff {
  return finalizeRunPayoff(
    {
      immediateAccessValue:
        installedRunPayoff.immediateAccessValue +
        runActionPayoff.immediateAccessValue,
      futureSetupValue:
        installedRunPayoff.futureSetupValue + runActionPayoff.futureSetupValue,
      purgeTaxValue:
        installedRunPayoff.purgeTaxValue + runActionPayoff.purgeTaxValue,
      economyValue:
        installedRunPayoff.economyValue + runActionPayoff.economyValue,
      riskPenalty: installedRunPayoff.riskPenalty + runActionPayoff.riskPenalty,
    },
    installedRunPayoff.multiaccessAvailable ||
      runActionPayoff.multiaccessAvailable,
    uniqueStrings([
      ...installedRunPayoff.evidence,
      ...runActionPayoff.evidence,
    ]),
  );
}

function emptyRunPayoffValues(): Omit<
  RunnerInstalledRunPayoff,
  "scoreBonus" | "multiaccessAvailable" | "evidence"
> {
  return {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
  };
}

function finalizeRunPayoff(
  values: Omit<
    RunnerInstalledRunPayoff,
    "scoreBonus" | "multiaccessAvailable" | "evidence"
  >,
  multiaccessAvailable: boolean,
  evidence: string[],
): RunnerInstalledRunPayoff {
  const rawScore =
    values.immediateAccessValue +
    values.futureSetupValue +
    values.purgeTaxValue +
    values.economyValue -
    values.riskPenalty;
  return {
    ...values,
    scoreBonus: Math.max(0, Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore)),
    multiaccessAvailable,
    evidence: uniqueStrings(evidence).sort(),
  };
}

function payloadRecord(action: LegalAction): Record<string, unknown> {
  return (action.payload ?? {}) as Record<string, unknown>;
}

function payloadStringValues(
  action: LegalAction,
  keys: readonly string[],
): string[] {
  const payload = payloadRecord(action);
  return keys.flatMap((key) => {
    const value = payload[key];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is string => typeof entry === "string",
      );
    }
    if (
      value &&
      typeof value === "object" &&
      typeof (value as { serverId?: unknown }).serverId === "string"
    ) {
      return [(value as { serverId: string }).serverId];
    }
    return [];
  });
}

function payloadStringArray(
  action: LegalAction,
  keys: readonly string[],
): string[] {
  return payloadStringValues(action, keys).map((value) =>
    value.trim().toLowerCase(),
  );
}

function payloadSearchText(action: LegalAction): string {
  const payload = payloadRecord(action);
  return Object.entries(payload)
    .flatMap(([key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [`${key}:${value}`];
      }
      if (Array.isArray(value)) {
        return value
          .filter(
            (entry): entry is string | number | boolean =>
              typeof entry === "string" ||
              typeof entry === "number" ||
              typeof entry === "boolean",
          )
          .map((entry) => `${key}:${entry}`);
      }
      return [key];
    })
    .join(" ");
}

function booleanPayloadValue(action: LegalAction, key: string): boolean {
  return payloadRecord(action)[key] === true;
}

function numberPayloadValue(
  action: LegalAction,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = payloadRecord(action)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return undefined;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function accessPayoffWithInstalledRunPayoff(params: {
  basePayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  accessNoveltyRatio: number;
  installedRunPayoff: RunnerInstalledRunPayoff;
  scoreThreat: boolean;
}): RunnerAccessPayoff {
  if (params.knownAccessState === "known_no_current_payoff") {
    return params.basePayoff;
  }
  if (params.scoreThreat && params.basePayoff === "unknown") {
    return "score_threat";
  }
  if (
    params.basePayoff === "unknown" &&
    params.installedRunPayoff.immediateAccessValue *
      params.accessNoveltyRatio >=
      50
  ) {
    return "access_bonus";
  }
  return params.basePayoff;
}

function payoffForTarget(
  params: EvaluateRunnerRunTargetsParams,
  targetServerId: string,
  targetKind: RunnerRunTargetKind,
): {
  accessPayoff: RunnerAccessPayoff;
  accessPayoffContestable?: boolean;
  knownAccessDamageSurvivable?: boolean;
  knownAccessState: RunnerKnownAccessState;
  accessNoveltyRatio: number;
  scoreAdjustment: number;
  evidence: string[];
} {
  if (targetKind === "remote") {
    return remotePayoffToRunTarget(
      evaluateKnownRemoteAccessPayoff(
        params.input,
        targetServerId,
        params.beliefState,
      ),
    );
  }
  if (targetServerId === "hq" || targetServerId === "rd") {
    return centralPayoffToRunTarget(
      evaluateKnownCentralAccessPayoff(
        params.input,
        targetServerId,
        params.beliefState,
      ),
    );
  }
  return {
    accessPayoff: "unknown",
    knownAccessState: "unknown",
    accessNoveltyRatio: 1,
    scoreAdjustment: 0,
    evidence: [`${targetKind}_payoff:unknown`],
  };
}

function accessReplacementPayoffForTarget(
  params: EvaluateRunnerRunTargetsParams,
  projection: RunActionProjection,
  targetServerId: string,
  targetKind: RunnerRunTargetKind,
): ReturnType<typeof payoffForTarget> | undefined {
  if (
    projection.accessReplacement !== "private_look_top_rd" ||
    targetServerId !== "rd" ||
    targetKind !== "rd"
  ) {
    return undefined;
  }
  const beliefState =
    params.beliefState ?? reconstructBeliefState(params.input);
  const knownSequence =
    beliefState.runnerOpponentModel?.rndTopFreshness
      ?.knownSequenceDefinitionIds ?? [];
  const requestedLookCount = Math.max(
    1,
    Math.floor(projection.accessReplacementLookCount ?? 1),
  );
  const visibleRdCount = Math.max(
    0,
    Math.floor(params.input.playerView.opponent.deckCount),
  );
  const effectiveLookCount = Math.min(requestedLookCount, visibleRdCount);
  const priorPrivateLookStillCurrent =
    rdPrivateLookHasNoProvenStateInvalidation(params.input);
  const addsNewInformation =
    !priorPrivateLookStillCurrent && knownSequence.length < effectiveLookCount;
  const evidence = [
    "central_target:rd",
    "central_access_replacement:private_look_top_rd",
    `central_access_replacement_look_count:${requestedLookCount}`,
    `central_access_replacement_effective_count:${effectiveLookCount}`,
    `central_access_replacement_known_sequence_count:${knownSequence.length}`,
    `central_access_replacement_prior_private_look_still_current:${priorPrivateLookStillCurrent}`,
    `central_access_replacement_adds_information:${addsNewInformation}`,
  ];
  if (!addsNewInformation) {
    return {
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      accessNoveltyRatio: 0,
      scoreAdjustment: -640,
      evidence: [...evidence, "central_access_replacement_redundant:true"],
    };
  }
  return {
    accessPayoff: "access_bonus",
    knownAccessState: "known_payoff",
    accessNoveltyRatio: 1,
    scoreAdjustment: 0,
    evidence: [
      ...evidence,
      "central_access_replacement_information_payoff:true",
    ],
  };
}

function rdPrivateLookHasNoProvenStateInvalidation(
  input: AiDecisionInput,
): boolean {
  const events = aiVisibleEvents(input);
  let latestPrivateLookIndex = -1;
  for (let index = 0; index < events.length; index += 1) {
    if (isRunnerRdPrivateLook(events[index]!)) latestPrivateLookIndex = index;
  }
  if (latestPrivateLookIndex < 0) return false;
  return !events.slice(latestPrivateLookIndex + 1).some(rdTopMayHaveChanged);
}

function aiVisibleEvents(input: AiDecisionInput): PublicGameEvent[] {
  const byId = new Map<string, PublicGameEvent>();
  for (const event of [...input.playerView.publicEvents, ...input.eventTail]) {
    const previous = byId.get(event.eventId);
    if (!previous || previous.stateVersionAfter <= event.stateVersionAfter) {
      byId.set(event.eventId, event);
    }
  }
  return [...byId.values()].sort(
    (left, right) =>
      left.stateVersionBefore - right.stateVersionBefore ||
      left.eventId.localeCompare(right.eventId),
  );
}

function isRunnerRdPrivateLook(event: PublicGameEvent): boolean {
  return (
    event.publicPayload.actor === "runner" &&
    event.publicPayload.hiddenZoneAction === "p3_33_private_look" &&
    event.publicPayload.privateLookZone === "rd" &&
    (Array.isArray(event.publicPayload.knownRndDefinitionIds) ||
      typeof event.publicPayload.knownRndTopDefinitionId === "string")
  );
}

function rdTopMayHaveChanged(event: PublicGameEvent): boolean {
  const actionType = String(event.publicPayload.actionType ?? event.type);
  const actor = event.publicPayload.actor;
  if (
    actor === "corp" &&
    (actionType === "draw_card" || actionType === "mandatory_draw")
  ) {
    return true;
  }
  if (
    actionType === "steal_agenda" ||
    actionType === "trash_accessed_card" ||
    actionType === "move_to_removed_from_game" ||
    actionType === "move_to_set_aside" ||
    actionType === "return_from_set_aside"
  ) {
    return event.publicPayload.serverId === "rd";
  }
  return (
    event.publicPayload.hiddenZoneChangesRd === true &&
    typeof event.publicPayload.hiddenZoneAffectedCardCount === "number" &&
    event.publicPayload.hiddenZoneAffectedCardCount > 0 &&
    (event.publicPayload.hiddenZoneContentsChanged === true ||
      event.publicPayload.hiddenZoneOrderChanged === true)
  );
}

function rankedAccessTargetForServer(
  rankedAccessTargets: readonly RankedKnownRemoteAccessCandidate[] | undefined,
  serverId: string,
): RankedKnownRemoteAccessCandidate | undefined {
  return rankedAccessTargets?.find(
    (candidate) => candidate.commitment.serverId === serverId,
  );
}

function accessOutcomeMemoryEvaluationEvidence(
  status: AccessOutcomeMemoryStatus | undefined,
): string[] {
  if (!status) return [];
  return [
    `run_target_access_memory_applies:${status.applies}`,
    `run_target_access_memory_suppresses_plan_bonus:${status.suppressesPlanBonus}`,
    ...(status.invalidationReason
      ? [`run_target_access_memory_invalidation:${status.invalidationReason}`]
      : []),
    ...status.evidence.slice(0, 20),
  ];
}

function rankedAccessTargetEvaluationEvidence(
  candidate: RankedKnownRemoteAccessCandidate | undefined,
): string[] {
  if (!candidate) return [];
  return [
    `run_target_ranked_access_position:${candidate.positionKey}`,
    `run_target_ranked_access_kind:${candidate.targetKind}`,
    `run_target_ranked_access_intent:${candidate.commitment.intendedAccessAction}`,
    `run_target_ranked_access_reason:${candidate.commitment.reason}`,
    `run_target_ranked_access_score:${candidate.rankScore}`,
    ...candidate.rankEvidence.slice(0, 6),
  ];
}

function remotePayoffToRunTarget(payoff: KnownRemoteAccessPayoff): {
  accessPayoff: RunnerAccessPayoff;
  accessPayoffContestable: boolean;
  knownAccessDamageSurvivable?: boolean;
  knownAccessState: RunnerKnownAccessState;
  accessNoveltyRatio: number;
  scoreAdjustment: number;
  evidence: string[];
} {
  return {
    accessPayoff: payoff.payoff === "changed" ? "unknown" : payoff.payoff,
    accessPayoffContestable: payoff.contestable,
    ...(payoff.evidence.includes("known_remote_access_damage_survivable:true")
      ? { knownAccessDamageSurvivable: true }
      : payoff.evidence.includes("known_remote_access_damage_survivable:false")
        ? { knownAccessDamageSurvivable: false }
        : {}),
    knownAccessState: payoff.knownNoCurrentPayoff
      ? "known_no_current_payoff"
      : payoff.payoff === "changed"
        ? "changed"
        : payoff.payoff === "unknown"
          ? "unknown"
          : "known_payoff",
    accessNoveltyRatio: 1,
    scoreAdjustment: -payoff.penalty,
    evidence: payoff.evidence,
  };
}

function centralPayoffToRunTarget(payoff: KnownCentralAccessPayoff): {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  accessNoveltyRatio: number;
  scoreAdjustment: number;
  evidence: string[];
} {
  return {
    accessPayoff: payoff.payoff,
    knownAccessState: payoff.knownNoCurrentPayoff
      ? "known_no_current_payoff"
      : payoff.payoff === "fresh"
        ? "fresh"
        : payoff.payoff === "unknown"
          ? "unknown"
          : "known_payoff",
    accessNoveltyRatio: payoff.accessNoveltyRatio,
    scoreAdjustment: (payoff.bonus ?? 0) - payoff.penalty,
    evidence: payoff.evidence,
  };
}

function quoteRunnerPrerunReserve(params: {
  input: AiDecisionInput;
  deckCapabilities: DeckCapabilityProfile | undefined;
  projection: InternalRunActionProjection;
  accessPayoff: RunnerAccessPayoff;
  scoreThreat: boolean;
  multiaccessAvailable: boolean;
  runnerMatchpointCentralAccess: boolean;
  knownPathCost: number;
  creditsAfterKnownPath: number;
  unknownIceCount: number;
  unknownIcePositions: number[];
  unrezzedIceRiskCreditBuffer: number;
  riskyUniversalCoverage: boolean;
  visibleDuringRunRezSupport: boolean;
}): RunnerPrerunReserveQuote {
  const installedBreakers =
    params.deckCapabilities?.runner?.breakerInventory.filter((breaker) =>
      breaker.locations.includes("installed"),
    ) ?? [];
  const stableUniversal = installedBreakers.some(
    (breaker) =>
      breaker.coverage.includes("universal") &&
      breaker.confidence === "high" &&
      breaker.risks.length === 0,
  );
  const riskyUniversal =
    !stableUniversal &&
    (params.riskyUniversalCoverage ||
      installedBreakers.some((breaker) =>
        breaker.coverage.includes("universal"),
      ));
  const typedCoverage =
    installedBreakers.some((breaker) => breaker.coverage.length > 0) ||
    (params.input.playerView.own.rig ?? []).some((card) =>
      (card.subtypes ?? []).some((subtype) =>
        subtype.toLowerCase().includes("icebreaker"),
      ),
    );
  const visibleCoverage = stableUniversal
    ? ("stable_universal" as const)
    : riskyUniversal
      ? ("risky_universal" as const)
      : typedCoverage
        ? ("typed_only" as const)
        : ("none" as const);
  const purpose =
    params.scoreThreat ||
    params.accessPayoff === "agenda" ||
    params.accessPayoff === "score_threat"
      ? ("contest" as const)
      : params.multiaccessAvailable
        ? ("multiaccess" as const)
        : params.projection.accessReplacement === "private_look_top_rd" ||
            params.accessPayoff === "unknown" ||
            params.accessPayoff === "fresh"
          ? ("information" as const)
          : ("access" as const);
  const corpRezCredits = Math.max(0, params.input.playerView.opponent.credits);
  const riskTolerance =
    params.runnerMatchpointCentralAccess && stableUniversal
      ? ("matchpoint_with_stable_universal_coverage" as const)
      : ("standard" as const);
  const corpRezExposureActive =
    corpRezCredits > 0 || params.visibleDuringRunRezSupport;
  const informationProbeAllowed =
    purpose === "information" &&
    !params.runnerMatchpointCentralAccess &&
    params.knownPathCost <= 1 &&
    params.creditsAfterKnownPath >=
      Math.min(1, params.unrezzedIceRiskCreditBuffer);
  return quoteRunnerRunRiskReserve({
    purpose,
    riskTolerance,
    visibleCoverage,
    knownPathCost: params.knownPathCost,
    creditsAfterKnownPath: params.creditsAfterKnownPath,
    unknownIceCount: params.unknownIceCount,
    unknownIcePositions: params.unknownIcePositions,
    corpRezCredits,
    corpRezExposureActive,
    riskCreditBuffer: params.unrezzedIceRiskCreditBuffer,
    runnerGripCount: params.input.playerView.own.gripOrHq.length,
    informationProbeAllowed,
  });
}

function recommendationForRunTarget(params: {
  targetKind: RunnerRunTargetKind;
  accessPayoff: RunnerAccessPayoff;
  accessPayoffContestable?: boolean;
  knownAccessDamageSurvivable?: boolean;
  knownAccessState: RunnerKnownAccessState;
  accessNoveltyRatio: number;
  pathPassability: RunnerPathPassability;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
  installedRunPayoff: RunnerInstalledRunPayoff;
  scoreThreat: boolean;
  unproductiveVisibleRunPath: boolean;
  visibleIceHazardPenalty: number;
  futureClicksLost: number;
  visibleIceHazardAvoidanceCost: number;
  creditsAfterAvoidingVisibleIceHazards: number;
  expectedTagsFromVisibleIce: number;
  unavoidableVisibleIceHazardCount: number;
  visibleTraceTagHazardUnavoidable: boolean;
  runnerMatchpointCentralAccess: boolean;
  routeQuote: NonNullable<RunnerRunTargetEvaluation["routeQuote"]>;
  targetFundingNeed: RunnerRunTargetFundingNeed;
  unrezzedIceRiskUnderfunded: boolean;
  prerunReserveQuote: RunnerPrerunReserveQuote;
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  rankedAccessTarget?: RankedKnownRemoteAccessCandidate;
  randomBreakOrDamageRiskAssessment?: RandomBreakOrDamageRiskAssessment;
}): RunnerRunTargetRecommendation {
  if (params.knownAccessDamageSurvivable === false) {
    return "draw_for_damage_buffer";
  }
  if (params.pathPassability === "blocked_by_random_break_damage_hand_buffer") {
    return "draw_for_damage_buffer";
  }
  if (
    randomBreakOrDamageRiskShouldAvoidRun(
      params.randomBreakOrDamageRiskAssessment,
    )
  ) {
    return "do_not_run_now";
  }
  if (
    params.randomBreakOrDamageRiskAssessment &&
    params.randomBreakOrDamageRiskAssessment.payoffOverride === "none" &&
    params.randomBreakOrDamageRiskAssessment.riskSeverity === "medium" &&
    params.knownAccessState === "known_no_current_payoff"
  ) {
    return "do_not_run_now";
  }
  if (
    params.randomBreakOrDamageRiskAssessment &&
    params.randomBreakOrDamageRiskAssessment.payoffOverride === "none" &&
    params.randomBreakOrDamageRiskAssessment.riskSeverity === "medium"
  ) {
    return "setup_first";
  }
  if (params.unproductiveVisibleRunPath) {
    const explicitConditionalAgendaRisk =
      params.routeQuote.reachability === "conditional_access" &&
      (params.accessPayoff === "agenda" ||
        params.accessPayoff === "score_threat" ||
        params.scoreThreat) &&
      !params.routeQuote.effects.some(
        (effect) => effect.canEndGameBeforeAccess,
      );
    if (!explicitConditionalAgendaRisk) return "do_not_run_now";
    return "run_now";
  }
  if (
    params.visibleTraceTagHazardUnavoidable &&
    !highValuePayoff(params.accessPayoff) &&
    !params.scoreThreat &&
    !params.runnerMatchpointCentralAccess
  ) {
    return "gain_credits_first";
  }
  if (
    params.unavoidableVisibleIceHazardCount > 0 &&
    !highValuePayoff(params.accessPayoff) &&
    !params.scoreThreat &&
    !params.runnerMatchpointCentralAccess
  ) {
    return params.expectedTagsFromVisibleIce > 0
      ? "gain_credits_first"
      : "setup_first";
  }
  if (params.pathPassability === "blocked_missing_coverage") {
    return "find_breaker_first";
  }
  if (
    params.pathPassability === "blocked_unpayable" ||
    params.pathPassability === "blocked_unbreakable"
  ) {
    return params.pathPassability === "blocked_unbreakable"
      ? "find_breaker_first"
      : "gain_credits_first";
  }
  if (params.prerunReserveQuote.status === "blocked") {
    return "gain_credits_first";
  }
  if (
    params.targetKind === "remote" &&
    params.accessPayoff === "agenda" &&
    params.accessPayoffContestable === false
  ) {
    return "gain_credits_first";
  }
  if (
    params.targetKind === "remote" &&
    params.accessOutcomeMemory?.invalidationReason ===
      "remote_fingerprint_changed"
  ) {
    return "remote_changed_reassess";
  }
  if (
    params.targetKind === "remote" &&
    accessOutcomeMemorySuppressesCurrentPayoff(params)
  ) {
    return "declined_trash_memory_active";
  }
  if (params.knownAccessState === "known_no_current_payoff") {
    if (params.targetKind === "remote") {
      if (
        params.rankedAccessTarget?.commitment.reason ===
          "insufficient_credits" ||
        params.rankedAccessTarget?.commitment.reason === "reserve_would_break"
      ) {
        return "gain_credits_first";
      }
      return params.accessPayoff === "trash_unaffordable"
        ? "gain_credits_first"
        : "known_no_current_payoff";
    }
    return params.accessPayoff === "trash_unaffordable"
      ? "gain_credits_first"
      : "do_not_run_now";
  }
  if (
    params.runnerMatchpointCentralAccess &&
    params.pathPassability === "reachable" &&
    params.routeQuote.fundingGap === 0 &&
    (params.targetFundingNeed.reason === "none" ||
      highValuePayoff(params.accessPayoff) ||
      params.scoreThreat)
  ) {
    return "run_now";
  }
  if (
    params.accessPayoff !== "agenda" &&
    runnerRdRunBurnsRemotePressureReserve(params)
  ) {
    return "gain_credits_first";
  }
  if (
    params.accessPayoff === "score_threat" &&
    params.creditsAfterRun <
      params.economyPosture.creditReservePolicy.contestReserve
  ) {
    return "gain_credits_first";
  }
  if (
    params.unrezzedIceRiskUnderfunded &&
    !highValuePayoff(params.accessPayoff) &&
    !params.scoreThreat
  ) {
    return "gain_credits_first";
  }
  if (
    (params.targetFundingNeed.reason === "route_funding_gap" ||
      (params.targetFundingNeed.reason === "post_run_floor_gap" &&
        params.targetFundingNeed.protectedLiquidReserve >
          params.economyPosture.minimumCreditFloor)) &&
    !highValuePayoff(params.accessPayoff) &&
    !params.scoreThreat
  ) {
    return "gain_credits_first";
  }
  if (
    params.targetKind === "rd" &&
    params.knownAccessState === "unknown" &&
    params.pathPassability === "reachable" &&
    params.creditsAfterRun >= 0
  ) {
    return "run_now";
  }
  if (highValuePayoff(params.accessPayoff)) return "run_now";
  if (params.targetFundingNeed.reason !== "none") {
    return "gain_credits_first";
  }
  if (
    params.installedRunPayoff.immediateAccessValue *
      params.accessNoveltyRatio >=
      50 &&
    params.pathPassability === "reachable"
  ) {
    return "run_now";
  }
  if (params.scoreThreat) return "run_now";
  if (params.accessPayoff === "unknown") return "run_if_free";
  return "setup_first";
}

function runnerRunTargetFundingNeed(params: {
  routeQuote: NonNullable<RunnerRunTargetEvaluation["routeQuote"]>;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
}): RunnerRunTargetFundingNeed {
  const routeFundingGap = Math.max(0, params.routeQuote.fundingGap ?? 0);
  const liquidCreditsSpent =
    params.creditsAfterRun <
    params.economyPosture.creditReservePolicy.currentCredits;
  const protectedLiquidReserve = liquidCreditsSpent
    ? params.economyPosture.creditReservePolicy.phase === "opening"
      ? params.economyPosture.minimumCreditFloor
      : params.economyPosture.desiredCreditReserve
    : params.economyPosture.minimumCreditFloor;
  const postRunFloorGap = Math.max(
    0,
    protectedLiquidReserve - params.creditsAfterRun,
  );
  return {
    reason:
      routeFundingGap > 0
        ? "route_funding_gap"
        : postRunFloorGap > 0
          ? "post_run_floor_gap"
          : "none",
    routeFundingGap,
    postRunFloorGap,
    protectedLiquidReserve,
  };
}

function scoreRunTargetEvaluation(params: {
  targetKind: RunnerRunTargetKind;
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  pathPassability: RunnerPathPassability;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
  scoreThreat: boolean;
  recommendation: RunnerRunTargetRecommendation;
  multiaccessAvailable: boolean;
  installedRunPayoffScore: number;
  installedImmediateAccessValue: number;
  accessNoveltyRatio: number;
  accessPayoffScoreAdjustment: number;
  visibleIceHazardPenalty: number;
  futureClicksLost: number;
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  randomBreakOrDamageRiskAssessment?: RandomBreakOrDamageRiskAssessment;
}): number {
  const payoffScore = scoreForPayoff(params.accessPayoff);
  const pathPenalty =
    params.pathPassability === "reachable"
      ? 0
      : params.pathPassability === "blocked_by_random_break_damage_hand_buffer"
        ? -1200
        : -420;
  const reservePenalty =
    params.creditsAfterRun < params.economyPosture.minimumCreditFloor
      ? -160
      : runnerRdRunBurnsRemotePressureReserve(params) &&
          params.accessPayoff !== "agenda"
        ? -480
        : 0;
  const accessNoveltyRatio = Math.max(
    0,
    Math.min(1, params.accessNoveltyRatio),
  );
  const multiaccessBonus = params.multiaccessAvailable
    ? 80 * accessNoveltyRatio
    : 0;
  const redundantInstalledAccessValue =
    params.installedImmediateAccessValue * (1 - accessNoveltyRatio);
  const installedRunPayoffBonus = Math.max(
    0,
    params.installedRunPayoffScore - redundantInstalledAccessValue,
  );
  const scoreThreatBonus = params.scoreThreat ? 180 : 0;
  const recommendationScore = recommendationRank(params.recommendation) * 20;
  const visibleIceHazardPenalty = -Math.max(0, params.visibleIceHazardPenalty);
  const futureClickPenalty = -Math.max(0, params.futureClicksLost) * 80;
  const randomBreakOrDamageRiskPenalty = randomBreakOrDamageRiskScorePenalty(
    params.randomBreakOrDamageRiskAssessment,
  );
  const accessOutcomeMemoryPenalty =
    params.targetKind === "remote" &&
    accessOutcomeMemorySuppressesCurrentPayoff(params)
      ? -360
      : 0;
  return (
    payoffScore +
    pathPenalty +
    reservePenalty +
    multiaccessBonus +
    installedRunPayoffBonus +
    scoreThreatBonus +
    params.accessPayoffScoreAdjustment +
    visibleIceHazardPenalty +
    futureClickPenalty +
    randomBreakOrDamageRiskPenalty +
    accessOutcomeMemoryPenalty +
    recommendationScore
  );
}

function accessOutcomeMemorySuppressesCurrentPayoff(params: {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
}): boolean {
  return (
    params.accessOutcomeMemory?.applies === true &&
    params.accessOutcomeMemory.suppressesPlanBonus &&
    (params.accessOutcomeMemory.suppressUntilInvalidated === true ||
      !(
        params.knownAccessState === "known_payoff" &&
        highValuePayoff(params.accessPayoff)
      ))
  );
}

function runnerRdRunBurnsRemotePressureReserve(params: {
  targetKind: RunnerRunTargetKind;
  pathPassability: RunnerPathPassability;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
}): boolean {
  const policy = params.economyPosture.creditReservePolicy;
  if (
    params.targetKind !== "rd" ||
    params.pathPassability !== "reachable" ||
    policy.remotePressureReserveActive !== true ||
    policy.reserveOverrides.includes("terminal_central_pressure")
  ) {
    return false;
  }
  return (
    policy.liquidCredits < (policy.pressureRunwayTarget ?? 0) ||
    params.creditsAfterRun < (policy.remotePressureReserve ?? 0)
  );
}

function scoreForPayoff(payoff: RunnerAccessPayoff): number {
  switch (payoff) {
    case "agenda":
      return 520;
    case "score_threat":
      return 260;
    case "trash_affordable":
    case "fresh":
      return 180;
    case "access_bonus":
      return 140;
    case "unknown":
      return 60;
    case "trash_unaffordable":
      return -120;
    case "known_low_value":
      return -260;
  }
}

function recommendationRank(
  recommendation: RunnerRunTargetRecommendation,
): number {
  switch (recommendation) {
    case "run_now":
      return 6;
    case "run_if_free":
      return 5;
    case "setup_first":
      return 4;
    case "draw_for_damage_buffer":
      return 3;
    case "gain_credits_first":
      return 3;
    case "find_breaker_first":
      return 2;
    case "remote_changed_reassess":
      return 2;
    case "declined_trash_memory_active":
      return 1;
    case "known_no_current_payoff":
      return 1;
    case "do_not_run_now":
      return 1;
  }
}

function pathPassabilityFor(
  path: ReturnType<typeof assessKnownRezzedIcePath>,
): RunnerPathPassability {
  if (!path.blocked) return "reachable";
  if (path.knownPathBlockedByHardUnbrokenEffect) {
    return path.unpayableReason === "ice_unbreakable"
      ? "blocked_unbreakable"
      : "blocked_unpayable";
  }
  if (path.knownPathBlockedByMissingCoverage) return "blocked_missing_coverage";
  if (path.unpayableReason === "ice_unbreakable") return "blocked_unbreakable";
  return "blocked_unpayable";
}

function runnerRunTargetPathIsUnproductive(
  path: ReturnType<typeof assessKnownRezzedIcePath>,
): boolean {
  return (
    path.blocked &&
    path.canReachAccess === false &&
    path.knownPathBlockedByHardUnbrokenEffect === true
  );
}

function stealOrTrashAffordableFor(
  payoff: RunnerAccessPayoff,
  contestable?: boolean,
): boolean | "unknown" {
  if (payoff === "agenda") return contestable ?? true;
  if (payoff === "trash_affordable") return true;
  if (payoff === "trash_unaffordable") return false;
  return "unknown";
}

function highValuePayoff(payoff: RunnerAccessPayoff): boolean {
  return (
    payoff === "agenda" ||
    payoff === "trash_affordable" ||
    payoff === "fresh" ||
    payoff === "access_bonus" ||
    payoff === "score_threat"
  );
}

function installedRunPayoffForTarget(
  input: AiDecisionInput,
  targetKind: RunnerRunTargetKind,
): RunnerInstalledRunPayoff {
  const values = {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
  };
  let multiaccessAvailable = false;
  const evidence = new Set<string>();
  for (const card of input.playerView.own.rig ?? []) {
    if (card.known === false) continue;
    if (!card.definitionId) continue;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    const contribution = hint
      ? installedRunPayoffContributionForHint(hint, targetKind)
      : undefined;
    if (!contribution) continue;
    values.immediateAccessValue += contribution.immediateAccessValue;
    values.futureSetupValue += contribution.futureSetupValue;
    values.purgeTaxValue += contribution.purgeTaxValue;
    values.economyValue += contribution.economyValue;
    values.riskPenalty += contribution.riskPenalty;
    multiaccessAvailable ||= contribution.multiaccessAvailable;
    for (const fact of contribution.evidence) evidence.add(fact);
  }
  const rawScore =
    values.immediateAccessValue +
    values.futureSetupValue +
    values.purgeTaxValue +
    values.economyValue -
    values.riskPenalty;
  const scoreBonus = Math.max(
    0,
    Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore),
  );
  return {
    ...values,
    scoreBonus,
    multiaccessAvailable,
    evidence: [...evidence].sort(),
  };
}

function installedRunPayoffContributionForHint(
  hint: AiCardHint,
  targetKind: RunnerRunTargetKind,
): RunnerInstalledRunPayoff {
  const effects = hint.effects ?? [];
  const contribution: RunnerInstalledRunPayoff = {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: [],
  };
  const successfulRunTriggerMatches = effects.some(
    (effect) =>
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "successful_run" &&
      effectScopeMatchesTarget(effect.scope, targetKind),
  );
  for (const effect of effects) {
    const target = effectTarget(effect);
    if (
      effect.kind === "multiaccess" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.multiaccessAvailable = true;
      contribution.immediateAccessValue += 90;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:multiaccess`,
      );
      continue;
    }
    if (
      effect.kind === "hq_info" &&
      targetKind === "hq" &&
      effect.timing === "on_access"
    ) {
      contribution.immediateAccessValue += 60;
      contribution.evidence.push("installed_run_payoff:hq:hq_info");
      continue;
    }
    if (
      effect.kind === "topdeck_info" &&
      targetKind === "rd" &&
      (effect.timing === "on_access" || effect.timing === "successful_run")
    ) {
      contribution.immediateAccessValue += 60;
      contribution.evidence.push("installed_run_payoff:rd:topdeck_info");
      continue;
    }
    if (
      effect.kind === "access_replacement" &&
      effectScopeMatchesTarget(effect.scope, targetKind) &&
      (effect.timing === "on_access" || effect.timing === "successful_run")
    ) {
      contribution.immediateAccessValue += 45;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:access_replacement`,
      );
      continue;
    }
    if (
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "on_access" &&
      effectScopeMatchesTarget(effect.scope, targetKind) &&
      (target === "free_trash" ||
        target === "trash_untrashable" ||
        target === "access_trash_pressure")
    ) {
      contribution.immediateAccessValue += 70;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:access_trash`,
      );
      continue;
    }
    if (
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "successful_run" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.futureSetupValue += 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:successful_run_counter`,
      );
      continue;
    }
    if (
      effect.kind === "topdeck_info" &&
      targetKind === "rd" &&
      effect.timing === "start_of_turn"
    ) {
      contribution.futureSetupValue += 35;
      contribution.evidence.push("installed_run_payoff:rd:future_topdeck_info");
      continue;
    }
    if (
      effect.kind === "hq_info" &&
      targetKind === "hq" &&
      effect.timing === "start_of_turn"
    ) {
      contribution.futureSetupValue += 35;
      contribution.evidence.push("installed_run_payoff:hq:future_hq_info");
      continue;
    }
    if (
      effect.kind === "remote_tax" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.futureSetupValue += targetKind === "remote" ? 45 : 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:remote_tax`,
      );
      continue;
    }
    if (
      effect.kind === "global_modifier" &&
      effect.timing === "successful_run" &&
      effect.scope === "ice"
    ) {
      contribution.futureSetupValue += 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:break_cost_support`,
      );
      continue;
    }
    if (
      effect.kind === "recurring_economy" &&
      (effectScopeMatchesTarget(effect.scope, targetKind) ||
        successfulRunTriggerMatches)
    ) {
      contribution.economyValue += 28;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:economy_value`,
      );
      continue;
    }
    if (
      effect.kind === "delayed_penalty" &&
      target === "virus_purge" &&
      successfulRunTriggerMatches
    ) {
      contribution.purgeTaxValue += 10;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:purge_tax`,
      );
      continue;
    }
    if (
      effect.kind === "run_tax" &&
      effect.scope === "runner" &&
      (effect.timing === "action" || effect.timing === "successful_run")
    ) {
      contribution.riskPenalty += 25;
      contribution.evidence.push(`installed_run_payoff:${targetKind}:risk_tax`);
    }
  }
  const rawScore =
    contribution.immediateAccessValue +
    contribution.futureSetupValue +
    contribution.purgeTaxValue +
    contribution.economyValue -
    contribution.riskPenalty;
  return {
    ...contribution,
    scoreBonus: Math.max(0, Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore)),
  };
}

function effectScopeMatchesTarget(
  scope: string | undefined,
  targetKind: RunnerRunTargetKind,
): boolean {
  if (!scope) return false;
  if (targetKind === "rd" && scope === "rnd") return true;
  if (
    scope === "central" &&
    (targetKind === "hq" || targetKind === "rd" || targetKind === "archives")
  )
    return true;
  if (scope === targetKind) return true;
  if (scope === "server") return true;
  if (targetKind === "remote" && scope === "remote") return true;
  return false;
}

function effectTarget(
  effect: NonNullable<AiCardHint["effects"]>[number],
): string | undefined {
  const target = (effect as Record<string, unknown>).target;
  return typeof target === "string" ? target : undefined;
}

function hasRiskyUniversalPressure(
  params: EvaluateRunnerRunTargetsParams,
): boolean {
  const riskProfile = new Set(params.strategicIntent?.riskProfile ?? []);
  return (
    riskProfile.has("runner.risky_universal_breaker_pressure") ||
    (params.deckCapabilities?.runner?.breakerInventory.some((breaker) => {
      const coverage = new Set(breaker.coverage);
      return coverage.has("universal") && breaker.risks.length > 0;
    }) ??
      false)
  );
}

function runnerCreditReservePhase(
  input: AiDecisionInput,
  remoteScoreThreat: RunnerRemoteScoreThreat,
): RunnerCreditReservePhase {
  if (
    remoteScoreThreat === "urgent" ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2
  ) {
    return "late_contest";
  }
  if (remoteScoreThreat === "visible") return "late_contest";
  return input.playerView.stateVersion <= 8 ? "opening" : "midgame";
}

function runnerRemoteScoreThreat(
  input: AiDecisionInput,
): RunnerRemoteScoreThreat {
  let threat: RunnerRemoteScoreThreat = "none";
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    if (server.root.length === 0) continue;
    const advancedRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) > 0,
    );
    const urgentRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) >= 2,
    );
    const knownAgenda = server.root.some(
      (card) => card.known && card.type === "agenda",
    );
    if (
      urgentRoot ||
      knownAgenda ||
      input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin - 2
    ) {
      return "urgent";
    }
    if (advancedRoot) threat = maxRemoteScoreThreat(threat, "visible");
    else threat = maxRemoteScoreThreat(threat, "possible");
  }
  return threat;
}

function maxRemoteScoreThreat(
  left: RunnerRemoteScoreThreat,
  right: RunnerRemoteScoreThreat,
): RunnerRemoteScoreThreat {
  return remoteScoreThreatRank(right) > remoteScoreThreatRank(left)
    ? right
    : left;
}

function remoteScoreThreatRank(threat: RunnerRemoteScoreThreat): number {
  switch (threat) {
    case "urgent":
      return 3;
    case "visible":
      return 2;
    case "possible":
      return 1;
    case "none":
      return 0;
  }
}

function runnerContestReserve(params: {
  phase: RunnerCreditReservePhase;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  canContestIfFunded: boolean;
}): number {
  if (params.remoteScoreThreat === "none") return 0;
  if (!params.canContestIfFunded) return 0;
  if (params.remoteScoreThreat === "urgent") return 8;
  if (params.remoteScoreThreat === "visible") return 6;
  if (params.phase === "late_contest") return 6;
  return params.canContestIfFunded ? 5 : 4;
}

function runnerEmergencyReserve(input: AiDecisionInput): number {
  return input.playerView.own.tags > 0 ? 3 : 0;
}

function remoteHasScoreThreat(
  server: AiDecisionInput["playerView"]["servers"][number] | undefined,
): boolean {
  if (!server?.id.startsWith("remote_")) return false;
  return server.root.some(
    (card) =>
      card.type === "agenda" ||
      (card.known === false && (card.advancementCounters ?? 0) > 0),
  );
}

function targetKindForServerId(
  serverId: string,
): RunnerRunTargetKind | undefined {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId.startsWith("remote_")) return "remote";
  return undefined;
}

function actionServerId(action: LegalAction): string | undefined {
  const value = action.payload?.serverId;
  return typeof value === "string" ? value : undefined;
}

function isBankPayoutAction(action: LegalAction): boolean {
  return (
    (action.type === "trigger_ability" ||
      action.type === "activated_card_ability") &&
    action.payload?.cardImplementationTakesHostedCredits === true
  );
}
