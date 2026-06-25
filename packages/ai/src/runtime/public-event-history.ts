import type { PublicGameEvent } from "@netgrid/shared";
import type { CentralServerId } from "./server-target";

export function findLastHistoryIndex<T>(
  values: readonly T[],
  predicate: (value: T) => boolean,
): number {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (predicate(values[index]!)) return index;
  }
  return -1;
}

export function isArchivesAccessEvent(event: PublicGameEvent): boolean {
  return (
    event.publicPayload.actionType === "access_card" &&
    serverIdFromEvent(event) === "archives"
  );
}

export function eventMayChangeArchives(event: PublicGameEvent): boolean {
  const payload = event.publicPayload;
  if (
    payload.discardZone === "archives" ||
    payload.hiddenZoneAction === "discard_phase"
  )
    return true;
  const actionType =
    typeof payload.actionType === "string" ? payload.actionType : event.type;
  return (
    actionType === "trash_accessed_card" ||
    actionType === "trash_card" ||
    actionType === "play_operation"
  );
}

export function eventMayChangeHqPressure(event: PublicGameEvent): boolean {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  return (
    actionType === "draw_card" ||
    actionType === "mandatory_draw" ||
    actionType === "install_card" ||
    actionType === "play_operation" ||
    actionType === "discard_card" ||
    actionType === "resolve_choice"
  );
}

export function eventRefreshesCentralTarget(
  event: PublicGameEvent,
  target: CentralServerId,
): boolean {
  const actionType =
    typeof event.publicPayload.actionType === "string"
      ? event.publicPayload.actionType
      : event.type;
  if (actionType === "steal_agenda" || actionType === "trash_accessed_card")
    return true;
  if (target === "hq")
    return (
      actionType === "draw_card" ||
      actionType === "mandatory_draw" ||
      actionType === "install_card" ||
      actionType === "play_operation"
    );
  if (target === "rd")
    return (
      actionType === "draw_card" ||
      actionType === "mandatory_draw" ||
      actionType === "shuffle_stack" ||
      actionType === "reorder_cards"
    );
  return actionType === "trash_card";
}

export function serverIdFromEvent(
  event: PublicGameEvent,
): string | undefined {
  const payload = event.publicPayload;
  if (typeof payload.serverId === "string") return payload.serverId;
  if (typeof payload.server === "string") return payload.server;
  if (typeof payload.targetServerId === "string") return payload.targetServerId;
  if (typeof payload.attackedServerId === "string")
    return payload.attackedServerId;
  const label =
    typeof payload.serverLabel === "string"
      ? payload.serverLabel
      : typeof payload.serverName === "string"
        ? payload.serverName
        : undefined;
  if (!label) return undefined;
  const normalized = label.toLowerCase();
  if (normalized === "r&d" || normalized === "rd") return "rd";
  if (normalized === "hq" || normalized === "headquarters") return "hq";
  if (normalized === "archives" || normalized === "archive") return "archives";
  return undefined;
}

export function eventVersion(event: PublicGameEvent): number {
  return typeof event.stateVersionAfter === "number"
    ? event.stateVersionAfter
    : 0;
}
