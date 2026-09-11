import type { RunnerRecurringEconomySignal } from "./recurring-economy-types";

/** The income owner may defer runs; it does not own unrelated waiting-turn actions. */
export function runnerRecurringEconomyRunDeferral(
  signals: readonly RunnerRecurringEconomySignal[],
): string | undefined {
  const recurringEconomyRunDeferral = signals.find(
    (signal) =>
      signal.commitmentActive &&
      signal.phase === "hold" &&
      signal.investmentHorizon.decision === "wait" &&
      signal.investmentHorizon.futureValueAtRisk > 0,
  );
  return recurringEconomyRunDeferral === undefined
    ? undefined
    : `runner_recurring_economy_defers_run_until_payout:${recurringEconomyRunDeferral.definitionId}`;
}
