import type { RunnerMultiRunEventAssessment } from "./runner-multi-run-event-assessment";

export function runnerMultiRunEventScoreValue(
  phase: RunnerMultiRunEventAssessment["phase"],
  payoffClass: string,
  canTakeRun: boolean,
): number {
  if (!canTakeRun) return -2200;
  if (phase === "followup_run") return payoffClass === "high_payoff" ? 220 : 80;
  return payoffClass === "high_payoff" ? 2100 : 1400;
}
