import type { LegalAction } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export function applyTraceCounterSemantics(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  if (!removesPersistentTraceTagCounter(action)) return candidate;
  return {
    ...candidate,
    semanticActionType: "counter.remove_trace_tag",
    confidence: "high",
    primaryProjectionStatus: "projected",
    actionTacticSignals: uniqueStrings([
      ...candidate.actionTacticSignals,
      "counter.remove_trace_tag",
      "survival.persistent_trace_counter",
    ]),
    evidence: [
      ...candidate.evidence,
      "LegalAction payload removes persistent runner trace-tag counter",
    ],
  };
}

export function removesPersistentTraceTagCounter(action: LegalAction): boolean {
  const payload = action.payload;
  return (
    action.side === "runner" &&
    action.type === "trigger_ability" &&
    payload?.runnerAbility === "remove_runner_trace_counter" &&
    payload.counterType === "trace_tag_counter" &&
    typeof payload.removeCounterAmount === "number" &&
    Number.isFinite(payload.removeCounterAmount) &&
    payload.removeCounterAmount > 0
  );
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
