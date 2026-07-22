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
      const sameTurn = [] as AiSimulationSummary["actionSequence"];
      for (const candidate of summary.actionSequence.slice(index + 1)) {
        if (
          candidate.side !== entry.side ||
          candidate.turnNumber !== entry.turnNumber
        ) {
          break;
        }
        sameTurn.push(candidate);
      }
      const followupConverted = sameTurn.some(
        (candidate) =>
          candidate.actionCapacitySourceUsed !== true &&
          candidate.actionType !== "end_turn" &&
          candidate.timingPoint === `${entry.side}_action.main`,
      );
      if (followupConverted) metrics.actionCapacityFollowupConversions += 1;
      const endTurn = sameTurn.find(
        (candidate) => candidate.actionType === "end_turn",
      );
      if ((endTurn?.actionsRemainingBefore ?? 0) > 0)
        metrics.actionCapacityExpiredUses += 1;
      if (!followupConverted) metrics.actionCapacityMisconversions += 1;
    }
  }
  return metrics;
}
