import type { PlayerView, VisibleCard } from "@netgrid/shared";

export function visibleCardByInstanceId(
  playerView: PlayerView,
  instanceId: string,
): VisibleCard | undefined {
  const ownCards = [
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...(playerView.own.rig ?? []),
    ...playerView.own.scoreArea,
  ];
  const serverCards = playerView.servers.flatMap((server) => [
    ...server.ice,
    ...server.root,
  ]);
  return [...ownCards, ...serverCards].find(
    (card) => card.instanceId === instanceId,
  );
}
