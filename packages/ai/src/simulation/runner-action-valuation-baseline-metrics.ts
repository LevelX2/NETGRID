import type { AiSimulationSummary } from "./ai-simulation-summary";

export type RunnerActionValuationBaselineMetrics = {
  runnerEndTurnsWithClicks: number;
  runnerInevitableCorpDeckoutEndTurnsWithClicks: number;
  runnerPrematureEndTurnsWithClicks: number;
  runnerPersistentInstallSelections: number;
  runnerRedundantPersistentInstallSelections: number;
};

export function summarizeRunnerActionValuationBaselineMetrics(
  summaries: readonly AiSimulationSummary[],
): RunnerActionValuationBaselineMetrics {
  const metrics: RunnerActionValuationBaselineMetrics = {
    runnerEndTurnsWithClicks: 0,
    runnerInevitableCorpDeckoutEndTurnsWithClicks: 0,
    runnerPrematureEndTurnsWithClicks: 0,
    runnerPersistentInstallSelections: 0,
    runnerRedundantPersistentInstallSelections: 0,
  };
  for (const summary of summaries) {
    for (const entry of summary.actionSequence) {
      if (
        entry.side === "runner" &&
        entry.actionType === "end_turn" &&
        (entry.actionsRemainingBefore ?? 0) > 0
      ) {
        metrics.runnerEndTurnsWithClicks += 1;
        if (entry.evidence.includes("runner_inevitable_corp_deckout:true")) {
          metrics.runnerInevitableCorpDeckoutEndTurnsWithClicks += 1;
        } else {
          metrics.runnerPrematureEndTurnsWithClicks += 1;
        }
      }
      if (
        entry.side !== "runner" ||
        entry.actionType !== "install_card" ||
        !entry.evidence.includes("persistentInstallEvaluation:true")
      ) {
        continue;
      }
      metrics.runnerPersistentInstallSelections += 1;
      if (
        entry.evidence.includes(
          "persistentInstallDuplicateRole:redundant_duplicate",
        ) &&
        persistentInstallFinalFit(entry.evidence) < 0
      ) {
        metrics.runnerRedundantPersistentInstallSelections += 1;
      }
    }
  }
  return metrics;
}

function persistentInstallFinalFit(evidence: readonly string[]): number {
  const prefix = "persistentInstallFinalFit:";
  const entry = evidence.find((candidate) => candidate.startsWith(prefix));
  if (!entry) return 0;
  const value = Number(entry.slice(prefix.length));
  return Number.isFinite(value) ? value : 0;
}
