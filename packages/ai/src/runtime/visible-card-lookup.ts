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
  if (action.source !== "basic_action" && action.source !== "game_rule") {
    const byInstance = findVisibleCard(input, action.source);
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
          : action.source.startsWith("onr_") ||
              action.source.startsWith("simple_")
            ? action.source
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
  if (action.source === "basic_action" || action.source === "game_rule")
    return "";
  return (
    findVisibleCard(input, action.source)?.definitionId ??
    semanticRuntimeVisibleSourceCard(input, action)?.definitionId ??
    ""
  );
}
