import type { GameState, LegalAction, PublicGameEvent } from "@netgrid/shared";
import { serverIdForCorpInstalledCard } from "./installed-card-location";

export function targetServerIdForSimulationAction(
  action: LegalAction,
  event: PublicGameEvent,
  stateBeforeAction: GameState,
): string | undefined {
  if (typeof action.payload?.serverId === "string")
    return action.payload.serverId;
  if (typeof event.publicPayload.serverId === "string")
    return event.publicPayload.serverId;
  if (typeof action.payload?.targetServerId === "string")
    return action.payload.targetServerId;
  if (typeof event.publicPayload.targetServerId === "string")
    return event.publicPayload.targetServerId;
  const cardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : typeof event.publicPayload.targetCardId === "string"
        ? event.publicPayload.targetCardId
        : undefined;
  if (cardId) return serverIdForCorpInstalledCard(stateBeforeAction, cardId);
  return undefined;
}
