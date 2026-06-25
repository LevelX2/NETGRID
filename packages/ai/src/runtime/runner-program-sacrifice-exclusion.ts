import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerProgramSacrificeAssessment = {
  memoryRequired: boolean;
  canFreeRequiredMemory: boolean;
  evidence: string[];
};

export type RunnerProgramSacrificeExclusionDependencies = {
  assessmentForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerProgramSacrificeAssessment | undefined;
  displacementPenalty: (
    assessment: RunnerProgramSacrificeAssessment | undefined,
  ) => number;
};

export function runnerProgramSacrificeExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerProgramSacrificeExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  const assessment = dependencies.assessmentForAction(input, action);
  if (!assessment?.memoryRequired || assessment.canFreeRequiredMemory) {
    return undefined;
  }
  return {
    key: "program_sacrifice_no_acceptable_candidate",
    label: "Kein akzeptables Programm-Opfer",
    reason: sortedUnique([
      ...assessment.evidence,
      `program_sacrifice_penalty:${dependencies.displacementPenalty(assessment)}`,
    ]).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
