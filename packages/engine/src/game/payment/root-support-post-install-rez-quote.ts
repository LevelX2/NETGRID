import type {
  CardInstanceId,
  GameState,
  VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { nextCanonicalRemoteServerId } from "../state/remote-server-id";
import { projectInstalledCorpSequenceRezPayment } from "./corp-rez-cost";

/** Payment facts for passive global ICE support installed in a new remote. */
export function projectGlobalRootSupportRezAfterInstall(
  state: GameState,
  cardId: CardInstanceId,
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
    targetServerId: "new_remote" as const,
    expiresAtStateVersion: state.stateVersion,
  };
  const serverId = nextCanonicalRemoteServerId(state.corp.servers);
  if (
    !serverId ||
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
      servers: [
        ...state.corp.servers,
        {
          id: serverId,
          kind: "remote",
          label: `Remote ${serverId.slice(7)}`,
          ice: [],
          root: [cardId],
        },
      ],
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
