import { EconomyState } from "./economy-types";

import {
  assessment,
  domain,
  proposal,
  state,
} from "../../plans/corp-core-module-support";
import { CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { currentCorpCreditObligation } from "../../plans/corp-credit-obligation";
import { CorpGenericDefenseSignal } from "../../plans/corp-defense-contracts";
import {
  corpGenericDefensePriorityClass,
  genericDefenseFundingRequirement,
  genericDefenseFundingRequirementIsCurrent,
} from "../../plans/corp-defense-funding-contract";
import { corpScorePriorityClass } from "../../plans/corp-score-priority";
import type {
  GuaranteeLevel,
  PriorityClass,
} from "../../plans/plan-assessment";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type {
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import { corpRestrictedRezPreparationCandidates } from "../../runtime/corp-restricted-credit-reserve";
import {
  economyCandidates,
  economyMaterialization,
  immediateCorpLiquidCreditGain,
} from "./economy-routes";
import { CorpEconomyNeedSignal } from "./economy-types";

export function economyModule(): PlanModule {
  return {
    moduleId: "corp.economy",
    side: "corp",
    discover: (context) =>
      validatedEconomyNeeds(context)
        .economyNeeds.filter(
          (signal) =>
            signal.kind === "develop_campaign" ||
            signal.kind === "convert_immediate_operation" ||
            signal.kind === "convert_visible_card_payout" ||
            signal.kind === "prepare_immediate_operation" ||
            signal.kind === "develop_liquidity" ||
            signal.kind === "resolve_start_rez_choice" ||
            signal.kind === "resolve_optional_action_capacity_offer" ||
            signal.gap > 0,
        )
        .map((signal) =>
          proposal({
            moduleId: "corp.economy",
            dedupeKey: signal.needId,
            moduleState: { kind: "economy", signal } satisfies EconomyState,
            priorityClass: corpEconomyPriorityClass(signal),
            target:
              signal.kind === "develop_campaign" ||
              signal.kind === "convert_immediate_operation" ||
              signal.kind === "convert_visible_card_payout" ||
              signal.kind === "prepare_immediate_operation"
                ? { kind: "card", id: signal.sourceInstanceId }
                : { kind: "capability", id: signal.needId },
            routeExists: economyCandidates(context, signal).length > 0,
            supportable:
              signal.kind === "develop_campaign" &&
              signal.restrictedCreditNeed !== undefined,
            evidenceCode: signal.evidenceCode,
            ...(signal.kind === "parent_funding" && signal.parentPlanInstanceId
              ? {
                  parentInstanceId: signal.parentPlanInstanceId,
                  parentNeedId: signal.parentNeedId ?? signal.needId,
                  persistencePolicy: "flexible_support" as const,
                }
              : {}),
          }),
        ),
    assess: (instance, context, portfolio) => {
      const current = state<EconomyState>(instance);
      const currentSignal = validatedEconomyNeeds(context).economyNeeds.find(
        (signal) =>
          signal.needId === current.signal.needId &&
          signal.kind === current.signal.kind,
      );
      return assessment(
        instance,
        corpEconomyPriorityClass(currentSignal ?? current.signal),
        currentSignal !== undefined &&
          economyCandidates(context, currentSignal).length > 0,
        economyAssessmentValue(currentSignal ?? current.signal),
        portfolio.executorInstanceId,
        currentSignal?.kind === "develop_campaign" &&
          currentSignal.restrictedCreditNeed
          ? [
              {
                needId: currentSignal.restrictedCreditNeed.needId,
                capability: "fund_corp_install_or_rez",
                minimum: currentSignal.restrictedCreditNeed.gap,
                available: 0,
                deadline: "current_turn",
              },
            ]
          : [],
      );
    },
    materialize: (instance, _assessment, context) => ({
      ...economyMaterialization(
        instance,
        context,
        state<EconomyState>(instance).signal,
      ),
    }),
  };
}

export function validatedEconomyNeeds(
  context: PlanSchedulerContext,
): CorpCorePlanDomain {
  const currentDomain = domain(context);
  const requiredCredits = currentCorpCreditObligation(context.input);
  const invalidObligation = currentDomain.economyNeeds.find((signal) => {
    if (
      signal.kind !== "reserve" ||
      (signal.priorityClass !== "P1" &&
        signal.mandatoryCreditObligation === undefined)
    )
      return false;
    return (
      signal.priorityClass !== "P1" ||
      requiredCredits === undefined ||
      signal.mandatoryCreditObligation?.creditsDue !== requiredCredits ||
      signal.mandatoryCreditObligation.stateVersion !==
        context.input.playerView.stateVersion ||
      signal.targetCredits !== requiredCredits ||
      signal.gap !== requiredCredits - context.input.playerView.own.credits ||
      signal.gap <= 0 ||
      signal.actionIds.some(
        (id) =>
          !context.actionCandidates.some(
            (candidate) =>
              candidate.actionId === id &&
              immediateCorpLiquidCreditGain(candidate) > 0 &&
              candidate.economyProjection?.reliability === "guaranteed",
          ),
      )
    );
  });
  if (invalidObligation)
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((a) => a.type),
      owner: "plan_module",
      removalCondition:
        "Bind mandatory P1 credit funding to the current Engine obligation and guaranteed liquid funding actions.",
    });
  const invalidScoreParent = currentDomain.economyNeeds.find((signal) => {
    if (signal.kind !== "parent_funding") return false;
    const scoreFundingNeed = signal.needId.startsWith("score-support:");
    const scoreParentBound =
      signal.parentPlanInstanceId?.startsWith("plan:corp.score_agenda:") ===
      true;
    const scorePriorityDelegated = signal.delegatedPriorityClass !== undefined;
    if (!scoreFundingNeed && !scoreParentBound && !scorePriorityDelegated)
      return false;
    const projectId = signal.needId.slice("score-support:".length);
    const parentProject = currentDomain.scoreProjects.find(
      (project) => project.projectId === projectId,
    );
    const expectedParent = parentProject
      ? planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: parentProject.projectId,
        })
      : undefined;
    const expectedMilestone = parentProject?.fundingMilestone;
    const hasMilestoneContract =
      expectedMilestone !== undefined ||
      signal.scoreFundingMilestone !== undefined;
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    const validFundingRouteBinding =
      signal.actionIds.length > 0
        ? signal.actionIds.every((actionId) =>
            validFundingActions.has(actionId),
          )
        : signal.fundingRouteAssessment?.status === "uncovered" &&
          signal.fundingRouteAssessment.headActionId === undefined;
    return (
      !parentProject ||
      signal.parentPlanInstanceId !== expectedParent ||
      signal.parentNeedId !== signal.needId ||
      !scorePriorityDelegated ||
      signal.delegatedPriorityClass !== corpScorePriorityClass(parentProject) ||
      (hasMilestoneContract &&
        (!expectedMilestone ||
          signal.scoreFundingMilestone?.kind !== "score_credit_milestone" ||
          signal.scoreFundingMilestone.targetCredits !==
            expectedMilestone.targetCredits ||
          signal.scoreFundingMilestone.observedCredits !==
            expectedMilestone.observedCredits ||
          signal.scoreFundingMilestone.remainingGap !==
            expectedMilestone.remainingGap ||
          signal.scoreFundingMilestone.priorityClass !==
            expectedMilestone.priorityClass ||
          signal.gap !== expectedMilestone.remainingGap)) ||
      signal.evidenceCode !== parentProject.evidenceCode ||
      !validFundingRouteBinding
    );
  });
  if (invalidScoreParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidScoreParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind score funding need ${invalidScoreParent.needId} to its exact score parent, inherited P1-P4 priority class, matching evidence and current liquid-credit actions.`,
    });
  }
  const invalidAmbushParent = currentDomain.economyNeeds.find((signal) => {
    if (signal.kind !== "parent_funding") return false;
    const ambushFundingShape =
      signal.needId.startsWith("ambush-funding:") ||
      signal.parentPlanInstanceId?.startsWith("plan:corp.ambush_and_bluff:") ===
        true;
    if (!ambushFundingShape) return false;
    const defenseFunding = signal.needId.startsWith("ambush-defense-funding:");
    const sourceInstanceId = signal.needId.slice(
      (defenseFunding ? "ambush-defense-funding:" : "ambush-funding:").length,
    );
    const ambushes = (
      context.domain as
        | (CorpCorePlanDomain & {
            ambushes?: readonly {
              ambushId: string;
              sourceInstanceId: string;
              phase: string;
              evidenceCode: string;
              installRoute?: { fundingGap: number };
              defenseNeed?: {
                fundingGap: number;
                observedAtStateVersion: number;
                sourceInstanceId: string;
              };
            }[];
          })
        | undefined
    )?.ambushes;
    const ambush = ambushes?.find(
      (candidate) =>
        (candidate.phase === "install" ||
          (defenseFunding && candidate.phase === "recycle_rd")) &&
        candidate.sourceInstanceId === sourceInstanceId,
    );
    const expectedParent = ambush
      ? planInstanceIdForProposal({
          moduleId: "corp.ambush_and_bluff",
          dedupeKey: ambush.ambushId,
        })
      : undefined;
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    const validFundingRouteBinding =
      signal.actionIds.length > 0
        ? signal.actionIds.every((actionId) =>
            validFundingActions.has(actionId),
          )
        : signal.fundingRouteAssessment?.status === "uncovered" &&
          signal.fundingRouteAssessment.headActionId === undefined;
    return (
      !ambush ||
      (defenseFunding
        ? ambush.defenseNeed?.fundingGap
        : ambush.installRoute?.fundingGap) !== signal.gap ||
      (defenseFunding &&
        (ambush.defenseNeed?.observedAtStateVersion !==
          context.input.playerView.stateVersion ||
          ambush.defenseNeed.sourceInstanceId !== sourceInstanceId ||
          context.input.playerView.run !== undefined)) ||
      signal.parentPlanInstanceId !== expectedParent ||
      signal.parentNeedId !== signal.needId ||
      signal.delegatedPriorityClass !== undefined ||
      signal.parentPriorityClass !==
        (ambush.phase === "install" ? "P5" : "P4") ||
      signal.evidenceCode !== ambush.evidenceCode ||
      !validFundingRouteBinding
    );
  });
  if (invalidAmbushParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidAmbushParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind Ambush funding need ${invalidAmbushParent.needId} to its exact visible Ambush root, inherited phase priority, current quoted funding gap and liquid-credit actions.`,
    });
  }
  const punishCampaigns = (
    context.domain as
      | (CorpCorePlanDomain & {
          punishCampaigns?: readonly {
            campaignId: string;
            evidenceCode: string;
            guarantee: GuaranteeLevel;
            terminalCondition?: "runner_flatline" | "runner_deckout";
            visibleTerminalProjection: boolean;
            priorityClass?: "P4" | "P5";
            routeContract?: {
              quoteStatus: "complete" | "unknown";
              routeId: string;
              fundingNeedId: string;
              fundingGap: number;
              fundingActionIds: string[];
              horizon: "execute" | "fund" | "wait";
            };
          }[];
        })
      | undefined
  )?.punishCampaigns;
  const invalidPunishParent = currentDomain.economyNeeds.find((signal) => {
    if (
      signal.kind !== "parent_funding" ||
      !signal.needId.startsWith("punish-funding:")
    ) {
      return false;
    }
    const campaign = punishCampaigns?.find(
      (candidate) =>
        candidate.routeContract?.quoteStatus === "complete" &&
        candidate.routeContract.horizon === "fund" &&
        candidate.routeContract.fundingNeedId === signal.needId,
    );
    const expectedParent = campaign
      ? planInstanceIdForProposal({
          moduleId: "corp.punish_campaign",
          dedupeKey: campaign.campaignId,
        })
      : undefined;
    const expectedPriority =
      campaign &&
      campaign.terminalCondition === "runner_flatline" &&
      campaign.visibleTerminalProjection &&
      (campaign.guarantee === "visible_state_forced" ||
        campaign.guarantee === "robust_but_reactive")
        ? "P1"
        : (campaign?.priorityClass ?? "P4");
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    return (
      !campaign ||
      signal.parentPlanInstanceId !== expectedParent ||
      signal.parentNeedId !== signal.needId ||
      signal.gap !== campaign.routeContract?.fundingGap ||
      signal.evidenceCode !== campaign.evidenceCode ||
      signal.delegatedPriorityClass !== undefined ||
      signal.parentPriorityClass !== expectedPriority ||
      signal.actionIds.length === 0 ||
      signal.actionIds.some(
        (actionId) =>
          !campaign.routeContract?.fundingActionIds.includes(actionId) ||
          !validFundingActions.has(actionId),
      )
    );
  });
  if (invalidPunishParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidPunishParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind punish funding need ${invalidPunishParent.needId} to the exact complete current quoted campaign route, inherited parent priority, same-turn funding horizon and current liquid-credit action.`,
    });
  }
  const expectedDefenseParent = planInstanceIdForProposal({
    moduleId: "corp.defend_servers",
    dedupeKey: "server-defense-portfolio",
  });
  const invalidDefenseParent = currentDomain.economyNeeds.find((signal) => {
    if (signal.kind !== "parent_funding") return false;
    const isDefenseFundingShape =
      signal.needId.startsWith("defense-reserve:") ||
      signal.immediateDefenseConversion === true ||
      signal.incrementalDefenseReserve !== undefined ||
      signal.parentPlanInstanceId?.startsWith("plan:corp.defend_servers:") ===
        true;
    if (!isDefenseFundingShape) return false;
    const parentNeed = currentDomain.defenseNeeds.find(
      (need): need is CorpGenericDefenseSignal =>
        need.kind === "generic" && need.defenseId === signal.parentNeedId,
    );
    if (signal.restrictedCreditFunding || parentNeed?.restrictedRezFunding) {
      const quotes = parentNeed?.restrictedRezFunding?.quotes;
      return (
        !parentNeed ||
        !quotes?.length ||
        signal.needId !==
          `defense-restricted-funding:${parentNeed.defenseId}` ||
        signal.parentPlanInstanceId !== expectedDefenseParent ||
        signal.parentPriorityClass !==
          corpGenericDefensePriorityClass([parentNeed]) ||
        signal.evidenceCode !== parentNeed.evidenceCode ||
        signal.gap !== parentNeed.restrictedRezFunding?.gap ||
        signal.immediateDefenseConversion !== true ||
        signal.incrementalDefenseReserve !== undefined ||
        JSON.stringify(signal.restrictedCreditFunding) !==
          JSON.stringify(quotes) ||
        JSON.stringify(signal.actionIds) !==
          JSON.stringify(quotes.map((quote) => quote.request.payoutActionId)) ||
        quotes.some(
          (quote) =>
            !(context.input.corpRestrictedCreditRouteQuotes ?? []).some(
              (current) => JSON.stringify(current) === JSON.stringify(quote),
            ),
        ) ||
        economyCandidates(context, signal).length === 0
      );
    }
    const validFundingActions = new Set(
      context.actionCandidates
        .filter(immediateCorpLiquidCreditGain)
        .map((candidate) => candidate.actionId),
    );
    const requirement = parentNeed
      ? genericDefenseFundingRequirement(
          parentNeed,
          context.input.playerView.own.credits,
        )
      : undefined;
    const expectedPreparations =
      parentNeed?.rezReserveNeed && parentNeed.targetIceInstanceId
        ? corpRestrictedRezPreparationCandidates(
            context.input,
            context.actionCandidates,
            {
              targetIceInstanceId: parentNeed.targetIceInstanceId,
              targetServerId: parentNeed.serverId,
              requiredRezCredits: parentNeed.rezReserveNeed.requiredCredits,
            },
          )
        : [];
    for (const preparation of expectedPreparations)
      validFundingActions.add(preparation.actionId);
    if (
      JSON.stringify(signal.restrictedCreditPreparations ?? []) !==
      JSON.stringify(expectedPreparations)
    )
      return true;
    const exactNeedId = requirement
      ? `defense-reserve:${parentNeed!.serverId}:${requirement.iceInstanceId}`
      : undefined;
    return (
      signal.needId !== exactNeedId ||
      signal.immediateDefenseConversion !== true ||
      signal.parentPlanInstanceId !== expectedDefenseParent ||
      !parentNeed ||
      !requirement ||
      !genericDefenseFundingRequirementIsCurrent(
        context,
        parentNeed,
        requirement,
      ) ||
      signal.gap !== requirement.gap ||
      signal.parentPriorityClass !==
        corpGenericDefensePriorityClass([parentNeed]) ||
      signal.evidenceCode !== parentNeed.evidenceCode ||
      signal.incrementalDefenseReserve?.targetCredits !==
        requirement.targetCredits ||
      signal.incrementalDefenseReserve?.serverId !== parentNeed.serverId ||
      signal.incrementalDefenseReserve?.iceInstanceId !==
        requirement.iceInstanceId ||
      signal.actionIds.length === 0 ||
      signal.actionIds.some((actionId) => !validFundingActions.has(actionId))
    );
  });
  if (invalidDefenseParent) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: context.input.side,
      stateVersion: context.input.playerView.stateVersion,
      timingPoint: context.input.playerView.timingPoint,
      legalActionTypes: context.input.legalActions.map((action) => action.type),
      unresolvedActionIds: invalidDefenseParent.actionIds,
      owner: "plan_module",
      removalCondition: `Bind defense funding need ${invalidDefenseParent.needId} to the exact corp.defend_servers parent, its funding-only child route, inherited priority, matching evidence and current liquid-credit actions.`,
    });
  }
  return currentDomain;
}

export function corpEconomyPriorityClass(
  signal: CorpEconomyNeedSignal,
): PriorityClass {
  if (signal.kind === "parent_funding")
    return signal.delegatedPriorityClass ?? signal.parentPriorityClass ?? "P5";
  if (signal.kind === "convert_immediate_operation") return "P4";
  if (signal.kind === "convert_visible_card_payout") return "P4";
  if (signal.kind === "prepare_immediate_operation") return "P4";
  if (signal.kind === "develop_liquidity") return "P6";
  if (signal.kind === "resolve_start_rez_choice") return "P3";
  if (signal.kind === "resolve_optional_action_capacity_offer") return "P4";
  if (signal.kind === "reserve" && signal.priorityClass)
    return signal.priorityClass;
  if (
    signal.kind === "develop_campaign" &&
    signal.phase === "rez" &&
    signal.cadence.kind === "immediate_on_rez"
  )
    return "P3";
  if (
    signal.kind === "develop_campaign" &&
    signal.phase === "rez" &&
    (signal.cadence.kind === "finite_pool" ||
      signal.cadence.kind === "automatic_start_of_turn")
  )
    return "P4";
  if (
    signal.kind === "develop_campaign" &&
    signal.phase === "rez" &&
    signal.cadence.kind === "counter_cashout_development"
  )
    return "P4";
  return "P5";
}

export function economyAssessmentValue(signal: CorpEconomyNeedSignal): number {
  if (signal.kind === "parent_funding" && signal.restrictedCreditFunding) {
    return signal.gap * 20;
  }
  if (signal.kind === "develop_liquidity") return -9_999;
  if (signal.kind === "convert_immediate_operation") {
    return (
      signal.conversion.netLiquidCreditGain * 20 +
      signal.conversion.cardsDrawn * 20
    );
  }
  if (signal.kind === "convert_visible_card_payout") {
    return (
      (signal.withdrawalCampaign?.projectedNetCredits ??
        signal.conversion.netLiquidCreditGain) * 20
    );
  }
  if (signal.kind === "prepare_immediate_operation") {
    return 50 + signal.futureConversion.strategicEconomyValue * 10;
  }
  if (signal.kind === "resolve_start_rez_choice") return 1;
  if (signal.kind === "resolve_optional_action_capacity_offer")
    return signal.decision === "accept" ? 100 : 1;
  if (signal.kind === "develop_campaign") {
    return Math.max(1, signal.payback.projectedNetCredits * 20);
  }
  if (signal.kind === "reserve") return 100 + signal.gap * 20;
  if (signal.needId.startsWith("punish-funding:")) {
    return 1_000 + signal.gap * 20;
  }
  const readinessValue = signal.scoreFundingMilestone
    ? 320
    : signal.delegatedPriorityClass || signal.parentPriorityClass
      ? 300
      : signal.immediateDefenseConversion
        ? 180
        : 100;
  return Math.max(1, readinessValue - signal.gap * 20);
}
