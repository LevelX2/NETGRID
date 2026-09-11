import { corpEconomyPriorityClass } from "../economy/economy-plan-module";
import { corpGenericDefensePriorityClass } from "../../plans/corp-defense-funding-contract";
import { corpScorePriorityClass } from "../../plans/corp-score-priority";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";

import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { exactCurrentCorpDrawAdmissionProjection } from "../../runtime/corp-draw-action-facts";
import {
  assessCorpDrawAdmission,
  type CorpDrawAdmissionAssessment,
  type CorpDrawAdmissionPriority,
  type CorpDrawCapacityReleaseRoute,
} from "../../runtime/corp-draw-admission";
import {
  type CorpHandDomainRouteClaimInput,
  type CorpHandInventoryFacts,
} from "./hand-inventory-facts";
import { corpHandPriorityClass } from "./hand-management-plan-module";

export function corpHandDomainRouteClaims(
  domain: CorpPlanDomain,
): CorpHandDomainRouteClaimInput[] {
  const claims: CorpHandDomainRouteClaimInput[] = [];
  const add = (claim: {
    ownerModuleId: `corp.${string}`;
    dedupeKey: string;
    actionIds?: readonly string[];
    sourceInstanceIds?: readonly (string | undefined)[];
    readiness: CorpHandDomainRouteClaimInput["readiness"];
    evidenceCode: string;
    parentNeedId?: string;
  }) => {
    claims.push({
      ownerModuleId: claim.ownerModuleId,
      planInstanceId: planInstanceIdForProposal({
        moduleId: claim.ownerModuleId,
        dedupeKey: claim.dedupeKey,
      }),
      ...(claim.parentNeedId ? { parentNeedId: claim.parentNeedId } : {}),
      readiness: claim.readiness,
      actionIds: [...new Set(claim.actionIds ?? [])].sort(),
      sourceInstanceIds: [
        ...new Set(
          (claim.sourceInstanceIds ?? []).filter(
            (instanceId): instanceId is string => Boolean(instanceId),
          ),
        ),
      ].sort(),
      evidenceCode: claim.evidenceCode,
    });
  };

  for (const signal of domain.scoreProjects) {
    const actionIds = signal.actionIds ?? [];
    add({
      ownerModuleId: "corp.score_agenda",
      dedupeKey: signal.projectId,
      actionIds,
      sourceInstanceIds: [
        signal.agendaInstanceId,
        signal.setupNeed?.sourceCardInstanceId,
        signal.counterBank?.sourceCardInstanceId,
      ],
      readiness:
        signal.feasible && actionIds.length > 0
          ? "executable_now"
          : (signal.fundingGap ?? 0) > 0
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.setupNeed?.needId
        ? { parentNeedId: signal.setupNeed.needId }
        : {}),
    });
  }
  for (const signal of domain.economyNeeds) {
    const sourceInstanceId =
      "sourceInstanceId" in signal ? signal.sourceInstanceId : undefined;
    const supportRequired = "gap" in signal && signal.gap > 0;
    add({
      ownerModuleId: "corp.economy",
      dedupeKey: signal.needId,
      actionIds: signal.actionIds,
      sourceInstanceIds: [sourceInstanceId],
      readiness:
        signal.actionIds.length > 0
          ? "executable_now"
          : supportRequired
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...("parentNeedId" in signal && signal.parentNeedId
        ? { parentNeedId: signal.parentNeedId }
        : {}),
    });
  }
  for (const signal of domain.defenseNeeds) {
    const actionIds =
      signal.kind === "generic" ? (signal.actionIds ?? []) : [signal.actionId];
    const sourceInstanceId =
      signal.kind === "score_protection_install" ||
      signal.kind === "score_protection_staging_install"
        ? signal.sourceCardInstanceId
        : undefined;
    add({
      ownerModuleId: "corp.defend_servers",
      dedupeKey: "server-defense-portfolio",
      actionIds,
      sourceInstanceIds: [sourceInstanceId],
      readiness: actionIds.length > 0 ? "executable_now" : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.kind !== "generic"
        ? { parentNeedId: signal.parentNeedId }
        : {}),
    });
  }
  for (const signal of domain.punishCampaigns) {
    const actionIds = [
      ...(signal.actionIds ?? []),
      ...(signal.routeContract?.currentHeadActionId
        ? [signal.routeContract.currentHeadActionId]
        : []),
    ];
    add({
      ownerModuleId: "corp.punish_campaign",
      dedupeKey: signal.campaignId,
      actionIds,
      readiness:
        signal.feasible && actionIds.length > 0
          ? "executable_now"
          : signal.routeContract && signal.routeContract.fundingGap > 0
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.routeContract?.executionNeedId
        ? { parentNeedId: signal.routeContract.executionNeedId }
        : {}),
    });
  }
  for (const signal of domain.ambushes) {
    add({
      ownerModuleId: "corp.ambush_and_bluff",
      dedupeKey: signal.ambushId,
      actionIds: signal.actionIds,
      sourceInstanceIds: [signal.sourceInstanceId],
      readiness:
        signal.actionIds.length > 0 && signal.affordableOrSupportable
          ? "executable_now"
          : !signal.affordableOrSupportable
            ? "executable_with_support"
            : "blocked",
      evidenceCode: signal.evidenceCode,
    });
  }
  for (const signal of domain.handManagement) {
    const actionIds = signal.actionIds ?? [];
    add({
      ownerModuleId: "corp.hand_and_agenda_management",
      dedupeKey: signal.handPlanId,
      actionIds,
      sourceInstanceIds: [signal.sourceInstanceId],
      readiness:
        signal.routeAllowed === false
          ? "blocked"
          : actionIds.length > 0
            ? "executable_now"
            : "blocked",
      evidenceCode: signal.evidenceCode,
      ...(signal.parentNeedId ? { parentNeedId: signal.parentNeedId } : {}),
    });
  }
  return claims;
}

export function arbitrateCorpHandConversionBeforeDraw(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CorpPlanDomain,
  facts: CorpHandInventoryFacts,
): CorpPlanDomain {
  const releaseRoutes = corpExactHandCapacityReleaseRoutes(
    input,
    candidates,
    domain,
    facts,
  );
  const assessments: CorpDrawAdmissionAssessment[] = [];
  const knownAgendaInstanceIds = new Set(
    input.playerView.own.gripOrHq
      .filter((card) => card.known === true && card.type === "agenda")
      .map((card) => card.instanceId),
  );
  const knownNonAgendaCount = input.playerView.own.gripOrHq.filter(
    (card) => card.known === true && card.type !== "agenda",
  ).length;
  const consequenceFacts = {
    knownAgendaCount: knownAgendaInstanceIds.size,
    remainingDeckCardsBeforeDraw: input.playerView.own.stackOrRdCount,
  };
  const assess = (params: {
    routeId: string;
    ownerModuleId: CorpDrawAdmissionAssessment["ownerModuleId"];
    actionId: string;
    purpose: CorpDrawAdmissionAssessment["purpose"];
    priorityClass: CorpDrawAdmissionPriority;
    remainingAttempts: 0 | 1;
    parentProvidesExactSameTurnCapacityRelease?: boolean;
    allowFinalClickScoreMaterialReplacement?: boolean;
    terminalNeedBeforeMandatoryDraw?: boolean;
  }) => {
    const candidate = candidates.find(
      (entry) => entry.actionId === params.actionId,
    );
    const projectedSourceConsumption =
      candidate?.economyProjection?.cardsConsumed;
    const knownNonAgendaCleanupCandidates = Math.max(
      0,
      knownNonAgendaCount -
        (Number.isSafeInteger(projectedSourceConsumption) &&
        (projectedSourceConsumption ?? -1) >= 0
          ? projectedSourceConsumption!
          : 0),
    );
    const assessment = assessCorpDrawAdmission({
      ...params,
      handSize: facts.pressure.handSize,
      maximumHandSize: facts.pressure.maximumHandSize,
      currentClicks: input.playerView.own.clicks,
      drawProjection: candidate
        ? exactCurrentCorpDrawAdmissionProjection(input, candidate)
        : undefined,
      capacityReleaseRoutes: releaseRoutes,
      parentProvidesExactSameTurnCapacityRelease:
        params.parentProvidesExactSameTurnCapacityRelease ?? false,
      consequenceFacts: {
        ...consequenceFacts,
        safeDiscardCandidateCount: Math.max(
          knownNonAgendaCleanupCandidates,
          facts.cleanupProjection.discardCandidateInstanceIds.filter(
            (instanceId) => !knownAgendaInstanceIds.has(instanceId),
          ).length,
        ),
        terminalNeedBeforeMandatoryDraw:
          params.terminalNeedBeforeMandatoryDraw ?? false,
      },
    });
    assessments.push(assessment);
    return assessment.disposition === "admitted";
  };

  const defenseNeeds: CorpPlanDomain["defenseNeeds"] =
    domain.defenseNeeds.flatMap((signal): CorpPlanDomain["defenseNeeds"] => {
      if (signal.kind === "score_protection_draw") {
        return assess({
          routeId: signal.defenseId,
          ownerModuleId: "corp.defend_servers",
          actionId: signal.actionId,
          purpose: "score_defense_answer_search",
          priorityClass: signal.delegatedPriorityClass,
          remainingAttempts: signal.drawAttemptState.remainingAttempts,
          parentProvidesExactSameTurnCapacityRelease:
            signal.cleanupReplacementDraw === true,
          terminalNeedBeforeMandatoryDraw:
            signal.delegatedPriorityClass === "P1" ||
            signal.delegatedPriorityClass === "P2",
        })
          ? [signal]
          : [];
      }
      if (
        signal.kind !== "generic" ||
        signal.phase !== "draw_for_ice" ||
        !signal.actionIds ||
        signal.actionIds.length === 0
      ) {
        return [signal];
      }
      const admittedActionIds = signal.actionIds.filter((actionId) =>
        assess({
          routeId: `${signal.defenseId}:${actionId}`,
          ownerModuleId: "corp.defend_servers",
          actionId,
          purpose: "central_defense_answer_search",
          priorityClass: corpGenericDefensePriorityClass([signal]),
          remainingAttempts: signal.drawAttemptState?.remainingAttempts ?? 0,
          terminalNeedBeforeMandatoryDraw:
            signal.urgent === true && signal.centralPressure === "terminal",
        }),
      );
      return [{ ...signal, actionIds: admittedActionIds }];
    });
  const handManagement = domain.handManagement.map((signal) => {
    if (
      signal.phase !== "draw_for_plan" ||
      !signal.actionIds ||
      signal.actionIds.length === 0
    ) {
      return signal;
    }
    const priorityClass = corpEffectiveHandPriorityClass(domain, signal);
    const admittedActionIds = signal.actionIds.filter((actionId) =>
      assess({
        routeId: `${signal.handPlanId}:${actionId}`,
        ownerModuleId: "corp.hand_and_agenda_management",
        actionId,
        purpose: "score_material_search",
        priorityClass,
        remainingAttempts: signal.drawAttemptState?.remainingAttempts ?? 0,
        allowFinalClickScoreMaterialReplacement:
          signal.handPlanId === "draw-for-score-material",
        terminalNeedBeforeMandatoryDraw:
          priorityClass === "P1" || priorityClass === "P2",
      }),
    );
    return { ...signal, actionIds: admittedActionIds };
  });
  return {
    ...domain,
    defenseNeeds,
    handManagement,
    drawArbitrations: assessments.sort(
      (left, right) =>
        left.routeId.localeCompare(right.routeId) ||
        left.actionId.localeCompare(right.actionId),
    ),
  };
}

function corpExactHandCapacityReleaseRoutes(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CorpPlanDomain,
  facts: CorpHandInventoryFacts,
): CorpDrawCapacityReleaseRoute[] {
  const routesByActionId = new Map<
    string,
    Omit<CorpDrawCapacityReleaseRoute, "clickCost" | "netHandDelta">
  >();
  for (const signal of domain.economyNeeds) {
    const priorityClass = corpEconomyPriorityClass(signal);
    const withinClassValue =
      signal.kind === "convert_immediate_operation"
        ? signal.conversion.netLiquidCreditGain * 20 +
          signal.conversion.cardsDrawn * 20
        : signal.kind === "prepare_immediate_operation"
          ? 50 + signal.futureConversion.strategicEconomyValue * 10
          : 0;
    for (const actionId of signal.actionIds) {
      routesByActionId.set(actionId, {
        actionId,
        priorityClass,
        withinClassValue,
      });
    }
  }
  for (const signal of domain.defenseNeeds) {
    if (
      signal.kind !== "generic" ||
      signal.phase !== "install_ice" ||
      signal.installRoute?.progressKind !== "score_material_capacity_release"
    ) {
      continue;
    }
    for (const actionId of signal.actionIds ?? []) {
      if (routesByActionId.has(actionId)) continue;
      routesByActionId.set(actionId, {
        actionId,
        priorityClass: "P5",
        withinClassValue: signal.value,
      });
    }
  }
  for (const signal of domain.handManagement) {
    const priorityClass = corpEffectiveHandPriorityClass(domain, signal);
    for (const actionId of signal.actionIds ?? []) {
      if (routesByActionId.has(actionId)) continue;
      routesByActionId.set(actionId, {
        actionId,
        priorityClass,
        withinClassValue: signal.value,
      });
    }
  }
  return facts.records
    .flatMap((record) => record.actionHandDeltas)
    .flatMap((delta) => {
      if (delta.netHandDelta >= 0) return [];
      const route = routesByActionId.get(delta.actionId);
      const candidate = candidates.find(
        (entry) => entry.actionId === delta.actionId,
      );
      const legalActionCurrent = input.legalActions.some(
        (action) =>
          action.actionId === delta.actionId &&
          action.expiresAtStateVersion === input.playerView.stateVersion,
      );
      if (
        !route ||
        !candidate ||
        !legalActionCurrent ||
        candidate.costProfile.costKnownStatus !== "known" ||
        candidate.costProfile.additionalCosts.length > 0 ||
        !Number.isSafeInteger(candidate.costProfile.clickCost) ||
        (candidate.costProfile.clickCost ?? 0) <= 0
      ) {
        return [];
      }
      return [
        {
          ...route,
          clickCost: candidate.costProfile.clickCost!,
          netHandDelta: delta.netHandDelta,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.priorityClass.localeCompare(right.priorityClass) ||
        left.actionId.localeCompare(right.actionId),
    );
}

function corpEffectiveHandPriorityClass(
  domain: CorpPlanDomain,
  signal: CorpPlanDomain["handManagement"][number],
): CorpDrawAdmissionPriority {
  if (signal.parentPlanInstanceId) {
    const parent = domain.scoreProjects.find(
      (project) =>
        planInstanceIdForProposal({
          moduleId: "corp.score_agenda",
          dedupeKey: project.projectId,
        }) === signal.parentPlanInstanceId,
    );
    if (parent) return corpScorePriorityClass(parent);
  }
  return corpHandPriorityClass(signal);
}
