import { isTraceId, type GameState, type LegalAction } from "@netgrid/shared";

export function applyPublicTraceStartContext(
  state: GameState,
  legalAction: LegalAction,
  context: Record<string, unknown>,
): void {
  if (legalAction.payload?.traceStarted === true) {
    // Trace contexts are public bidding state. This layer only forwards the
    // fields emitted by trace execution and does not infer hidden choices.
    if (typeof legalAction.payload.agendaAbility === "string")
      context.agendaAbility = legalAction.payload.agendaAbility;
    context.traceStarted = true;
    context.traceRulesProfile =
      state.trace?.traceRulesProfile ??
      state.traceRulesProfile ??
      "modern_open";
    const blindTraceStart = context.traceRulesProfile !== "modern_open";
    if (blindTraceStart) {
      delete context.corpBidMax;
      delete context.fortTraceBitPoolServerId;
      delete context.temporaryTraceCreditsSourceDefinitionId;
    }
    if (isTraceId(legalAction.payload.traceId))
      context.traceId = legalAction.payload.traceId;
    if (typeof legalAction.payload.traceSourceRunId === "number")
      context.traceSourceRunId = legalAction.payload.traceSourceRunId;
    context.sourceCardId = legalAction.payload.sourceCardId;
    context.sourceDefinitionId = legalAction.payload.sourceDefinitionId;
    if (typeof legalAction.payload.traceLimit === "number")
      context.traceLimit = legalAction.payload.traceLimit;
    if (typeof legalAction.payload.effectiveTraceLimit === "number")
      context.effectiveTraceLimit = legalAction.payload.effectiveTraceLimit;
    if (!blindTraceStart && typeof legalAction.payload.corpBidMax === "number")
      context.corpBidMax = legalAction.payload.corpBidMax;
    if (typeof legalAction.payload.rabbitTraceLimitReduction === "number")
      context.rabbitTraceLimitReduction =
        legalAction.payload.rabbitTraceLimitReduction;
    if (
      !blindTraceStart &&
      typeof legalAction.payload.temporaryTraceCreditsAvailable === "number"
    )
      context.temporaryTraceCreditsAvailable =
        legalAction.payload.temporaryTraceCreditsAvailable;
    if (
      !blindTraceStart &&
      typeof legalAction.payload.temporaryTraceCreditsSourceDefinitionId ===
        "number"
    )
      context.temporaryTraceCreditsSourceDefinitionId =
        legalAction.payload.temporaryTraceCreditsSourceDefinitionId;
    if (legalAction.payload.oncePerRunConsumed === true)
      context.oncePerRunConsumed = true;
  }
}
