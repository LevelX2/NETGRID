import {
  type AiDecisionInput,
  type LegalAction,
  type PublicGameEvent,
} from "@netgrid/shared";
import {
  eventVersion,
  findLastHistoryIndex,
  mergedPublicHistory,
  serverIdFromEvent,
} from "./public-event-history";

export function recentRemoteJackOutRepeatRunPenalty(
  input: AiDecisionInput,
  action: LegalAction,
): number {
  if (input.side !== "runner" || action.type !== "start_run") return 0;
  const serverId = String(action.payload?.serverId ?? "");
  if (!serverId.startsWith("remote_")) return 0;
  const history = mergedPublicHistory(input);
  const lastSameRemoteRunIndex = findLastHistoryIndex(
    history,
    (event) =>
      serverIdFromEvent(event) === serverId &&
      (event.publicPayload.actionType === "start_run" ||
        event.type === "run_started"),
  );
  if (lastSameRemoteRunIndex < 0) return 0;
  const lastRunEvent = history[lastSameRemoteRunIndex];
  if (!lastRunEvent) return 0;
  if (input.playerView.stateVersion - eventVersion(lastRunEvent) > 8) return 0;
  return recentAiSameRemoteJackOutWithoutAccess(
    history,
    lastSameRemoteRunIndex,
    serverId,
  )
    ? 520
    : 0;
}

function recentAiSameRemoteJackOutWithoutAccess(
  history: PublicGameEvent[],
  startIndex: number,
  serverId: string,
): boolean {
  const afterStart = history.slice(startIndex + 1);
  const jackOutIndex = afterStart.findIndex((event) => {
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (actionType !== "jack_out") return false;
    const eventServerId = serverIdFromEvent(event);
    return eventServerId === undefined || eventServerId === serverId;
  });
  if (jackOutIndex < 0) return false;
  if (
    afterStart
      .slice(0, jackOutIndex)
      .some(
        (event) =>
          serverIdFromEvent(event) === serverId &&
          event.publicPayload.actionType === "access_card",
      )
  )
    return false;
  return !afterStart
    .slice(jackOutIndex + 1)
    .some((event) => aiEventMayRefreshRemoteRun(event, serverId));
}

function aiEventMayRefreshRemoteRun(
  event: PublicGameEvent,
  serverId: string,
): boolean {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  if (actionType === "access_card" && serverIdFromEvent(event) === serverId)
    return true;
  return (
    actionType === "gain_credit" ||
    actionType === "draw_card" ||
    actionType === "install_card" ||
    actionType === "play_event" ||
    actionType === "trigger_ability" ||
    actionType === "rez_ice"
  );
}
