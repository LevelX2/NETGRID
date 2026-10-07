import type {
  CardInstanceId,
  GameState,
  ServerId,
  VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { nextCanonicalRemoteServerId } from "../state/remote-server-id";
import { projectInstalledCorpSequenceRezPayment } from "./corp-rez-cost";

/** Payment facts for passive global ICE support installed in an empty remote. */
export function projectGlobalRootSupportRezAfterInstall(
  state: GameState,
  cardId: CardInstanceId,
  targetServerId: ServerId,
): VisibleCorpRezCostQuote | undefined {
  const card = state.cardInstances[cardId];
  const definition = card && CARD_DEFINITIONS_BY_ID[card.definitionId];
  const implementation =
    card && cardImplementationForDefinitionId(card.definitionId);
  if (
    !card ||
    definition?.type !== "asset" ||
    !implementation?.modifiers?.some(
      (modifier) =>
        modifier.activeWhile === "rezzed" &&
        modifier.sourceZone === "corp_root" &&
        modifier.visibility === "public" &&
        "appliesTo" in modifier &&
        modifier.appliesTo.cardType === "ice" &&
        !(
          "sameServerAsSource" in modifier.appliesTo &&
          modifier.appliesTo.sameServerAsSource === true
        ),
    )
  )
    return undefined;
  const binding = {
    context: "post_install" as const,
    cardId,
    targetServerId,
    expiresAtStateVersion: state.stateVersion,
  };
  const existing = state.corp.servers.find(
    (server) => server.id === targetServerId,
  );
  const serverId =
    targetServerId === "new_remote"
      ? nextCanonicalRemoteServerId(state.corp.servers)
      : existing?.id;
  if (
    !serverId ||
    (targetServerId !== "new_remote" &&
      (existing?.kind !== "remote" ||
        existing.root.some((id) => {
          const rootCard = state.cardInstances[id];
          const rootDefinition =
            rootCard && CARD_DEFINITIONS_BY_ID[rootCard.definitionId];
          return (
            !rootDefinition ||
            rootDefinition.type === "asset" ||
            rootDefinition.type === "agenda"
          );
        }))) ||
    card.owner !== "corp" ||
    card.controller !== "corp" ||
    card.zone.side !== "corp" ||
    card.zone.zone !== "hq" ||
    !state.corp.hq.includes(cardId) ||
    (implementation.lifecycle?.on_install?.length ?? 0) > 0
  ) {
    return { ...binding, complete: false };
  }
  const projected: GameState = {
    ...state,
    corp: {
      ...state.corp,
      hq: state.corp.hq.filter((id) => id !== cardId),
      servers:
        targetServerId === "new_remote"
          ? [
              ...state.corp.servers,
              {
                id: serverId,
                kind: "remote",
                label: `Remote ${serverId.slice(7)}`,
                ice: [],
                root: [cardId],
              },
            ]
          : state.corp.servers.map((server) =>
              server.id === serverId
                ? { ...server, root: [...server.root, cardId] }
                : server,
            ),
    },
    cardInstances: {
      ...state.cardInstances,
      [cardId]: {
        ...card,
        rezzed: false,
        faceup: false,
        zone: { side: "corp", zone: "serverRoot", serverId },
      },
    },
  };
  const payment = projectInstalledCorpSequenceRezPayment(projected, cardId, 0);
  if (!payment.complete) return { ...binding, complete: false };
  return {
    ...binding,
    complete: true,
    projectedServerId: serverId,
    costKind: "fixed",
    baseCredits: payment.baseCredits,
    finalCredits: payment.finalCredits,
    mandatoryAdditionalCosts: payment.mandatoryAdditionalCosts,
    ...(payment.reductionSourceDefinitionIds
      ? { reductionSourceDefinitionIds: payment.reductionSourceDefinitionIds }
      : {}),
    ...(payment.increaseSourceDefinitionIds
      ? { increaseSourceDefinitionIds: payment.increaseSourceDefinitionIds }
      : {}),
  };
}
