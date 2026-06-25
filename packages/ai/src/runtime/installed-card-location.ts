import type { CardInstanceId, GameState } from "@netgrid/shared";

export function serverIdForCorpInstalledCard(
  state: GameState,
  cardId: string,
): string | undefined {
  const installedCardId = cardId as CardInstanceId;
  for (const server of state.corp.servers) {
    if (
      server.ice.includes(installedCardId) ||
      server.root.includes(installedCardId)
    )
      return server.id;
  }
  return undefined;
}
