import type {
  CardDefinitionId,
  CardInstanceId,
  PlayerView,
  VisibleCard,
} from "@netgrid/shared";

export function visibleSourceDefinitionsByInstanceId(
  playerView: PlayerView,
): Readonly<Record<CardInstanceId, CardDefinitionId>> {
  const ownCards: VisibleCard[] = [
    playerView.own.identity,
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...playerView.own.scoreArea,
    ...(playerView.own.rig ?? []),
    ...playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  const entries = ownCards
    .filter(
      (
        card,
      ): card is VisibleCard & {
        instanceId: CardInstanceId;
        definitionId: CardDefinitionId;
      } => card.known && card.definitionId !== undefined,
    )
    .map((card) => [card.instanceId, card.definitionId] as const);
  return Object.fromEntries(entries) as Record<
    CardInstanceId,
    CardDefinitionId
  >;
}
