import type { PreparedAiDecisionDebug } from "../lib/client-api";

import type { MaintenanceAiTraceDetail } from "./maintenance";

/** Converts the server-bound next AI decision into the inspector's trace view. */
export function preparedAiDecisionDebugTrace(
  prepared: PreparedAiDecisionDebug,
): MaintenanceAiTraceDetail {
  return {
    traceId: `prepared_ai_decision_${prepared.matchId}_${prepared.stateVersion}`,
    matchId: prepared.matchId,
    eventId: "prepared",
    stateVersion: prepared.stateVersion,
    matchVersion: prepared.matchVersion,
    side: prepared.side,
    turn: prepared.stateVersion,
    decisionIndex: 0,
    selectedActionId: prepared.actionId,
    selectedActionType: prepared.actionType,
    createdAt: prepared.preparedAt,
    schemaVersion: "prepared-ai-decision-debug-v1",
    meta: { source: "active_ai_preparation" },
    detail: {
      ...prepared.detail,
      selectedActionId: prepared.actionId,
      selectedActionType: prepared.actionType,
      debugSelectionMatchesApplied: true,
      preparedForExecution: true,
    },
  };
}
