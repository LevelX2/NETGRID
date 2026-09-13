import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { creditsToBreakVisibleSubroutinesWithBreaker } from "../visible-run-analysis";
import { visibleIceRunHazardsForQuote } from "../run-analysis/visible-run-hazards";
import {
  currentEncounterRequiresFullBreak,
  currentEncounterUnbrokenSubroutineIndexes,
} from "./current-encounter";

/** Compare complete mitigation routes inside the current encounter owner. */
export function cheaperSafeCurrentTracePayment(
  input: AiDecisionInput,
  breaker: VisibleCard,
  ice: VisibleCard,
  generalPumpAndBreakCost: number,
): number | undefined {
  if (currentEncounterRequiresFullBreak(input)) return undefined;
  const quote = ice.effectiveRunQuote;
  if (!quote || !input.playerView.own.runnerTraceSupportQuote) return undefined;
  const subroutines = quote.subroutines;
  if (
    subroutines.length === 0 ||
    subroutines.some((s) => s.type !== "initiate_trace" || s.unbrokenRunEffect)
  )
    return undefined;
  const breakQuote = creditsToBreakVisibleSubroutinesWithBreaker(
    breaker,
    ice,
    subroutines,
    breaker.strength,
    quote.breakSubroutineAdditionalCostPerSubroutine,
  );
  // Persistent strength and other break rewards need a wider route comparison.
  if (
    !breakQuote ||
    breakQuote.carriesStrengthAcrossIce ||
    (breakQuote.stateChangesAfterUse?.length ?? 0) > 0
  )
    return undefined;
  const hazards = visibleIceRunHazardsForQuote({
    quote: { ...quote, subroutines },
    ice,
    iceIndex: 0,
    rigCards: input.playerView.own.rig ?? [],
    availableCredits: input.playerView.own.credits,
    visibleCorpBidCapacity: input.playerView.opponent.credits,
    breakerStrengths: new Map(),
    additionalBreakCostPerSubroutine:
      quote.breakSubroutineAdditionalCostPerSubroutine ?? 0,
    runnerTraceSupportQuote: input.playerView.own.runnerTraceSupportQuote,
    ...(input.playerView.traceRulesProfile !== undefined
      ? { traceRulesProfile: input.playerView.traceRulesProfile }
      : {}),
    ...(input.playerView.run?.runTraceLinkBonus !== undefined
      ? { runTraceLinkBonus: input.playerView.run.runTraceLinkBonus }
      : {}),
  });
  if (hazards.length !== subroutines.length) return undefined;
  let cost = 0;
  for (const h of hazards) {
    if (
      h.hazard.unavoidable ||
      h.avoidancePayment?.kind !== "general" ||
      h.hazard.baseLinkSideEffect !== undefined ||
      (h.traceCreditPoolSpent ?? 0) > 0 ||
      (h.traceSupportSourceIdsConsumed?.length ?? 0) > 0 ||
      h.hazard.visibleCorpMaxTraceAvoidanceCost !== h.avoidancePayment.cost
    )
      return undefined;
    cost += h.avoidancePayment.cost;
  }
  if (cost >= generalPumpAndBreakCost) return undefined;
  // Only a viable cheaper route needs an exact remaining-action binding.
  // This comparison quotes the whole trace sequence; a partial sequence is
  // left to the existing encounter assessment, without recharging old traces.
  const remaining = currentEncounterUnbrokenSubroutineIndexes(input);
  if (remaining.size !== subroutines.length) return undefined;
  return cost < generalPumpAndBreakCost ? cost : undefined;
}
