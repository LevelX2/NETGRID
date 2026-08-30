import type { PublicGameEvent } from "@netgrid/shared";

import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

/**
 * Historical checkpoints predate the engine-owned event turn marker.
 *
 * Reconstruct only the mechanically recorded turn identity and the server
 * binding of complete run-origin/access event pairs. A run origin is either
 * an explicit `start_run` event or a public event-card resolution that itself
 * records the run phase, target server and access count. The helper
 * deliberately throws for an unpaired access instead of inventing tactical
 * history.
 */
export function bindHistoricalRunEventCadence(
  checkpoint: AiDecisionCheckpointV1,
  checkpointIds?: readonly string[],
): AiDecisionCheckpointV1 {
  if (checkpointIds && !checkpointIds.includes(checkpoint.checkpointId)) {
    return checkpoint;
  }
  let turnSerial = 0;
  let activeRunServerId: string | undefined;

  for (const event of checkpoint.engine.eventPrefix) {
    event.turnSerial = turnSerial;
    if (event.type === "end_turn") {
      turnSerial += 1;
      activeRunServerId = undefined;
      continue;
    }

    if (event.type === "start_run") {
      const serverId = eventServerId(event);
      if (!serverId) {
        throw new Error(
          `checkpoint_start_run_server_missing:${checkpoint.checkpointId}:${event.eventId}`,
        );
      }
      activeRunServerId = serverId;
      bindEventServer(event, serverId);
      continue;
    }

    if (isRecordedEventRunOrigin(event)) {
      const serverId = eventServerId(event);
      if (!serverId) {
        throw new Error(
          `checkpoint_event_run_server_missing:${checkpoint.checkpointId}:${event.eventId}`,
        );
      }
      activeRunServerId = serverId;
      bindEventServer(event, serverId);
      continue;
    }

    if (event.type !== "access_card") continue;
    if (!activeRunServerId) {
      throw new Error(
        `checkpoint_access_without_run_origin:${checkpoint.checkpointId}:${event.eventId}`,
      );
    }

    const visibleServerId = eventServerId(event);
    if (visibleServerId && visibleServerId !== activeRunServerId) {
      throw new Error(
        `checkpoint_access_server_mismatch:${checkpoint.checkpointId}:${event.eventId}:${activeRunServerId}:${visibleServerId}`,
      );
    }
    bindEventServer(event, activeRunServerId);
  }

  return checkpoint;
}

function isRecordedEventRunOrigin(event: PublicGameEvent): boolean {
  if (event.type !== "play_event") return false;
  const payload = event.publicPayload as Record<string, unknown>;
  return (
    eventServerId(event) !== undefined &&
    typeof payload.runPhase === "string" &&
    payload.runPhase.length > 0 &&
    typeof payload.effectiveAccessCount === "number" &&
    Number.isInteger(payload.effectiveAccessCount) &&
    payload.effectiveAccessCount > 0
  );
}

function eventServerId(event: PublicGameEvent): string | undefined {
  const payload = event.publicPayload as Record<string, unknown>;
  if (typeof payload.serverId === "string" && payload.serverId.length > 0) {
    return payload.serverId;
  }
  const targets = payload.targets;
  if (isRecord(targets)) {
    if (typeof targets.serverId === "string" && targets.serverId.length > 0) {
      return targets.serverId;
    }
    const targetLabel = serverIdForLabel(targets.serverLabel);
    if (targetLabel) return targetLabel;
  }
  return serverIdForLabel(payload.serverLabel);
}

function bindEventServer(event: PublicGameEvent, serverId: string): void {
  const payload = event.publicPayload as Record<string, unknown>;
  payload.serverId = serverId;
  payload.targets = {
    ...(isRecord(payload.targets) ? payload.targets : {}),
    serverId,
  };
}

function serverIdForLabel(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "hq") return "hq";
  if (normalized === "f&e" || normalized === "r&d" || normalized === "rd") {
    return "rd";
  }
  if (normalized === "archive" || normalized === "archives") {
    return "archives";
  }
  const remoteMatch = /^(?:remote|server)\s*(\d+)$/.exec(normalized);
  return remoteMatch ? `remote_${remoteMatch[1]}` : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
