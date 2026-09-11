import { type AiDecisionInput } from "@netgrid/shared";
import { type CorpScoreProjectSignal } from "../../plans/corp-core-plan-modules";

export function corpReservedScoreServerIds(
  input: AiDecisionInput,
  scoreProjects: readonly CorpScoreProjectSignal[],
): ReadonlySet<string> {
  return new Set(
    scoreProjects.flatMap((project) => {
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
