import { humanAiDecisionProbeReportSource } from "./human-ai-decision-probe";
import {
  aiTraceTitle,
  findForbiddenMaintenanceMarkers,
  safeStringList,
  type MaintenanceAiTraceDetail,
} from "./maintenance";
import { parseAiPlanFirstDecisionDebug } from "./ai-plan-first-decision-ui";

export function serializeAiPlanFirstDecisionVisibleJsonExport(
  trace: MaintenanceAiTraceDetail,
  mode: "trace" | "preview",
  exportedAt: string,
): string {
  const detail = trace.detail;
  const planFirstDecision = parseAiPlanFirstDecisionDebug(
    detail.planFirstDecision,
  );
  const whyNot = recordList(detail.actionAlternatives)
    .filter((alternative) => alternative.selected !== true)
    .flatMap((alternative) =>
      safeStringList(alternative.whyNot, 3).map((reason) => ({
        actionId: String(alternative.actionId ?? "-"),
        reason,
      })),
    )
    .slice(0, 16);
  const payload = {
    schemaVersion: "netgrid-ai-decision-display-export-v2",
    redaction: "client-visible-ai-decision-debug-projection",
    exportedAt,
    mode,
    source: {
      traceId: trace.traceId,
      eventId: trace.eventId,
      turn: trace.turn,
      decisionIndex: trace.decisionIndex,
      ...(mode === "preview"
        ? humanAiDecisionProbeReportSource({
            matchId: trace.matchId,
            matchVersion: trace.matchVersion,
            stateVersion: trace.stateVersion,
            side: trace.side,
            selectedActionId: trace.selectedActionId,
            selectedActionType: trace.selectedActionType,
            detail,
          })
        : {
            matchId: trace.matchId,
            stateVersion: trace.stateVersion,
            matchVersion: trace.matchVersion,
            side: trace.side,
            selectedActionId: trace.selectedActionId,
            selectedActionType: trace.selectedActionType,
          }),
      planKind: trace.planKind,
      confidence: trace.confidence,
      createdAt: trace.createdAt,
      sourceSchemaVersion: trace.schemaVersion,
    },
    display: {
      title:
        mode === "preview"
          ? `KI-Vorschlag ab aktuellem Zustand · ${trace.side === "runner" ? "Runner" : "Korp"} · ${selectedActionLabel(trace)}`
          : aiTraceTitle(trace),
      contractStatus: planFirstDecision ? "plan_first" : "missing_fail_closed",
      selectedLegalAction: {
        actionId: trace.selectedActionId,
        actionType: trace.selectedActionType,
        label: selectedActionLabel(trace),
      },
      warnings: [
        ...(detail.fallbackUsed === true
          ? ["fallback_contract_violation"]
          : []),
        ...(detail.timeoutUsed === true ? ["timeout_contract_violation"] : []),
      ],
      planFirstDecision,
      whyNot,
    },
  };
  const output = `${JSON.stringify(payload, null, 2)}\n`;
  if (findForbiddenMaintenanceMarkers(output).length > 0) {
    throw new Error("ai_decision_debug_export_redaction_failed");
  }
  return output;
}

function selectedActionLabel(trace: MaintenanceAiTraceDetail): string {
  const action =
    trace.detail.selectedActionType ?? trace.selectedActionType ?? "KI-Aktion";
  const label = recordList(trace.detail.actionAlternatives).find(
    (entry) => entry.actionId === trace.selectedActionId,
  )?.label;
  return String(label ?? action);
}

function recordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      )
    : [];
}
