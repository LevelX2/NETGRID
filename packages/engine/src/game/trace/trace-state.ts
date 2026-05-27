/**
 * ARCH-12 TraceState-/TracePhase-Guards.
 * Keine Trace-Orchestrierung.
 * Keine Payment-Logik.
 * Keine State-Mutation.
 * Keine PublicPayload-Vertragsaenderung.
 * Kein Import aus index.ts.
 */
import type { CardInstanceId, GameState, TraceState } from "@netgrid/shared";

export type CurrentTrace = NonNullable<GameState["trace"]>;
export type TracePhase = CurrentTrace["status"];

export type TraceWindowDescriptor = {
  traceId: string;
  phase: TracePhase;
  sourceCardInstanceId: CardInstanceId;
  baseTraceStrength: number;
  hasCorpBid: boolean;
  hasRunnerBid: boolean;
  corpBid?: number;
  traceStrength?: number;
  runnerLink?: number;
  baseLinkSourceId?: CardInstanceId;
  baseLinkValue?: number;
  baseLinkCostPaid?: number;
  runnerBid?: number;
  runnerStrength?: number;
  postBidLinkSourceIds: readonly CardInstanceId[];
  postBidLinkBonus?: number;
};

const TRACE_PHASE_MESSAGES: Record<TracePhase, string> = {
  corp_bid: "Es ist kein Korp-Trace-Bid offen.",
  base_link: "Es ist kein Base-Link-Fenster offen.",
  runner_bid: "Es ist kein Runner-Trace-Bid offen.",
  post_bid_link: "Es ist kein Post-Bid-Link-Fenster offen.",
  trace_success_cancel: "Es ist kein Trace-Erfolg-Cancel-Fenster offen.",
};

export function currentTrace(state: GameState): CurrentTrace | undefined {
  return state.trace;
}

export function requireCurrentTrace(state: GameState): CurrentTrace {
  const trace = currentTrace(state);
  if (!trace) throw new Error("Kein aktiver Trace.");
  return trace;
}

export function traceIsInPhase(
  state: GameState,
  phase: TracePhase,
): boolean {
  return currentTrace(state)?.status === phase;
}

export function requireTracePhase(
  state: GameState,
  phase: TracePhase,
): CurrentTrace {
  const trace = currentTrace(state);
  if (!trace || trace.status !== phase) throw new Error(TRACE_PHASE_MESSAGES[phase]);
  return trace;
}

export function requireTracePhaseOneOf(
  state: GameState,
  phases: readonly TracePhase[],
): CurrentTrace {
  const trace = requireCurrentTrace(state);
  if (!phases.includes(trace.status))
    throw new Error("Es ist kein passendes Trace-Fenster offen.");
  return trace;
}

export function assertTraceBaseLinkUnused(trace: TraceState): void {
  if (trace.baseLinkSourceId)
    throw new Error(
      "Fuer diesen Trace wurde bereits eine Base-Link-Quelle verwendet.",
    );
}

export function tracePostBidLinkSourceUsed(
  trace: TraceState,
  sourceCardInstanceId: CardInstanceId,
): boolean {
  return (trace.postBidLinkSourceIds ?? []).includes(sourceCardInstanceId);
}

export function assertTracePostBidLinkSourceUnused(
  trace: TraceState,
  sourceCardInstanceId: CardInstanceId,
): void {
  if (tracePostBidLinkSourceUsed(trace, sourceCardInstanceId))
    throw new Error("Diese Post-Bid-Link-Quelle ist nicht legal.");
}

export function describeCurrentTraceWindow(
  state: GameState,
): TraceWindowDescriptor | undefined {
  const trace = currentTrace(state);
  if (!trace) return undefined;
  return {
    traceId: trace.traceId,
    phase: trace.status,
    sourceCardInstanceId: trace.sourceCardInstanceId,
    baseTraceStrength: trace.baseTraceStrength,
    hasCorpBid: trace.corpBid !== undefined,
    hasRunnerBid: trace.runnerBid !== undefined,
    ...(trace.corpBid !== undefined ? { corpBid: trace.corpBid } : {}),
    ...(trace.traceStrength !== undefined
      ? { traceStrength: trace.traceStrength }
      : {}),
    ...(trace.runnerLink !== undefined ? { runnerLink: trace.runnerLink } : {}),
    ...(trace.baseLinkSourceId !== undefined
      ? { baseLinkSourceId: trace.baseLinkSourceId }
      : {}),
    ...(trace.baseLinkValue !== undefined
      ? { baseLinkValue: trace.baseLinkValue }
      : {}),
    ...(trace.baseLinkCostPaid !== undefined
      ? { baseLinkCostPaid: trace.baseLinkCostPaid }
      : {}),
    ...(trace.runnerBid !== undefined ? { runnerBid: trace.runnerBid } : {}),
    ...(trace.runnerStrength !== undefined
      ? { runnerStrength: trace.runnerStrength }
      : {}),
    postBidLinkSourceIds: [...(trace.postBidLinkSourceIds ?? [])],
    ...(trace.postBidLinkBonus !== undefined
      ? { postBidLinkBonus: trace.postBidLinkBonus }
      : {}),
  };
}
