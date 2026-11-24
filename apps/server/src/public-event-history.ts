import type { PublicGameEvent } from "@netgrid/shared";
import {
  advanceChronicleTurnContext,
  initialChronicleTurnCursor,
  type ChronicleTurnCursor,
  type ChronicleTurnContext,
} from "./chronicle-turn-context";

/** Server-private prefix facts, without card identities or replay actions. */
export type PublicEventHistorySummary = {
  eventCount: number;
  actionCount: number;
  successfulRunCount: number;
  stolenAgendaCount: number;
  scoredAgendaCount: number;
  chronicle: ChronicleTurnCursor;
};

export type StoredPublicEventHistory = {
  before: PublicEventHistorySummary;
  context?: ChronicleTurnContext;
};

export function initialPublicEventHistory(): PublicEventHistorySummary {
  return {
    eventCount: 0, actionCount: 0, successfulRunCount: 0,
    stolenAgendaCount: 0, scoredAgendaCount: 0,
    chronicle: initialChronicleTurnCursor(),
  };
}

export function advancePublicEventHistory(
  before: PublicEventHistorySummary,
  event: PublicGameEvent,
): { after: PublicEventHistorySummary; stored: StoredPublicEventHistory } {
  const { cursor, context } = advanceChronicleTurnContext(before.chronicle, event);
  return {
    stored: { before, ...(context ? { context } : {}) },
    after: {
      eventCount: before.eventCount + 1,
      actionCount: before.actionCount + Number(event.type !== "game_created"),
      successfulRunCount: before.successfulRunCount + Number(
        event.type === "access_card" && event.publicPayload.accessIndex === 0,
      ),
      stolenAgendaCount: before.stolenAgendaCount + Number(
        event.type === "steal_agenda" && typeof event.publicPayload.agendaPoints === "number",
      ),
      scoredAgendaCount: before.scoredAgendaCount + Number(event.type === "score_agenda"),
      chronicle: cursor,
    },
  };
}

export function publicEventHistorySummary(
  record: {
    publicHistoryPrefix?: PublicEventHistorySummary;
    eventLog: readonly { publicPayload: PublicGameEvent }[];
  },
): PublicEventHistorySummary {
  let summary = record.publicHistoryPrefix ?? initialPublicEventHistory();
  for (const event of record.eventLog)
    summary = advancePublicEventHistory(summary, event.publicPayload).after;
  return summary;
}

export function isStoredPublicEventHistory(
  value: unknown,
  eventIndex: number,
): value is StoredPublicEventHistory {
  if (!value || typeof value !== "object") return false;
  const history = value as StoredPublicEventHistory;
  const before = history.before;
  if (!before || before.eventCount !== eventIndex) return false;
  for (const count of [before.eventCount, before.actionCount, before.successfulRunCount,
    before.stolenAgendaCount, before.scoredAgendaCount])
    if (!Number.isSafeInteger(count) || count < 0 || count > eventIndex) return false;
  const cursor = before.chronicle;
  if (!cursor || !Number.isSafeInteger(cursor.turnNumber) || cursor.turnNumber < 1 ||
    (cursor.activeSide !== "corp" && cursor.activeSide !== "runner")) return false;
  if (cursor.justEndedTurn && (
    (cursor.justEndedTurn.side !== "corp" && cursor.justEndedTurn.side !== "runner") ||
    !Number.isSafeInteger(cursor.justEndedTurn.turnNumber) || cursor.justEndedTurn.turnNumber < 1 ||
    cursor.justEndedTurn.turnNumber !== cursor.turnNumber - 1
  )) return false;
  return !history.context || (
    Number.isSafeInteger(history.context.turnNumber) && history.context.turnNumber >= 1 &&
    (history.context.turnSide === "corp" || history.context.turnSide === "runner")
  );
}
