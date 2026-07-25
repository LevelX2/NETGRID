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
    for (const [index, entry] of summary.actionSequence.entries()) {
      if (
        entry.side === "runner" &&
        entry.actionType === "end_turn" &&
        (entry.actionsRemainingBefore ?? 0) > 0
      ) {
        metrics.runnerEndTurnsWithClicks += 1;
        if (
          entry.evidence.includes("runner_inevitable_corp_deckout:true") ||
          isVerifiedPlanFirstCorpDeckoutCloseout(summary, index)
        ) {
          metrics.runnerInevitableCorpDeckoutEndTurnsWithClicks += 1;
        } else if (isCertifiedPlanFirstRouteExhaustion(entry)) {
          continue;
        } else if (entry.actionableAlternativeCount === 0) {
          continue;
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

function isCertifiedPlanFirstRouteExhaustion(
  entry: AiSimulationSummary["actionSequence"][number],
): boolean {
  return (
    entry.planKind === "runner.complete_turn" &&
    entry.reasonCode === "plan_first.runner.complete_turn" &&
    entry.fallbackUsed === false &&
    entry.timeoutUsed === false &&
    entry.evidence.includes("plan_first_lane:plan") &&
    entry.evidence.includes(
      "plan_step_capability:complete_turn_after_productive_routes_exhausted",
    ) &&
    entry.evidence.includes(
      "plan_assessment_evidence:productive_legal_routes_exhausted",
    )
  );
}

function isVerifiedPlanFirstCorpDeckoutCloseout(
  summary: AiSimulationSummary,
  endTurnIndex: number,
): boolean {
  const entry = summary.actionSequence[endTurnIndex];
  const forcedDraw = summary.actionSequence[endTurnIndex + 1];
  return (
    entry?.planKind === "runner.secure_terminal_win" &&
    summary.winner === "runner" &&
    summary.gameEndReason === "corp_deck_empty" &&
    forcedDraw?.side === "corp" &&
    forcedDraw.actionType === "mandatory_draw" &&
    endTurnIndex + 2 === summary.actionSequence.length
  );
}

function persistentInstallFinalFit(evidence: readonly string[]): number {
  const prefix = "persistentInstallFinalFit:";
  const entry = evidence.find((candidate) => candidate.startsWith(prefix));
  if (!entry) return 0;
  const value = Number(entry.slice(prefix.length));
  return Number.isFinite(value) ? value : 0;
}
