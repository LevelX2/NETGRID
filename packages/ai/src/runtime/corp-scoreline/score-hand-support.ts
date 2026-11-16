import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type AiDecisionInput } from "@netgrid/shared";
import { corpScorelineFeasibilityForDecisionInput } from "../corp-scoreline-feasibility";

export function corpReservedScoreServerIds(
  input: AiDecisionInput,
  scoreProjects: readonly CorpScoreProjectSignal[],
): ReadonlySet<string> {
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
      return project.agendaInstanceId !== undefined &&
        project.phase === "install_agenda" &&
        project.serverId?.startsWith("remote_") === true &&
        (exactLastClickContinuation || preparedScoreServer)
        ? [project.serverId]
        : [];
    }),
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
