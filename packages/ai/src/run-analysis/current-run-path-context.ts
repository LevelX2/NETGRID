import type { AiDecisionInput } from "@netgrid/shared";
import type { VisibleDeflectorContext } from "./visible-run-analysis-contracts";

/** Facts of the active run, for quotes of its current encounter and remaining ICE. */
export function currentRunPathContext(
  input: AiDecisionInput,
): VisibleDeflectorContext {
  const run = input.playerView.run;
  if (!run?.encounterTaxForFutureIce) return {};
  return {
    encounterEntryTax: {
      amount: run.encounterTaxForFutureIce,
      ...(run.encounteredIce?.instanceId
        ? { paidIceInstanceId: run.encounteredIce.instanceId }
        : {}),
    },
  };
}
