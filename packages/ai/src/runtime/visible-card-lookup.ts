import {
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

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

export function semanticRuntimeVisibleSourceCard(
  input: AiDecisionInput,
  action: LegalAction,
): VisibleCard | undefined {
  const actionSource =
    typeof action.source === "string" ? action.source : undefined;
  if (
    actionSource !== undefined &&
    actionSource !== "basic_action" &&
    actionSource !== "game_rule"
  ) {
    const byInstance = findVisibleCard(input, actionSource);
    if (byInstance) return byInstance;
  }
  const payload = action.payload ?? {};
  const definitionId =
    typeof payload.cardDefinitionId === "string"
      ? payload.cardDefinitionId
      : typeof payload.sourceDefinitionId === "string"
        ? payload.sourceDefinitionId
        : typeof payload.sourceCardDefinitionId === "string"
          ? payload.sourceCardDefinitionId
          : actionSource?.startsWith("onr_") ||
              actionSource?.startsWith("simple_")
            ? actionSource
            : undefined;
  const allVisibleCards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...(input.playerView.own.rig ?? []),
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
  ];
  if (definitionId) {
    const byDefinition = allVisibleCards.find(
      (card) => card.known && card.definitionId === definitionId,
    );
    if (byDefinition) return byDefinition;
  }
  return undefined;
}

export function findVisibleCorpServerCard(
  input: AiDecisionInput,
  instanceId: string,
):
  | {
      card: VisibleCard;
      server: AiDecisionInput["playerView"]["servers"][number];
    }
  | undefined {
  for (const server of input.playerView.servers) {
    const card = [...server.ice, ...server.root].find(
      (candidate) => candidate.instanceId === instanceId && candidate.known,
    );
    if (card) return { card, server };
  }
  return undefined;
}

export function sourceDefinitionIdForAction(
  input: AiDecisionInput,
  action: LegalAction,
): string {
  const actionSource =
    typeof action.source === "string" ? action.source : undefined;
  if (actionSource === "basic_action" || actionSource === "game_rule")
    return "";
  return (
    (actionSource ? findVisibleCard(input, actionSource)?.definitionId : undefined) ??
    semanticRuntimeVisibleSourceCard(input, action)?.definitionId ??
    ""
  );
}
