import type { AiDecisionInput } from "@netgrid/shared";

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
