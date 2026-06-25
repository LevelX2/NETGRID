import type { AiDecisionInput } from "@netgrid/shared";
import {
  agendaPointsForMetrics,
  remoteTrashCostForVisibleCard,
} from "./card-metric-lookup";
import { remoteTrashRoleForVisibleCard } from "./remote-trash-role";
import { isRemoteServerTarget } from "../runtime/server-target";

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
