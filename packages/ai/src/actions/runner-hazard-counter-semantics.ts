import type { LegalAction } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

const REMOVABLE_RUNNER_HAZARD_COUNTERS = new Set([
  "trace_tag_counter",
  "baskerville",
  "cerberus",
  "mastiff",
  "link_reduction_counter",
]);

export function applyRunnerHazardCounterSemantics(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): ActionSemanticCandidate {
  if (!removesPersistentRunnerHazardCounter(action)) return candidate;
  const traceTagCounter = removesPersistentTraceTagCounter(action);
  return {
    ...candidate,
    semanticActionType: traceTagCounter
      ? "counter.remove_trace_tag"
      : "counter.remove_runner_hazard",
    confidence: "high",
    primaryProjectionStatus: "projected",
    actionTacticSignals: uniqueStrings([
      ...candidate.actionTacticSignals,
      "counter.remove_runner_hazard",
      "survival.persistent_runner_hazard_counter",
      ...(traceTagCounter
        ? [
            "counter.remove_trace_tag",
            "survival.persistent_trace_counter",
          ]
        : []),
    ]),
    evidence: [
      ...candidate.evidence,
      `LegalAction payload removes persistent Runner hazard counter: ${String(action.payload?.counterType)}`,
    ],
  };
}

export function removesPersistentRunnerHazardCounter(
  action: LegalAction,
): boolean {
  const payload = action.payload;
  return (
    action.side === "runner" &&
    action.type === "trigger_ability" &&
    payload?.runnerAbility === "remove_runner_trace_counter" &&
    typeof payload.counterType === "string" &&
    REMOVABLE_RUNNER_HAZARD_COUNTERS.has(payload.counterType) &&
    typeof payload.removeCounterAmount === "number" &&
    Number.isFinite(payload.removeCounterAmount) &&
    payload.removeCounterAmount > 0
  );
}

export function removesPersistentTraceTagCounter(action: LegalAction): boolean {
  return (
    removesPersistentRunnerHazardCounter(action) &&
    action.payload?.counterType === "trace_tag_counter"
  );
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
