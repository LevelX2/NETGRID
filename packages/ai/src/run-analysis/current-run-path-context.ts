import type { AiDecisionInput } from "@netgrid/shared";
import type { VisibleDeflectorContext } from "./visible-run-analysis-contracts";

/** Facts of the active run, for quotes of its current encounter and remaining ICE. */
export function currentRunPathContext(
  input: AiDecisionInput,
): VisibleDeflectorContext {
  const run = input.playerView.run;
  if (!run) return {};
  return {
    ...(input.playerView.own.runnerTraceSupportQuote
      ? {
          runnerTraceSupportQuote: input.playerView.own.runnerTraceSupportQuote,
        }
      : {}),
    ...(run.encounterTaxForFutureIce
      ? {
          encounterEntryTax: {
            amount: run.encounterTaxForFutureIce,
            ...(run.encounteredIce?.instanceId
              ? { paidIceInstanceId: run.encounteredIce.instanceId }
              : {}),
          },
        }
      : {}),
  };
}
