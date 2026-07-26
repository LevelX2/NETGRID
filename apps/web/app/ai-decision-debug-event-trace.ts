import type { PublicGameEvent, Side } from "@netgrid/shared";

import type { MaintenanceAiTraceDetail } from "./maintenance";

/**
 * Rebuilds the visible inspector entry from the actual AI action event that
 * reached the current player payload. This deliberately does not fetch a
 * maintenance trace or construct an advisor preview: its input is only the
 * already projected event tail for this match perspective.
 */
export function latestAiDecisionDebugEventTrace(input: {
  matchId: string;
  matchVersion: number;
  eventTail: PublicGameEvent[];
  observedAt: string;
}): MaintenanceAiTraceDetail | null {
  for (const event of [...input.eventTail].reverse()) {
    const payload = record(event.publicPayload);
    const detail = record(payload?.aiDecisionDebug);
    const side = sideValue(payload?.actor);
    if (!detail || !side) continue;
    const planFirstDecision = record(detail.planFirstDecision);
    const route = record(planFirstDecision?.route);
    const selectedPlan = record(planFirstDecision?.selectedPlan);
    const selectedActionId = stringValue(route?.actionId);
    const selectedActionType =
      stringValue(payload?.actionType) ?? stringValue(route?.actionType);
    const planKind = stringValue(selectedPlan?.moduleId);
    const confidence = finiteNumber(detail.confidence);
    return {
      traceId: `event_trace_${event.eventId}`,
      matchId: input.matchId,
      eventId: event.eventId,
      stateVersion: event.stateVersionBefore,
      matchVersion: input.matchVersion,
      side,
      turn: finiteInteger(payload?.chronicleTurnNumber) ?? 0,
      decisionIndex: event.stateVersionBefore,
      ...(selectedActionId ? { selectedActionId } : {}),
      ...(selectedActionType ? { selectedActionType } : {}),
      ...(planKind ? { planKind } : {}),
      ...(confidence !== undefined ? { confidence } : {}),
      createdAt: input.observedAt,
      schemaVersion: "ai-decision-event-trace-v1",
      meta: { source: "projected_event_tail" },
      detail: {
        ...detail,
        ...(selectedActionId ? { selectedActionId } : {}),
        ...(selectedActionType ? { selectedActionType } : {}),
        debugSelectionMatchesApplied: true,
      },
    };
  }
  return null;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "runner" || value === "corp" ? value : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function finiteInteger(value: unknown): number | undefined {
  const number = finiteNumber(value);
  return number !== undefined && Number.isInteger(number) ? number : undefined;
}
