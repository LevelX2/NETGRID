import type {
  AiDecision,
  AiDecisionInput,
  CardInstanceId,
  GameState,
  LegalAction,
  PublicGameEvent,
} from "@netgrid/shared";
import { sortedUnique } from "./collection";
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

export function targetCardIdsForSimulationAction(
  input: AiDecisionInput,
  decision: AiDecision,
  action: LegalAction,
  event: PublicGameEvent,
  stateBeforeAction: GameState,
): CardInstanceId[] {
  const ids = [
    action.payload?.cardId,
    action.payload?.targetCardId,
    event.publicPayload.cardId,
    event.publicPayload.targetCardId,
    event.publicPayload.exposedCardInstanceId,
    ...(action.type === "steal_agenda" && stateBeforeAction.run?.accessedCardId
      ? [stateBeforeAction.run.accessedCardId]
      : []),
    ...(["trash_accessed_card", "decline_trash"].includes(action.type) &&
    stateBeforeAction.run?.accessedCardId
      ? [stateBeforeAction.run.accessedCardId]
      : []),
    ...selectedChoiceTargetCardIds(input, decision),
  ].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
  return sortedUnique(ids).filter((cardId): cardId is CardInstanceId =>
    Boolean(stateBeforeAction.cardInstances[cardId]),
  );
}

function selectedChoiceTargetCardIds(
  input: AiDecisionInput,
  decision: AiDecision,
): string[] {
  const selected = decision.selectedChoices as
    | { choiceId?: unknown; selectedOptionIds?: unknown }
    | undefined;
  const choice = input.playerView.pendingChoice;
  if (
    !selected ||
    !choice ||
    selected.choiceId !== choice.choiceId ||
    !Array.isArray(selected.selectedOptionIds)
  )
    return [];
  const selectedIds = new Set(
    selected.selectedOptionIds.filter(
      (optionId): optionId is string => typeof optionId === "string",
    ),
  );
  return choice.options
    .filter((option) => selectedIds.has(option.id))
    .flatMap((option) => String(option.value ?? "").split("|"))
    .map((entry) => entry.split(":")[0]?.trim() ?? "")
    .filter(Boolean);
}
