import { type AiDecisionInput, type VisibleCard } from "@netgrid/shared";

export function findVisibleCard(
  input: AiDecisionInput,
  instanceId: string,
): VisibleCard | undefined {
  const zones = [
    input.playerView.own.gripOrHq,
    input.playerView.own.heapOrArchives,
    input.playerView.own.scoreArea,
    input.playerView.own.rig ?? [],
    ...input.playerView.servers.flatMap((server) => [server.ice, server.root]),
  ];
  return zones
    .flat()
    .find((card) => card.instanceId === instanceId && card.known);
}
