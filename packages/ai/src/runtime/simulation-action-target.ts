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

export function simulationActionLocation(
  action: LegalAction,
  event: PublicGameEvent,
  before: GameState,
  after: GameState,
): { targetServerId?: string; corpNewRemoteCreated?: true } {
  if (action.side === "corp" && after.corp.servers.length > before.corp.servers.length) {
    const beforeIds = new Set(before.corp.servers.map(({ id }) => id));
    const created = after.corp.servers.filter(
      ({ id, kind }) => kind === "remote" && !beforeIds.has(id),
    );
    if (created.length === 1) {
      return { targetServerId: created[0]!.id, corpNewRemoteCreated: true };
    }
  }
  if (action.side === "runner" && after.run && after.run.runId !== before.run?.runId) {
    return { targetServerId: after.run.attackedServerId };
  }
  if (
    action.side === "runner" &&
    before.run &&
    (action.type === "access_card" ||
      action.type === "steal_agenda" ||
      action.type === "trash_accessed_card" ||
      action.type === "decline_trash" ||
      action.type === "jack_out")
  ) {
    return { targetServerId: before.run.attackedServerId };
  }
  const serverId = [
    action.payload?.serverId,
    event.publicPayload.serverId,
    action.payload?.targetServerId,
    event.publicPayload.targetServerId,
  ].find((id): id is string => typeof id === "string" && id !== "new_remote");
  if (serverId) return { targetServerId: serverId };
  const cardId =
    typeof action.payload?.cardId === "string"
      ? action.payload.cardId
      : typeof event.publicPayload.targetCardId === "string"
        ? event.publicPayload.targetCardId
        : undefined;
  const targetServerId = cardId
    ? serverIdForCorpInstalledCard(before, cardId)
    : undefined;
  return targetServerId ? { targetServerId } : {};
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
