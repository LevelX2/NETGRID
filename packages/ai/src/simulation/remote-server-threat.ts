import type { AiDecisionInput } from "@netgrid/shared";
import {
  agendaPointsForMetrics,
  remoteTrashCostForVisibleCard,
} from "./card-metric-lookup";
import { remoteTrashRoleForVisibleCard } from "./remote-trash-role";
import { isRemoteServerTarget } from "../runtime/server-target";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

export function remoteServerHasScoreThreat(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some(
    (card) =>
      (card.advancementCounters ?? 0) > 0 ||
      (card.known && card.type === "agenda"),
  );
}

export function remoteTrashAccessProtectsAcuteThreatForMetrics(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  if (remoteServerHasScoreThreat(input, serverId)) return true;
  return server.root.some((card) => {
    if (!card.known || card.type !== "agenda" || !card.definitionId)
      return false;
    return (
      input.playerView.own.agendaPoints +
        agendaPointsForMetrics(card.definitionId) >=
      input.playerView.agendaPointsToWin - 1
    );
  });
}

export function runnerHasVisibleRemoteScoreThreat(
  input: AiDecisionInput,
): boolean {
  return input.playerView.servers.some(
    (server) =>
      isRemoteServerTarget(server.id) &&
      remoteServerHasScoreThreat(input, server.id),
  );
}

export function runnerRemoteHasKnownRelevantTrashTarget(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some((card) => {
    if (!card.known || remoteTrashCostForVisibleCard(card) === undefined)
      return false;
    const role = remoteTrashRoleForVisibleCard(card);
    return role !== "low_value" && role !== "unknown";
  });
}

export function runnerContestBlockedByCredits(
  input: AiDecisionInput,
  reserveTarget: number,
): boolean {
  return input.legalActions.some((action) => {
    if (
      action.side !== "runner" ||
      action.type !== "start_run" ||
      typeof action.payload?.serverId !== "string" ||
      !isRemoteServerTarget(action.payload.serverId) ||
      !remoteServerHasScoreThreat(input, action.payload.serverId)
    )
      return false;
    const server = input.playerView.servers.find(
      (candidate) => candidate.id === action.payload?.serverId,
    );
    if (!server) return false;
    const path =
      assessKnownRezzedIcePath(
        server.ice,
        input.playerView.own.rig ?? [],
        input.playerView.own.credits,
        server.root,
      ).visibleBreakCost ?? 0;
    return (
      input.playerView.own.credits < path ||
      input.playerView.own.credits - path < Math.min(3, reserveTarget - 2)
    );
  });
}

export function runnerTrashBlockedByCredits(
  input: AiDecisionInput,
): boolean {
  const run = input.playerView.run;
  const accessed = run?.accessedCard;
  if (!run || !isRemoteServerTarget(run.attackedServerId) || !accessed?.known)
    return false;
  const trashCost = remoteTrashCostForVisibleCard(accessed);
  if (trashCost === undefined) return false;
  const role = remoteTrashRoleForVisibleCard(accessed);
  if (role === "low_value" || role === "unknown") return false;
  return (
    input.playerView.own.credits < trashCost &&
    !input.legalActions.some((action) => action.type === "trash_accessed_card")
  );
}
