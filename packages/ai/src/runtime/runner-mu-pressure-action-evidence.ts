import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerMuPressureAssessment } from "./runner-mu-pressure-policy";

export type RunnerMuPressureActionEvidenceDependencies = {
  assessment: (input: AiDecisionInput) => RunnerMuPressureAssessment;
  isMemorySupportAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
  isProgramInstallAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => boolean;
};

export function runnerMuPressureActionEvidence(
  input: AiDecisionInput,
  action: LegalAction,
  providedAssessment: RunnerMuPressureAssessment | undefined,
  dependencies: RunnerMuPressureActionEvidenceDependencies,
): string[] {
  const assessment = providedAssessment ?? dependencies.assessment(input);
  if (assessment.severity === "none") return [];
  const memorySupportAction = dependencies.isMemorySupportAction(input, action);
  const programInstallAction = dependencies.isProgramInstallAction(
    input,
    action,
  );
  if (
    action.type !== "gain_credit" &&
    !memorySupportAction &&
    !programInstallAction
  ) {
    return [];
  }
  return sortedUnique([
    ...assessment.evidence,
    ...(memorySupportAction ? ["runner_memory_support_action:true"] : []),
    ...(action.type === "gain_credit"
      ? ["runner_memory_support_funding_action:true"]
      : []),
    ...(programInstallAction && !memorySupportAction
      ? ["runner_program_install_under_mu_pressure:true"]
      : []),
  ]);
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}
