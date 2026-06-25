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
