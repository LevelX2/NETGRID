import type { GameState } from "@netgrid/shared";

export function returnUnusedCorpTraceWindowCredits(
  state: GameState,
): Record<string, string | number | boolean> {
  const grant = state.trace?.corpTemporaryTraceCredits;
  if (!grant) return {};
  if (
    grant.includedInCorpCreditPool !== true ||
    grant.usableFor !== "unrestricted_during_current_trace" ||
    grant.returnUnusedAtTraceEnd !== true
  )
    throw new Error("Der temporäre Trace-Credit-Vertrag ist ungültig.");
  if (!Number.isSafeInteger(grant.remaining) || grant.remaining < 0)
    throw new Error("Der temporäre Trace-Credit-Restbetrag ist ungültig.");
  const returned = grant.remaining;
  if (state.corp.credits < returned)
    throw new Error("Temporäre Trace-Credits sind nicht mehr im Korp-Pool.");
  state.corp.credits -= returned;
  grant.remaining = 0;
  return {
    temporaryTraceCreditsReturned: returned,
    temporaryTraceCreditsSourceDefinitionId: grant.sourceDefinitionId,
    corpCreditsAfter: state.corp.credits,
  };
}
