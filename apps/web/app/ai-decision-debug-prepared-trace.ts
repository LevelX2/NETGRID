import type { PreparedAiDecisionDebug } from "../lib/client-api";

import { parseAiPlanFirstDecisionDebug } from "./ai-plan-first-decision-ui";
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
      selectedActionLabel: prepared.actionLabel,
      debugSelectionMatchesApplied: true,
      preparedForExecution: true,
    },
  };
}

/** Returns only complete turn-planning snapshots suitable for turn retention. */
export function preparedAiDecisionDebugTurnPlanTrace(
  prepared: PreparedAiDecisionDebug,
): MaintenanceAiTraceDetail | null {
  const trace = preparedAiDecisionDebugTrace(prepared);
  const decision = parseAiPlanFirstDecisionDebug(
    trace.detail.planFirstDecision,
  );
  return decision?.turnPlanning?.consideredLines?.length ? trace : null;
}

/**
 * Keeps the first complete planning snapshot of a turn and replaces it only
 * when another match or another AI turn begins.
 */
export function retainPreparedAiDecisionDebugTurnPlanTrace(
  current: MaintenanceAiTraceDetail | null,
  prepared: PreparedAiDecisionDebug,
): MaintenanceAiTraceDetail | null {
  const next = preparedAiDecisionDebugTurnPlanTrace(prepared);
  if (!next) return current;
  const currentTurnKey = current
    ? parseAiPlanFirstDecisionDebug(current.detail.planFirstDecision)
        ?.turnPlanning?.turnKey
    : undefined;
  const nextTurnKey = parseAiPlanFirstDecisionDebug(
    next.detail.planFirstDecision,
  )?.turnPlanning?.turnKey;
  if (
    current &&
    current.matchId === next.matchId &&
    current.side === next.side &&
    currentTurnKey &&
    currentTurnKey === nextTurnKey
  ) {
    return current;
  }
  return next;
}

export function preparedAiDecisionDebugMatchesState(
  prepared: PreparedAiDecisionDebug | null,
  expected: {
    matchId: string;
    matchVersion: number;
    stateVersion: number;
  },
): boolean {
  return Boolean(
    prepared &&
    prepared.matchId === expected.matchId &&
    prepared.matchVersion === expected.matchVersion &&
    prepared.stateVersion === expected.stateVersion,
  );
}
