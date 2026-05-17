import type { GameState, PublicGameEvent } from "@netgrid/shared";
import type { StoredMatch } from "./multiplayer";

export const SPECTATOR_PROJECTION_V1_SCHEMA = "SpectatorProjectionV1" as const;

export type SpectatorProjectionKind =
  | "private_spectator_live_v1"
  | "delayed_public_spectator_v1";

export type SpectatorProjectionPolicyV1 = {
  kind?: SpectatorProjectionKind;
  eventCursor: number;
  maxEvents?: number;
};

export type SpectatorProjectionV1 = {
  schemaVersion: typeof SPECTATOR_PROJECTION_V1_SCHEMA;
  kind: SpectatorProjectionKind;
  match: {
    matchId: string;
    status: StoredMatch["match"]["status"];
    matchVersion: number;
  };
  cursor: {
    eventCursor: number;
    stateVersion: number;
  };
  board: {
    activeSide: "runner" | "corp";
    phase: string;
    runner: PublicSideSummaryV1;
    corp: PublicSideSummaryV1;
    servers: PublicServerSummaryV1[];
  };
  events: SpectatorEventV1[];
};

export type PublicSideSummaryV1 = {
  credits: number;
  clicks: number;
  agendaPoints: number;
  tags: number;
  scoredCount: number;
  discardCount: number;
  hiddenGripOrHqCount: number;
  hiddenDrawPileCount: number;
};

export type PublicServerSummaryV1 = {
  id: string;
  label: string;
  iceSlots: PublicInstalledSlotV1[];
  rootSlots: PublicInstalledSlotV1[];
};

export type PublicInstalledSlotV1 =
  | {
      slot: number;
      visibility: "hidden";
    }
  | {
      slot: number;
      visibility: "public";
      rezzed: boolean;
    };

export type SpectatorEventV1 = {
  eventId: string;
  type: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  stateHashAfter: string;
  visibilityClass: PublicGameEvent["visibilityClass"] | "public";
  hiddenInfoBarrier: boolean;
  eventFamily: string;
};

export function buildSpectatorProjectionV1(
  record: StoredMatch,
  policy: SpectatorProjectionPolicyV1,
): SpectatorProjectionV1 {
  const eventCursor = Math.max(0, Math.floor(policy.eventCursor));
  const state = stateForCursor(record, eventCursor);
  const visibleEvents = record.eventLog
    .filter((event) => event.stateVersionAfter <= eventCursor)
    .slice(-(policy.maxEvents ?? 20))
    .map((event): SpectatorEventV1 => ({
      eventId: event.eventId,
      type: event.publicPayload.type,
      stateVersionBefore: event.stateVersionBefore,
      stateVersionAfter: event.stateVersionAfter,
      stateHashAfter: event.stateHashAfter,
      visibilityClass: event.publicPayload.visibilityClass ?? "public",
      hiddenInfoBarrier: event.hiddenInfoBarrier,
      eventFamily: eventFamilyFor(event.publicPayload),
    }));

  return {
    schemaVersion: SPECTATOR_PROJECTION_V1_SCHEMA,
    kind: policy.kind ?? "private_spectator_live_v1",
    match: {
      matchId: record.match.matchId,
      status: record.match.status,
      matchVersion: record.match.matchVersion,
    },
    cursor: {
      eventCursor,
      stateVersion: state.stateVersion,
    },
    board: {
      activeSide: state.activeSide,
      phase: state.phase,
      runner: {
        credits: state.runner.credits,
        clicks: state.runner.clicks,
        agendaPoints: state.runner.scoreArea.length,
        tags: state.runner.tags,
        scoredCount: state.runner.scoreArea.length,
        discardCount: state.runner.heap.length,
        hiddenGripOrHqCount: state.runner.grip.length,
        hiddenDrawPileCount: state.runner.stack.length,
      },
      corp: {
        credits: state.corp.credits,
        clicks: state.corp.clicks,
        agendaPoints: state.corp.scoreArea.length,
        tags: 0,
        scoredCount: state.corp.scoreArea.length,
        discardCount: state.corp.archives.length,
        hiddenGripOrHqCount: state.corp.hq.length,
        hiddenDrawPileCount: state.corp.rd.length,
      },
      servers: state.corp.servers.map((server) => ({
        id: server.id,
        label: server.label,
        iceSlots: server.ice.map((cardId, index) =>
          publicInstalledSlotFor(state, cardId, index),
        ),
        rootSlots: server.root.map((cardId, index) =>
          publicInstalledSlotFor(state, cardId, index),
        ),
      })),
    },
    events: visibleEvents,
  };
}

function stateForCursor(record: StoredMatch, eventCursor: number): GameState {
  const snapshot = record.stateSnapshots
    .filter((candidate) => candidate.stateVersion <= eventCursor)
    .sort((left, right) => right.stateVersion - left.stateVersion)[0];
  if (snapshot) return snapshot.gameState;
  if (record.gameState.stateVersion <= eventCursor) return record.gameState;
  throw new Error("spectator_projection_cursor_snapshot_missing");
}

function publicInstalledSlotFor(state: GameState, cardId: string, slot: number): PublicInstalledSlotV1 {
  const card = state.cardInstances[cardId];
  if (!card?.faceup && !card?.rezzed) return { slot, visibility: "hidden" };
  return {
    slot,
    visibility: "public",
    rezzed: Boolean(card.rezzed),
  };
}

function eventFamilyFor(event: PublicGameEvent): string {
  const payloadType = event.publicPayload.actionType;
  if (typeof payloadType === "string" && payloadType.length > 0) return payloadType;
  return event.type;
}
