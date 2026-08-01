import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerRandomBreakOrDamageBreakRiskAssessment = {
  stableCoverageAvailable: boolean;
  evidence: string[];
};

export type RunnerRandomBreakOrDamageBreakExclusionDependencies = {
  riskAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerRandomBreakOrDamageBreakRiskAssessment | undefined;
  shouldAvoidRun: (
    assessment: RunnerRandomBreakOrDamageBreakRiskAssessment | undefined,
  ) => boolean;
};

export type RunnerRandomBreakOrDamageBreakExclusionContext = {
  semanticRuntimeRunnerRandomBreakOrDamageBreakExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerRandomBreakOrDamageBreakExclusionContext(
  dependencies: RunnerRandomBreakOrDamageBreakExclusionDependencies,
): RunnerRandomBreakOrDamageBreakExclusionContext {
  function semanticRuntimeRunnerRandomBreakOrDamageBreakExclusion(
    input: AiDecisionInput,
    action: LegalAction,
  ): SemanticRuntimeExclusion | undefined {
    return runnerRandomBreakOrDamageBreakExclusion(input, action, dependencies);
  }

  return { semanticRuntimeRunnerRandomBreakOrDamageBreakExclusion };
}

export function runnerRandomBreakOrDamageBreakExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerRandomBreakOrDamageBreakExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  const assessment = dependencies.riskAssessment(input, action);
  if (!assessment) return undefined;
  if (assessment.stableCoverageAvailable) {
    return {
      key: "random_break_damage_stable_alternative_available",
      label: "Stabiler Breaker statt Zufallsbruch",
      reason: sortedUnique([
        ...assessment.evidence,
        "why_random_break_damage_blocked:stable_breaker_available",
      ]).join("|"),
    };
  }
  if (!dependencies.shouldAvoidRun(assessment)) return undefined;
  return {
    key: "random_break_damage_self_damage_risk",
    label: "Zufallsbruch mit Eigenschaden-Risiko",
    reason: sortedUnique([
      ...assessment.evidence,
      "why_random_break_damage_blocked:self_damage_buffer_too_low",
    ]).join("|"),
  };
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
