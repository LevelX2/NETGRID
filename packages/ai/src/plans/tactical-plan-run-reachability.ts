import type { PlayerView } from "@netgrid/shared";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";
import { isRemoteServer } from "./tactical-plan-server-targets";

export function serverHasUnrezzedIce(
  playerView: PlayerView,
  serverId: string,
): boolean {
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return server?.ice.some((ice) => ice.rezzed !== true) === true;
}

export function runNeedsBreakerCoverage(
  playerView: PlayerView,
  serverId: string | undefined,
): boolean {
  if (!serverId) return false;
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  const assessment = assessKnownRezzedIcePath(
    server.ice,
    playerView.own.rig ?? [],
    playerView.own.credits,
    server.root,
  );
  return assessment.assessedKnownIceCount > 0 && !assessment.canReachAccess;
}

export function remoteRunHasNoRootValue(
  playerView: PlayerView,
  serverId: string | undefined,
): boolean {
  if (!serverId || !isRemoteServer(serverId)) return false;
  const server = playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (server?.root.length ?? 0) === 0;
}
