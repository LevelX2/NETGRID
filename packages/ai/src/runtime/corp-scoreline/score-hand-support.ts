import { isRemoteServerId } from "@netgrid/shared";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type AiDecisionInput } from "@netgrid/shared";
import { corpScorelineFeasibilityForDecisionInput } from "../corp-scoreline-feasibility";

export function corpReservedScoreServerIds(
  input: AiDecisionInput,
  scoreProjects: readonly CorpScoreProjectSignal[],
): ReadonlySet<string> {
  if (input.side !== "corp") return new Set();
  const scoreline = corpScorelineFeasibilityForDecisionInput(input);
  return new Set(
    scoreProjects.flatMap((project) => {
      // A prepared server does not keep an impossible Score continuation
      // alive. Current executable closeouts and merely blocked future paths
      // retain their existing claims.
      if (
        !project.feasible &&
        !project.sameTurnCloseout &&
        (scoreline?.feasible === false ||
          scoreline?.deadline === "current_turn_only")
      )
        return [];
      const server = input.playerView.servers.find(
        (candidate) => candidate.id === project.serverId,
      );
      const exactLastClickContinuation =
        project.routeAssessment === "corp_last_click_score_install_deferred";
      const preparedScoreServer = (server?.ice.length ?? 0) > 0;
      return server !== undefined &&
        project.agendaInstanceId !== undefined &&
        project.phase === "install_agenda" &&
        isRemoteServerId(project.serverId) === true &&
        (exactLastClickContinuation || preparedScoreServer)
        ? [project.serverId]
        : [];
    }),
  );
}

/** A known score blocker must outlast the immediately profitable occupation of the slot. */
export function scoreInstallWaitsBeyondCampaignPayouts(
  project: CorpScoreProjectSignal,
  stateVersion: number,
  currentPayoutCredits: number,
  stagedProtectionOutOfReach: boolean,
): boolean {
  const need = project.protectionNeed;
  if (
    project.phase !== "install_agenda" ||
    project.feasible ||
    project.sameTurnCloseout ||
    project.deadlinePressure ||
    project.continuationReserve ||
    project.setupNeed ||
    (project.fundingMilestone &&
      project.fundingMilestone.deadline !== "multi_turn") ||
    !need ||
    need.parentProjectId !== project.projectId ||
    need.targetServerId !== project.serverId ||
    need.observedAtStateVersion !== stateVersion ||
    need.baseline.knowledge !== "known" ||
    need.baseline.protection.protectsScore
  )
    return false;
  if (project.routeAssessment === "corp_score_protection_funding_gap") {
    const gap = project.fundingMilestone?.remainingGap ?? project.fundingGap;
    return gap !== undefined && gap > currentPayoutCredits;
  }
  return (
    project.routeAssessment === "corp_score_protection_required" &&
    stagedProtectionOutOfReach
  );
}

/** Require the actual Engine trash and the current empty agenda/asset slot. */
export function corpCampaignSlotJustCleared(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const root = input.playerView.servers.find(
    (server) => server.id === serverId,
  )?.root;
  return (
    input.side === "corp" &&
    root !== undefined &&
    root.every((card) => card.known && card.type === "upgrade") &&
    [...input.playerView.publicEvents, ...input.eventTail].some(
      (event) =>
        event.stateVersionAfter === input.playerView.stateVersion &&
        event.type === "activated_card_ability" &&
        event.publicPayload.actor === "corp" &&
        event.publicPayload.serverId === serverId &&
        event.publicPayload.resolvedEffects?.some(
          (effect) => effect.kind === "trash_source_when_empty",
        ),
    )
  );
}

export function corpScoreProjectReservesSlotAfterCampaign(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
): boolean {
  return (
    project.feasible ||
    project.sameTurnCloseout ||
    project.deadlinePressure === true ||
    !project.serverId ||
    !corpCampaignSlotJustCleared(input, project.serverId)
  );
}

export type CorpScoreAccelerationSetupBinding = Readonly<{
  parent: CorpScoreProjectSignal;
  setupNeed: NonNullable<CorpScoreProjectSignal["setupNeed"]>;
}>;
