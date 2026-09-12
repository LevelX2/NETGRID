import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import {
  type CorpDefenseSignal,
  type CorpGenericDefenseSignal,
} from "../../plans/corp-defense-contracts";
import {
  corpGlobalDefenseInstallRouteAssessment,
  type CorpDefenseDomainSignalFacts,
  type CorpLayeredIceStagingParent,
} from "./corp-defense-domain-signals";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type PriorityClass } from "../../plans/plan-assessment";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { type CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import { type CorpCentralDefenseDirectInstallRouteState } from "../../runtime/corp-economy/corp-defensive-draw";
import {
  corpRestrictedRezPreparationCandidates,
  currentCorpRestrictedCreditBanks,
} from "../../runtime/corp-restricted-credit-reserve";
import {
  corpRegionReplacementComponent,
  corpUpgradeInstallPlacementComponent,
  corpUpgradePlacementAssessment,
} from "../../runtime/corp-upgrade-placement";
import { hasExactNonNegativeCostProfile } from "../../runtime/exact-action-cost-facts";
import { technicalIdCompare } from "../../runtime/runtime-identifiers";
import { visibleCorpIceDefenseProfile } from "../../runtime/semantic-runtime-corp-effective-defense";
import {
  candidateIsVisibleCorpIceInstall,
  candidateTargetIds,
  isCorpInstallServerId,
} from "../../runtime/visible-action-facts";
import { archivesHasVisibleKnownAgenda } from "../../runtime/visible-server-agenda-facts";
import { assessCorpSpendAgainstScoreFundingMilestones } from "../score/corp-score-funding";
import { CorpDefensiveUpgradePlacement } from "./defense-runtime-types";

export const CORP_DEFENSE_DOMAIN_SIGNAL_FACTS = {
  hasExactNonNegativeCostProfile,
  archivesHasVisibleKnownAgenda,
} satisfies CorpDefenseDomainSignalFacts;

export function corpDefenseSignalOwnsAction(
  signal: CorpDefenseSignal,
  actionId: string,
): boolean {
  if (
    signal.kind === "score_protection_install" ||
    signal.kind === "score_protection_staging_install"
  ) {
    return signal.actionId === actionId;
  }
  if (signal.kind === "score_protection_draw") {
    return signal.actionId === actionId;
  }
  return signal.actionIds?.includes(actionId) === true;
}

export function corpResidentDelayedSuccessDefenseSignals(
  input: AiDecisionInput,
): CorpDefenseSignal[] {
  return input.playerView.servers.flatMap((server) =>
    server.root.flatMap((card) =>
      card.known &&
      card.rezzed === true &&
      card.definitionId === "onr_v1_358_dr-dreff"
        ? [
            {
              kind: "generic" as const,
              defenseId: `resident-delayed-success:${card.instanceId}`,
              serverId: server.id,
              phase: "activate_run_defense" as const,
              sourceDefinitionIds: [card.definitionId],
              actionIds: [],
              urgent: false,
              value: 0,
              evidenceCode:
                "corp_resident_delayed_success_defense_source_rezzed_on_attacked_server",
            },
          ]
        : [],
    ),
  );
}

export function corpLayeredIceStagingParent(
  scoreProjects: readonly CorpScoreProjectSignal[],
  remoteProjects: CorpCorePlanDomain["remoteProjects"],
  serverId: string,
  materialImmediateLiquidityAlternativeExists: boolean,
  exactExecutableScoreProjectAvailable: boolean,
): CorpLayeredIceStagingParent | undefined {
  if (
    (serverId !== "new_remote" && !serverId.startsWith("remote_")) ||
    materialImmediateLiquidityAlternativeExists ||
    exactExecutableScoreProjectAvailable
  ) {
    return undefined;
  }
  const scoreParent = scoreProjects.find(
    (project) => project.serverId === serverId && project.feasible,
  );
  const selectedScoreParentMatches =
    scoreParent?.serverId === serverId &&
    scoreParent.agendaInstanceId !== undefined &&
    (scoreParent.fundingGap ?? 0) === 0 &&
    scoreParent.protectionNeed?.baseline.knowledge === "known" &&
    scoreParent.protectionNeed.baseline.protection.protectsScore === false;
  if (scoreParent && selectedScoreParentMatches) {
    return { kind: "score", parentProjectId: scoreParent.projectId };
  }
  const remoteParent = remoteProjects
    .filter(
      (project) =>
        project.serverId === serverId &&
        project.purpose === "scoring_remote" &&
        project.need?.capability === "improve_remote_protection_path",
    )
    .sort((left, right) =>
      technicalIdCompare(left.projectId, right.projectId),
    )[0];
  return remoteParent
    ? {
        kind: "remote",
        parentProjectId: remoteParent.projectId,
        parentNeedId: remoteParent.need!.needId,
        targetRecoveryTurns: remoteParent.targetRecoveryTurns,
      }
    : undefined;
}

export function corpTurnCommitmentContainsExactAgendaAdvance(
  previous: ResidentPlanPortfolio | undefined,
  project: CorpScoreProjectSignal,
): boolean {
  if (!project.agendaInstanceId) return false;
  return (
    previous?.turnPlanCommitment?.phases.some((phase) =>
      phase.nodes.some(
        (node) =>
          node.invocation.semanticActionType === "score.advance_card" &&
          node.invocation.sourceCardInstanceId === project.agendaInstanceId,
      ),
    ) === true
  );
}

function postInstallCorpIceRezCost(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCardInstanceId: string,
  serverId: VisibleCorpRezCostQuote["targetServerId"],
): number | undefined {
  const payload = action.payload;
  const baseCredits = payload?.postInstallRezQuoteBaseCredits;
  const finalCredits = payload?.postInstallRezQuoteFinalCredits;
  if (
    payload?.postInstallRezQuoteComplete !== true ||
    payload.postInstallRezQuoteCardId !== sourceCardInstanceId ||
    payload.postInstallRezQuoteTargetServerId !== serverId ||
    payload.postInstallRezQuoteProjectedServerId !== serverId ||
    payload.postInstallRezQuoteExpiresAtStateVersion !==
      input.playerView.stateVersion ||
    !Number.isSafeInteger(baseCredits) ||
    (baseCredits as number) < 0 ||
    !Number.isSafeInteger(finalCredits) ||
    (finalCredits as number) < 0 ||
    payload.postInstallRezQuoteMandatoryAgendaPointCost !== 0 ||
    payload.postInstallRezQuoteMandatoryAdditionalCostKind !== undefined
  ) {
    return undefined;
  }
  return finalCredits as number;
}

export function corpTerminalCentralRezReserveSignals(
  input: AiDecisionInput,
  centralDefenseAllocation: CorpCentralDefenseAllocation | undefined,
  candidates: readonly ActionSemanticCandidate[],
): CorpGenericDefenseSignal[] {
  if (
    input.side !== "corp" ||
    input.playerView.timingPoint !== "corp_action.main" ||
    input.playerView.run !== undefined ||
    centralDefenseAllocation?.status !== "known"
  ) {
    return [];
  }
  return (["hq", "rd"] as const).flatMap((serverId) =>
    centralDefenseAllocation.evidence[serverId].threat === "terminal"
      ? corpTerminalServerRezReserveSignals(input, serverId, candidates)
      : [],
  );
}

function corpTerminalServerRezReserveSignals(
  input: AiDecisionInput,
  serverId: "hq" | "rd",
  candidates: readonly ActionSemanticCandidate[],
): CorpGenericDefenseSignal[] {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return [];
  const storedRestrictedCredits = Math.max(
    0,
    ...currentCorpRestrictedCreditBanks(input)
      .filter(
        (bank) =>
          bank.advancementCounters > 0 &&
          bank.generalCreditsAvailable === input.playerView.own.credits,
      )
      .map((bank) => bank.creditsPerCounter * bank.advancementCounters),
  );
  const reserveCandidate = server.ice
    .flatMap((ice) => {
      const quote = ice.effectiveRezCostQuote;
      const defense = visibleCorpIceDefenseProfile(ice);
      if (
        ice.rezzed === true ||
        !ice.definitionId ||
        !defense.isVisibleIce ||
        (!defense.hasImmediateStop &&
          !defense.hasMeaningfulTaxOrDamage &&
          !defense.hasEncounterDisruption) ||
        quote?.context !== "installed" ||
        quote.cardId !== ice.instanceId ||
        quote.targetServerId !== serverId ||
        quote.projectedServerId !== serverId ||
        quote.expiresAtStateVersion !== input.playerView.stateVersion ||
        quote.complete !== true ||
        quote.mandatoryAdditionalCosts.agendaPoints !== 0 ||
        !Number.isSafeInteger(quote.finalCredits) ||
        quote.finalCredits <=
          input.playerView.own.credits + storedRestrictedCredits
      ) {
        return [];
      }
      return [
        {
          ice,
          requiredCredits: quote.finalCredits,
          fundingGap:
            quote.finalCredits -
            input.playerView.own.credits -
            storedRestrictedCredits,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.fundingGap - right.fundingGap ||
        left.requiredCredits - right.requiredCredits ||
        technicalIdCompare(left.ice.instanceId, right.ice.instanceId),
    )[0];
  if (!reserveCandidate) return [];
  if (
    input.playerView.own.clicks === 0 &&
    !corpRestrictedRezPreparationCandidates(input, candidates, {
      targetIceInstanceId: reserveCandidate.ice.instanceId,
      targetServerId: serverId,
      requiredRezCredits: reserveCandidate.requiredCredits,
    }).some((preparation) => preparation.clickCost === 0)
  )
    return [];
  return [
    {
      kind: "generic",
      defenseId: `terminal-central-rez-reserve:${serverId}:${reserveCandidate.ice.instanceId}`,
      serverId,
      phase: "fund_rez_reserve",
      sourceDefinitionIds: [reserveCandidate.ice.definitionId!],
      targetIceInstanceId: reserveCandidate.ice.instanceId,
      urgent: true,
      centralPressure: "terminal",
      rezReserveNeed: {
        observedAtStateVersion: input.playerView.stateVersion,
        currentCredits: input.playerView.own.credits,
        requiredCredits: reserveCandidate.requiredCredits,
        fundingGap: reserveCandidate.fundingGap,
        ...(storedRestrictedCredits > 0 ? { storedRestrictedCredits } : {}),
      },
      value: 12,
      evidenceCode: `corp_terminal_central_rez_reserve_required:${serverId}:${reserveCandidate.ice.instanceId}:gap_${reserveCandidate.fundingGap}`,
    },
  ];
}

export function corpSelectedCentralDirectInstallRouteState(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  centralDefenseAllocation: CorpCentralDefenseAllocation | undefined,
): CorpCentralDefenseDirectInstallRouteState {
  if (centralDefenseAllocation?.status !== "known") {
    return { knowledge: "unknown" };
  }
  const selectedServerId = centralDefenseAllocation.selectedServerId;
  const assessments = candidates.flatMap((candidate) => {
    if (!candidateIsVisibleCorpIceInstall(input, candidate)) return [];
    const serverId = candidateTargetIds(candidate).find(isCorpInstallServerId);
    if (serverId !== selectedServerId) return [];
    return [
      corpGlobalDefenseInstallRouteAssessment(
        input,
        candidate,
        serverId,
        centralDefenseAllocation,
        CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
      ),
    ];
  });
  if (
    assessments.some(
      (assessment) =>
        assessment.knowledge === "known" &&
        (assessment.disposition === "funding_only" ||
          (assessment.disposition === "productive" &&
            assessment.projection.effect !== "no_progress")),
    )
  ) {
    return { knowledge: "known", disposition: "effect_capable" };
  }
  if (assessments.some((assessment) => assessment.knowledge === "unknown")) {
    return { knowledge: "unknown" };
  }
  return { knowledge: "known", disposition: "effect_missing" };
}

export function mergeDefenseSignals(
  values: readonly CorpDefenseSignal[],
): CorpDefenseSignal[] {
  const result = new Map<string, CorpDefenseSignal>();
  for (const value of values) {
    const previous = result.get(value.defenseId);
    if (!previous) {
      result.set(value.defenseId, value);
      continue;
    }
    if (previous.kind !== value.kind) {
      throw new Error(
        `Conflicting Corp defense signal kinds for ${value.defenseId}.`,
      );
    }
    if (value.kind !== "generic" || previous.kind !== "generic") {
      if (JSON.stringify(previous) !== JSON.stringify(value)) {
        throw new Error(
          `Conflicting exact Corp defense signals for ${value.defenseId}.`,
        );
      }
      continue;
    }
    const preferred = value.value > previous.value ? value : previous;
    result.set(value.defenseId, {
      ...preferred,
      sourceDefinitionIds: [
        ...new Set([
          ...previous.sourceDefinitionIds,
          ...value.sourceDefinitionIds,
        ]),
      ],
      ...(previous.actionIds || value.actionIds
        ? {
            actionIds: [
              ...new Set([
                ...(previous.actionIds ?? []),
                ...(value.actionIds ?? []),
              ]),
            ],
          }
        : {}),
      urgent: previous.urgent || value.urgent,
      ...(previous.centralPressure || value.centralPressure
        ? {
            centralPressure:
              previous.centralPressure === "terminal" ||
              value.centralPressure === "terminal"
                ? ("terminal" as const)
                : previous.centralPressure === "acute" ||
                    value.centralPressure === "acute"
                  ? ("acute" as const)
                  : ("material" as const),
          }
        : {}),
      value: Math.max(previous.value, value.value),
    });
  }
  return [...result.values()];
}

export function corpDefensiveUpgradePlacement(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scoreProjects: readonly CorpScoreProjectSignal[],
  centralAllocation?: CorpCentralDefenseAllocation,
): CorpDefensiveUpgradePlacement | undefined {
  if (
    candidate.semanticActionType !== "install.card" ||
    !candidate.sourceDefinitionId
  ) {
    return undefined;
  }
  const hint = AI_HINTS_BY_CARD.get(candidate.sourceDefinitionId);
  const exactAgendaStealTax =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "accessed_card" &&
        effect.timing === "on_access" &&
        effect.target === "agenda_steal_cost" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true;
  const exactRemoteAgendaStealTax =
    exactAgendaStealTax &&
    hint?.effects?.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "fort" &&
        effect.timing === "persistent" &&
        effect.target === "remote.agenda_steal_tax",
    ) === true;
  const exactCentralAgendaStealTax =
    exactAgendaStealTax &&
    hint?.functionSignals?.includes("access.agenda_steal_tax") === true;
  const exactFortRezSupport =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "rez_discount" &&
        effect.scope === "fort" &&
        effect.timing === "during_run" &&
        effect.target === "ice.corp_rez_discount",
    ) === true;
  const exactPassIceTax =
    hint?.effects?.some(
      (effect) =>
        effect.kind === "run_tax" &&
        effect.scope === "fort" &&
        effect.timing === "during_run" &&
        effect.target === "run.corp_pay_or_end_run" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    ) === true &&
    hint.effects.some(
      (effect) =>
        effect.kind === "remote_protection" &&
        effect.scope === "fort" &&
        effect.timing === "persistent" &&
        effect.target === "remote.scoring_protection",
    );
  const assignedToDefense =
    exactFortRezSupport ||
    exactPassIceTax ||
    exactRemoteAgendaStealTax ||
    exactCentralAgendaStealTax ||
    (hint?.roles?.includes("remote_support") === true &&
      hint?.remoteRole?.kind === "scoring_protection" &&
      hint.remoteRole.serverScope === "fort" &&
      hint.functionSignals?.includes("remote.scoring_protection") === true &&
      hint.functionSignals.includes("run.corp_pay_or_end_run")) ||
    (hint?.remoteRole?.kind === "agenda_steal_tax" &&
      hint.remoteRole.serverScope === "fort" &&
      hint.planRoles?.includes("remote_upgrade_tax") === true &&
      hint.planRoles.includes("protect_remote") &&
      hint.functionSignals?.includes("remote.agenda_steal_tax") === true &&
      hint.functionSignals.includes("tax.runner_credit") &&
      hint.effects?.some(
        (effect) =>
          effect.kind === "run_tax" &&
          effect.scope === "accessed_card" &&
          effect.timing === "on_access" &&
          typeof effect.amount === "number" &&
          effect.amount > 0,
      ) === true &&
      hint.effects.some(
        (effect) =>
          effect.kind === "remote_protection" &&
          effect.scope === "fort" &&
          effect.timing === "persistent",
      ));
  const legalAction = input.legalActions.find(
    (action) => action.actionId === candidate.actionId,
  );
  const sourceCard = candidate.sourceCardInstanceId
    ? input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      )
    : undefined;
  const serverId = candidateTargetIds(candidate).find(isCorpInstallServerId);
  if (!legalAction || !sourceCard || !serverId) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "Every defensive upgrade install requires a visible source card, exact LegalAction, and exact target server before the defense portfolio may assess it.",
    });
  }
  if (
    exactCentralAgendaStealTax &&
    (serverId === "hq" || serverId === "rd") &&
    (centralAllocation?.status !== "known" ||
      centralAllocation.selectedServerId !== serverId ||
      centralAllocation.evidence[serverId].threat === "none")
  ) {
    return {
      evidenceCode: `corp_defense_support_rejected:${serverId}:central_allocation_${
        centralAllocation?.status === "known"
          ? centralAllocation.selectedServerId
          : "unknown"
      }`,
    };
  }
  const roles = rolesForDeckDoctrineCard(candidate.sourceDefinitionId);
  const placement = corpUpgradePlacementAssessment({
    input,
    action: legalAction,
    roles,
    actionSemanticCandidate: candidate,
    sourceCard,
    serverId,
  });
  if (!placement) {
    if (!assignedToDefense) return undefined;
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "The defensive upgrade has a declared plan role but no complete placement assessment.",
    });
  }
  if (!assignedToDefense && placement.recommendation !== "defer") {
    return undefined;
  }
  const component =
    legalAction.payload?.regionReplacementWarning === true
      ? corpRegionReplacementComponent({
          input,
          action: legalAction,
          roles,
          actionSemanticCandidate: candidate,
          sourceCard,
          serverId,
        })
      : corpUpgradeInstallPlacementComponent({
          input,
          action: legalAction,
          roles,
          actionSemanticCandidate: candidate,
          sourceCard,
          serverId,
        });
  const activeRegionReplacement =
    legalAction.payload?.regionReplacementWarning === true &&
    placement.recommendation === "allow" &&
    placement.candidateActiveUtility.length > 0;
  if (!component) {
    throw new PlanResolutionFailure("missing_plan_module_coverage", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition:
        "The defensive upgrade has a declared plan role but no complete placement assessment and value component.",
    });
  }
  const evidenceCode =
    activeRegionReplacement ||
    (placement.recommendation === "allow" &&
      placement.candidateActiveUtility.length > 0 &&
      component.value > 0)
      ? `corp_defense_support_install:${serverId}:${component.key}`
      : `corp_defense_support_rejected:${serverId}:${placement.reason}:${component.key}`;
  const reserveAssessment = corpCardRoutePreservesScoreReserve(
    input,
    candidate,
    serverId,
    scoreProjects,
  );
  if (
    (!activeRegionReplacement &&
      (placement.recommendation !== "allow" ||
        placement.candidateActiveUtility.length === 0 ||
        component.value <= 0)) ||
    !reserveAssessment.preservesReserve
  ) {
    return {
      evidenceCode: reserveAssessment.preservesReserve
        ? evidenceCode
        : `corp_defense_support_rejected:${serverId}:score_reserve:${reserveAssessment.requiredCreditsAfterAction}`,
    };
  }
  const centralPressure =
    exactCentralAgendaStealTax &&
    centralAllocation?.status === "known" &&
    (serverId === "hq" || serverId === "rd")
      ? centralAllocation.evidence[serverId].threat
      : undefined;
  return {
    evidenceCode: `${evidenceCode}:reserve_after_action:${reserveAssessment.requiredCreditsAfterAction}`,
    signal: {
      kind: "generic",
      defenseId: `install-defense-support:${candidate.sourceCardInstanceId}:${serverId}`,
      serverId,
      phase: "install_defense_support",
      sourceDefinitionIds: [candidate.sourceDefinitionId],
      actionIds: [candidate.actionId],
      urgent: centralPressure === "acute" || centralPressure === "terminal",
      ...(centralPressure && centralPressure !== "none"
        ? { centralPressure }
        : {}),
      value: 100 + Math.max(0, component.value),
      evidenceCode: `${evidenceCode}:reserve_after_action:${reserveAssessment.requiredCreditsAfterAction}`,
    },
  };
}

export function corpCardRoutePreservesScoreReserve(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
  scoreProjects: readonly CorpScoreProjectSignal[],
  actionPriorityClass: PriorityClass = "P5",
): Readonly<{
  preservesReserve: boolean;
  requiredCreditsAfterAction: number;
}> {
  const continuationFloor = Math.max(
    0,
    ...scoreProjects
      .filter(
        (project) =>
          project.fundingMilestone === undefined &&
          project.serverId === serverId,
      )
      .map(
        (project) =>
          project.continuationReserve?.requiredCreditsBeforeNextCorpTurn ?? 0,
      ),
  );
  const milestoneAssessment = assessCorpSpendAgainstScoreFundingMilestones({
    currentCredits: input.playerView.own.credits,
    actionCreditCost: candidate.costProfile.creditCost,
    actionPriorityClass,
    scoreProjects,
  });
  const creditCost =
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0 &&
    Number.isSafeInteger(candidate.costProfile.creditCost) &&
    candidate.costProfile.creditCost !== undefined &&
    candidate.costProfile.creditCost >= 0
      ? candidate.costProfile.creditCost
      : undefined;
  const requiredCreditsAfterAction = Math.max(
    continuationFloor,
    milestoneAssessment.protectedCredits,
  );
  const preservesReserve =
    creditCost !== undefined &&
    milestoneAssessment.preservesMilestone &&
    input.playerView.own.credits - creditCost >= requiredCreditsAfterAction;
  return { preservesReserve, requiredCreditsAfterAction };
}
