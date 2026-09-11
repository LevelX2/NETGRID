import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { corpConditionalScoreCreditProfile } from "../../runtime/corp-canonical-card-facts";
import {
  assessBestFundedCorpScoreProtection,
  corpFundedScoreProtectionCertifiesBinding,
  type CorpFundedRemoteAccessRiskNeed,
  type CorpScoreReserve,
} from "../../runtime/corp-funded-score-protection";
import { finiteNonNegativeIntegerOrResolutionFailure } from "../../runtime/exact-action-cost-facts";
import { visibleOwnCardByInstanceId } from "../../runtime/runner-action-source-facts";
import {
  requireVisibleCandidateSource,
  visibleCardIsAgenda,
} from "../../runtime/visible-action-facts";
import {
  requireVisibleAgendaAdvancementRequirement,
  requireVisibleAgendaPoints,
  requireVisibleCardDefinition,
} from "../../runtime/visible-agenda-facts";
export function remainingAgendaAdvancementCreditsAfterAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard | undefined,
): number {
  const visibleAgenda =
    agenda ?? requireVisibleCandidateSource(input, candidate);
  const requirement = requireVisibleAgendaAdvancementRequirement(
    input,
    visibleAgenda,
  );
  const current = Math.max(0, visibleAgenda.advancementCounters ?? 0);
  const placedByCurrentAction =
    candidate.semanticActionType === "score.advance_card" ? 1 : 0;
  return Math.max(0, requirement - current - placedByCurrentAction);
}

function corpScoreReserveForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard,
  terminalScore: boolean,
  reserveClicksThisTurn: boolean,
): CorpScoreReserve {
  const actionCredits = finiteNonNegativeIntegerOrResolutionFailure(
    input,
    candidate.costProfile.creditCost,
    `Provide an exact non-negative credit cost for score route ${candidate.actionId}.`,
  );
  const actionClicks = finiteNonNegativeIntegerOrResolutionFailure(
    input,
    candidate.costProfile.clickCost,
    `Provide an exact non-negative click cost for score route ${candidate.actionId}.`,
  );
  const remainingAdvancementCredits =
    remainingAgendaAdvancementCreditsAfterAction(input, candidate, agenda);
  const conditionalPostScoreFloor = corpConditionalScoreCreditReserve(
    input,
    agenda,
    terminalScore,
  );
  return {
    creditBreakdown: [
      {
        reserveId: `score_action:${candidate.actionId}`,
        credits: actionCredits,
      },
      {
        reserveId: `remaining_advancement:${agenda.instanceId}`,
        credits: remainingAdvancementCredits,
      },
      {
        reserveId: `post_score_floor:${agenda.instanceId}`,
        credits: conditionalPostScoreFloor,
      },
    ],
    hardClickReserve: reserveClicksThisTurn
      ? actionClicks + remainingAdvancementCredits
      : 0,
  };
}

export function corpFundedScoreProtectionNeed(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard,
  projectId: string,
  serverId: string,
  terminalScore: boolean,
  reserveClicksThisTurn: boolean,
): CorpFundedRemoteAccessRiskNeed {
  const policy = corpScoreProtectionPolicy(input, agenda, serverId);
  const scoreReserve = corpScoreReserveForCandidate(
    input,
    candidate,
    agenda,
    terminalScore,
    reserveClicksThisTurn,
  );
  const server =
    serverId === "new_remote"
      ? undefined
      : input.playerView.servers.find(
          (candidateServer) => candidateServer.id === serverId,
        );
  if (serverId !== "new_remote" && !server) {
    throw new PlanResolutionFailure("step_target_mismatch", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Bind score protection need ${projectId} to visible server ${serverId}.`,
    });
  }
  const serverIce = (server?.ice ?? []).map((ice) => ({
    instanceId: ice.instanceId,
    known: ice.known,
    ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
    ...(ice.rezzed !== undefined ? { rezzed: ice.rezzed } : {}),
    ...(ice.strength !== undefined ? { strength: ice.strength } : {}),
    ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
    ...(ice.effectiveRunQuote
      ? { effectiveRunQuote: ice.effectiveRunQuote }
      : {}),
    ...(ice.effectiveRezCostQuote
      ? { effectiveRezCostQuote: ice.effectiveRezCostQuote }
      : {}),
  }));
  const baseline = assessBestFundedCorpScoreProtection({
    serverIce,
    runnerRig: input.playerView.opponent.rig ?? [],
    runnerSetAside: input.playerView.specialZones?.setAside ?? [],
    ...(input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
      : {}),
    ...(input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
      : {}),
    runnerCredits: input.playerView.opponent.credits,
    ...(input.playerView.activeSide === "corp" &&
    input.playerView.runnerNextTurnCreditClicks !== undefined
      ? {
          runnerPreparationCreditClicks:
            input.playerView.runnerNextTurnCreditClicks,
        }
      : {}),
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    availableCorpCredits: input.playerView.own.credits,
    availableCorpClicks: input.playerView.own.clicks,
    availableCorpAgendaPoints: input.playerView.own.agendaPoints,
    scoreReserve,
    maximumRunnerAccessSuccessProbability:
      policy.maximumRunnerAccessSuccessProbability,
  });
  return {
    needId: `score-protection:${projectId}`,
    parentProjectId: projectId,
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability:
        policy.maximumRunnerAccessSuccessProbability,
      policySource: policy.policySource,
    },
    scoreReserve,
    baseline,
  };
}

export function corpScoreProtectionNeedIsSatisfied(
  input: AiDecisionInput,
  need: CorpFundedRemoteAccessRiskNeed | undefined,
  expectedParentProjectId: string,
  expectedTargetServerId: string | undefined,
): boolean {
  return corpFundedScoreProtectionCertifiesBinding({
    need,
    expectedParentProjectId,
    expectedTargetServerId,
    observedAtStateVersion: input.playerView.stateVersion,
  });
}

export function corpScoreProtectionIsSatisfied(
  input: AiDecisionInput,
  project: Pick<
    CorpScoreProjectSignal,
    "projectId" | "serverId" | "protectionNeed"
  >,
): boolean {
  return corpScoreProtectionNeedIsSatisfied(
    input,
    project.protectionNeed,
    project.projectId,
    project.serverId,
  );
}

export function corpScoreRemainingAdvancementClicks(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
): number | undefined {
  if (project.continuationReserve) {
    return project.continuationReserve.remainingAdvancementCounters;
  }
  if (!project.agendaInstanceId) return undefined;
  const agenda = visibleOwnCardByInstanceId(input, project.agendaInstanceId);
  if (!agenda || !visibleCardIsAgenda(input, agenda)) return undefined;
  const requirement = requireVisibleAgendaAdvancementRequirement(input, agenda);
  const current =
    project.phase === "install_agenda"
      ? 0
      : Math.max(0, agenda.advancementCounters ?? 0);
  return Math.max(0, requirement - current);
}

export function corpScoreProjectNeedsProtectionMaturity(
  project: CorpScoreProjectSignal,
): boolean {
  return (
    project.routeAssessment === "corp_score_horizon_unbounded" ||
    project.routeAssessment === "corp_near_matchpoint_remote_maturity_required"
  );
}

function corpConditionalScoreCreditReserve(
  input: AiDecisionInput,
  agenda: VisibleCard,
  terminalScore: boolean,
): number {
  if (terminalScore) return 0;
  const definition = requireVisibleCardDefinition(input, agenda, "agenda");
  return corpConditionalScoreCreditProfile(definition.id)?.threshold ?? 0;
}

function corpScoreProtectionPolicy(
  input: AiDecisionInput,
  agenda: VisibleCard,
  serverId: string,
): {
  maximumRunnerAccessSuccessProbability: {
    numerator: number;
    denominator: number;
  };
  policySource: string;
} {
  const agendaPoints = requireVisibleAgendaPoints(input, agenda);
  const terminalStealRisk =
    input.playerView.opponent.agendaPoints + agendaPoints >=
    input.playerView.agendaPointsToWin;
  const urgentRushPressure =
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 3 ||
    input.playerView.opponent.agendaPoints + agendaPoints >=
      input.playerView.agendaPointsToWin - 2;
  const establishedRemoteLayerCount =
    serverId === "new_remote"
      ? 0
      : (input.playerView.servers.find((server) => server.id === serverId)?.ice
          .length ?? 0);
  if (
    !terminalStealRisk &&
    urgentRushPressure &&
    establishedRemoteLayerCount < 2
  ) {
    return {
      maximumRunnerAccessSuccessProbability: {
        numerator: 0,
        denominator: 1,
      },
      policySource: "corp_thin_remote_rush_zero_access_risk",
    };
  }
  if (
    !terminalStealRisk &&
    urgentRushPressure &&
    establishedRemoteLayerCount >= 2
  ) {
    return {
      maximumRunnerAccessSuccessProbability: {
        numerator: 1,
        denominator: 2,
      },
      policySource: "corp_established_remote_rush_moderate_access_risk",
    };
  }
  return {
    maximumRunnerAccessSuccessProbability: {
      numerator: 1,
      denominator: 4,
    },
    policySource: terminalStealRisk
      ? "corp_terminal_steal_strict_access_risk"
      : "corp_score_default_strict_access_risk",
  };
}
