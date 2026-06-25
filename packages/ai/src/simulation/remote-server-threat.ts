import type { AiDecisionInput } from "@netgrid/shared";
import { agendaPointsForMetrics } from "./card-metric-lookup";

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
