import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";

export function visibleSourceServerId(
  playerView: PlayerView,
  action: LegalAction,
): string | undefined {
  const source = String(action.source);
  for (const server of playerView.servers) {
    if (
      server.root.some((card) => card.instanceId === source) ||
      server.ice.some((card) => card.instanceId === source)
    ) {
      return server.id;
    }
  }
  return undefined;
}

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

export function visibleCardForAction(
  playerView: PlayerView,
  action: LegalAction,
): VisibleCard | undefined {
  const source = String(action.source ?? "");
  const byInstance = visibleCardByInstanceId(playerView, source);
  if (byInstance) return byInstance;
  const payload = action.payload ?? {};
  const definitionId =
    typeof payload.cardDefinitionId === "string"
      ? payload.cardDefinitionId
      : typeof payload.sourceDefinitionId === "string"
        ? payload.sourceDefinitionId
        : typeof payload.sourceCardDefinitionId === "string"
          ? payload.sourceCardDefinitionId
          : source.startsWith("onr_") || source.startsWith("simple_")
            ? source
            : undefined;
  const allVisibleCards = [
    ...playerView.own.gripOrHq,
    ...playerView.own.heapOrArchives,
    ...(playerView.own.rig ?? []),
    ...playerView.own.scoreArea,
    ...playerView.servers.flatMap((server) => [...server.ice, ...server.root]),
  ];
  if (definitionId) {
    const byDefinition = allVisibleCards.find(
      (card) => card.definitionId === definitionId,
    );
    if (byDefinition) return byDefinition;
  }
  return allVisibleCards.find(
    (card) =>
      card.title !== undefined &&
      action.label.toLowerCase().includes(card.title.toLowerCase()),
  );
}
