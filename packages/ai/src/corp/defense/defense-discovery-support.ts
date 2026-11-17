import { candidateTargetIds } from "../../actions/action-candidate-facts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
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
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { type CorpCentralDefenseAllocation } from "./corp-central-defense-allocation";
import { type CorpCentralDefenseDirectInstallRouteState } from "../../runtime/corp-economy/corp-defensive-draw";
import {
  corpRestrictedRezPreparationCandidates,
  currentCorpRestrictedCreditBanks,
} from "../../runtime/corp-restricted-credit-reserve";
import { hasExactNonNegativeCostProfile } from "../../runtime/exact-action-cost-facts";
import { technicalIdCompare } from "../../runtime/runtime-identifiers";
import { visibleCorpIceDefenseProfile } from "../../runtime/semantic-runtime-corp-effective-defense";
import {
  candidateIsVisibleCorpIceInstall,
  isCorpInstallServerId,
} from "../../runtime/visible-action-facts";
import { archivesHasVisibleKnownAgenda } from "../../runtime/visible-server-agenda-facts";
import { assessCorpSpendAgainstScoreFundingMilestones } from "../score/corp-score-funding";
import { corpInstalledIceHasFreeFullBreak } from "./corp-free-full-break";

export const CORP_DEFENSE_DOMAIN_SIGNAL_FACTS = {
  hasExactNonNegativeCostProfile,
  archivesHasVisibleKnownAgenda,
} satisfies CorpDefenseDomainSignalFacts;

export function corpDefenseSignalOwnsAction(
  signal: CorpDefenseSignal,
  actionId: string,
): boolean {
  if (
    signal.kind === "score_protection_terminal_install" ||
    signal.kind === "score_protection_install" ||
    signal.kind === "score_protection_staging_install" ||
    signal.kind === "score_protection_draw"
  ) {
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
      card.definitionId === 570
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
    (project) =>
      project.serverId === serverId &&
      project.feasible &&
      project.agendaInstanceId !== undefined &&
      (project.fundingGap ?? 0) === 0 &&
      project.protectionNeed?.baseline.knowledge === "known" &&
      project.protectionNeed.baseline.protection.protectsScore === false,
  );
  if (scoreParent) {
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
        corpInstalledIceHasFreeFullBreak(input, ice, serverId) ||
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
