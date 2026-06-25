import type { AiDecisionInput } from "@netgrid/shared";
import { serverIdFromEvent } from "../runtime/public-event-history";

export function runnerRunTargetHasOnlyUnknownOrUnrezzedIce(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  return (
    server !== undefined &&
    server.ice.length > 0 &&
    server.ice.every((ice) => !ice.known || ice.rezzed !== true)
  );
}

export function runnerHasRecentRunOnServer(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return input.playerView.publicEvents
    .slice(-24)
    .some(
      (event) =>
        event.publicPayload.actionType === "start_run" &&
        serverIdFromEvent(event) === serverId,
    );
}
