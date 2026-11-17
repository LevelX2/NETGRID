import type { AiSimulationSummary } from "./ai-simulation-summary";

export type ActionCapacityBaselineMetrics = {
  actionCapacityOpportunities: number;
  actionCapacityUses: number;
  actionCapacityPlanConversions: number;
  actionCapacityFollowupConversions: number;
  actionCapacityExpiredUses: number;
  actionCapacityMisconversions: number;
};

export function summarizeActionCapacityBaselineMetrics(
  summaries: readonly AiSimulationSummary[],
): ActionCapacityBaselineMetrics {
  const metrics: ActionCapacityBaselineMetrics = {
    actionCapacityOpportunities: 0,
    actionCapacityUses: 0,
    actionCapacityPlanConversions: 0,
    actionCapacityFollowupConversions: 0,
    actionCapacityExpiredUses: 0,
    actionCapacityMisconversions: 0,
  };
  for (const summary of summaries) {
    for (const [index, entry] of summary.actionSequence.entries()) {
      if (entry.actionCapacityOpportunity)
        metrics.actionCapacityOpportunities += 1;
      if (!entry.actionCapacitySourceUsed) continue;
      metrics.actionCapacityUses += 1;
      if (entry.actionCapacityPlanConversionUsed)
        metrics.actionCapacityPlanConversions += 1;
      let followupConverted = entry.actionCapacityInlineConversionUsed === true;
      for (
        let nextIndex = index + 1;
        nextIndex < summary.actionSequence.length;
        nextIndex++
      ) {
        const candidate = summary.actionSequence[nextIndex]!;
        if (candidate.turnNumber !== entry.turnNumber) break;
        if (candidate.side !== entry.side) continue;
        if (candidate.actionType === "end_turn") {
          if ((candidate.actionsRemainingBefore ?? 0) > 0)
            metrics.actionCapacityExpiredUses += 1;
          break;
        }
        if (
          candidate.actionCapacitySourceUsed !== true &&
          candidate.timingPoint === entry.side + "_action.main"
        )
          followupConverted = true;
      }
      if (followupConverted) metrics.actionCapacityFollowupConversions += 1;
      if (!followupConverted) metrics.actionCapacityMisconversions += 1;
    }
  }
  return metrics;
}
