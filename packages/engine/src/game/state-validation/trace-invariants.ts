import { isRunId, isTraceId, type GameState } from "@netgrid/shared";
import {
  normalizeTraceRulesProfile,
  traceRulesDefinitionForTrace,
} from "../trace/trace-rules-profile";
import { isSupportedTraceSuccessEffect } from "../trace/trace-success-effect-validation";

export function validateTraceState(errors: string[], state: GameState): void {
  if (state.trace) {
    if (
      !isTraceId(state.trace.traceId) ||
      state.trace.traceId > state.stateVersion
    )
      errors.push(
        "Trace id must identify a current or earlier GameState version.",
      );
    if (
      state.trace.sourceRunId !== undefined &&
      (!isRunId(state.trace.sourceRunId) ||
        state.trace.sourceRunId > state.trace.traceId ||
        state.trace.subroutineIndex === undefined ||
        !Number.isSafeInteger(state.trace.subroutineIndex) ||
        state.trace.subroutineIndex < 0)
    )
      errors.push(
        "Encounter Trace must identify its originating run and subroutine.",
      );
    const traceRules = traceRulesDefinitionForTrace(state.trace);
    if (
      normalizeTraceRulesProfile(state.trace.traceRulesProfile) !==
      normalizeTraceRulesProfile(state.traceRulesProfile)
    )
      errors.push("Active trace rules profile differs from the match profile.");
    if (!state.cardInstances[state.trace.sourceCardInstanceId])
      errors.push("Trace references missing source card.");
    if (!Number.isInteger(state.trace.traceLimit) || state.trace.traceLimit < 0)
      errors.push("Trace limit is invalid.");
    if (
      state.trace.effectiveTraceLimit !== undefined &&
      (!Number.isInteger(state.trace.effectiveTraceLimit) ||
        state.trace.effectiveTraceLimit < 0)
    )
      errors.push("Effective trace limit is invalid.");
    if (
      state.trace.traceValue !== undefined &&
      state.trace.effectiveTraceLimit !== undefined &&
      traceRules.corpBidLimitMode === "effective_trace_limit" &&
      state.trace.traceValue > state.trace.effectiveTraceLimit
    )
      errors.push("Trace value exceeds the effective trace limit.");
    if (!isSupportedTraceSuccessEffect(state.trace.successEffect))
      errors.push("Trace success effect is outside supported scope.");
    if (!state.pendingChoice)
      errors.push("Trace requires an open PendingChoice.");
    if (
      state.trace.status === "corp_bid" &&
      state.pendingChoice?.side !== "corp"
    )
      errors.push("Corp trace bid requires Corp choice.");
    if (
      state.trace.status === "trace_success_program_trash" &&
      state.pendingChoice?.side !== "corp" &&
      !state.eventModificationWindow
    )
      errors.push("Trace program trash requires Corp choice.");
    if (
      state.trace.status === "base_link" ||
      state.trace.status === "runner_bid" ||
      state.trace.status === "post_bid_link"
    ) {
      if (state.pendingChoice?.side !== "runner")
        errors.push("Runner trace step requires Runner choice.");
      if (
        state.trace.corpBid === undefined ||
        state.trace.traceValue === undefined ||
        state.trace.runnerLink === undefined
      )
        errors.push("Runner trace step is missing Corp bid context.");
    }
  }
}
