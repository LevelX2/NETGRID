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

export type CorpScoreAccelerationSetupBinding = Readonly<{
  parent: CorpScoreProjectSignal;
  setupNeed: NonNullable<CorpScoreProjectSignal["setupNeed"]>;
}>;
