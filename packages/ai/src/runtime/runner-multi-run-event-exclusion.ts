import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import type { RunnerMultiRunEventAssessment } from "./runner-multi-run-event-assessment";

export type RunnerMultiRunEventExclusionDependencies = {
  assessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerMultiRunEventAssessment | undefined;
};

export function runnerMultiRunEventExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerMultiRunEventExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  const assessment = dependencies.assessment(input, action);
  if (!assessment || assessment.canTakeRun) return undefined;
  return {
    key:
      assessment.phase === "followup_run"
        ? "multi_run_followup_no_plausible_run"
        : "multi_run_event_no_plausible_first_run",
    label:
      assessment.phase === "followup_run"
        ? "All-Nighter-Folgerun ohne plausibles Ziel"
        : "All-Nighter ohne plausibles erstes Run-Ziel",
    reason: sortedUnique(assessment.evidence).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
