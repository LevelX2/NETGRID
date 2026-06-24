import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

export type RunnerMultiRunEventScoreAssessment = {
  phase: "first_run" | "followup_run";
  value: number;
  evidence: string[];
};

export type RunnerMultiRunEventScoreDependencies = {
  assessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMultiRunEventScoreAssessment | undefined;
};

export function runnerMultiRunEventScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerMultiRunEventScoreDependencies,
): AiDecisionScoreComponent | undefined {
  const assessment = dependencies.assessment(input, action);
  if (!assessment) return undefined;
  return {
    key: "runner_multi_run_event_gate",
    label:
      assessment.phase === "followup_run"
        ? "All-Nighter-Folgerun"
        : "All-Nighter-Run-Gate",
    value: assessment.value,
    reason: sortedUnique(assessment.evidence).join("|"),
  };
}

export function runnerMultiRunEventScoreValue(
  phase: RunnerMultiRunEventScoreAssessment["phase"],
  payoffClass: string,
  canTakeRun: boolean,
): number {
  if (!canTakeRun) return -2200;
  if (phase === "followup_run") return payoffClass === "high_payoff" ? 220 : 80;
  return payoffClass === "high_payoff" ? 2100 : 1400;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
