/**
 * ARCH-13 Trace-Result-/Descriptor-Helfer.
 * Berechnet nur read-only Trace-Ergebnisdaten.
 * Keine Trace-Orchestrierung.
 * Keine Payment-Logik.
 * Keine onSuccess/onFailure-Ausfuehrung.
 * Keine State-Mutation.
 * Keine PublicPayload-Vertragsaenderung.
 * Kein Import aus index.ts.
 */
import type { GameState } from "@netgrid/shared";
import { requireCurrentTrace, type CurrentTrace } from "./trace-state";

export type TraceResultDescriptor = {
  traceLimit: number;
  corpBid: number;
  traceValue: number;
  baseLinkValue: number;
  runnerLink: number;
  runnerBid: number;
  postBidLinkValue: number;
  runnerStrength: number;
  successful: boolean;
};

export type TraceResultOptions = {
  runnerLinkFallback?: number;
};

export function traceCorpValue(trace: CurrentTrace): number {
  return trace.traceValue ?? trace.corpBid ?? 0;
}

export function traceRunnerStrength(
  trace: CurrentTrace,
  options: TraceResultOptions = {},
): number {
  const runnerLink = trace.runnerLink ?? options.runnerLinkFallback ?? 0;
  const runnerBid = trace.runnerBid ?? 0;
  return trace.runnerStrength ?? runnerLink + runnerBid;
}

export function isTraceSuccessful(
  trace: CurrentTrace,
  options: TraceResultOptions = {},
): boolean {
  return (
    trace.successful ??
    (traceCorpValue(trace) >= traceRunnerStrength(trace, options))
  );
}

export function describeTraceResultFromTrace(
  trace: CurrentTrace,
  options: TraceResultOptions = {},
): TraceResultDescriptor {
  const runnerLink = trace.runnerLink ?? options.runnerLinkFallback ?? 0;
  const traceValue = traceCorpValue(trace);
  const runnerStrength = traceRunnerStrength(trace, options);
  return {
    traceLimit: trace.traceLimit,
    corpBid: trace.corpBid ?? 0,
    traceValue,
    baseLinkValue: trace.baseLinkValue ?? 0,
    runnerLink,
    runnerBid: trace.runnerBid ?? 0,
    postBidLinkValue: trace.postBidLinkBonus ?? 0,
    runnerStrength,
    successful:
      trace.successful ?? (traceValue >= runnerStrength),
  };
}

export function describeTraceResult(
  state: GameState,
  options: TraceResultOptions = {},
): TraceResultDescriptor {
  return describeTraceResultFromTrace(requireCurrentTrace(state), options);
}
