import { type AiDecisionInput } from "@netgrid/shared";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import { assessCorpRemoteMaturityFromVisibleServer } from "../../runtime/corp-remote-maturity-assessment";
import { runnerRunPathCreditBudgetWithVisiblePools } from "../../visible-run-analysis";
import { buildCorpScoringRemoteProjectSignals } from "./scoring-remote-signals";
import { type CorpRemoteOccupancyClaim } from "./scoring-remote-types";
export function buildCorpScoringRemoteDiscovery({
  input,
  previous,
  scoreProjects,
  ambushes,
  availableRemoteRezCredits,
}: {
  input: AiDecisionInput;
  previous: ResidentPlanPortfolio | undefined;
  scoreProjects: readonly CorpScoreProjectSignal[];
  ambushes: CorpPlanDomain["ambushes"];
  availableRemoteRezCredits: number;
}): CorpCorePlanDomain["remoteProjects"] {
  const remoteOccupancyClaims: CorpRemoteOccupancyClaim[] = [
    ...scoreProjects.flatMap((project) =>
      project.feasible && project.serverId && project.serverId !== "new_remote"
        ? [
            {
              serverId: project.serverId,
              owner: "score" as const,
              ownerId: project.projectId,
            },
          ]
        : [],
    ),
    ...ambushes.flatMap((ambush) =>
      ambush.serverId && ambush.serverId !== "new_remote"
        ? [
            {
              serverId: ambush.serverId,
              owner: "ambush" as const,
              ownerId: ambush.ambushId,
            },
          ]
        : [],
    ),
  ];
  const { playerView } = input;
  return buildCorpScoringRemoteProjectSignals({
    input,
    ...(previous ? { previous } : {}),
    scoreProjects,
    remoteOccupancyClaims,
    assessMaturityForServer: (serverId, targetBand) => {
      const server =
        serverId === "new_remote"
          ? { ice: [], root: [] }
          : playerView.servers.find(
              (entry) =>
                entry.id === serverId && entry.id.startsWith("remote_"),
            );
      if (!server) return undefined;

      const runnerRig = playerView.opponent.rig ?? [];
      const runnerCreditBudget = runnerRunPathCreditBudgetWithVisiblePools(
        playerView.opponent.credits,
        runnerRig,
      );
      const { traceRulesProfile } = playerView;
      return assessCorpRemoteMaturityFromVisibleServer({
        observedAtStateVersion: playerView.stateVersion,
        targetServerId: serverId,
        targetBand,
        serverIce: server.ice,
        serverRoot: server.root,
        runnerRig,
        runnerCreditBudget,
        availableCorpRezCredits: availableRemoteRezCredits,
        visibleCorpBidCapacity: playerView.own.credits,
        ...(traceRulesProfile !== undefined ? { traceRulesProfile } : {}),
      });
    },
  });
}
