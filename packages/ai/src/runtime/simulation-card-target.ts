import {
  DEMO_CARDS_BY_ID,
  type CardInstanceId,
  type GameState,
  type LegalAction,
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
    DEMO_CARDS_BY_ID[definitionId]?.type ?? RUNTIME_CARDS[definitionId]?.type;
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
  state: GameState,
  serverId: string,
): boolean {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) return false;
  return server.root.some((cardId) => {
    const instance = state.cardInstances[cardId];
    if (!instance) return false;
    if (cardTargetTypeForInstance(state, cardId) !== "agenda") return false;
    const requirement =
      DEMO_CARDS_BY_ID[instance.definitionId]?.advancementRequirement ??
      RUNTIME_CARDS[instance.definitionId]?.numeric.advancementRequirement ??
      0;
    return Math.max(0, requirement - instance.advancementCounters) <= 2;
  });
}

export function rezCostForDefinitionId(
  definitionId: string | undefined,
): number {
  if (!definitionId) return 0;
  return (
    DEMO_CARDS_BY_ID[definitionId]?.rezCost ??
    RUNTIME_CARDS[definitionId]?.numeric.rezCost ??
    0
  );
}
