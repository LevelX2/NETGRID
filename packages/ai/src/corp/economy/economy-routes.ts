import { candidateTargetIds } from "../../plans/corp-core-module-support";

import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { domain } from "../../plans/corp-core-module-support";
import { createCreditDemand } from "../../plans/credit-demand";
import { searchFundingRoutes } from "../../plans/funding-route";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import type {
  PlanMaterialization,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import {
  CorpEconomyDevelopmentSignal,
  CorpEconomyFundingRouteAssessment,
  CorpEconomyImmediateOperationSignal,
  CorpEconomyNeedSignal,
  CorpEconomyOperationThresholdSignal,
  CorpEconomyOptionalActionCapacitySignal,
  CorpEconomyParentFundingSignal,
  CorpEconomyReserveSignal,
  CorpEconomyVisibleCardWithdrawalSignal,
} from "./economy-types";

export function corpEconomyActionIsOwned(
  candidate: ActionSemanticCandidate,
): boolean {
  return immediateCorpLiquidCreditGain(candidate) > 0;
}

export function economyCandidates(
  context: PlanSchedulerContext,
  signal: CorpEconomyNeedSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.kind === "parent_funding" &&
    signal.restrictedCreditPreparations?.length
  ) {
    const preparations = signal.restrictedCreditPreparations;
    const { restrictedCreditPreparations: _preparations, ...liquidSignal } =
      signal;
    return [
      ...context.actionCandidates.flatMap((candidate) => {
        const preparation = preparations.find(
          (preparation) => preparation.actionId === candidate.actionId,
        );
        return preparation
          ? [{ candidate, stepValue: preparation.capacityGain * 10 }]
          : [];
      }),
      ...economyCandidates(context, liquidSignal),
    ];
  }
  if (signal.kind === "parent_funding" && signal.restrictedCreditFunding) {
    return context.actionCandidates.flatMap((candidate) => {
      const quote = signal.restrictedCreditFunding!.find(
        (entry) => entry.request.payoutActionId === candidate.actionId,
      );
      const payout = candidate.economyProjection?.restrictedCreditPayout;
      if (
        !quote ||
        !payout ||
        quote.request.stateVersion !== context.input.playerView.stateVersion ||
        candidate.sourceCardInstanceId !== quote.payoutSourceCardInstanceId ||
        candidate.abilityId !== quote.payoutSourceAbilityId ||
        payout.amount !== quote.payoutCredits ||
        !corpEconomyCandidateHasExecutablePayload(context.input, candidate)
      )
        return [];
      return [
        {
          candidate,
          stepValue:
            Math.min(signal.gap, quote.consumer.newlyProvidedCreditsApplied) *
            10,
        },
      ];
    });
  }
  const exactFundingHead =
    signal.kind === "develop_campaign" ||
    signal.kind === "convert_immediate_operation" ||
    signal.kind === "convert_visible_card_payout" ||
    signal.kind === "prepare_immediate_operation" ||
    signal.kind === "develop_liquidity" ||
    signal.kind === "resolve_start_rez_choice" ||
    signal.kind === "resolve_optional_action_capacity_offer"
      ? undefined
      : (
          signal.fundingRouteAssessment ??
          assessCorpEconomyFundingRoute(context, signal)
        ).headActionId;
  const campaignActionIds =
    signal.kind === "develop_campaign" ? new Set(signal.actionIds) : undefined;
  const immediateOperationActionId =
    signal.kind === "convert_immediate_operation"
      ? signal.actionIds[0]
      : undefined;
  const visibleCardPayoutActionId =
    signal.kind === "convert_visible_card_payout"
      ? signal.actionIds[0]
      : undefined;
  const operationThresholdActionId =
    signal.kind === "prepare_immediate_operation"
      ? signal.actionIds[0]
      : undefined;
  const liquidityActionId =
    signal.kind === "develop_liquidity" ? signal.actionIds[0] : undefined;
  const startRezChoiceActionId =
    signal.kind === "resolve_start_rez_choice"
      ? signal.actionIds[0]
      : undefined;
  const optionalActionCapacityActionId =
    signal.kind === "resolve_optional_action_capacity_offer"
      ? signal.actionIds[0]
      : undefined;
  return context.actionCandidates
    .filter(
      (candidate) =>
        (signal.kind === "develop_campaign"
          ? campaignActionIds!.has(candidate.actionId) &&
            (signal.startRezChoiceBinding
              ? candidate.actionId === signal.startRezChoiceBinding.actionId &&
                candidate.semanticActionType === "choice.resolve"
              : candidate.sourceCardInstanceId === signal.sourceInstanceId &&
                candidate.sourceDefinitionId === signal.sourceDefinitionId &&
                candidate.semanticActionType ===
                  (signal.phase === "install"
                    ? "install.card"
                    : signal.phase === "advance"
                      ? "score.advance_card"
                      : "corp_window.rez")) &&
            (signal.cadence.kind !== "immediate_on_rez" ||
              certifiedImmediateRootRezCampaignCandidate(candidate, signal))
          : signal.kind === "convert_immediate_operation"
            ? candidate.actionId === immediateOperationActionId &&
              immediateOperationCandidateMatchesSignal(candidate, signal)
            : signal.kind === "convert_visible_card_payout"
              ? candidate.actionId === visibleCardPayoutActionId &&
                visibleCardPayoutCandidateMatchesSignal(candidate, signal)
              : signal.kind === "prepare_immediate_operation"
                ? candidate.actionId === operationThresholdActionId &&
                  corpExactBasicLiquidCreditCandidate(candidate)
                : signal.kind === "develop_liquidity"
                  ? candidate.actionId === liquidityActionId &&
                    corpExactBasicLiquidCreditCandidate(candidate)
                  : signal.kind === "resolve_start_rez_choice"
                    ? candidate.actionId === startRezChoiceActionId &&
                      candidate.semanticActionType === "choice.resolve"
                    : signal.kind === "resolve_optional_action_capacity_offer"
                      ? candidate.actionId === optionalActionCapacityActionId &&
                        optionalActionCapacityCandidateMatchesSignal(
                          candidate,
                          signal,
                        )
                      : candidate.actionId === exactFundingHead &&
                        immediateCorpLiquidCreditGain(candidate) > 0) &&
        corpEconomyCandidateHasExecutablePayload(context.input, candidate),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.kind === "develop_campaign"
          ? economyDevelopmentStepValue(context, candidate, signal)
          : signal.kind === "convert_immediate_operation"
            ? economyImmediateOperationStepValue(signal)
            : signal.kind === "convert_visible_card_payout"
              ? economyVisibleCardPayoutStepValue(signal)
              : signal.kind === "prepare_immediate_operation"
                ? economyOperationThresholdStepValue(signal)
                : signal.kind === "develop_liquidity"
                  ? -9_999
                  : signal.kind === "resolve_start_rez_choice"
                    ? 1
                    : signal.kind === "resolve_optional_action_capacity_offer"
                      ? signal.decision === "accept"
                        ? 100
                        : 1
                      : immediateCorpLiquidCreditGain(candidate) * 10,
    }));
}

export function corpExactBasicLiquidCreditCandidate(
  candidate: ActionSemanticCandidate,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "basic_action" &&
    candidate.actionType === "gain_credit" &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.costProfile.clickCost === 1 &&
    (candidate.costProfile.creditCost === undefined ||
      candidate.costProfile.creditCost === 0) &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === 1 &&
    projection.creditCost === 0 &&
    projection.grossLiquidCreditGain === 1 &&
    projection.netLiquidCreditGain === 1 &&
    projection.cardsDrawn === 0 &&
    projection.cardsConsumed === 0 &&
    projection.netHandDelta === 0 &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    ((projection.source === "basic_action_contract" &&
      projection.confidence === "medium") ||
      (projection.source === "legal_action_payload" &&
        projection.confidence === "high"))
  );
}

function certifiedImmediateRootRezCampaignCandidate(
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyDevelopmentSignal,
): boolean {
  const projection = candidate.economyProjection;
  return (
    signal.phase === "rez" &&
    signal.cadence.kind === "immediate_on_rez" &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.reliability === "guaranteed" &&
    projection.source === "legal_action_payload" &&
    projection.confidence === "high" &&
    Number.isSafeInteger(projection.grossLiquidCreditGain) &&
    projection.grossLiquidCreditGain === signal.payback.projectedCredits &&
    Number.isSafeInteger(projection.creditCost) &&
    projection.creditCost === signal.payback.setupCreditCost &&
    Number.isSafeInteger(projection.netLiquidCreditGain) &&
    projection.netLiquidCreditGain === signal.payback.projectedNetCredits &&
    projection.netLiquidCreditGain > 0 &&
    signal.payback.horizonTurns === 0
  );
}

export function assessCorpEconomyFundingRoute(
  context: PlanSchedulerContext,
  signal: CorpEconomyParentFundingSignal | CorpEconomyReserveSignal,
): CorpEconomyFundingRouteAssessment {
  const candidates = context.actionCandidates.filter(
    (candidate) =>
      signal.actionIds.includes(candidate.actionId) &&
      immediateCorpLiquidCreditGain(candidate) > 0 &&
      candidate.economyProjection?.reliability === "guaranteed" &&
      corpEconomyCandidateHasExecutablePayload(context.input, candidate),
  );
  const currentCredits = context.input.playerView.own.credits;
  const demandForTarget = (
    targetCredits: number,
    evidence: readonly string[],
  ) =>
    createCreditDemand({
      demandId: signal.needId,
      side: "corp",
      ...(signal.kind === "parent_funding" && signal.parentPlanInstanceId
        ? { sourcePlanId: signal.parentPlanInstanceId }
        : {}),
      purpose: signal.urgentForScore
        ? "current_score_window"
        : "tactical_reserve",
      priority: signal.urgentForScore
        ? "current_foreground_plan"
        : "tactical_reserve",
      hardness: signal.kind === "parent_funding" ? "hard" : "soft",
      deadline: "end_of_current_turn",
      currentCredits,
      targetCredits,
      acceptedCreditRestrictions: ["general"],
      evidence,
    });
  const fullTargetCredits =
    signal.kind === "reserve"
      ? signal.targetCredits
      : (signal.scoreFundingMilestone?.targetCredits ??
        signal.incrementalDefenseReserve?.targetCredits ??
        currentCredits + signal.gap);
  if (!Number.isFinite(currentCredits) || !Number.isFinite(fullTargetCredits)) {
    return {
      routeId: `${signal.needId}:uncovered`,
      status: "uncovered",
      reliability: "contingent",
      evidence: [signal.evidenceCode, "corp_funding_target_invalid"],
    };
  }
  const fullTargetDemand = demandForTarget(fullTargetCredits, [
    signal.evidenceCode,
  ]);
  const fullTargetResult = searchFundingRoutes({
    demand: fullTargetDemand,
    candidates,
    remainingClicks: context.input.playerView.own.clicks,
  });
  let result = fullTargetResult;
  const progressEvidence: string[] = [];
  const exactIncrementalDefenseReserve =
    signal.kind === "parent_funding" &&
    signal.immediateDefenseConversion === true &&
    signal.incrementalDefenseReserve !== undefined &&
    typeof signal.parentPlanInstanceId === "string" &&
    signal.parentPlanInstanceId.length > 0 &&
    typeof signal.parentNeedId === "string" &&
    signal.parentNeedId.length > 0 &&
    Number.isFinite(signal.gap) &&
    signal.gap > 0 &&
    Number.isFinite(signal.incrementalDefenseReserve.targetCredits) &&
    signal.incrementalDefenseReserve.targetCredits > currentCredits &&
    signal.incrementalDefenseReserve.targetCredits - currentCredits ===
      signal.gap &&
    signal.incrementalDefenseReserve.serverId.length > 0 &&
    signal.incrementalDefenseReserve.iceInstanceId.length > 0;
  const exactIncrementalScoreFunding =
    signal.kind === "parent_funding" &&
    signal.needId.startsWith("score-support:") &&
    signal.parentPlanInstanceId?.startsWith("plan:corp.score_agenda:") ===
      true &&
    signal.delegatedPriorityClass !== undefined &&
    signal.urgentForScore === true &&
    signal.scoreFundingMilestone?.remainingGap === signal.gap &&
    signal.scoreFundingMilestone.observedCredits === currentCredits &&
    signal.scoreFundingMilestone.targetCredits ===
      currentCredits + signal.gap &&
    Number.isFinite(signal.gap) &&
    signal.gap > 0;
  const exactIncrementalAmbushFunding =
    signal.kind === "parent_funding" &&
    (signal.needId.startsWith("ambush-funding:") ||
      signal.needId.startsWith("ambush-defense-funding:")) &&
    signal.parentPlanInstanceId?.startsWith("plan:corp.ambush_and_bluff:") ===
      true &&
    signal.parentNeedId === signal.needId &&
    signal.delegatedPriorityClass === undefined &&
    (signal.parentPriorityClass === "P5" ||
      (signal.needId.startsWith("ambush-defense-funding:") &&
        signal.parentPriorityClass === "P4")) &&
    Number.isFinite(signal.gap) &&
    signal.gap > 0;
  const incrementalProgressAllowed =
    (signal.kind === "reserve" &&
      Number.isFinite(signal.targetCredits) &&
      currentCredits < signal.targetCredits) ||
    exactIncrementalDefenseReserve ||
    exactIncrementalScoreFunding ||
    exactIncrementalAmbushFunding;
  if (
    incrementalProgressAllowed &&
    fullTargetResult.bestRoute.status === "uncovered"
  ) {
    const maximumSingleActionGain = Math.max(
      0,
      ...candidates.map((candidate) =>
        Math.floor(immediateCorpLiquidCreditGain(candidate)),
      ),
    );
    const incrementalGap = Math.min(
      fullTargetCredits - currentCredits,
      maximumSingleActionGain,
    );
    if (incrementalGap > 0) {
      const incrementalTarget = currentCredits + incrementalGap;
      const incrementalResult = searchFundingRoutes({
        demand: demandForTarget(incrementalTarget, [
          signal.evidenceCode,
          "corp_reserve_incremental_progress_contract",
          `corp_reserve_final_target:${fullTargetCredits}`,
          `corp_reserve_incremental_target:${incrementalTarget}`,
        ]),
        candidates,
        remainingClicks: context.input.playerView.own.clicks,
      });
      if (
        incrementalResult.bestRoute.status === "covered_guaranteed" &&
        incrementalResult.bestRoute.reliability === "guaranteed"
      ) {
        result = incrementalResult;
        const evidencePrefix =
          signal.kind === "reserve"
            ? "corp_reserve"
            : exactIncrementalScoreFunding
              ? "corp_incremental_score_funding"
              : exactIncrementalAmbushFunding
                ? "corp_incremental_ambush_funding"
                : "corp_incremental_defense_reserve";
        progressEvidence.push(
          `${evidencePrefix}_incremental_route:true`,
          `${evidencePrefix}_final_target:${fullTargetCredits}`,
          `${evidencePrefix}_incremental_target:${incrementalTarget}`,
        );
      }
    }
  }
  const route = result.bestRoute;
  const head =
    route.status === "covered_guaranteed" && route.reliability === "guaranteed"
      ? route.steps.find(
          (step) =>
            step.kind === "legal_action" &&
            step.ownTurnOffset === 0 &&
            typeof step.actionId === "string",
        )
      : undefined;
  return {
    routeId: route.routeId,
    status: route.status,
    reliability: route.reliability,
    ...(head?.actionId ? { headActionId: head.actionId } : {}),
    evidence: [...result.evidence, ...route.evidence, ...progressEvidence],
  };
}

export function immediateCorpLiquidCreditGain(
  candidate: ActionSemanticCandidate,
): number {
  const projection = candidate.economyProjection;
  if (
    !projection ||
    projection.kind !== "immediate_liquid" ||
    projection.timing !== "immediate" ||
    projection.creditRestriction !== "general"
  ) {
    return 0;
  }
  const projectedGain = projection.netLiquidCreditGain;
  return typeof projectedGain === "number" &&
    Number.isFinite(projectedGain) &&
    projectedGain > 0
    ? projectedGain
    : 0;
}

export function corpEconomyCandidateHasExecutablePayload(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): boolean {
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const drawCardsAmount = Number(action?.payload?.drawCardsAmount ?? 0);
  return !(drawCardsAmount > 0 && input.playerView.own.stackOrRdCount <= 0);
}

function economyDevelopmentStepValue(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyDevelopmentSignal,
): number {
  if (signal.cadence.kind === "counter_cashout_development")
    return Math.max(1, signal.payback.projectedNetCredits * 10);
  if (signal.phase === "rez")
    return Math.max(1, signal.payback.projectedNetCredits * 10);

  const targetServerId = candidateTargetIds(candidate).find(
    (targetId) => targetId === "new_remote" || targetId.startsWith("remote_"),
  );
  if (!targetServerId) return 10;
  if (targetServerId === "new_remote") {
    const installedScoreProjectExists = domain(context).scoreProjects.some(
      (project) => project.phase !== "install_agenda",
    );
    return installedScoreProjectExists ? 5 : 25;
  }
  const server = context.input.playerView.servers.find(
    (candidateServer) => candidateServer.id === targetServerId,
  );
  if (!server) return 10;
  if (server.root.length > 0) return 10;
  return 60 + Math.min(3, server.ice.length) * 10;
}

export function economyMaterialization(
  instance: PlanInstance,
  context: PlanSchedulerContext,
  signal: CorpEconomyNeedSignal,
): PlanMaterialization {
  const candidates = economyCandidates(context, signal);
  return {
    step: {
      stepId: `${instance.instanceId}:fund`,
      capability: {
        capabilityId: "develop_or_convert_corp_economy",
        semanticActionTypes: [
          ...new Set(
            candidates.map((entry) => entry.candidate.semanticActionType),
          ),
        ],
      },
      purpose:
        signal.kind === "develop_campaign"
          ? `Advance the admitted ${signal.sourceDefinitionId} economy campaign from ${signal.phase} to ${signal.completion.expectedState}.`
          : signal.kind === "convert_immediate_operation"
            ? `Convert the Engine-certified immediate ${signal.sourceDefinitionId} operation once, consuming its exact HQ source.`
            : signal.kind === "convert_visible_card_payout"
              ? `Take the exact currently quoted visible-card payout from ${signal.sourceDefinitionId}, then revalidate the source.`
              : signal.kind === "prepare_immediate_operation"
                ? `Take the exact Engine-certified Basic Credit once to make the reviewed ${signal.sourceDefinitionId} operation legal, then revalidate its new LegalAction.`
                : signal.kind === "develop_liquidity"
                  ? signal.residualCapacityOnly
                    ? `Use one otherwise unbound normal click for explicitly nonstrategic residual capacity in ${signal.turnKey}; claim no campaign or parent progress.`
                    : `Convert the exact Engine-certified Basic Credit action toward the stable, visible-demand target of ${signal.targetCredits} credits.`
                  : signal.kind === "resolve_start_rez_choice"
                    ? "Decline the exact current Corp start-of-turn rez choice because no reviewed economy campaign is admitted."
                    : signal.kind === "resolve_optional_action_capacity_offer"
                      ? signal.decision === "accept"
                        ? `Accept the exact current optional action-capacity offer from ${signal.sourceDefinitionId}; the granted action is replanned by its normal domain owner.`
                        : `Decline the exact current optional action-capacity offer from ${signal.sourceDefinitionId} because its restricted follow-up has no admitted productive route.`
                      : signal.kind === "parent_funding" &&
                          signal.restrictedCreditPreparations?.length
                        ? "Prepare conditional stored install/rez capacity or liquid funding for the bound installed-ICE reserve; revalidate the remaining gap after this current head."
                        : signal.kind === "parent_funding" &&
                            signal.restrictedCreditFunding
                          ? "Take the exact restricted payout for the bound current install/rez consumer, then return control to its resident parent."
                          : "Convert an immediate positive liquid-credit route for the bound Corp funding need.",
    },
    candidates,
  };
}

function optionalActionCapacityCandidateMatchesSignal(
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyOptionalActionCapacitySignal,
): boolean {
  const projection = candidate.actionCapacityProjection;
  if (signal.decision === "decline") {
    return (
      candidate.actionId === signal.actionIds[0] &&
      candidate.sourceKind === "card" &&
      candidate.actionType === "trigger_ability" &&
      candidate.sourceCardInstanceId === signal.sourceInstanceId &&
      candidate.sourceDefinitionId === signal.sourceDefinitionId &&
      projection?.followupActionCapacity === 0
    );
  }
  return (
    candidate.sourceKind === "card" &&
    candidate.actionType === "trigger_ability" &&
    candidate.semanticActionType === "score_conversion.gain_action_capacity" &&
    candidate.sourceCardInstanceId === signal.sourceInstanceId &&
    candidate.sourceDefinitionId === signal.sourceDefinitionId &&
    projection?.timing === "immediate" &&
    projection.reliability === "guaranteed" &&
    projection.followupActionCapacity === signal.followupActionCapacity &&
    projection.restriction === signal.restriction &&
    projection.allowedActionTypes.length === signal.allowedActionTypes.length &&
    signal.allowedActionTypes.every((actionType) =>
      projection.allowedActionTypes.includes(actionType),
    )
  );
}

function immediateOperationCandidateMatchesSignal(
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyImmediateOperationSignal,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "card" &&
    candidate.sourceCardInstanceId === signal.sourceInstanceId &&
    candidate.sourceDefinitionId === signal.sourceDefinitionId &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.actionType === "play_operation" &&
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === signal.conversion.clickCost &&
    projection.creditCost === signal.conversion.creditCost &&
    projection.grossLiquidCreditGain ===
      signal.conversion.grossLiquidCreditGain &&
    projection.netLiquidCreditGain === signal.conversion.netLiquidCreditGain &&
    projection.cardsDrawn === signal.conversion.cardsDrawn &&
    projection.cardsConsumed === signal.conversion.cardsConsumed &&
    projection.netHandDelta === signal.conversion.netHandDelta &&
    projection.payoutMode === signal.conversion.payoutMode &&
    projection.reliability === signal.conversion.reliability &&
    projection.source === signal.conversion.source &&
    projection.confidence === "high"
  );
}

function visibleCardPayoutCandidateMatchesSignal(
  candidate: ActionSemanticCandidate,
  signal: CorpEconomyVisibleCardWithdrawalSignal,
): boolean {
  const projection = candidate.economyProjection;
  return (
    candidate.sourceKind === "card" &&
    candidate.sourceCardInstanceId === signal.sourceInstanceId &&
    (candidate.sourceDefinitionId === undefined ||
      candidate.sourceDefinitionId === signal.sourceDefinitionId) &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.actionType === "activated_card_ability" &&
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    projection?.kind === "immediate_liquid" &&
    projection.timing === "immediate" &&
    projection.creditRestriction === "general" &&
    projection.clickCost === signal.conversion.clickCost &&
    projection.creditCost === signal.conversion.creditCost &&
    projection.grossLiquidCreditGain ===
      signal.conversion.grossLiquidCreditGain &&
    projection.netLiquidCreditGain === signal.conversion.netLiquidCreditGain &&
    projection.cardsDrawn === 0 &&
    projection.cardsConsumed === 0 &&
    projection.netHandDelta === 0 &&
    projection.payoutMode === "fixed" &&
    projection.reliability === "guaranteed" &&
    projection.source === "legal_action_payload" &&
    projection.confidence === "high"
  );
}

function economyImmediateOperationStepValue(
  signal: CorpEconomyImmediateOperationSignal,
): number {
  return (
    signal.conversion.netLiquidCreditGain * 20 +
    signal.conversion.cardsDrawn * 20
  );
}

function economyVisibleCardPayoutStepValue(
  signal: CorpEconomyVisibleCardWithdrawalSignal,
): number {
  return (
    (signal.withdrawalCampaign?.projectedNetCredits ??
      signal.conversion.netLiquidCreditGain) * 20
  );
}

function economyOperationThresholdStepValue(
  signal: CorpEconomyOperationThresholdSignal,
): number {
  return 50 + signal.futureConversion.strategicEconomyValue * 10;
}
