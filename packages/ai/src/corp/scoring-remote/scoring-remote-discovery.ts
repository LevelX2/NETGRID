import { type AiDecisionInput } from "@netgrid/shared";
import { type CorpCorePlanDomain } from "../../plans/corp-core-plan-contracts";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { type CorpPlanDomain } from "../../plans/corp-tactical-plan-contracts";
import { type ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
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
  const remoteDoctrine = (input as AiDecisionInputWithDeckCapabilities)
    .ownRemoteDoctrineProfile;

  const runnerRig = input.playerView.opponent.rig ?? [];
  const runnerCreditBudget = runnerRunPathCreditBudgetWithVisiblePools(
    input.playerView.opponent.credits,
    runnerRig,
  );
  const remoteMaturityByServerId = new Map(
    [
      ...input.playerView.servers.filter((server) =>
        server.id.startsWith("remote_"),
      ),
      { id: "new_remote", ice: [], root: [] },
    ].map((server) => [
      server.id,
      assessCorpRemoteMaturityFromVisibleServer({
        observedAtStateVersion: input.playerView.stateVersion,
        targetServerId: server.id,
        targetBand: remoteDoctrine?.protectionTarget ?? "none",
        serverIce: server.ice,
        serverRoot: server.root,
        runnerRig,
        runnerCreditBudget,
        availableCorpRezCredits: availableRemoteRezCredits,
        visibleCorpBidCapacity: input.playerView.own.credits,
      }),
    ]),
  );
  const remoteProjects = buildCorpScoringRemoteProjectSignals({
    input,
    ...(previous ? { previous } : {}),
    ...(remoteDoctrine ? { remoteDoctrine } : {}),
    scoreProjects,
    remoteOccupancyClaims,
    maturityByServerId: remoteMaturityByServerId,
  });
  return remoteProjects;
}
