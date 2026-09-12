import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { recentlyCompromisedCorpRemoteIds } from "../../plans/corp-opponent-campaign-continuity";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { type CorpCentralDefenseAllocation } from "../defense/corp-central-defense-allocation";
import { assessCorpOpeningRush } from "../../runtime/corp-opening-rush";
import {
  corpPreparedScoreProjectHasExecutableCurrentStep,
  corpPreparedScoreProjectHasImmediateFundingSupport,
} from "../defense/corp-score-protection-routes";
import { type CorpScorelineFeasibility } from "../../runtime/corp-scoreline-feasibility";
import { visibleCardIsAgenda } from "../../runtime/visible-action-facts";
import { corpExactCurrentBasicLiquidCreditCandidate } from "../economy/economy-domain-signals";
import { corpCounterBankScoreProjects } from "./corp-counter-bank-score-plan";
import { corpAssetPreservingSameTurnScoreRoutes } from "./score-asset-preservation";
import { corpConditionalScoreCreditFunding } from "./score-conditional-credit-funding";
import {
  corpRemoteHasEngineQuotedReusableScoreFriction,
  corpResidentScoreDefenseBinding,
} from "./corp-score-defense-continuity";
import {
  corpKnownDeferredLastClickScoreProject,
  corpNextTurnScoreContinuationProjects,
  corpPreferredDeckoutAgendaRecycleRouteAvailable,
  corpRemoteCreationUnlockScoreProjects,
  sameTurnScoreConversionProjectForCandidate,
  scoreProjectForCandidate,
  uniqueScoreProjects,
} from "./score-project-signals";
export function discoverCorpDirectScoreProjects({
  input,
  candidates,
  previous,
  scorelineFeasibility,
  centralDefenseAllocation,
}: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  previous: ResidentPlanPortfolio | undefined;
  scorelineFeasibility: CorpScorelineFeasibility | undefined;
  centralDefenseAllocation: CorpCentralDefenseAllocation;
}): {
  directScoreProjects: CorpScoreProjectSignal[];
  recentlyCompromisedRemoteIds: Set<string>;
  residentScoreDefenseBinding: ReturnType<
    typeof corpResidentScoreDefenseBinding
  >;
  residentScoreAgendaInstanceId: string | undefined;
} {
  const residentScoreDefenseBinding = corpResidentScoreDefenseBinding(
    previous,
    input,
    visibleCardIsAgenda,
  );
  const residentScoreAgendaInstanceId =
    residentScoreDefenseBinding?.agendaInstanceId;
  const recentlyCompromisedRemoteIds = new Set(
    recentlyCompromisedCorpRemoteIds(input, previous?.stateVersion),
  );
  const preferredDeckoutAgendaRecycleRouteAvailable =
    corpPreferredDeckoutAgendaRecycleRouteAvailable(input, candidates);
  const directScoreProjects = candidates.flatMap((candidate) =>
    scoreProjectForCandidate(
      input,
      candidate,
      scorelineFeasibility,
      centralDefenseAllocation,
      preferredDeckoutAgendaRecycleRouteAvailable,
      residentScoreDefenseBinding,
      recentlyCompromisedRemoteIds,
    ),
  );
  return {
    directScoreProjects,
    recentlyCompromisedRemoteIds,
    residentScoreDefenseBinding,
    residentScoreAgendaInstanceId,
  };
}

export function reconcileCorpScoreProjects({
  input,
  candidates,
  proposedAmbushes,
  directScoreProjects,
  recentlyCompromisedRemoteIds,
  residentScoreDefenseBinding,
  residentScoreAgendaInstanceId,
  centralDefenseAllocation,
}: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  proposedAmbushes: CorpPlanDomain["ambushes"];
  directScoreProjects: CorpScoreProjectSignal[];
  recentlyCompromisedRemoteIds: ReadonlySet<string>;
  residentScoreDefenseBinding: ReturnType<
    typeof corpResidentScoreDefenseBinding
  >;
  residentScoreAgendaInstanceId: string | undefined;
  centralDefenseAllocation: CorpCentralDefenseAllocation;
}): {
  requiredScoreCreditFloor: number;
  scoreProjects: CorpScoreProjectSignal[];
  deferredLastClickScoreProject: ReturnType<
    typeof corpKnownDeferredLastClickScoreProject
  >;
  exactLastClickLiquidityHeadAvailable: boolean;
  ownAgendas: number;
} {
  const counterBankScoreProjects = corpCounterBankScoreProjects(
    input,
    candidates,
    proposedAmbushes,
  );
  const remoteCreationUnlockScoreProjects = candidates.flatMap((candidate) =>
    corpRemoteCreationUnlockScoreProjects(input, candidate),
  );
  const nextTurnScoreContinuationProjects =
    corpNextTurnScoreContinuationProjects(input, candidates);
  const discoveredScoreProjects = [
    ...directScoreProjects,
    ...counterBankScoreProjects,
    ...remoteCreationUnlockScoreProjects,
    ...nextTurnScoreContinuationProjects,
    ...candidates.flatMap((candidate) => {
      const conversion = sameTurnScoreConversionProjectForCandidate(
        input,
        candidate,
        directScoreProjects,
        candidates,
      );
      return conversion ? [conversion] : [];
    }),
  ];
  const assetPreservation = corpAssetPreservingSameTurnScoreRoutes(
    input,
    candidates,
    discoveredScoreProjects,
  );
  const proposedScoreProjects = discoveredScoreProjects
    .filter(
      (project) =>
        !assetPreservation.dominatedProjectIds.has(project.projectId),
    )
    .map((project) =>
      corpConditionalScoreCreditFunding(input, candidates, project),
    );
  const ownAgendas = input.playerView.own.gripOrHq.filter(
    (card) => card.known && visibleCardIsAgenda(input, card),
  ).length;
  const agendaInstancesWithPreparedRemote = new Set(
    proposedScoreProjects
      .filter(
        (project) =>
          project.phase === "install_agenda" &&
          project.serverId !== undefined &&
          project.serverId !== "new_remote" &&
          !recentlyCompromisedRemoteIds.has(project.serverId) &&
          project.agendaInstanceId !== undefined,
      )
      .map((project) => project.agendaInstanceId!),
  );
  const agendaInstancesWithEngineQuotedReusableRemote = new Set(
    proposedScoreProjects
      .filter(
        (project) =>
          project.phase === "install_agenda" &&
          project.serverId !== undefined &&
          project.serverId !== "new_remote" &&
          !recentlyCompromisedRemoteIds.has(project.serverId) &&
          project.agendaInstanceId !== undefined &&
          corpRemoteHasEngineQuotedReusableScoreFriction(
            input,
            project.serverId,
          ),
      )
      .map((project) => project.agendaInstanceId!),
  );
  const actionableScoreProjectIds = new Set(
    proposedScoreProjects
      .filter(
        (project) =>
          project.phase === "install_agenda" &&
          project.serverId !== undefined &&
          project.agendaInstanceId !== undefined &&
          (project.serverId === "new_remote" ||
            !recentlyCompromisedRemoteIds.has(project.serverId)) &&
          agendaInstancesWithPreparedRemote.has(project.agendaInstanceId) &&
          (corpPreparedScoreProjectHasExecutableCurrentStep(
            input,
            candidates,
            project,
          ) ||
            corpPreparedScoreProjectHasImmediateFundingSupport(
              input,
              candidates,
              project,
            )),
      )
      .map((project) => project.projectId),
  );
  const agendaInstancesWithActionablePreparedRemote = new Set(
    proposedScoreProjects
      .filter(
        (project) =>
          project.phase === "install_agenda" &&
          project.serverId !== undefined &&
          project.serverId !== "new_remote" &&
          !recentlyCompromisedRemoteIds.has(project.serverId) &&
          project.agendaInstanceId !== undefined &&
          actionableScoreProjectIds.has(project.projectId),
      )
      .map((project) => project.agendaInstanceId!),
  );
  const concreteScoreProjectsBeforeOpeningRush = uniqueScoreProjects(
    proposedScoreProjects.filter(
      (project) =>
        !(
          project.phase === "install_agenda" &&
          project.serverId === "new_remote" &&
          !assetPreservation.preservingProjectIds.has(project.projectId) &&
          project.agendaInstanceId !== undefined &&
          (residentScoreDefenseBinding?.agendaInstanceId ===
            project.agendaInstanceId ||
            agendaInstancesWithEngineQuotedReusableRemote.has(
              project.agendaInstanceId,
            ) ||
            (agendaInstancesWithPreparedRemote.has(project.agendaInstanceId) &&
              (agendaInstancesWithActionablePreparedRemote.has(
                project.agendaInstanceId,
              ) ||
                !actionableScoreProjectIds.has(project.projectId))))
        ),
    ),
  );
  const concreteScoreProjects = concreteScoreProjectsBeforeOpeningRush.map(
    (project) => {
      if (
        project.routeAssessment ===
        "corp_recently_compromised_score_remote_requires_reprotection"
      ) {
        return project;
      }
      const actionId =
        project.actionIds?.length === 1 ? project.actionIds[0] : undefined;
      const openingRush = assessCorpOpeningRush({
        input,
        project,
        candidate: actionId
          ? candidates.find((candidate) => candidate.actionId === actionId)
          : undefined,
        centralDefenseAllocation,
      });
      if (!openingRush) return project;
      if (openingRush.status === "qualified") {
        return {
          ...project,
          openingRush,
          feasible: project.feasible,
          routeAssessment: "corp_opening_rush_engine_randomized" as const,
          evidenceCode: `corp_opening_rush_engine_randomized:${openingRush.quote.opportunityKey}`,
        };
      }
      return {
        ...project,
        openingRush,
      };
    },
  );
  const residentPreparedScoreProject =
    residentScoreAgendaInstanceId === undefined
      ? undefined
      : concreteScoreProjects.find(
          (project) =>
            project.agendaInstanceId === residentScoreAgendaInstanceId &&
            project.serverId === residentScoreDefenseBinding?.serverId &&
            project.phase === "install_agenda" &&
            project.serverId !== undefined &&
            project.serverId !== "new_remote" &&
            project.feasible,
        );
  const continuityBoundScoreProjects = residentPreparedScoreProject
    ? concreteScoreProjects.map((project) => {
        if (project.phase !== "install_agenda") return project;
        const competingTargetForResidentAgenda =
          project.agendaInstanceId === residentScoreAgendaInstanceId &&
          project.serverId !== residentPreparedScoreProject.serverId;
        const competingAgendaForResidentTarget =
          project.serverId === residentPreparedScoreProject.serverId &&
          project.agendaInstanceId !== residentScoreAgendaInstanceId;
        return competingTargetForResidentAgenda ||
          competingAgendaForResidentTarget
          ? {
              ...project,
              feasible: false,
              routeAssessment:
                "corp_resident_score_parent_dominates_sibling_route" as const,
              evidenceCode: `corp_resident_score_parent_dominates_sibling_route:${residentScoreAgendaInstanceId}:${residentPreparedScoreProject.serverId}`,
            }
          : project;
      })
    : concreteScoreProjects;
  // Missing HQ agendas are not an actionable scoring window. Optional draws
  // need an independently justified development or defense purpose; the
  // mandatory draw will expose fresh scoring material at its normal cadence.
  const scoreProjects: CorpScoreProjectSignal[] = [
    ...continuityBoundScoreProjects,
  ];
  const deferredLastClickScoreProject =
    corpKnownDeferredLastClickScoreProject(scoreProjects);
  const exactLastClickLiquidityHeadAvailable =
    input.playerView.own.clicks === 1 &&
    candidates.some((candidate) =>
      corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
    );
  const requiredScoreCreditFloor = Math.max(
    0,
    ...scoreProjects.map(
      (project) =>
        project.continuationReserve?.requiredCreditsBeforeNextCorpTurn ?? 0,
    ),
  );
  return {
    requiredScoreCreditFloor,
    scoreProjects,
    deferredLastClickScoreProject,
    exactLastClickLiquidityHeadAvailable,
    ownAgendas,
  };
}
