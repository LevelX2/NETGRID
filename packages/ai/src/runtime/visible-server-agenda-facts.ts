import { type AiDecisionInput } from "@netgrid/shared";
export function visibleKnownAgendaOnServer(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return (
    input.playerView.servers
      .find((server) => server.id === serverId)
      ?.root.some((card) => card.known !== false && card.type === "agenda") ===
    true
  );
}

export function archivesIsKnownWithoutAgenda(input: AiDecisionInput): boolean {
  if (input.playerView.opponent.discardCount === 0) return true;
  const visibleCards = input.playerView.servers.find(
    (server) => server.id === "archives",
  )?.root;
  if (!visibleCards) return false;
  if (visibleCards.some((card) => !card.known)) return false;
  if (visibleCards.length < input.playerView.opponent.discardCount)
    return false;
  return !visibleCards.some((card) => card.type === "agenda");
}

export function archivesHasVisibleKnownAgenda(input: AiDecisionInput): boolean {
  return (
    input.playerView.servers
      .find((server) => server.id === "archives")
      ?.root.some((card) => card.known && card.type === "agenda") === true
  );
}
