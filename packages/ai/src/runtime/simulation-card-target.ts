import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PlayerView,
  type VisibleCard,
} from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";
import {
  progressionCardTargetType,
  type ProgressionCardTargetType,
} from "./progression-card-target";

export function cardTargetTypeForInstance(
  state: GameState,
  cardId: string,
): ProgressionCardTargetType {
  const definitionId = state.cardInstances[cardId]?.definitionId;
  if (!definitionId) return "unknown";
  const type =
    CARD_DEFINITIONS_BY_ID[definitionId]?.type ??
    RUNTIME_CARDS[definitionId]?.type;
  return progressionCardTargetType(type);
}

export function advancedAgendaStealSourceForAction(
  stateBeforeAction: GameState,
  action: LegalAction,
  targetCardIds: CardInstanceId[],
): "remote" | "central" | "unknown" | undefined {
  if (action.type !== "steal_agenda") return undefined;
  const stolenSources = targetCardIds
    .map((cardId) => {
      const instance = stateBeforeAction.cardInstances[cardId];
      if (!instance || instance.advancementCounters <= 0) return undefined;
      if (cardTargetTypeForInstance(stateBeforeAction, cardId) !== "agenda")
        return undefined;
      if (
        instance.zone.side !== "corp" ||
        !["serverRoot", "rd", "hq", "archives"].includes(instance.zone.zone)
      )
        return undefined;
      if (
        instance.zone.zone === "serverRoot" &&
        instance.zone.serverId.startsWith("remote_")
      )
        return "remote" as const;
      if (
        instance.zone.zone === "rd" ||
        instance.zone.zone === "hq" ||
        instance.zone.zone === "archives"
      )
        return "central" as const;
      return "unknown" as const;
    })
    .filter((source): source is "remote" | "central" | "unknown" =>
      Boolean(source),
    );
  return stolenSources.includes("remote")
    ? "remote"
    : stolenSources.includes("central")
      ? "central"
      : stolenSources[0];
}

export function remoteHasNearFinalAgenda(
  view: Pick<PlayerView, "servers">,
  serverId: string,
): boolean {
  const server = view.servers.find((candidate) => candidate.id === serverId);
  return server?.root.some(
    (card) =>
      card.known === true &&
      card.type === "agenda" &&
      card.advancementRequirement !== undefined &&
      card.advancementRequirement - (card.advancementCounters ?? 0) <= 2,
  ) === true;
}

export function rezCostForDefinitionId(
  definitionId: string | undefined,
): number {
  if (!definitionId) return 0;
  return (
    CARD_DEFINITIONS_BY_ID[definitionId]?.rezCost ??
    RUNTIME_CARDS[definitionId]?.numeric.rezCost ??
    0
  );
}

export function sourceDefinitionIdForSimulationAction(
  action: LegalAction,
  findVisibleCard: (instanceId: string) => VisibleCard | undefined,
): string | undefined {
  if (action.source === "basic_action" || action.source === "game_rule")
    return undefined;
  return findVisibleCard(action.source)?.definitionId;
}
