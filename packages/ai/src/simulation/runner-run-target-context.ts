import type { AiDecisionInput } from "@netgrid/shared";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "../public-event-history";

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
  return mergedPublicHistory(input)
    .slice(-24)
    .some((event) => {
      const payload = event.publicPayload;
      return (
        ((payload.actionType ?? event.type) === "start_run" &&
          payload.actor === "runner" &&
          serverIdFromEvent(event) === serverId) ||
        (payload.resolvedEffects ?? []).some(
          (effect) =>
            effect.kind === "start_run" &&
            effect.side === "runner" &&
            effect.serverId === serverId,
        )
      );
    });
}
