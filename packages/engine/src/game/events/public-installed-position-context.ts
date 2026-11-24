import type { GameState, LegalAction, ServerId } from "@netgrid/shared";

export function publicInstalledPositionContext(
  previousState: GameState,
  state: GameState,
  legalAction: LegalAction,
): Record<string, unknown> {
  const candidateIds = [
    legalAction.payload?.cardId,
    legalAction.payload?.accessedCardId,
    legalAction.payload?.targetCardId,
    legalAction.payload?.targetIceId,
    legalAction.payload?.selectedCardId,
    legalAction.payload?.exposedCardId,
    legalAction.payload?.rezzedCardId,
    legalAction.payload?.trashedCardId,
    legalAction.payload?.scoredAgendaId,
    legalAction.payload?.agendaId,
    legalAction.source,
  ].filter((value): value is string => typeof value === "string");
  for (const cardId of candidateIds) {
    const location =
      installedCorpCardLocation(state, cardId) ??
      installedCorpCardLocation(previousState, cardId);
    if (!location) continue;
    return {
      serverId: location.serverId,
      installPlacement: location.installPlacement,
      installedPositionKey: opaqueInstalledPositionKey(cardId),
    };
  }
  return {};
}

function installedCorpCardLocation(
  state: GameState,
  cardId: string,
):
  | {
      serverId: Exclude<ServerId, "new_remote">;
      installPlacement: "ice" | "root";
    }
  | undefined {
  const instance = state.cardInstances[cardId];
  if (!instance || instance.zone.side !== "corp") return undefined;
  if (instance.zone.zone === "serverIce") {
    return { serverId: instance.zone.serverId, installPlacement: "ice" };
  }
  if (instance.zone.zone === "serverRoot") {
    return { serverId: instance.zone.serverId, installPlacement: "root" };
  }
  return undefined;
}

function opaqueInstalledPositionKey(cardId: string): string {
  let hash = 0x811c9dc5;
  const input = `netgrid-installed-position-v1:${cardId}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `installed-position-v1:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
